import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { strToU8, zipSync, zlibSync } from 'fflate'
import jpeg from 'jpeg-js'
import { decodeImage, encodePng, isTransparent, makeTransparentWhite } from '../skills/dsh-ppt/scripts/deck-pixels.mjs'
import { CHROME_PAGE_TYPES, TEMPLATE_SCHEMA, normalizeTemplate, templateToTheme } from '../skills/dsh-ppt/scripts/deck-template.mjs'
import { extractTemplateFromPptx, imageSignature, signatureDistance } from '../skills/dsh-ppt/scripts/deck-template-extract.mjs'

const EMU = 914400
const emu = (inches) => String(Math.round(inches * EMU))

// ---------------------------------------------------------------------------
// 测试夹具
// ---------------------------------------------------------------------------

function imageOf(width, height, painter) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = painter(x, y)
      const offset = (y * width + x) * 4
      data[offset] = r
      data[offset + 1] = g
      data[offset + 2] = b
      data[offset + 3] = a
    }
  }
  return { width, height, data }
}

async function withTempDir(run) {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-template-'))
  try {
    return await run(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// 4-bit 调色板 PNG：用来验证「不支持位深要报错、抽取时不崩」。
const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let value = n
    for (let k = 0; k < 8; k++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    table[n] = value
  }
  return table
})()

function crc32(buffer) {
  let crc = -1
  for (let index = 0; index < buffer.length; index++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[index]) & 0xff]
  return (crc ^ -1) >>> 0
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBytes = Buffer.from(type, 'latin1')
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0)
  return Buffer.concat([length, typeBytes, data, checksum])
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function fourBitPalettePng(width = 8, height = 8) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 4
  header[9] = 3
  const palette = Buffer.from([255, 255, 255, 31, 78, 121])
  const rows = []
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + Math.ceil(width / 2))
    for (let x = 0; x < width; x++) row[1 + (x >> 1)] |= x % 2 ? 0x01 : 0x10
    rows.push(row)
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', header),
    pngChunk('PLTE', palette),
    pngChunk('IDAT', Buffer.from(zlibSync(Buffer.concat(rows)))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

/** 白底蓝条 logo（封面/结尾用，bbox 宽扁）。 */
function barLogo() {
  return encodePng(imageOf(80, 20, (x, y) => (x >= 10 && x <= 70 && y >= 4 && y <= 16 ? [31, 78, 121, 255] : [255, 255, 255, 255])))
}

/** 32×32 方形 logo（buildDeckAsync 夹具的品牌 Logo，白底会被抠透）。 */
function brandLogoPng() {
  return encodePng(imageOf(32, 32, (x, y) => (x >= 8 && x < 24 && y >= 8 && y < 24 ? [31, 78, 121, 255] : [255, 255, 255, 255])))
}

/** 白底绿色空心圆环 logo（内容页用，bbox 近方形）。 */
function ringLogo() {
  return encodePng(imageOf(20, 20, (x, y) => {
    const distance = Math.hypot(x - 9.5, y - 9.5)
    return distance <= 8 && distance >= 4 ? [0, 150, 70, 255] : [255, 255, 255, 255]
  }))
}

const THEME_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Synthetic">' +
  '<a:themeElements><a:clrScheme name="synthetic">' +
  '<a:dk1><a:srgbClr val="1A1A1A"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>' +
  '<a:dk2><a:srgbClr val="6B7785"/></a:dk2><a:lt2><a:srgbClr val="F2F5F9"/></a:lt2>' +
  '<a:accent1><a:srgbClr val="1F4E79"/></a:accent1><a:accent2><a:srgbClr val="C9A227"/></a:accent2>' +
  '</a:clrScheme><a:fontScheme name="synthetic">' +
  '<a:majorFont><a:latin typeface="Arial"/><a:ea typeface="微软雅黑"/></a:majorFont>' +
  '<a:minorFont><a:latin typeface="Arial"/><a:ea typeface="微软雅黑"/></a:minorFont>' +
  '</a:fontScheme></a:themeElements></a:theme>'

const PRESENTATION_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">' +
  '<p:sldSz cx="12192000" cy="6858000"/></p:presentation>'

function pictureXml(picture, index) {
  return '<p:pic><p:nvPicPr><p:cNvPr id="' + (100 + index) + '" name="Picture ' + index + '"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>' +
    '<p:blipFill><a:blip r:embed="' + picture.relId + '"/></p:blipFill>' +
    '<p:spPr><a:xfrm><a:off x="' + emu(picture.box[0]) + '" y="' + emu(picture.box[1]) + '"/>' +
    '<a:ext cx="' + emu(picture.box[2]) + '" cy="' + emu(picture.box[3]) + '"/></a:xfrm>' +
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>'
}

function textXml(text, index) {
  return '<p:sp><p:nvSpPr><p:cNvPr id="' + (200 + index) + '" name="Text ' + index + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>' +
    '<p:spPr><a:xfrm><a:off x="' + emu(text.box[0]) + '" y="' + emu(text.box[1]) + '"/>' +
    '<a:ext cx="' + emu(text.box[2]) + '" cy="' + emu(text.box[3]) + '"/></a:xfrm>' +
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>' +
    '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r>' +
    '<a:rPr lang="zh-CN" sz="' + Math.round(text.size * 100) + '"><a:solidFill><a:srgbClr val="1A1A1A"/></a:solidFill>' +
    '<a:ea typeface="微软雅黑"/></a:rPr><a:t>' + text.text + '</a:t></a:r></a:p></p:txBody></p:sp>'
}

function slideXml(page) {
  const pictures = (page.pictures || []).map(pictureXml).join('')
  const texts = (page.texts || []).map(textXml).join('')
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<p:cSld><p:spTree>' + pictures + texts + '</p:spTree></p:cSld></p:sld>'
}

function slideRels(page) {
  const images = (page.pictures || []).map((picture) =>
    '<Relationship Id="' + picture.relId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/' + picture.media + '"/>').join('')
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>' +
    images + '</Relationships>'
}

function buildSyntheticPptx(pages) {
  const files = {
    'ppt/presentation.xml': strToU8(PRESENTATION_XML),
    'ppt/theme/theme1.xml': strToU8(THEME_XML),
    'ppt/media/cover.png': barLogo(),
    'ppt/media/badge.png': ringLogo(),
    'ppt/media/broken.png': fourBitPalettePng(),
  }
  pages.forEach((page, index) => {
    files['ppt/slides/slide' + (index + 1) + '.xml'] = strToU8(slideXml(page))
    files['ppt/slides/_rels/slide' + (index + 1) + '.xml.rels'] = strToU8(slideRels(page))
  })
  return Buffer.from(zipSync(files))
}

const COVER_LOGO = { relId: 'rId2', media: 'cover.png', box: [4, 1, 3, 0.75] }
const BADGE = { relId: 'rId2', media: 'badge.png', box: [0.5, 0.15, 2, 0.5] }
const BROKEN = { relId: 'rId3', media: 'broken.png', box: [11, 6.2, 1, 0.6] }
const FOOTER = { text: '示例页脚文字', box: [2, 6.8, 5, 0.35], size: 12 }
const COVER_TITLE = { text: '合成封面标题', box: [1, 4, 10, 1], size: 40 }
const SECTION_TITLE = { text: '章节标题', box: [3, 2.5, 7, 1], size: 40 }

const SYNTHETIC_PAGES = [
  { pictures: [COVER_LOGO], texts: [COVER_TITLE] },
  { pictures: [BADGE, BROKEN], texts: [FOOTER, { text: '正文一', box: [1, 2, 7, 2], size: 13 }] },
  { pictures: [BADGE, BROKEN], texts: [FOOTER, { text: '正文二', box: [1, 2, 7, 2], size: 13 }] },
  { pictures: [BADGE, BROKEN], texts: [FOOTER, { text: '正文三', box: [1, 2, 7, 2], size: 13 }] },
  { pictures: [BADGE], texts: [FOOTER, { text: '正文四', box: [1, 2, 7, 2], size: 13 }] },
  { pictures: [BADGE], texts: [SECTION_TITLE] },
  { pictures: [BADGE], texts: [SECTION_TITLE] },
  { pictures: [COVER_LOGO], texts: [FOOTER] },
]

// ---------------------------------------------------------------------------
// deck-pixels
// ---------------------------------------------------------------------------

test('PNG 编解码回环保持 RGBA 字节不变', async () => {
  const original = imageOf(7, 5, (x, y) => [x * 20, y * 30, (x + y) * 10, x === 0 && y === 0 ? 0 : 255])
  const png = encodePng(original)
  assert.ok(Buffer.isBuffer(png))
  assert.deepEqual([...png.subarray(0, 8)], [...PNG_SIGNATURE])
  const decoded = await decodeImage(png)
  assert.equal(decoded.format, 'png')
  assert.equal(decoded.width, 7)
  assert.equal(decoded.height, 5)
  assert.deepEqual([...decoded.data], [...original.data])
})

test('8-bit 灰度 / RGB / 灰度+透明 / 调色板+tRNS 都能解成 RGBA', async () => {
  const gray = imageOf(2, 2, () => [90, 90, 90, 255])
  const decodedGray = await decodeImage(encodePng(gray))
  assert.deepEqual([...decodedGray.data.subarray(0, 4)], [90, 90, 90, 255])
  const transparent = imageOf(3, 1, (x) => [10, 20, 30, x === 0 ? 255 : 0])
  const decodedTransparent = await decodeImage(encodePng(transparent))
  assert.equal(decodedTransparent.data[3], 255)
  assert.equal(decodedTransparent.data[7], 0)
})

test('16-bit / 隔行 / 未知格式明确抛 dsh-ppt 错误', async () => {
  const png = encodePng(imageOf(4, 4, () => [1, 2, 3, 255]))
  const sixteenBit = Buffer.from(png)
  sixteenBit[24] = 16
  await assert.rejects(decodeImage(sixteenBit), /dsh-ppt：仅支持 8-bit PNG/)
  const interlaced = Buffer.from(png)
  interlaced[28] = 1
  await assert.rejects(decodeImage(interlaced), /dsh-ppt：不支持隔行/)
  await assert.rejects(decodeImage(Buffer.from('GIF89a-not-an-image')), /dsh-ppt：不支持的图片格式/)
  await assert.rejects(decodeImage(png.subarray(0, 20)), /dsh-ppt：PNG 数据被截断|dsh-ppt：PNG 缺少 IDAT/)
})

test('JPEG 走 jpeg-js 解码，白底能被泛洪抠掉', async () => {
  const source = imageOf(32, 32, (x, y) => (x >= 10 && x <= 21 && y >= 10 && y <= 21 ? [20, 20, 20, 255] : [255, 255, 255, 255]))
  const encoded = jpeg.encode({ data: Buffer.from(source.data), width: 32, height: 32 }, 100)
  const decoded = await decodeImage(encoded.data)
  assert.equal(decoded.format, 'jpeg')
  assert.equal(decoded.width, 32)
  makeTransparentWhite(decoded)
  assert.equal(decoded.data[3], 0, '左上角白底应透明')
  assert.ok(decoded.data[(16 * 32 + 16) * 4 + 3] > 200, '中央深色像素保留')
  assert.equal(isTransparent(decoded), true)
})

test('makeTransparentWhite 只抠与边界连通的近白，保留内部白与容差', () => {
  const size = 9
  const ringed = imageOf(size, size, (x, y) => {
    const onRing = (x === 2 || x === 6 || y === 2 || y === 6) && x >= 2 && x <= 6 && y >= 2 && y <= 6
    return onRing ? [0, 0, 0, 255] : [255, 255, 255, 255]
  })
  makeTransparentWhite(ringed)
  assert.equal(ringed.data[3], 0, '角上的白底被抠掉')
  assert.equal(ringed.data[(4 * size + 4) * 4 + 3], 255, '被黑框包围的内部白保留')
  assert.equal(ringed.data[(size * size - 1) * 4 + 3], 0)

  const light = imageOf(4, 4, () => [240, 240, 240, 255])
  makeTransparentWhite(light)
  assert.equal(light.data[3], 0, 'tolerance 默认 18 覆盖 240')
  const strict = imageOf(4, 4, () => [240, 240, 240, 255])
  makeTransparentWhite(strict, { tolerance: 5 })
  assert.equal(strict.data[3], 255, 'tolerance 5 不吃 240')
  assert.throws(() => makeTransparentWhite(imageOf(2, 2, () => [0, 0, 0, 255]), { tolerance: 999 }), /dsh-ppt：tolerance/)
})

test('isTransparent 用四角 alpha 均值判定', () => {
  assert.equal(isTransparent(imageOf(4, 4, () => [1, 2, 3, 255])), false)
  assert.equal(isTransparent(imageOf(4, 4, () => [1, 2, 3, 0])), true)
  const mixed = imageOf(4, 4, () => [1, 2, 3, 255])
  mixed.data[3] = 0
  assert.equal(isTransparent(mixed), false, '只有一个角透明不算透明底')
})

test('图片相似度：同款不同分辨率可合并，不同 logo 不会误合并', async () => {
  const prepare = async (image) => {
    makeTransparentWhite(image)
    return image
  }
  const cover = await prepare(await decodeImage(barLogo()))
  const badge = await prepare(await decodeImage(ringLogo()))
  const badgeCopy = await prepare(imageOf(40, 40, (x, y) => {
    const distance = Math.hypot(x - 19.5, y - 19.5)
    return distance <= 16 && distance >= 8 ? [0, 150, 70, 255] : [255, 255, 255, 255]
  }))
  assert.ok(signatureDistance(imageSignature(cover), imageSignature(badge)) > 0.3)
  assert.ok(signatureDistance(imageSignature(badge), imageSignature(badgeCopy)) <= 0.3)
})

// ---------------------------------------------------------------------------
// deck-template
// ---------------------------------------------------------------------------

const TEMPLATE_BASE = {
  id: 'demo-campus',
  name: { zh: '示例校园模板', en: 'Demo Campus' },
  canvas: { w: 13.3333, h: 7.5 },
  palette: { bg: '#ffffff', panel: '#F2F5F9', fg: '#1A1A1A', muted: '#6B7785', accent: '#1f4e79', accent2: '#c9a227' },
  fonts: { heading: 'Microsoft YaHei', body: 'Microsoft YaHei', accent: 'STKaiti' },
  typeScale: { cover: 40, section: 40, title: 20, body: 13, caption: 10, footer: 14 },
  assets: {
    universityLogo: { file: 'assets/universityLogo.png', width: 732, height: 166, alpha: true },
    classLogo: { file: 'assets/classLogo.png', width: 236, height: 224, alpha: true },
  },
  chrome: {
    cover: [{ kind: 'image', asset: 'universityLogo', box: [4.9, 1.7, 3.3, 0.75] }],
    section: [{ kind: 'image', asset: 'classLogo', box: [0.5, 0.4, 1.1, 1.05] }],
    content: [{
      kind: 'text',
      text: '示例班级名称',
      box: [0.5, 6.8, 2.7, 0.4],
      size: 14,
      color: '#1F4E79',
      font: 'accent',
      align: 'left',
    }],
    closing: [],
  },
}

test('normalizeTemplate 归一化：颜色大写、缺省字段补齐、幂等', () => {
  const template = normalizeTemplate(TEMPLATE_BASE)
  assert.equal(template.schema, TEMPLATE_SCHEMA)
  assert.equal(template.palette.bg, '#FFFFFF')
  assert.equal(template.palette.accent2, '#C9A227')
  assert.equal(template.palette.accent, '#1F4E79')
  assert.equal(template.dark, false)
  assert.equal(template.typeScale.caption, 10)
  assert.ok(!Number.isNaN(Date.parse(template.createdAt)))
  assert.deepEqual(template.assets.classLogo, { file: 'assets/classLogo.png', width: 236, height: 224, alpha: true })
  assert.deepEqual(normalizeTemplate(template), template, '归一化应幂等')
  const minimal = normalizeTemplate({
    id: 'minimal-1',
    name: '最小模板',
    palette: TEMPLATE_BASE.palette,
    fonts: { heading: 'Arial', body: 'Arial' },
  })
  assert.deepEqual(minimal.canvas, { w: 13.3333, h: 7.5 })
  assert.deepEqual(minimal.chrome, { cover: [], section: [], content: [], closing: [] })
  assert.equal(minimal.fonts.accent, 'Arial')
  assert.ok(CHROME_PAGE_TYPES.every((pageType) => Array.isArray(minimal.chrome[pageType])))
})

test('normalizeTemplate 严格拒绝坏数据（错误带 dsh-ppt 前缀）', () => {
  const cases = [
    [{ ...TEMPLATE_BASE, id: 'Bad_ID' }, /不符合规则/],
    [{ ...TEMPLATE_BASE, id: 'swiss' }, /与内置主题重名/],
    [{ ...TEMPLATE_BASE, schema: 'dsh-ppt/template@2' }, /schema/],
    [{ ...TEMPLATE_BASE, palette: { ...TEMPLATE_BASE.palette, accent: '#00448' } }, /palette.accent/],
    [{ ...TEMPLATE_BASE, palette: { ...TEMPLATE_BASE.palette, muted: undefined } }, /palette 缺少 "muted"/],
    [{ ...TEMPLATE_BASE, canvas: { w: 0, h: 7.5 } }, /canvas.w/],
    [{ ...TEMPLATE_BASE, fonts: { heading: '', body: 'Arial' } }, /fonts.heading/],
    [{ ...TEMPLATE_BASE, typeScale: { ...TEMPLATE_BASE.typeScale, body: 100 } }, /typeScale.body/],
    [{ ...TEMPLATE_BASE, chrome: { cover: [], section: [], content: [] } }, /chrome 缺少页型 "closing"/],
    [{ ...TEMPLATE_BASE, chrome: { ...TEMPLATE_BASE.chrome, cover: [{ kind: 'image', asset: 'ghost', box: [1, 1, 1, 1] }] } }, /不存在的素材 "ghost"/],
    [{ ...TEMPLATE_BASE, chrome: { ...TEMPLATE_BASE.chrome, cover: [{ kind: 'image', asset: 'universityLogo', box: [13, 1, 2, 1] }] } }, /超出画布/],
    [{ ...TEMPLATE_BASE, chrome: { ...TEMPLATE_BASE.chrome, cover: [{ kind: 'image', asset: 'universityLogo', box: [1, 1, 0, 1] }] } }, /宽高必须大于 0/],
    [{ ...TEMPLATE_BASE, chrome: { ...TEMPLATE_BASE.chrome, content: [{ kind: 'text', text: 'x', box: [1, 1, 1, 1], size: 9, color: '#123456', font: 'body', align: 'middle' }] } }, /align/],
    [{ ...TEMPLATE_BASE, chrome: { ...TEMPLATE_BASE.chrome, content: Array.from({ length: 13 }, () => ({ kind: 'image', asset: 'universityLogo', box: [0.5, 6.8, 2.7, 0.4] })) } }, /最多 12 个元素/],
    [{ ...TEMPLATE_BASE, assets: { 'bad slot': { file: 'assets/a.png' } } }, /槽位名/],
  ]
  for (const [input, pattern] of cases) {
    assert.throws(() => normalizeTemplate(input), (error) => {
      assert.match(error.message, /^dsh-ppt：/)
      assert.match(error.message, pattern)
      return true
    })
  }
})

test('templateToTheme 输出 chrome / chromeAssets / typeScale 等扩展字段', () => {
  const template = normalizeTemplate(TEMPLATE_BASE)
  const theme = templateToTheme(template, { universityLogo: 'iVBORw0KGgo=', unknownSlot: 'ignored' })
  assert.equal(theme.id, 'demo-campus')
  assert.equal(theme.dark, false)
  assert.deepEqual(theme.palette, template.palette)
  assert.equal(theme.fonts.heading, '"Microsoft YaHei"')
  assert.equal(theme.fonts.accent, 'STKaiti')
  assert.deepEqual(theme.typeScale, template.typeScale)
  assert.deepEqual(Object.keys(theme.chrome), ['cover', 'section', 'content', 'closing'])
  assert.equal(theme.chrome.cover[0].asset, 'universityLogo')
  assert.deepEqual(theme.chromeAssets, { universityLogo: 'data:image/png;base64,iVBORw0KGgo=' })
  theme.chrome.cover[0].box[0] = 99
  assert.equal(template.chrome.cover[0].box[0], 4.9, 'theme.chrome 必须是深拷贝')
  const withUrl = templateToTheme(template, { universityLogo: 'data:image/png;base64,AAAA' })
  assert.equal(withUrl.chromeAssets.universityLogo, 'data:image/png;base64,AAAA')
})

// ---------------------------------------------------------------------------
// deck-template-extract：合成样本
// ---------------------------------------------------------------------------

test('合成 pptx 抽取：页型归类、固定元素、素材与透明化', () => withTempDir(async (dir) => {
  const bytes = buildSyntheticPptx(SYNTHETIC_PAGES)
  const assetsDir = join(dir, 'assets')
  const { draft, draftAssets, candidates, stats } = await extractTemplateFromPptx(bytes, { assetsDir, fileName: '合成模板.pptx', id: 'synthetic-deck' })
  assert.deepEqual(Object.keys(draftAssets).sort(), Object.keys(draft.assets).sort(), '顶层 draftAssets 必须与 draft.assets 同键')
  assert.equal(draft.draftAssets, undefined, 'draft 内不要再带 draftAssets')
  for (const value of Object.values(draftAssets)) assert.match(value, /^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
  assert.equal(draft.schema, TEMPLATE_SCHEMA)
  assert.equal(draft.id, 'synthetic-deck')
  assert.equal(draft.name.zh, '合成模板')
  assert.equal(draft.source.kind, 'pptx')
  assert.equal(draft.source.sha256.length, 64)
  assert.equal(draft.palette.accent, '#1F4E79')
  assert.equal(draft.palette.bg, '#FFFFFF')
  assert.equal(draft.dark, false)
  assert.equal(draft.fonts.heading, '微软雅黑')
  assert.equal(draft.canvas.w, 13.3333)

  const assetSlots = Object.keys(draft.assets)
  assert.ok(assetSlots.length >= 2, '至少抽出 2 个素材')
  assert.ok(assetSlots.includes('universityLogo'), '封面/结尾同款 logo → universityLogo')
  assert.ok(assetSlots.includes('classLogo'), '内容页近方形徽标 → classLogo')
  for (const slot of assetSlots) {
    assert.match(draft.assets[slot].file, /^assets\/.+\.png$/)
    assert.ok(draft.assets[slot].width > 0 && draft.assets[slot].height > 0)
    const png = readFileSync(join(assetsDir, slot + '.png'))
    const decoded = await decodeImage(png)
    assert.equal(decoded.width, draft.assets[slot].width)
    assert.equal(decoded.height, draft.assets[slot].height)
    assert.equal(isTransparent(decoded), true, slot + ' 应已抠成透明 PNG')
  }

  assert.ok(CHROME_PAGE_TYPES.every((pageType) => draft.chrome[pageType].length > 0), '四类 chrome 均有内容')
  assert.equal(draft.chrome.cover[0].kind, 'image')
  assert.equal(draft.chrome.cover[0].asset, 'universityLogo')
  assert.ok(draft.chrome.content.some((item) => item.kind === 'text' && item.text === '示例页脚文字'))
  assert.ok(draft.chrome.content.some((item) => item.kind === 'image' && item.asset === 'classLogo'))
  const chromeImages = CHROME_PAGE_TYPES.flatMap((pageType) => draft.chrome[pageType]).filter((item) => item.kind === 'image')
  assert.ok(chromeImages.every((item) => typeof item.asset === 'string' && item.asset in draft.assets), '解码失败的素材不能进 chrome')

  assert.deepEqual(stats.pageTypes, { 1: 'cover', 2: 'content', 3: 'content', 4: 'content', 5: 'content', 6: 'section', 7: 'section', 8: 'closing' })
  assert.ok(stats.skippedAssets.some((entry) => /8-bit/.test(entry.reason)), '4-bit PNG 应被跳过并记录原因')
  assert.deepEqual(stats.droppedAssets, [], '合成样本素材都可见，不应被丢弃')
  assert.equal(stats.colors.text['#1A1A1A'], 12, '文本色按 a:srgbClr 统计')
  assert.ok(stats.fonts.some((entry) => entry.typeface === '微软雅黑'))
  assert.ok(stats.sizes.some((entry) => entry.pt === 40))

  const images = candidates.filter((candidate) => candidate.kind === 'image')
  assert.ok(images.length >= 2)
  assert.ok(images.every((candidate) => Array.isArray(candidate.pages) && candidate.pages.length >= 2))
  assert.ok(images.every((candidate) => /^[0-9a-f]{64}$/.test(candidate.dataSha256)))
  const texts = candidates.filter((candidate) => candidate.kind === 'text')
  assert.ok(texts.some((candidate) => candidate.text === '示例页脚文字' && candidate.size === 12))

  assert.throws(() => normalizeTemplate({ ...draft, id: 'swiss' }), /dsh-ppt：模板 id "swiss" 与内置主题重名/)
}))

test('不传 assetsDir 时素材以 base64 放进顶层 draftAssets', async () => {
  const { draft, draftAssets } = await extractTemplateFromPptx(buildSyntheticPptx(SYNTHETIC_PAGES), { fileName: 'synthetic.pptx' })
  assert.deepEqual(Object.keys(draftAssets).sort(), Object.keys(draft.assets).sort())
  for (const value of Object.values(draftAssets)) assert.match(value, /^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
  assert.match(draft.id, /^imported-[0-9a-f]{8}$/)
  const normalized = normalizeTemplate(draft)
  assert.equal(normalized.draftAssets, undefined, 'draftAssets 不属于 template.json 契约字段')
})

test('非 zip / 无幻灯片的输入给出明确错误', async () => {
  await assert.rejects(extractTemplateFromPptx(Buffer.from('definitely not a pptx')), /dsh-ppt：无法解包 pptx/)
  const empty = Buffer.from(zipSync({ 'ppt/theme/theme1.xml': strToU8(THEME_XML) }))
  await assert.rejects(extractTemplateFromPptx(empty), /dsh-ppt：pptx 中没有可解析的幻灯片/)
})

// ---------------------------------------------------------------------------
// deck-template-extract：buildDeckAsync 现场生成的临时 deck（无个人样本依赖）
// ---------------------------------------------------------------------------

/** 用 buildDeckAsync + 现场生成的 logo 组一份带品牌层的临时 deck（不依赖任何真实素材）。 */
async function buildBrandedDeck(dir) {
  const { buildDeckAsync } = await import('../skills/dsh-ppt/scripts/deck-advanced.mjs')
  const logoPath = join(dir, 'brand-logo.png')
  writeFileSync(logoPath, brandLogoPng())
  const deck = await buildDeckAsync({
    title: '示例演示文稿',
    content: '# 示例演示文稿\n\n## 第一章\n\n- 要点一\n\n## 第二章\n\n- 要点二\n',
    theme: 'data',
    brand: { logo: logoPath, footer: '示例单位 · 2026' },
    outputDir: join(dir, 'deck'),
  })
  return { deck, bytes: readFileSync(deck.pptxPath) }
}

test('buildDeckAsync 生成的临时 deck 抽取：跨页品牌 logo + footer 固定文本', () => withTempDir(async (dir) => {
  const { deck, bytes } = await buildBrandedDeck(dir)
  assert.ok(existsSync(deck.pptxPath), 'buildDeckAsync 应产出 pptx')
  const { draft, draftAssets, candidates, stats } = await extractTemplateFromPptx(bytes, { fileName: 'fixture.pptx' })

  // 四类页型的 chrome 键必须齐全（夹具没有章节页，section 允许是空数组）
  assert.deepEqual(Object.keys(draft.chrome).sort(), [...CHROME_PAGE_TYPES].sort())
  assert.equal(stats.pageTypes[1], 'cover')
  const lastPage = Math.max(...Object.keys(stats.pageTypes).map(Number))
  assert.equal(stats.pageTypes[lastPage], 'closing')

  // 跨页同一摆位的品牌 logo → 至少 1 个素材，并识别成 universityLogo
  const slots = Object.keys(draft.assets)
  assert.ok(slots.length >= 1, '至少抽出 1 个素材')
  assert.ok(slots.includes('universityLogo'), '每页同一摆位的品牌 logo → universityLogo')
  assert.deepEqual(Object.keys(draftAssets).sort(), [...slots].sort(), '顶层 draftAssets 必须与 assets 同键')
  const logoAsset = draft.assets.universityLogo
  assert.equal(logoAsset.width, 32)
  assert.equal(logoAsset.height, 32)
  assert.equal(logoAsset.alpha, true)
  const decoded = await decodeImage(Buffer.from(draftAssets.universityLogo.split(',')[1], 'base64'))
  assert.equal(decoded.width, 32)
  assert.equal(isTransparent(decoded), true, '白底应被抠透')
  assert.equal(decoded.data[3], 0)
  for (const pageType of ['cover', 'content', 'closing']) {
    assert.ok(draft.chrome[pageType].some((item) => item.kind === 'image' && item.asset === 'universityLogo'), pageType + ' 应带品牌 logo')
  }
  const imageCandidates = candidates.filter((candidate) => candidate.kind === 'image')
  assert.ok(imageCandidates.length >= 1)
  assert.ok(imageCandidates.every((candidate) => candidate.pages.length >= 2 && candidate.dataSha256.length === 64))

  // 品牌 footer：跨页同一 box + 同一文本 → 固定文本，既进 chrome 也进 candidates
  const footerText = '示例单位 · 2026'
  const footerItems = CHROME_PAGE_TYPES.flatMap((pageType) => draft.chrome[pageType])
    .filter((item) => item.kind === 'text' && item.text === footerText)
  assert.ok(footerItems.length >= 2, 'footer 固定文本应出现在多个页型')
  assert.ok(candidates.some((candidate) => candidate.kind === 'text' && candidate.text === footerText), 'candidates 应含 footer 文本')
  for (const item of footerItems) {
    assert.ok(item.box[0] >= -0.05 && item.box[1] >= -0.05)
    assert.ok(item.box[0] + item.box[2] <= draft.canvas.w + 0.05)
    assert.ok(item.box[1] + item.box[3] <= draft.canvas.h + 0.05)
  }

  // 带 assetsDir 的落盘路径：文件与顶层 draftAssets 同键，回读尺寸一致
  const assetsDir = join(dir, 'assets')
  const written = await extractTemplateFromPptx(bytes, { assetsDir })
  assert.equal(written.draft.draftAssets, undefined, 'draft 内不带 draftAssets')
  assert.deepEqual(Object.keys(written.draftAssets).sort(), Object.keys(written.draft.assets).sort())
  for (const slot of Object.keys(written.draft.assets)) {
    const onDisk = await decodeImage(readFileSync(join(assetsDir, slot + '.png')))
    assert.equal(onDisk.width, written.draft.assets[slot].width)
    assert.equal(onDisk.height, written.draft.assets[slot].height)
  }
  writeFileSync(join(dir, 'template.json'), JSON.stringify(normalizeTemplate(written.draft), null, 2))
  assert.ok(existsSync(join(dir, 'template.json')))
}))
