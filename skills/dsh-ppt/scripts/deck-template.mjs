#! /usr/bin/env node
/**
 * deck-template.mjs —— 导入模板的校验层与主题合成（SPEC §3）。
 *
 * normalizeTemplate(input)  校验 + 归一化，返回可直接落盘的 template.json 对象。
 *                           不读文件系统；坏数据一律抛 'dsh-ppt：' 前缀错误。
 * templateToTheme(t, assets) 模板 → deck-core / deck-advanced 消费的 theme 对象，
 *                           额外带 chrome / chromeAssets / typeScale / dark。
 *
 * 约束（SPEC §2）：
 *   - id ^[a-z0-9][a-z0-9-]{1,39}$，且不与内置主题重名
 *   - palette 六个 #RRGGBB（大写存储）
 *   - typeScale 六项整数 8–96
 *   - chrome 四个页型键齐全；每个页型最多 12 个 item
 *   - box = [x, y, w, h] 英寸，必须落在画布内（±0.05in 容差）
 *   - chrome item 引用的 asset 必须存在于 assets
 */

export const TEMPLATE_SCHEMA = 'dsh-ppt/template@1'
export const CHROME_PAGE_TYPES = ['cover', 'section', 'content', 'closing']

const BUILTIN_THEME_IDS = ['swiss', 'velvet', 'data', 'soft', 'bold']
const PALETTE_KEYS = ['bg', 'panel', 'fg', 'muted', 'accent', 'accent2']
const TYPE_SCALE_KEYS = ['cover', 'section', 'title', 'body', 'caption', 'footer']
const FONT_ROLES = ['heading', 'body', 'accent']
const TEXT_ALIGNS = ['left', 'center', 'right']
const TYPE_SCALE_DEFAULTS = { cover: 40, section: 40, title: 20, body: 13, caption: 10, footer: 14 }
const MAX_CHROME_ITEMS = 12
const BOX_TOLERANCE = 0.05
const DEFAULT_CANVAS = { w: 13.3333, h: 7.5 }
const TEMPLATE_ID_RE = /^[a-z0-9][a-z0-9-]{1,39}$/
const COLOR_RE = /^#[0-9A-Fa-f]{6}$/
const ASSET_SLOT_RE = /^[A-Za-z][A-Za-z0-9_-]{0,39}$/
const ASSET_FILE_RE = /^assets\/[A-Za-z0-9._-]+$/
const SHA256_RE = /^[0-9a-f]{64}$/

function fail(message) {
  throw new Error('dsh-ppt：' + message)
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requireObject(value, label) {
  if (!isPlainObject(value)) fail(label + ' 必须是对象')
  return value
}

function requireText(value, label, maxLength = 200) {
  if (typeof value !== 'string') fail(label + ' 必须是字符串')
  const text = value.trim()
  if (!text) fail(label + ' 不能为空')
  if (text.length > maxLength) fail(label + ' 过长（上限 ' + maxLength + ' 字符）')
  return text
}

function normalizeColor(value, label) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!COLOR_RE.test(text)) fail(label + ' 必须是 #RRGGBB 颜色，收到 ' + JSON.stringify(value))
  return text.toUpperCase()
}

function normalizeInt(value, label, min, max, fallback) {
  if (value === undefined) return fallback
  const number = Number(value)
  if (!Number.isInteger(number)) fail(label + ' 必须是整数，收到 ' + JSON.stringify(value))
  if (number < min || number > max) fail(label + ' 必须在 ' + min + '–' + max + ' 之间，收到 ' + number)
  return number
}

function roundInch(value) {
  return Math.round(Number(value) * 10000) / 10000
}

function hexLuminance(color) {
  const value = color.replace('#', '')
  const channel = (offset) => {
    const srgb = parseInt(value.slice(offset, offset + 2), 16) / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
}

function normalizeTemplateId(value) {
  const id = String(value ?? '').trim().toLowerCase()
  if (!id) fail('模板缺少 id（规则 ^[a-z0-9][a-z0-9-]{1,39}$）')
  if (!TEMPLATE_ID_RE.test(id)) fail('模板 id "' + id + '" 不符合规则 ^[a-z0-9][a-z0-9-]{1,39}$')
  if (BUILTIN_THEME_IDS.includes(id)) fail('模板 id "' + id + '" 与内置主题重名，请换一个')
  return id
}

function normalizeName(value) {
  if (typeof value === 'string') {
    const zh = requireText(value, '模板 name', 80)
    return { zh, en: zh }
  }
  const raw = requireObject(value, '模板 name')
  const zh = typeof raw.zh === 'string' ? raw.zh.trim() : ''
  const en = typeof raw.en === 'string' ? raw.en.trim() : ''
  if (!zh && !en) fail('模板 name 至少要提供 zh 或 en')
  if (zh.length > 80 || en.length > 80) fail('模板 name 过长（上限 80 字符）')
  return { zh: zh || en, en: en || zh }
}

function normalizeCreatedAt(value) {
  if (value === undefined || value === null || value === '') return new Date().toISOString()
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) fail('createdAt 不是合法时间：' + String(value))
  return date.toISOString()
}

function normalizeCanvas(value) {
  if (value === undefined) return { ...DEFAULT_CANVAS }
  const raw = requireObject(value, '模板 canvas')
  const w = Number(raw.w)
  const h = Number(raw.h)
  if (!Number.isFinite(w) || w < 1 || w > 40) fail('canvas.w 必须是 1–40 的数值（英寸），收到 ' + JSON.stringify(raw.w))
  if (!Number.isFinite(h) || h < 1 || h > 40) fail('canvas.h 必须是 1–40 的数值（英寸），收到 ' + JSON.stringify(raw.h))
  return { w: roundInch(w), h: roundInch(h) }
}

function normalizePalette(value) {
  const raw = requireObject(value, '模板 palette')
  const palette = {}
  for (const key of PALETTE_KEYS) {
    if (raw[key] === undefined) fail('palette 缺少 "' + key + '" 颜色')
    palette[key] = normalizeColor(raw[key], 'palette.' + key)
  }
  return palette
}

function normalizeFonts(value) {
  const raw = requireObject(value, '模板 fonts')
  const heading = requireText(raw.heading, 'fonts.heading', 200)
  const body = requireText(raw.body, 'fonts.body', 200)
  const accent = raw.accent === undefined ? heading : requireText(raw.accent, 'fonts.accent', 200)
  return { heading, body, accent }
}

function normalizeTypeScale(value) {
  if (value === undefined) return { ...TYPE_SCALE_DEFAULTS }
  const raw = requireObject(value, '模板 typeScale')
  const typeScale = {}
  for (const key of TYPE_SCALE_KEYS) typeScale[key] = normalizeInt(raw[key], 'typeScale.' + key, 8, 96, TYPE_SCALE_DEFAULTS[key])
  return typeScale
}

function normalizeAssets(value) {
  if (value === undefined) return {}
  const raw = requireObject(value, '模板 assets')
  const assets = {}
  for (const [slot, entry] of Object.entries(raw)) {
    if (!ASSET_SLOT_RE.test(slot)) fail('assets 槽位名 "' + slot + '" 不合法（字母开头，仅字母数字 _ -，最长 40）')
    if (!isPlainObject(entry)) fail('assets.' + slot + ' 必须是对象')
    const file = entry.file === undefined ? 'assets/' + slot + '.png' : requireText(entry.file, 'assets.' + slot + '.file', 200)
    if (!ASSET_FILE_RE.test(file)) fail('assets.' + slot + '.file 必须形如 assets/<文件名>.png，收到 "' + file + '"')
    const width = normalizeInt(entry.width, 'assets.' + slot + '.width', 0, 20000, 0)
    const height = normalizeInt(entry.height, 'assets.' + slot + '.height', 0, 20000, 0)
    let alpha = true
    if (entry.alpha !== undefined) {
      if (typeof entry.alpha !== 'boolean') fail('assets.' + slot + '.alpha 必须是布尔值')
      alpha = entry.alpha
    }
    assets[slot] = { file, width, height, alpha }
  }
  return assets
}

function normalizeBox(value, label, canvas) {
  if (!Array.isArray(value) || value.length !== 4) fail(label + ' 的 box 必须是 [x, y, w, h] 四元数组')
  const numbers = value.map((item) => Number(item))
  if (numbers.some((item) => !Number.isFinite(item))) fail(label + ' 的 box 含非数值：' + JSON.stringify(value))
  const [x, y, w, h] = numbers
  if (w <= 0 || h <= 0) fail(label + ' 的 box 宽高必须大于 0，收到 ' + JSON.stringify(value))
  if (x < -BOX_TOLERANCE || y < -BOX_TOLERANCE) fail(label + ' 的 box 左上角超出画布：' + JSON.stringify(value))
  if (x + w > canvas.w + BOX_TOLERANCE || y + h > canvas.h + BOX_TOLERANCE) {
    fail(label + ' 的 box 超出画布 ' + canvas.w + '×' + canvas.h + '：' + JSON.stringify(value))
  }
  return numbers.map(roundInch)
}

function normalizeChromeItem(item, pageType, index, canvas, assets) {
  const label = 'chrome.' + pageType + '[' + index + ']'
  const raw = requireObject(item, label)
  const kind = String(raw.kind ?? '').trim()
  if (kind !== 'image' && kind !== 'text') fail(label + ' 的 kind 必须是 image 或 text，收到 "' + kind + '"')
  const box = normalizeBox(raw.box, label, canvas)
  if (kind === 'image') {
    const asset = requireText(raw.asset, label + '.asset', 40)
    if (!Object.prototype.hasOwnProperty.call(assets, asset)) fail(label + ' 引用了不存在的素材 "' + asset + '"')
    return { kind: 'image', asset, box }
  }
  const text = requireText(raw.text, label + '.text', 200)
  const size = normalizeInt(raw.size, label + '.size', 8, 96, undefined)
  if (size === undefined) fail(label + '.size 必须是 8–96 的整数')
  const color = normalizeColor(raw.color, label + '.color')
  const font = String(raw.font ?? '').trim()
  if (!FONT_ROLES.includes(font)) fail(label + '.font 必须是 ' + FONT_ROLES.join(' / ') + '，收到 "' + font + '"')
  const align = String(raw.align ?? '').trim()
  if (!TEXT_ALIGNS.includes(align)) fail(label + '.align 必须是 ' + TEXT_ALIGNS.join(' / ') + '，收到 "' + align + '"')
  return { kind: 'text', text, box, size, color, font, align }
}

function normalizeChrome(value, canvas, assets) {
  const chrome = {}
  if (value === undefined) {
    for (const pageType of CHROME_PAGE_TYPES) chrome[pageType] = []
    return chrome
  }
  const raw = requireObject(value, '模板 chrome')
  for (const pageType of CHROME_PAGE_TYPES) {
    if (!Array.isArray(raw[pageType])) fail('chrome 缺少页型 "' + pageType + '"（必须是数组，可为空）')
  }
  for (const pageType of CHROME_PAGE_TYPES) {
    if (raw[pageType].length > MAX_CHROME_ITEMS) fail('chrome.' + pageType + ' 最多 ' + MAX_CHROME_ITEMS + ' 个元素，收到 ' + raw[pageType].length)
    chrome[pageType] = raw[pageType].map((item, index) => normalizeChromeItem(item, pageType, index, canvas, assets))
  }
  return chrome
}

function normalizeSource(value) {
  if (value === undefined) return null
  const raw = requireObject(value, '模板 source')
  const kind = String(raw.kind ?? '').trim()
  if (kind !== 'pptx' && kind !== 'manual') fail('source.kind 必须是 pptx 或 manual，收到 "' + kind + '"')
  const source = { kind }
  if (raw.file !== undefined) source.file = requireText(raw.file, 'source.file', 300)
  if (raw.sha256 !== undefined) {
    const sha = String(raw.sha256).trim().toLowerCase()
    if (!SHA256_RE.test(sha)) fail('source.sha256 必须是 64 位十六进制摘要')
    source.sha256 = sha
  }
  return source
}

/**
 * 校验并归一化模板。不读文件系统。
 * 缺少可选字段时补默认值；未知字段直接丢弃，保证落盘对象只有契约字段。
 */
export function normalizeTemplate(input) {
  const raw = requireObject(input, '模板')
  const schema = raw.schema === undefined ? TEMPLATE_SCHEMA : String(raw.schema).trim()
  if (schema !== TEMPLATE_SCHEMA) fail('模板 schema 必须是 ' + TEMPLATE_SCHEMA + '，收到 "' + schema + '"')
  const id = normalizeTemplateId(raw.id)
  const name = normalizeName(raw.name)
  const canvas = normalizeCanvas(raw.canvas)
  const palette = normalizePalette(raw.palette)
  let dark = hexLuminance(palette.bg) < 0.5
  if (raw.dark !== undefined) {
    if (typeof raw.dark !== 'boolean') fail('dark 必须是布尔值')
    dark = raw.dark
  }
  const fonts = normalizeFonts(raw.fonts)
  const typeScale = normalizeTypeScale(raw.typeScale)
  const assets = normalizeAssets(raw.assets)
  const chrome = normalizeChrome(raw.chrome, canvas, assets)
  const template = {
    schema: TEMPLATE_SCHEMA,
    id,
    name,
    createdAt: normalizeCreatedAt(raw.createdAt),
    canvas,
    dark,
    palette,
    fonts,
    typeScale,
    assets,
    chrome,
  }
  const source = normalizeSource(raw.source)
  if (source) template.source = source
  return template
}

// ---------------------------------------------------------------------------
// 主题合成
// ---------------------------------------------------------------------------

/** 单字体名 → CSS font-family 值；含空格时补引号，本身是字体栈则原样保留。 */
function cssFont(name) {
  const value = String(name ?? '').trim()
  if (!value) return 'sans-serif'
  if (value.includes(',')) return value
  if (/\s/.test(value) && !/^['"]/.test(value)) return '"' + value + '"'
  return value
}

function toDataUrl(source) {
  const value = String(source ?? '').trim()
  if (!value) return ''
  if (/^data:image\//i.test(value)) return value
  return 'data:image/png;base64,' + value.replace(/^data:[^,]*,/i, '')
}

function cloneChrome(chrome) {
  const out = {}
  for (const pageType of CHROME_PAGE_TYPES) out[pageType] = chrome[pageType].map((item) => ({ ...item, box: [...item.box] }))
  return out
}

/**
 * 模板 → 渲染 theme。
 * chromeAssets: { [slot]: 'data:image/png;base64,...' | base64 }，只保留模板 assets 里存在的槽位。
 */
export function templateToTheme(template, chromeAssets = {}) {
  const normalized = normalizeTemplate(template)
  const provided = isPlainObject(chromeAssets) ? chromeAssets : {}
  const resolvedAssets = {}
  for (const slot of Object.keys(normalized.assets)) {
    const value = provided[slot]
    if (typeof value === 'string') {
      const dataUrl = toDataUrl(value)
      if (dataUrl) resolvedAssets[slot] = dataUrl
    } else if (isPlainObject(value) && typeof value.data === 'string') {
      const dataUrl = toDataUrl(value.data)
      if (dataUrl) resolvedAssets[slot] = dataUrl
    }
  }
  return {
    id: normalized.id,
    name: { ...normalized.name },
    mood: { zh: '导入模板', en: 'Imported template' },
    bestFor: { zh: '套用导入模板的视觉令牌与品牌固定层', en: 'Imported template tokens and brand chrome' },
    dark: normalized.dark,
    palette: { ...normalized.palette },
    fonts: {
      heading: cssFont(normalized.fonts.heading),
      body: cssFont(normalized.fonts.body),
      accent: cssFont(normalized.fonts.accent),
    },
    typeScale: { ...normalized.typeScale },
    chrome: cloneChrome(normalized.chrome),
    chromeAssets: resolvedAssets,
  }
}
