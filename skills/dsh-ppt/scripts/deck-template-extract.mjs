#! /usr/bin/env node
/**
 * deck-template-extract.mjs —— 从现成 .pptx 抽取模板草稿（SPEC §7）。
 *
 *   const { draft, draftAssets, candidates, stats } = await extractTemplateFromPptx(bytes, { assetsDir })
 *
 * 流程：
 *   1. fflate 解包（单条目 16 MiB、总量 128 MiB 上限）
 *   2. theme1.xml → palette / fonts（lt1 亮度判深浅底，a:ea 优先）
 *   3. 全量统计 a:srgbClr（分文字/填充）、a:rPr@sz、typeface
 *   4. 遍历 slideN.xml 收 <p:pic>（r:embed → rels → media）与 <p:sp> 文本
 *   5. 跨页聚类（媒体 sha256 + box 四舍五入到 0.05in；标题文字同理）→ 固定元素
 *   6. 页型归类：第 1 页 cover、最后 1 页 closing；其余按固定元素指纹分组，
 *      最大组 content，含大标题（>=32pt）的组 section
 *   7. 素材统一经 deck-pixels 白底泛洪转透明 PNG；像素级相似的同款 logo 合并成
 *      同一个 asset（不同页型上的不同摆位保留为不同 chrome item）
 *   8. options.assetsDir 存在则写文件；无论是否落盘，顶层 draftAssets 都返回
 *      { slot: 'data:image/png;base64,...' }（SPEC §7：刻意不放 draft 内，
 *      避免被 normalizeTemplate 当成未知字段）
 *
 * 抽取是 async 的：JPEG 解码需要 await import('jpeg-js')。
 */

import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join as joinPath } from 'node:path'
import { strFromU8, unzipSync } from 'fflate'
import { decodeImage, encodePng, isTransparent, makeTransparentWhite } from './deck-pixels.mjs'
import { CHROME_PAGE_TYPES, normalizeTemplate } from './deck-template.mjs'

const EMU_PER_INCH = 914400
const MAX_ENTRY_BYTES = 16 * 1024 * 1024
const MAX_TOTAL_BYTES = 128 * 1024 * 1024
const FIXED_MIN_PAGES = 3
const FIXED_EDGE_MIN_PAGES = 2
const BOX_GRID = 0.05
const MAX_CHROME_ITEMS = 12
const BRAND_ZONE_RATIO = 0.7
const MIN_EFFECTIVE_COVERAGE = 0.01
const VISIBLE_ALPHA_FLOOR = 8
const VISIBLE_COLOR_FLOOR = 0.12
const DEFAULT_CANVAS = { w: 13.3333, h: 7.5 }
const DEFAULT_TYPE_SCALE = { cover: 40, section: 40, title: 20, body: 13, caption: 10, footer: 14 }
const CJK_RE = /[\u3400-\u9fff]/
const SCHEME_COLOR_MAP = { bg1: 'bg', tx1: 'fg', bg2: 'panel', tx2: 'muted', accent1: 'accent', accent2: 'accent2', hlink: 'accent', folHlink: 'accent' }

function fail(message) {
  throw new Error('dsh-ppt：' + message)
}

function asBuffer(input) {
  if (Buffer.isBuffer(input)) return input
  if (input instanceof Uint8Array) return Buffer.from(input.buffer, input.byteOffset, input.byteLength)
  if (input instanceof ArrayBuffer) return Buffer.from(input)
  fail('pptx 字节必须是 Buffer / Uint8Array / ArrayBuffer')
}

function round(value, digits = 3) {
  const factor = 10 ** digits
  return Math.round(Number(value) * factor) / factor
}

function decodeEntities(value) {
  return String(value).replace(/&(#x[0-9a-fA-F]+|#\d+|lt|gt|amp|quot|apos);/g, (match, entity) => {
    if (entity === 'lt') return '<'
    if (entity === 'gt') return '>'
    if (entity === 'amp') return '&'
    if (entity === 'quot') return '"'
    if (entity === 'apos') return "'"
    if (entity[1] === 'x' || entity[1] === 'X') return String.fromCodePoint(parseInt(entity.slice(2), 16))
    return String.fromCodePoint(parseInt(entity.slice(1), 10))
  })
}

function xmlText(data) {
  if (!data) return ''
  if (data.length >= 2 && data[0] === 0xff && data[1] === 0xfe) return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf16le').replace(/^\uFEFF/, '')
  return strFromU8(data).replace(/^\uFEFF/, '')
}

function tagBlock(xml, tag) {
  const match = new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + tag + '>').exec(xml)
  return match ? match[1] : ''
}

function tagBlocks(xml, tag) {
  const re = new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + tag + '>', 'g')
  const blocks = []
  let match
  while ((match = re.exec(xml))) blocks.push(match[1])
  return blocks
}

function attrValue(tag, name) {
  const match = new RegExp('\\b' + name + '="([^"]*)"').exec(tag)
  return match ? decodeEntities(match[1]) : ''
}

function colorFromBlock(block) {
  const srgb = /<a:srgbClr[^>]*val="([0-9A-Fa-f]{6})"/.exec(block)
  if (srgb) return '#' + srgb[1].toUpperCase()
  const sys = /<a:sysClr[^>]*lastClr="([0-9A-Fa-f]{6})"/.exec(block)
  if (sys) return '#' + sys[1].toUpperCase()
  return ''
}

function schemeColor(schemeXml, key) {
  const block = tagBlock(schemeXml, 'a:' + key)
  return block ? colorFromBlock(block) : ''
}

function hexLuminance(color) {
  const value = String(color).replace('#', '')
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) return 0
  const channel = (offset) => {
    const srgb = parseInt(value.slice(offset, offset + 2), 16) / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
}

function mixHex(a, b, ratio) {
  const parse = (color) => [1, 3, 5].map((offset) => parseInt(String(color).replace('#', '').slice(offset - 1, offset + 1), 16))
  const left = parse(a)
  const right = parse(b)
  const channels = left.map((value, index) => Math.round(value + (right[index] - value) * ratio))
  return '#' + channels.map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0')).join('').toUpperCase()
}

function isNeutral(color) {
  const value = String(color).replace('#', '')
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min < 0.12
}

// ---------------------------------------------------------------------------
// 解包
// ---------------------------------------------------------------------------

function unzipEntries(buffer) {
  let total = 0
  const skipped = []
  let entries
  try {
    entries = unzipSync(buffer, {
      filter: (file) => {
        if (!file || !file.name) return false
        const size = Number(file.originalSize ?? file.size ?? 0)
        if (size > MAX_ENTRY_BYTES) {
          skipped.push({ name: file.name, reason: '单条目超过 16 MiB' })
          return false
        }
        total += size
        if (total > MAX_TOTAL_BYTES) fail('pptx 解包总量超过 ' + MAX_TOTAL_BYTES / 1024 / 1024 + ' MiB 上限')
        return true
      },
    })
  } catch (error) {
    if (String(error.message).startsWith('dsh-ppt：')) throw error
    fail('无法解包 pptx（不是合法的 zip，或文件已损坏）：' + error.message)
  }
  return { entries, skipped }
}

// ---------------------------------------------------------------------------
// theme / canvas / rels
// ---------------------------------------------------------------------------

function parseTheme(xml) {
  const scheme = tagBlock(xml, 'a:clrScheme')
  const pickFont = (block) => {
    const ea = /<a:ea[^>]*typeface="([^"]*)"/.exec(block)
    const latin = /<a:latin[^>]*typeface="([^"]*)"/.exec(block)
    const name = ea && decodeEntities(ea[1]).trim() ? decodeEntities(ea[1]).trim() : latin ? decodeEntities(latin[1]).trim() : ''
    return name.startsWith('+') ? '' : name
  }
  return {
    colors: {
      bg: schemeColor(scheme, 'lt1'),
      fg: schemeColor(scheme, 'dk1'),
      panel: schemeColor(scheme, 'lt2'),
      muted: schemeColor(scheme, 'dk2'),
      accent: schemeColor(scheme, 'accent1'),
      accent2: schemeColor(scheme, 'accent2'),
    },
    fonts: {
      heading: pickFont(tagBlock(xml, 'a:majorFont')),
      body: pickFont(tagBlock(xml, 'a:minorFont')),
    },
  }
}

function parseCanvas(xml) {
  const match = /<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/.exec(xml)
  if (!match) return { ...DEFAULT_CANVAS }
  const w = round(Number(match[1]) / EMU_PER_INCH, 4)
  const h = round(Number(match[2]) / EMU_PER_INCH, 4)
  if (!(w > 0) || !(h > 0)) return { ...DEFAULT_CANVAS }
  return { w, h }
}

function resolveTarget(baseDir, target) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return ''
  let decoded = target
  try {
    decoded = decodeURIComponent(target)
  } catch { /* 保留原始 target */ }
  const parts = (decoded.startsWith('/') ? decoded : baseDir + '/' + decoded).split('/')
  const stack = []
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') stack.pop()
    else stack.push(part)
  }
  return stack.join('/')
}

function parseRels(xml, baseDir) {
  const map = {}
  for (const match of xml.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = attrValue(match[0], 'Id')
    const target = attrValue(match[0], 'Target')
    if (!id || !target) continue
    const resolved = resolveTarget(baseDir, target)
    if (resolved) map[id] = resolved
  }
  return map
}

// ---------------------------------------------------------------------------
// 幻灯片解析
// ---------------------------------------------------------------------------

function parseXfrm(block) {
  const offTag = /<a:off\b[^>]*>/.exec(block)
  const extTag = /<a:ext\b[^>]*\bcx="\d+"[^>]*>/.exec(block)
  if (!offTag || !extTag) return null
  const x = Number(/x="(-?\d+)"/.exec(offTag[0])?.[1])
  const y = Number(/y="(-?\d+)"/.exec(offTag[0])?.[1])
  const cx = Number(/\bcx="(\d+)"/.exec(extTag[0])?.[1])
  const cy = Number(/\bcy="(\d+)"/.exec(extTag[0])?.[1])
  if (![x, y, cx, cy].every(Number.isFinite) || cx <= 0 || cy <= 0) return null
  return [round(x / EMU_PER_INCH), round(y / EMU_PER_INCH), round(cx / EMU_PER_INCH), round(cy / EMU_PER_INCH)]
}

function runColor(runBlock) {
  const srgb = /<a:srgbClr[^>]*val="([0-9A-Fa-f]{6})"/.exec(runBlock)
  if (srgb) return { type: 'srgb', value: '#' + srgb[1].toUpperCase() }
  const scheme = /<a:schemeClr[^>]*val="([A-Za-z0-9]+)"/.exec(runBlock)
  if (scheme) return { type: 'scheme', value: scheme[1] }
  return null
}

function parseRuns(block) {
  const body = tagBlock(block, 'p:txBody')
  if (!body) return []
  const runs = []
  for (const match of body.matchAll(/<a:r>([\s\S]*?)<\/a:r>/g)) {
    const runBlock = match[1]
    const textMatch = /<a:t>([\s\S]*?)<\/a:t>/.exec(runBlock)
    const text = textMatch ? decodeEntities(textMatch[1]) : ''
    const rPr = /<a:rPr\b([^>]*)>/.exec(runBlock)
    const attrs = rPr ? rPr[1] : ''
    const sizeMatch = /\bsz="(\d+)"/.exec(attrs)
    const ea = /<a:ea[^>]*typeface="([^"]*)"/.exec(runBlock)
    const latin = /<a:latin[^>]*typeface="([^"]*)"/.exec(runBlock)
    const pick = (match) => (match ? decodeEntities(match[1]).trim() : '')
    const typefaceRaw = pick(ea) || pick(latin)
    runs.push({
      text,
      size: sizeMatch ? Number(sizeMatch[1]) / 100 : null,
      typeface: typefaceRaw.startsWith('+') ? '' : typefaceRaw,
      color: runColor(runBlock),
      cjk: CJK_RE.test(text),
    })
  }
  return runs
}

function shapeText(block) {
  const body = tagBlock(block, 'p:txBody')
  if (!body) return ''
  const paragraphs = tagBlocks(body, 'a:p').map((paragraph) => [...paragraph.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => decodeEntities(match[1])).join(''))
  return paragraphs.join(' ').replace(/[\u00a0\s]+/g, ' ').trim()
}

function shapeAlign(block) {
  const match = /<a:pPr[^>]*\balgn="(l|ctr|r|just|dist)"/.exec(block)
  if (!match) return 'left'
  if (match[1] === 'ctr') return 'center'
  if (match[1] === 'r') return 'right'
  return 'left'
}

function summarizeShape(block) {
  const text = shapeText(block)
  const runs = parseRuns(block)
  if (!text) return { text: '', runs, box: parseXfrm(block), size: null, color: null, typeface: '', align: 'left' }
  const sizes = runs.map((run) => run.size).filter((size) => size !== null)
  const colorRun = runs.find((run) => run.color)
  const typefaceRun = runs.find((run) => run.typeface && run.cjk) || runs.find((run) => run.typeface)
  return {
    text,
    runs,
    box: parseXfrm(block),
    size: sizes.length ? Math.max(...sizes) : null,
    color: colorRun ? colorRun.color : null,
    typeface: typefaceRun ? typefaceRun.typeface : '',
    align: shapeAlign(block),
  }
}

function slideNumber(name) {
  const match = /slide(\d+)\.xml$/.exec(name)
  return match ? Number(match[1]) : 0
}

function listSlideNames(entries) {
  return Object.keys(entries)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((left, right) => slideNumber(left) - slideNumber(right))
}

function parseSlide(entries, name) {
  const xml = xmlText(entries[name])
  const relsName = name.replace(/slides\/(slide\d+\.xml)$/, 'slides/_rels/$1.rels')
  const rels = parseRels(xmlText(entries[relsName]), 'ppt/slides')
  const pictures = []
  for (const block of tagBlocks(xml, 'p:pic')) {
    const blip = /<a:blip[^>]*r:embed="([^"]+)"/.exec(block)
    if (!blip) continue
    const target = rels[blip[1]]
    if (!target) continue
    const box = parseXfrm(block)
    if (!box) continue
    pictures.push({ target, box })
  }
  const shapes = tagBlocks(xml, 'p:sp').map(summarizeShape)
  return { number: slideNumber(name), name, xml, pictures, shapes }
}

// ---------------------------------------------------------------------------
// 统计（spec §7 第 3 步）
// ---------------------------------------------------------------------------

function countInto(map, key) {
  if (!key) return
  map[key] = (map[key] || 0) + 1
}

function sortedCounts(map) {
  return Object.entries(map)
    .sort((left, right) => right[1] - left[1] || String(left[0]).localeCompare(String(right[0])))
    .map(([key, count]) => ({ key, count }))
}

function collectStats(slides) {
  const textColors = {}
  const fillColors = {}
  const fontCounts = {}
  const cjkFontCounts = {}
  const sizeCounts = {}
  for (const slide of slides) {
    const xml = slide.xml
    for (const match of xml.matchAll(/<a:srgbClr[^>]*val="([0-9A-Fa-f]{6})"/g)) {
      const before = xml.slice(Math.max(0, match.index - 400), match.index)
      const runIndex = before.lastIndexOf('<a:rPr')
      const shapeIndex = before.lastIndexOf('<p:spPr')
      countInto(runIndex >= 0 && runIndex > shapeIndex ? textColors : fillColors, '#' + match[1].toUpperCase())
    }
    for (const shape of slide.shapes) {
      for (const run of shape.runs) {
        if (run.size !== null) countInto(sizeCounts, String(run.size))
        if (run.typeface) {
          countInto(fontCounts, run.typeface)
          if (run.cjk) countInto(cjkFontCounts, run.typeface)
        }
      }
    }
  }
  return {
    colors: {
      text: Object.fromEntries(sortedCounts(textColors).map((entry) => [entry.key, entry.count])),
      fill: Object.fromEntries(sortedCounts(fillColors).map((entry) => [entry.key, entry.count])),
    },
    fonts: sortedCounts(fontCounts).map((entry) => ({ typeface: entry.key, count: entry.count })),
    sizes: sortedCounts(sizeCounts).map((entry) => ({ pt: Number(entry.key), count: entry.count })),
    cjkFonts: sortedCounts(cjkFontCounts).map((entry) => ({ typeface: entry.key, count: entry.count })),
  }
}

function topColor(colors) {
  return sortedCounts(colors)[0]?.key || ''
}

function buildPalette(themeColors, stats) {
  const accentCandidate = sortedCounts(stats.colors.text).map((entry) => entry.key).find((color) => !isNeutral(color)) ||
    sortedCounts(stats.colors.fill).map((entry) => entry.key).find((color) => !isNeutral(color)) || '#2F6BFF'
  const palette = {
    bg: themeColors.bg || (hexLuminance(topColor(stats.colors.fill) || '#FFFFFF') > 0.5 ? topColor(stats.colors.fill) || '#FFFFFF' : '#FFFFFF'),
    panel: themeColors.panel,
    fg: themeColors.fg || '#000000',
    muted: themeColors.muted,
    accent: themeColors.accent || accentCandidate,
    accent2: themeColors.accent2,
  }
  if (!palette.panel || palette.panel === palette.bg) palette.panel = mixHex(palette.bg, palette.fg, 0.05)
  if (!palette.muted || palette.muted === palette.fg) palette.muted = mixHex(palette.fg, palette.bg, 0.45)
  if (!palette.accent || palette.accent === palette.bg || palette.accent === palette.fg) palette.accent = accentCandidate
  if (!palette.accent2 || palette.accent2 === palette.accent) palette.accent2 = mixHex(palette.accent, palette.fg, 0.35)
  return palette
}

function deriveFonts(themeFonts, stats, accentHint) {
  const fallback = topColor(Object.fromEntries(stats.fonts.map((entry) => [entry.typeface, entry.count]))) || 'Microsoft YaHei'
  const heading = themeFonts.heading || fallback
  const body = themeFonts.body || heading
  let accent = ''
  if (accentHint) accent = accentHint
  if (!accent) {
    const candidate = stats.cjkFonts.find((entry) => entry.typeface !== heading && entry.typeface !== body)
    accent = candidate ? candidate.typeface : ''
  }
  if (!accent) {
    const candidate = stats.fonts.find((entry) => entry.typeface !== heading && entry.typeface !== body)
    accent = candidate ? candidate.typeface : ''
  }
  return { heading, body, accent: accent || heading }
}

// ---------------------------------------------------------------------------
// 固定元素聚类
// ---------------------------------------------------------------------------

function boxSignature(box) {
  return box.map((value) => String(Math.round(value / BOX_GRID) * BOX_GRID)).join(',')
}

function clusterFixed(slides, mediaInfo) {
  const lastPage = slides.length
  const elements = new Map()
  const upsert = (key, factory) => {
    if (!elements.has(key)) elements.set(key, factory())
    return elements.get(key)
  }
  for (const slide of slides) {
    for (const picture of slide.pictures) {
      const info = mediaInfo(picture.target)
      if (!info) continue
      const key = 'img|' + info.sha256 + '|' + boxSignature(picture.box)
      const element = upsert(key, () => ({ type: 'image', key, sha256: info.sha256, media: picture.target, box: picture.box, pages: new Set() }))
      element.pages.add(slide.number)
    }
    for (const shape of slide.shapes) {
      if (!shape.box || !shape.text) continue
      const key = 'txt|' + shape.text + '|' + boxSignature(shape.box)
      const element = upsert(key, () => ({
        type: 'text',
        key,
        text: shape.text,
        box: shape.box,
        pages: new Set(),
        size: shape.size,
        color: shape.color,
        typeface: shape.typeface,
        align: shape.align,
      }))
      element.pages.add(slide.number)
      if (element.size === null && shape.size !== null) element.size = shape.size
      if (!element.color && shape.color) element.color = shape.color
      if (!element.typeface && shape.typeface) element.typeface = shape.typeface
    }
  }
  const fixed = []
  for (const element of elements.values()) {
    const pages = [...element.pages].sort((left, right) => left - right)
    const edge = pages.includes(1) || pages.includes(lastPage)
    const threshold = edge ? FIXED_EDGE_MIN_PAGES : FIXED_MIN_PAGES
    if (pages.length < threshold) continue
    fixed.push({ ...element, pages })
  }
  fixed.sort((left, right) => left.pages[0] - right.pages[0] || right.pages.length - left.pages.length)
  return fixed
}

function pageMaxFontSize(slide) {
  let max = 0
  for (const shape of slide.shapes) for (const run of shape.runs) if (run.size !== null && run.size > max) max = run.size
  return max
}

function classifyPages(slides, fixed) {
  const types = new Map()
  const pageKeys = new Map()
  for (const element of fixed) {
    for (const page of element.pages) {
      if (!pageKeys.has(page)) pageKeys.set(page, [])
      pageKeys.get(page).push(element.key)
    }
  }
  const lastPage = slides.length
  types.set(1, 'cover')
  if (lastPage > 1) types.set(lastPage, 'closing')
  const byNumber = new Map(slides.map((slide) => [slide.number, slide]))
  const groups = new Map()
  for (const slide of slides) {
    const number = slide.number
    if (number === 1 || (lastPage > 1 && number === lastPage)) continue
    const fingerprint = [...(pageKeys.get(number) || [])].sort().join('&&')
    if (!groups.has(fingerprint)) groups.set(fingerprint, [])
    groups.get(fingerprint).push(number)
  }
  let largest = null
  for (const [fingerprint, pages] of groups) {
    if (!largest || pages.length > largest.pages.length) largest = { fingerprint, pages }
  }
  for (const [fingerprint, pages] of groups) {
    const isContent = largest && fingerprint === largest.fingerprint
    let type = 'content'
    if (!isContent) {
      const hasBigTitle = pages.some((page) => pageMaxFontSize(byNumber.get(page)) >= 32)
      if (hasBigTitle) type = 'section'
    }
    for (const page of pages) types.set(page, type)
  }
  return { types, pageKeys }
}

// ---------------------------------------------------------------------------
// 像素辅助
// ---------------------------------------------------------------------------

function hasAnyTransparency(image) {
  const data = image.data
  for (let index = 3; index < data.length; index += 4) if (data[index] < 255) return true
  return false
}

function parseHexColor(color) {
  const value = String(color).replace('#', '')
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) return [255, 255, 255]
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16))
}

/**
 * 「有效像素」占比：alpha > 8，且颜色与模板底色有明显差异（否则就是白底白水印，
 * UI 里是空图、PPTX 里是空白图片）。占比 < 1% 的素材会被丢弃。
 */
function alphaCoverage(image) {
  const data = image.data
  let count = 0
  for (let index = 3; index < data.length; index += 4) if (data[index] > VISIBLE_ALPHA_FLOOR) count += 1
  return count / (image.width * image.height)
}

function effectiveCoverage(image, backgroundColor) {
  const background = parseHexColor(backgroundColor)
  const data = image.data
  let visible = 0
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] <= VISIBLE_ALPHA_FLOOR) continue
    const dr = data[index] - background[0]
    const dg = data[index + 1] - background[1]
    const db = data[index + 2] - background[2]
    const distance = Math.sqrt((dr * dr + dg * dg + db * db) / 3) / 255
    if (distance > VISIBLE_COLOR_FLOOR) visible += 1
  }
  return visible / (image.width * image.height)
}

function opaqueMeanLuminance(image) {
  const data = image.data
  let sum = 0
  let count = 0
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 32) continue
    sum += 0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]
    count += 1
  }
  return count ? sum / count / 255 : 0
}

const SIGNATURE_GRID = 16
const CONTENT_ALPHA_FLOOR = 24

/**
 * 同款 logo 的不同分辨率 / 不同留白导出：先裁到不透明内容包围盒，再压成
 * 16×16 的 alpha + 预乘颜色签名。距离里带包围盒宽高比惩罚，
 * 因此「同一图案不同缩放」距离很小，「不同 logo」距离很大。
 */
function imageSignature(image) {
  const { width, height, data } = image
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= CONTENT_ALPHA_FLOOR) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < minX || maxY < minY) return null
  const boxWidth = maxX - minX + 1
  const boxHeight = maxY - minY + 1
  const cells = SIGNATURE_GRID * SIGNATURE_GRID
  const alpha = new Float32Array(cells)
  const color = new Float32Array(cells * 3)
  const alphaSum = new Float32Array(cells)
  const count = new Uint32Array(cells)
  for (let cellY = 0; cellY < SIGNATURE_GRID; cellY++) {
    const startY = minY + Math.floor((cellY * boxHeight) / SIGNATURE_GRID)
    const endY = Math.max(startY + 1, minY + Math.floor(((cellY + 1) * boxHeight) / SIGNATURE_GRID))
    for (let cellX = 0; cellX < SIGNATURE_GRID; cellX++) {
      const startX = minX + Math.floor((cellX * boxWidth) / SIGNATURE_GRID)
      const endX = Math.max(startX + 1, minX + Math.floor(((cellX + 1) * boxWidth) / SIGNATURE_GRID))
      const cell = cellY * SIGNATURE_GRID + cellX
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const offset = (y * width + x) * 4
          const a = data[offset + 3] / 255
          alpha[cell] += a
          alphaSum[cell] += a
          color[cell * 3] += data[offset] * a
          color[cell * 3 + 1] += data[offset + 1] * a
          color[cell * 3 + 2] += data[offset + 2] * a
          count[cell] += 1
        }
      }
    }
  }
  for (let cell = 0; cell < cells; cell++) {
    if (count[cell]) alpha[cell] /= count[cell]
    const weight = alphaSum[cell]
    if (weight > 0) {
      color[cell * 3] /= weight
      color[cell * 3 + 1] /= weight
      color[cell * 3 + 2] /= weight
    }
  }
  return { alpha, color, boxWidth, boxHeight }
}

function signatureDistance(left, right) {
  if (!left || !right) return Infinity
  const aspect = Math.abs(Math.log((left.boxWidth / left.boxHeight) / (right.boxWidth / right.boxHeight)))
  const cells = left.alpha.length
  let alphaDiff = 0
  let colorDiff = 0
  let colorWeight = 0
  for (let cell = 0; cell < cells; cell++) {
    alphaDiff += Math.abs(left.alpha[cell] - right.alpha[cell])
    if (left.alpha[cell] > 0.2 || right.alpha[cell] > 0.2) {
      colorDiff += Math.abs(left.color[cell * 3] - right.color[cell * 3]) +
        Math.abs(left.color[cell * 3 + 1] - right.color[cell * 3 + 1]) +
        Math.abs(left.color[cell * 3 + 2] - right.color[cell * 3 + 2])
      colorWeight += 1
    }
  }
  return alphaDiff / cells + (colorWeight ? colorDiff / colorWeight / 255 / 3 : 0) + 0.15 * aspect
}

const SIMILARITY_THRESHOLD = 0.3

/** 内部工具（测试 / 调参）：图片缩略签名与距离。 */
export { imageSignature, signatureDistance }

function uniqueSlot(base, occupied) {
  let slot = base
  let index = 2
  while (occupied.has(slot)) {
    slot = base + index
    index += 1
  }
  occupied.add(slot)
  return slot
}

function slotNameFor(group, lastPage, occupied) {
  const representative = group.representative
  const pages = new Set()
  for (const member of group.members) for (const page of member.element.pages) pages.add(page)
  const aspect = representative.width / representative.height
  const luminance = opaqueMeanLuminance(representative.image)
  if (luminance > 0.9 && representative.width >= 1000) return uniqueSlot('brandWatermark', occupied)
  if (pages.has(1) || pages.has(lastPage)) return uniqueSlot('universityLogo', occupied)
  if (aspect <= 1.6) return uniqueSlot('classLogo', occupied)
  if (aspect >= 2.4) return uniqueSlot('className', occupied)
  return uniqueSlot('brandMark', occupied)
}

// ---------------------------------------------------------------------------
// 素材处理
// ---------------------------------------------------------------------------

async function prepareImages(fixedImages, entries, skipped) {
  const prepared = []
  for (const element of fixedImages) {
    try {
      const image = await decodeImage(entries[element.media])
      makeTransparentWhite(image)
      const png = encodePng(image)
      prepared.push({
        element,
        image,
        png,
        width: image.width,
        height: image.height,
        alpha: hasAnyTransparency(image) || isTransparent(image),
        signature: imageSignature(image),
      })
    } catch (error) {
      skipped.push({ slot: '', media: element.media, reason: error.message })
    }
  }
  return prepared
}

function groupImages(prepared) {
  const groups = []
  for (const item of prepared) {
    const group = groups.find((candidate) => signatureDistance(candidate.representative.signature, item.signature) <= SIMILARITY_THRESHOLD)
    if (group) group.members.push(item)
    else groups.push({ members: [item], representative: item })
  }
  for (const group of groups) {
    group.representative = group.members.reduce((best, item) => (item.width * item.height > best.width * best.height ? item : best), group.members[0])
  }
  return groups
}

function dataUrlFor(png) {
  return 'data:image/png;base64,' + png.toString('base64')
}

// ---------------------------------------------------------------------------
// chrome 组装
// ---------------------------------------------------------------------------

function clampBox(box, canvas) {
  const x = Math.min(Math.max(box[0], 0), canvas.w)
  const y = Math.min(Math.max(box[1], 0), canvas.h)
  const w = Math.min(box[2], canvas.w - x)
  const h = Math.min(box[3], canvas.h - y)
  if (w < 0.05 || h < 0.05) return null
  return [round(x, 4), round(y, 4), round(w, 4), round(h, 4)]
}

function containedRatio(box, container) {
  const left = Math.max(box[0], container[0])
  const top = Math.max(box[1], container[1])
  const right = Math.min(box[0] + box[2], container[0] + container[2])
  const bottom = Math.min(box[1] + box[3], container[1] + container[3])
  if (right <= left || bottom <= top) return 0
  return ((right - left) * (bottom - top)) / (box[2] * box[3])
}

function resolveTextColor(color, palette) {
  if (!color) return palette.fg
  const hex = color.type === 'srgb' ? color.value : palette[SCHEME_COLOR_MAP[color.value] || 'fg']
  if (!hex) return palette.fg
  if (hex.toUpperCase() === palette.bg.toUpperCase()) return palette.fg
  return hex
}

function buildChrome(fixed, types, palette, fonts, typeScale, canvas) {
  const chrome = { cover: [], section: [], content: [], closing: [] }
  for (const element of fixed) {
    const kinds = [...new Set(element.pages.map((page) => types.get(page)).filter(Boolean))]
    if (element.type === 'image') {
      if (!element.slot) continue
      const box = clampBox(element.box, canvas)
      if (!box) continue
      for (const kind of kinds) chrome[kind].push({ kind: 'image', asset: element.slot, box })
      continue
    }
    if (element.box[1] + element.box[3] < canvas.h * BRAND_ZONE_RATIO) continue
    const box = clampBox(element.box, canvas)
    if (!box) continue
    const color = resolveTextColor(element.color, palette)
    const size = Math.min(96, Math.max(8, Math.round(element.size ?? typeScale.body)))
    const font = element.typeface && element.typeface === fonts.accent ? 'accent' : 'body'
    for (const kind of kinds) {
      chrome[kind].push({ kind: 'text', text: element.text, box, size, color, font, align: element.align })
    }
  }
  for (const kind of CHROME_PAGE_TYPES) {
    chrome[kind] = dedupeCoveredText(chrome[kind])
    if (chrome[kind].length > MAX_CHROME_ITEMS) {
      chrome[kind] = chrome[kind]
        .map((item, index) => ({ item, index, priority: item.kind === 'image' ? 0 : 1 }))
        .sort((left, right) => left.priority - right.priority || left.index - right.index)
        .slice(0, MAX_CHROME_ITEMS)
        .sort((left, right) => left.index - right.index)
        .map((entry) => entry.item)
    }
  }
  return chrome
}

/** 图片已经烘进文字（班名 logo）时，丢掉同一摆位里被图片覆盖的文本 item，避免重影。 */
function dedupeCoveredText(items) {
  const images = items.filter((item) => item.kind === 'image')
  return items.filter((item) => {
    if (item.kind !== 'text') return true
    return !images.some((image) => containedRatio(item.box, image.box) >= 0.6)
  })
}

function dedupeChrome(chrome) {
  for (const kind of CHROME_PAGE_TYPES) {
    const seen = new Set()
    chrome[kind] = chrome[kind].filter((item) => {
      const key = item.kind === 'image' ? 'i|' + item.asset + '|' + item.box.join(',') : 't|' + item.text + '|' + item.box.join(',')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  return chrome
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

function modalSize(values, fallback) {
  if (!values.length) return fallback
  const counts = new Map()
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1)
  let best = fallback
  let bestCount = 0
  for (const [value, count] of counts) {
    if (count > bestCount || (count === bestCount && value === fallback)) {
      best = value
      bestCount = count
    }
  }
  return best
}

function deriveTypeScale(slides, types, fixed, canvas) {
  const byNumber = new Map(slides.map((slide) => [slide.number, slide]))
  const pagesOf = (type) => slides.filter((slide) => types.get(slide.number) === type).map((slide) => slide.number)
  const coverPages = pagesOf('cover')
  const coverCandidates = coverPages.map((page) => pageMaxFontSize(byNumber.get(page))).filter((size) => size >= 24)
  const cover = modalSize(coverCandidates, DEFAULT_TYPE_SCALE.cover)
  const sectionPages = pagesOf('section')
  const sectionCandidates = sectionPages.map((page) => pageMaxFontSize(byNumber.get(page))).filter((size) => size >= 24)
  const section = modalSize(sectionCandidates.length ? sectionCandidates.concat([DEFAULT_TYPE_SCALE.section]) : [], DEFAULT_TYPE_SCALE.section)
  const sizes = []
  for (const slide of slides) for (const shape of slide.shapes) for (const run of shape.runs) if (run.size !== null) sizes.push(run.size)
  const inRange = (min, max) => sizes.filter((size) => size >= min && size <= max)
  const title = modalSize(inRange(16, 28), DEFAULT_TYPE_SCALE.title)
  const body = modalSize(inRange(11, 15), DEFAULT_TYPE_SCALE.body)
  const caption = modalSize(inRange(8, 11), DEFAULT_TYPE_SCALE.caption)
  const footerText = fixed.find((element) => element.type === 'text' && element.size !== null && element.box[1] + element.box[3] >= 0.7 * canvas.h)
  const footer = footerText ? Math.round(footerText.size) : DEFAULT_TYPE_SCALE.footer
  const clamp = (value) => Math.min(96, Math.max(8, Math.round(value)))
  return { cover: clamp(cover), section: clamp(section), title: clamp(title), body: clamp(body), caption: clamp(caption), footer: clamp(footer) }
}

function deriveName(options) {
  const source = typeof options.name === 'string' ? options.name.trim() : ''
  if (source) return { zh: source, en: CJK_RE.test(source) ? 'Imported template' : source }
  const fileName = String(options.fileName || '').split(/[\\/]/).pop() || ''
  const base = fileName.replace(/\.(pptx|pptm)$/i, '').trim()
  if (!base) return { zh: '导入模板', en: 'Imported template' }
  return { zh: base, en: CJK_RE.test(base) ? 'Imported template' : base }
}

/**
 * 从 .pptx 抽取模板草稿。
 * options: { assetsDir?, fileName?, name?, id? }
 */
export async function extractTemplateFromPptx(bytes, options = {}) {
  const buffer = asBuffer(bytes)
  const digest = createHash('sha256').update(buffer).digest('hex')
  const { entries, skipped: skippedEntries } = unzipEntries(buffer)
  const skippedAssets = [...skippedEntries]
  const theme = parseTheme(xmlText(entries['ppt/theme/theme1.xml']))
  const canvas = parseCanvas(xmlText(entries['ppt/presentation.xml']))
  const slides = listSlideNames(entries).map((name) => parseSlide(entries, name))
  if (!slides.length) fail('pptx 中没有可解析的幻灯片（ppt/slides/slideN.xml）')

  const statsRaw = collectStats(slides)
  const palette = buildPalette(theme.colors, statsRaw)
  const stats = {
    colors: statsRaw.colors,
    fonts: statsRaw.fonts,
    sizes: statsRaw.sizes,
  }

  const mediaCache = new Map()
  const mediaInfo = (target) => {
    if (mediaCache.has(target)) return mediaCache.get(target)
    const data = entries[target]
    if (!data) {
      mediaCache.set(target, null)
      return null
    }
    const info = { sha256: createHash('sha256').update(data).digest('hex'), size: data.length }
    mediaCache.set(target, info)
    return info
  }

  const fixed = clusterFixed(slides, mediaInfo)
  const { types } = classifyPages(slides, fixed)
  const typeScale = deriveTypeScale(slides, types, fixed, canvas)

  const fixedImages = fixed.filter((element) => element.type === 'image')
  const prepared = await prepareImages(fixedImages, entries, skippedAssets)
  const groups = groupImages(prepared)
  groups.sort((left, right) => {
    const leftEdge = left.members.some((member) => member.element.pages.includes(1) || member.element.pages.includes(slides.length)) ? 0 : 1
    const rightEdge = right.members.some((member) => member.element.pages.includes(1) || member.element.pages.includes(slides.length)) ? 0 : 1
    return leftEdge - rightEdge || right.members.length - left.members.length
  })

  const occupied = new Set()
  const assets = {}
  const draftAssets = {}
  const droppedAssets = []
  const candidates = []
  const assetsDir = typeof options.assetsDir === 'string' && options.assetsDir.trim() ? options.assetsDir.trim() : ''
  if (assetsDir) mkdirSync(assetsDir, { recursive: true })

  for (const group of groups) {
    const slot = slotNameFor(group, slides.length, occupied)
    const representative = group.representative
    const coverage = effectiveCoverage(representative.image, palette.bg)
    if (coverage < MIN_EFFECTIVE_COVERAGE) {
      // coverage 是「相对模板底色的可见像素占比」；alphaCoverage 是纯 alpha>8 占比。
      // 极淡白水印的 alphaCoverage 正常，但在浅底上 coverage≈0，属于空图。
      droppedAssets.push({ slot, coverage: round(coverage, 4), alphaCoverage: round(alphaCoverage(representative.image), 4) })
      continue
    }
    assets[slot] = {
      file: 'assets/' + slot + '.png',
      width: representative.width,
      height: representative.height,
      alpha: representative.alpha,
    }
    if (assetsDir) writeFileSync(joinPath(assetsDir, slot + '.png'), representative.png)
    draftAssets[slot] = dataUrlFor(representative.png)
    for (const member of group.members) {
      member.element.slot = slot
      candidates.push({
        slot,
        kind: 'image',
        pages: [...member.element.pages],
        box: member.element.box,
        width: member.width,
        height: member.height,
        alpha: member.alpha,
        dataSha256: member.element.sha256,
      })
    }
  }

  const accentHint = fixed.find((element) => element.type === 'text' && element.typeface && CJK_RE.test(element.text) && element.typeface !== theme.fonts.heading)?.typeface || ''
  const fonts = deriveFonts(theme.fonts, statsRaw, accentHint)
  const chrome = dedupeChrome(buildChrome(fixed, types, palette, fonts, typeScale, canvas))

  // 只把真正进了 chrome 的固定文本列成 candidate，避免 UI 展示被图片覆盖掉的重复文本。
  const chromeTextKeys = new Set()
  for (const kind of CHROME_PAGE_TYPES) {
    for (const item of chrome[kind]) if (item.kind === 'text') chromeTextKeys.add(item.text + '|' + item.box.join(','))
  }
  const usedTextSlots = new Set()
  for (const element of fixed) {
    if (element.type !== 'text') continue
    const key = element.text + '|' + (clampBox(element.box, canvas) || element.box).join(',')
    if (!chromeTextKeys.has(key)) continue
    const slot = uniqueSlot('footerText', usedTextSlots)
    candidates.push({
      slot,
      kind: 'text',
      pages: [...element.pages],
      box: element.box,
      text: element.text,
      size: element.size,
      color: resolveTextColor(element.color, palette),
      typeface: element.typeface,
      align: element.align,
    })
  }

  const name = deriveName(options)
  const id = typeof options.id === 'string' && options.id.trim() ? options.id.trim() : 'imported-' + digest.slice(0, 8)

  const draft = normalizeTemplate({
    id,
    name,
    canvas,
    dark: hexLuminance(palette.bg) < 0.5,
    palette,
    fonts,
    typeScale,
    assets,
    chrome,
    source: { kind: 'pptx', file: String(options.fileName || 'deck.pptx').split(/[\\/]/).pop(), sha256: digest },
  })
  if (skippedAssets.length) stats.skippedAssets = skippedAssets
  stats.droppedAssets = droppedAssets
  stats.pageTypes = Object.fromEntries([...types.entries()].sort((left, right) => left[0] - right[0]))
  return { draft, draftAssets, candidates, stats }
}
