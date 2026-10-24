import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inflateRawSync } from 'node:zlib'
import {
  CHROME_SLOTS,
  chromePageType,
  listThemes,
  renderHtml,
  resolveLanguage,
  resolveTheme,
  setTemplateThemeProvider,
} from '../skills/dsh-ppt/scripts/deck-core.mjs'
import { chromeBoxToPercent } from '../skills/dsh-ppt/scripts/deck-media.mjs'
import { buildDeckAsync } from '../skills/dsh-ppt/scripts/deck-advanced.mjs'

const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVcoAAAAASUVORK5CYII=', 'base64')
const png = 'data:image/png;base64,' + pngBytes.toString('base64')
const templateId = 'demo-campus'

/** 与 SPEC §3 的 rendering theme 同形：模板 id + palette/fonts/typeScale + chrome。 */
function templateTheme() {
  return {
    id: templateId,
    name: { zh: '示例校园模板', en: 'Demo Campus' },
    mood: { zh: '学院、正式、克制', en: 'Academic, formal, restrained' },
    bestFor: { zh: '毕业答辩、组会', en: 'Thesis defense, group meeting' },
    dark: false,
    palette: { bg: '#FFFFFF', panel: '#F2F5F9', fg: '#1A1A1A', muted: '#6B7785', accent: '#1F4E79', accent2: '#C9A227' },
    fonts: { heading: 'Microsoft YaHei', body: 'Microsoft YaHei', accent: 'STKaiti' },
    typeScale: { cover: 40, section: 40, title: 20, body: 13, caption: 10, footer: 14 },
    chrome: {
      cover: [{ kind: 'image', asset: 'universityLogo', box: [12.7, 4.4, 8.4, 1.9] }],
      section: [{ kind: 'image', asset: 'classLogo', box: [1.3, 0.9, 2.8, 2.7] }],
      content: [
        { kind: 'image', asset: 'classLogo', box: [0.5, 6.5, 2.7, 0.6] },
        { kind: 'text', text: '示例班级名称', box: [2.6, 6.9, 5.7, 0.3], size: 14, color: '#1F4E79', font: 'accent', align: 'left' },
      ],
      closing: [],
    },
    chromeAssets: { universityLogo: png, classLogo: png },
  }
}

const deckSlides = [
  { layout: 'cover', title: '封面标题' },
  { layout: 'section', title: '章节标题' },
  { layout: 'bullets', title: '内容标题', bullets: ['第一条'] },
  { layout: 'closing', title: '谢谢' },
]
const deck = () => ({ title: '模板注入', slides: deckSlides.map(slide => ({ ...slide })) })

function thrown(run) {
  try {
    run()
  } catch (error) {
    return error
  }
  return undefined
}

function zipEntries(buffer) {
  let end = buffer.length - 22
  while (end >= 0 && buffer.readUInt32LE(end) !== 0x06054b50) end--
  assert.ok(end >= 0, 'ZIP 目录存在')
  const count = buffer.readUInt16LE(end + 10), entries = {}
  let pos = buffer.readUInt32LE(end + 16)
  for (let i = 0; i < count; i++) {
    assert.equal(buffer.readUInt32LE(pos), 0x02014b50)
    const method = buffer.readUInt16LE(pos + 10), size = buffer.readUInt32LE(pos + 20)
    const nameLength = buffer.readUInt16LE(pos + 28), extra = buffer.readUInt16LE(pos + 30), comment = buffer.readUInt16LE(pos + 32)
    const local = buffer.readUInt32LE(pos + 42), start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28)
    const raw = buffer.subarray(start, start + size)
    entries[buffer.toString('utf8', pos + 46, pos + 46 + nameLength)] = method === 0 ? raw : inflateRawSync(raw)
    pos += 46 + nameLength + extra + comment
  }
  return entries
}

test('chromeBoxToPercent：按 13.3333×7.5 画布换算百分比，最多 2 位小数', () => {
  assert.deepEqual(chromeBoxToPercent([12.7, 4.4, 8.4, 1.9]), { left: '95.25%', top: '58.67%', width: '63%', height: '25.33%' })
  assert.deepEqual(chromeBoxToPercent({ x: 1.3, y: 0.9, w: 2.8, h: 2.7 }), { left: '9.75%', top: '12%', width: '21%', height: '36%' })
  assert.deepEqual(chromeBoxToPercent([0, 0, 0, 0]), { left: '0%', top: '0%', width: '0%', height: '0%' })
  assert.deepEqual(chromeBoxToPercent([1, 1, 2, 2], { w: 10, h: 5 }), { left: '10%', top: '20%', width: '20%', height: '40%' })
  assert.deepEqual(chromeBoxToPercent([13.3333333333, 7.5, 13.3333333333, 7.5]), { left: '100%', top: '100%', width: '100%', height: '100%' })
})

test('setTemplateThemeProvider：内置主题优先，未命中再查 provider，provider 抛错原样透出', () => {
  try {
    setTemplateThemeProvider(undefined)
    assert.throws(() => resolveTheme(templateId), /未知主题/)
    assert.doesNotMatch(thrown(() => resolveTheme(templateId)).message, /模板 id/)

    const calls = []
    setTemplateThemeProvider((id) => {
      calls.push(id)
      if (id === templateId) return templateTheme()
      if (id === 'broken-template') throw new Error('dsh-ppt：模板 ' + id + ' 的 template.json 损坏')
      return undefined
    })

    assert.equal(resolveTheme(templateId).id, templateId)
    assert.equal(resolveTheme('DATA').id, 'data', '内置主题大小写归一化不变')
    assert.deepEqual(calls, [templateId], '内置主题命中后不再问 provider')

    assert.throws(() => resolveTheme('missing-template'), /未知主题/)
    assert.match(thrown(() => resolveTheme('missing-template')).message, /模板 id 见 ppt_template_list/, 'provider 已注入时附带模板 id 提示')
    assert.throws(() => resolveTheme('broken-template'), /template\.json 损坏/, 'provider 的错误语义保持不变')
    assert.doesNotMatch(thrown(() => resolveTheme('broken-template')).message, /未知主题/)
  } finally {
    setTemplateThemeProvider(undefined)
  }
  assert.throws(() => resolveTheme(templateId), /未知主题/, '解绑 provider 后恢复原行为')
})

test('listThemes：第二参数缺省时行为不变，传入模板时按同结构追加 custom', () => {
  assert.deepEqual(listThemes('zh'), listThemes('zh', []))
  assert.equal(listThemes('zh').length, 5)
  assert.equal(listThemes('en')[0].name, 'Swiss Pulse')
  assert.ok(listThemes('zh').every(theme => theme.custom === undefined))
  assert.ok(listThemes('zh').every(theme => theme.palette.accent && theme.fonts.heading && theme.mood && theme.bestFor))

  const templates = [
    { id: templateId, name: '示例校园模板', dark: false, palette: { ...templateTheme().palette } },
    { id: 'lab-footer', name: { zh: '实验室页脚', en: 'Lab footer' }, dark: true, palette: { accent: '#1F4E79' } },
  ]
  const list = listThemes('zh', templates)
  assert.equal(list.length, 7)
  const custom = list[5]
  assert.equal(custom.id, templateId)
  assert.equal(custom.name, '示例校园模板')
  assert.equal(custom.custom, true)
  assert.equal(custom.dark, false)
  assert.deepEqual(custom.palette, templateTheme().palette)
  assert.equal(typeof custom.mood, 'string')
  assert.equal(typeof custom.bestFor, 'string')
  assert.deepEqual(custom.fonts, {})
  assert.equal(list[6].name, '实验室页脚')
  assert.equal(listThemes('en', templates)[6].name, 'Lab footer')
  assert.equal(listThemes('zh', [null, {}, { id: '' }, 0]).length, 5, '非法条目被忽略')
})

test('renderHtmlSlide：按页型注入 chrome 层，百分比与 CSS 与 SPEC §5 一致', () => {
  const html = renderHtml(deck(), templateTheme(), resolveLanguage('zh'))

  // chrome 容器与 PPTX 画布 / .media-canvas 同一个 16:9 居中盒
  assert.match(html, /\.chrome\{position:absolute;left:50%;top:50%;transform:translate\(-50%,-50%\);width:min\(100vw,177\.7778vh\);height:min\(100vh,56\.25vw\);pointer-events:none;z-index:3;container-type:inline-size\}/)
  assert.match(html, /width:min\(100vw,177\.7778vh\)/, '非 16:9 窗口下按 16:9 盒对齐')
  assert.doesNotMatch(html, /\.chrome\{[^}]*inset:0/, '不再用 inset:0 铺满全屏')
  assert.match(html, /body\.overview \.chrome\{left:0;top:0;transform:none;width:100%;height:100%\}/, 'overview 缩略图里铺满 1280×720 的 .slide')
  assert.match(html, /\.chrome-item\{position:absolute;object-fit:contain\}/)
  assert.match(html, /\.chrome-text\{/)
  assert.match(html, /--font-accent:STKaiti/)

  const layers = html.match(/<div class="chrome" aria-hidden="true">/g) ?? []
  assert.equal(layers.length, 3, '封面 / 章节 / 内容各一层，closing 为空数组不出层')

  assert.match(html, /<img class="chrome-item" src="data:image\/png;base64,[^"]+" alt="" style="left:95\.25%;top:58\.67%;width:63%;height:25\.33%">/)
  assert.match(html, /style="left:9\.75%;top:12%;width:21%;height:36%"/)
  assert.match(html, /<div class="chrome-item chrome-text" style="left:19\.5%;top:92%;width:42\.75%;height:4%;font-size:calc\(14 \* \.104167cqw\);color:#1F4E79;text-align:left;font-family:var\(--font-accent\)">示例班级名称<\/div>/)
  assert.equal((html.match(/示例班级名称/g) ?? []).length, 1, '文字只注入内容页一次')
})

test('renderHtml：主题没有 chrome 时输出与原来完全一致', () => {
  const theme = resolveTheme('data')
  const plain = renderHtml(deck(), theme, resolveLanguage('zh'))
  const emptyChrome = renderHtml(deck(), { ...theme, chrome: { cover: [], section: [], content: [], closing: [] }, chromeAssets: {} }, resolveLanguage('zh'))
  const noChromeKey = renderHtml(deck(), { ...theme }, resolveLanguage('zh'))

  assert.equal(emptyChrome, plain, '空 chrome 数组不产生任何额外字节')
  assert.equal(noChromeKey, plain)
  assert.doesNotMatch(plain, /class="chrome"/)
  assert.doesNotMatch(plain, /\.chrome\{/)
  assert.doesNotMatch(plain, /--font-accent/)

  const allChrome = renderHtml(deck(), templateTheme(), resolveLanguage('zh'))
  assert.notEqual(allChrome, plain)
})

test('chromePageType：四类页型映射，其余全部走 content', () => {
  assert.deepEqual(CHROME_SLOTS, ['cover', 'section', 'content', 'closing'])
  const mapping = {
    cover: 'cover', section: 'section', closing: 'closing',
    bullets: 'content', statement: 'content', quote: 'content', table: 'content',
    image: 'content', 'image-left': 'content', 'image-right': 'content', chart: 'content',
  }
  for (const [layout, slot] of Object.entries(mapping)) assert.equal(chromePageType(layout), slot, layout)
})

test('buildDeckAsync + designTemplate：HTML 与 PPTX 同页注入品牌固定层', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-ppt-template-engine-'))
  try {
    setTemplateThemeProvider((id) => (id === templateId ? templateTheme() : undefined))
    const out = await buildDeckAsync({ title: '模板注入', designTemplate: templateId, outputDir: dir, slides: deckSlides })
    assert.equal(out.designTemplate, templateId)
    assert.equal(out.theme, 'data', 'designTemplate 给出时 theme 被忽略，保留默认 id')

    const manifest = JSON.parse(readFileSync(out.jsonPath, 'utf8'))
    assert.equal(manifest.designTemplate, templateId)

    const html = readFileSync(out.htmlPath, 'utf8')
    assert.equal((html.match(/<div class="chrome" aria-hidden="true">/g) ?? []).length, 3)
    assert.match(html, /--font-accent:STKaiti/)

    const entries = zipEntries(readFileSync(out.pptxPath))
    const media = Object.keys(entries).filter(name => name.startsWith('ppt/media/'))
    assert.ok(media.length >= 1, '模板素材写进 PPTX media')
    assert.equal((entries['ppt/slides/slide1.xml'].toString().match(/<p:pic>/g) ?? []).length, 1, '封面注入校徽')
    assert.equal((entries['ppt/slides/slide2.xml'].toString().match(/<p:pic>/g) ?? []).length, 1, '章节页注入班徽')
    const content = entries['ppt/slides/slide3.xml'].toString()
    assert.equal((content.match(/<p:pic>/g) ?? []).length, 1, '内容页注入班徽')
    assert.match(content, /示例班级名称/)
    assert.match(content, /sz="1400"/)
    assert.match(content, /1F4E79/)
    assert.equal((entries['ppt/slides/slide4.xml'].toString().match(/<p:pic>/g) ?? []).length, 0, 'closing 空 chrome 不注入')

    // designTemplate 优先解析：给出模板时，即使 theme 是未知 id 也不拦生成。
    const ignored = await buildDeckAsync({ title: '模板注入二', designTemplate: templateId, theme: 'neon', outputDir: dir, slides: deckSlides })
    assert.equal(ignored.designTemplate, templateId)
    await assert.rejects(buildDeckAsync({ title: '未知模板', designTemplate: 'no-such-template', outputDir: dir, slides: deckSlides }), /未知主题/)
  } finally {
    setTemplateThemeProvider(undefined)
    rmSync(dir, { recursive: true, force: true })
  }
})

test('无 chrome 的常规工程导出路径不变（早退分支仍生效）', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-ppt-template-engine-plain-'))
  try {
    const out = await buildDeckAsync({ title: '普通工程', theme: 'swiss', outputDir: dir,
      slides: [{ layout: 'cover', title: '封面' }, { layout: 'bullets', title: '要点', bullets: ['一'] }] })
    assert.equal(out.designTemplate, undefined)
    const html = readFileSync(out.htmlPath, 'utf8')
    assert.doesNotMatch(html, /class="chrome"/)
    const entries = zipEntries(readFileSync(out.pptxPath))
    assert.equal(Object.keys(entries).filter(name => name.startsWith('ppt/media/')).length, 0, '无图片时仍走基础 PPTX 分支')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
