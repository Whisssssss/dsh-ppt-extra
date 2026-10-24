import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { PptWorkbench, PPT_WORKBENCH_ROUTE } from '../lib/workbench.js'

const work = resolve('.test-output'); mkdirSync(work, { recursive: true })
const request = (body, headers = {}) => new Request('http://dsh.internal' + PPT_WORKBENCH_ROUTE, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-dsh-ppt-action': '1', origin: 'http://127.0.0.1:8181', host: '127.0.0.1:8181', ...headers },
  body: JSON.stringify(body),
})
// templates.ts resolves its root per call; the test hook keeps every case inside its own temp dir.
async function pinTemplateDir(dir) {
  const module = await import('../lib/templates.js')
  const pin = module.setTemplateDir ?? module.setTemplateDirForTesting
  assert.equal(typeof pin, 'function', 'templates module must expose a template dir override')
  pin(dir)
}
function writeTemplate(root, id, extra = {}) {
  const dir = join(root, id)
  mkdirSync(dir, { recursive: true })
  const template = {
    schema: 'dsh-ppt/template@1', id, name: { zh: '演示模板', en: 'Demo template' }, canvas: { w: 13.3333, h: 7.5 }, dark: false,
    palette: { bg: '#FFFFFF', panel: '#F2F5F9', fg: '#1A1A1A', muted: '#6B7785', accent: '#1F4E79', accent2: '#C9A227' },
    fonts: { heading: 'Microsoft YaHei', body: 'Microsoft YaHei' },
    typeScale: { cover: 40, section: 40, title: 20, body: 13, caption: 10, footer: 14 },
    assets: {}, chrome: { cover: [], section: [], content: [], closing: [] }, ...extra,
  }
  writeFileSync(join(dir, 'template.json'), JSON.stringify(template, null, 2) + '\n')
  return dir
}
async function fixture(run) {
  const dir = mkdtempSync(join(work, 'template-'))
  const templates = join(dir, 'templates')
  try {
    await pinTemplateDir(templates)
    const wb = new PptWorkbench({ catalogPath: join(dir, 'catalog.jsonl') })
    return await run({ dir, templates, wb })
  } finally {
    await pinTemplateDir(undefined)
    assert.ok(dir.startsWith(work), 'temp dir must stay inside .test-output')
    rmSync(dir, { recursive: true, force: true })
  }
}

test('template operations are project-independent: list, detail and unknown ids', () => fixture(async ({ templates, wb }) => {
  assert.deepEqual(await wb.action({ operation: 'template-list' }), { ok: true, templates: [] })
  assert.equal(existsSync(wb.catalogPath), false, 'listing templates must not create the project index')
  writeTemplate(templates, 'demo-1')
  writeTemplate(templates, 'demo-2', { name: { zh: '第二套', en: 'Second' }, dark: true })
  const list = await wb.action({ operation: 'template-list' })
  assert.equal(list.ok, true)
  assert.deepEqual(list.templates.map(row => row.id), ['demo-1', 'demo-2'])
  assert.equal(list.templates[0].name, '演示模板')
  assert.equal(list.templates[1].dark, true)
  assert.equal(list.templates[0].palette.bg, '#FFFFFF')
  const detail = await wb.action({ operation: 'template-list', id: 'demo-1' })
  assert.equal(detail.ok, true)
  assert.equal(detail.template.id, 'demo-1')
  assert.equal(detail.template.name, '演示模板')
  assert.deepEqual(detail.template.template.chrome, { cover: [], section: [], content: [], closing: [] })
  assert.deepEqual(detail.template.assets, {})
  await assert.rejects(wb.action({ operation: 'template-list', id: 'ghost-tpl' }), /模板不存在/)
  await assert.rejects(wb.action({ operation: 'template-list', id: 'Bad_Id!' }), /编号无效/)
  await assert.rejects(wb.action({ operation: 'template-list', id: 'swiss' }), /编号无效|内置主题/)
}))

test('template-remove requires confirmed:true and refuses unknown or invalid ids', () => fixture(async ({ templates, wb }) => {
  writeTemplate(templates, 'demo-2')
  await assert.rejects(wb.action({ operation: 'template-remove', id: 'demo-2' }), /请确认删除模板/)
  await assert.rejects(wb.action({ operation: 'template-remove', id: 'demo-2', confirmed: 'yes' }), /请确认删除模板/)
  await assert.rejects(wb.action({ operation: 'template-remove', id: 'ghost-tpl', confirmed: true }), /模板不存在/)
  await assert.rejects(wb.action({ operation: 'template-remove', id: 'UPPER', confirmed: true }), /编号无效/)
  assert.equal(existsSync(join(templates, 'demo-2')), true)
  assert.deepEqual(await wb.action({ operation: 'template-remove', id: 'demo-2', confirmed: true }), { ok: true, removed: true })
  assert.equal(existsSync(join(templates, 'demo-2')), false)
}))

test('template-extract rejects missing, non-base64, empty and non-pptx payloads before unzipping', () => fixture(async ({ wb }) => {
  await assert.rejects(wb.action({ operation: 'template-extract' }), /请选择要导入的 PPTX 文件/)
  await assert.rejects(wb.action({ operation: 'template-extract', file: '', filename: 'deck.pptx' }), /请选择要导入的 PPTX 文件/)
  await assert.rejects(wb.action({ operation: 'template-extract', file: '%%%not base64%%%', filename: 'deck.pptx' }), /base64/)
  await assert.rejects(wb.action({ operation: 'template-extract', file: 'AAAA', filename: 'deck.pdf' }), /\.pptx/)
  await assert.rejects(wb.action({ operation: 'template-extract', file: '   ', filename: 'deck.pptx' }), /为空/)
  const response = await wb.fetch(request({ operation: 'template-extract', file: '%not-base64%', filename: 'deck.pptx' }))
  assert.equal(response.status, 400)
  const error = await response.json()
  assert.match(error.message, /base64/)
  assert.match(error.messageEn, /base64/)
}))

test('template-save validates the template object and asset slots before writing storage', () => fixture(async ({ wb }) => {
  await assert.rejects(wb.action({ operation: 'template-save' }), /模板内容无效/)
  await assert.rejects(wb.action({ operation: 'template-save', template: [] }), /模板内容无效/)
  await assert.rejects(wb.action({ operation: 'template-save', template: {}, assets: { universityLogo: 'not-a-data-uri' } }), /data URI/)
  await assert.rejects(wb.action({ operation: 'template-save', template: {}, assets: { 'bad slot': 'data:image/png;base64,AAAA' } }), /名称无效/)
  await assert.rejects(wb.action({ operation: 'template-save', template: {}, assets: ['nope'] }), /slot → data URI/)
}))

test('template-update accepts only known patch fields and refuses empty or unknown updates', () => fixture(async ({ templates, wb }) => {
  writeTemplate(templates, 'demo-1')
  await assert.rejects(wb.action({ operation: 'template-update', id: 'demo-1' }), /没有要更新的模板内容/)
  await assert.rejects(wb.action({ operation: 'template-update', id: 'demo-1', unknownField: 1 }), /没有要更新的模板内容/)
  await assert.rejects(wb.action({ operation: 'template-update', id: 'ghost-tpl', palette: { bg: '#000000' } }), /模板不存在/)
  await assert.rejects(wb.action({ operation: 'template-update', id: 'bad id', palette: { bg: '#000000' } }), /编号无效/)
  const response = await wb.fetch(request({ operation: 'template-update', id: 'ghost-tpl', palette: { bg: '#000000' } }))
  assert.equal(response.status, 400)
  assert.match((await response.json()).message, /模板不存在/)
}))

test('template requests keep the panel carrier, origin checks and bilingual errors', () => fixture(async ({ templates, wb }) => {
  writeTemplate(templates, 'demo-1')
  const listed = await wb.fetch(request({ operation: 'template-list' }))
  assert.equal(listed.status, 200)
  assert.equal((await listed.json()).templates[0].id, 'demo-1')
  assert.equal((await wb.fetch(request({ operation: 'template-list' }, { origin: 'https://evil.example' }))).status, 403)
  assert.equal((await wb.fetch(request({ operation: 'template-list' }, { 'sec-fetch-site': 'cross-site' }))).status, 403)
  assert.equal((await wb.fetch(request({ operation: 'template-list' }, { 'x-dsh-ppt-action': '' }))).status, 403)
  const denied = await wb.fetch(request({ operation: 'template-remove', id: 'demo-1' }))
  assert.equal(denied.status, 400)
  const error = await denied.json()
  assert.match(error.message, /请确认删除模板/)
  assert.match(error.messageEn, /Confirm removing this template/)
  assert.doesNotMatch(error.message, /项目/, 'template errors must not ask for a project')
  assert.equal(existsSync(join(templates, 'demo-1', 'template.json')), true)
}))

test('browser client parses and carries the template panel operations', () => {
  const file = fileURLToPath(new URL('../lib/client.js', import.meta.url))
  execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
  const source = readFileSync(file, 'utf8')
  for (const marker of ['function TemplatePanel()', "operation: 'template-list'", "operation: 'template-extract'", "operation: 'template-save'", "operation: 'template-update'", "operation: 'template-remove'", "'tpl-canvas'", 'onPointerDown', 'confirmed: true']) {
    assert.ok(source.includes(marker), marker + ' missing from the template panel')
  }
})


function browserHarness() {
  let plugin
  const values = []
  let cursor = 0
  const React = {
    Fragment: 'fragment',
    createElement(type, props, ...children) { return { type, props: props || {}, children } },
    useState(initial) { const index = cursor++; if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial; return [values[index], value => { values[index] = typeof value === 'function' ? value(values[index]) : value }] },
    useEffect() {},
    useRef(initial) { return { current: initial } },
    useMemo(run) { return run() },
  }
  runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load(entry) { plugin = entry.factory(() => React) } } },
    fetch: async () => ({ ok: true, status: 200, json: async () => ({ ok: true, templates: [] }) }),
    document: { baseURI: 'http://dsh.internal/' },
    FileReader: class {},
    crypto: { randomUUID: () => 'nonce' },
  })
  const nodes = tree => !tree ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : typeof tree === 'object' ? [tree, ...nodes(tree.children)] : [tree]
  const text = tree => nodes(tree).filter(value => typeof value === 'string').join(' ')
  return { plugin, nodes, text, render: () => { cursor = 0; return plugin.__internals.templatePanel({}) } }
}

test('template panel renders the library, a blank editor, the canvas and the page tabs', async () => {
  const { render, nodes, text } = browserHarness()
  const findButton = (tree, match) => {
    const found = nodes(tree).filter(node => node && node.type === 'button').find(node => match(text(node)))
    assert.ok(found, 'missing button: ' + match)
    return found
  }
  const click = async match => { findButton(render(), match).props.onClick(); await new Promise(resolve => setImmediate(resolve)) }
  assert.match(text(render()), /模板/)
  await click(label => label === '模板库')
  const listed = render()
  assert.match(text(listed), /内置主题/)
  assert.match(text(listed), /自定义模板/)
  assert.match(text(listed), /还没有自定义模板/)
  await click(label => label === '手动创建模板')
  const editor = render()
  assert.match(text(editor), /保存模板/)
  const canvas = nodes(editor).find(node => node && node.props && node.props.className === 'tpl-canvas')
  assert.ok(canvas, 'the 16:9 canvas must render')
  assert.equal(canvas.props.style.background, '#FFFFFF')
  assert.equal(canvas.children.filter(child => child && child.props && child.props.className === 'tpl-item').length, 0)
  await click(label => label === '添加文字')
  const withText = render()
  assert.match(text(withText), /文字元素/)
  assert.match(text(withText), /删除选中元素/)
  const item = nodes(withText).find(node => node && node.props && node.props.className === 'tpl-item')
  assert.ok(item, 'the added text item must render on the canvas')
  item.props.onPointerDown({ button: 0, clientX: 10, clientY: 10, pointerId: 1, currentTarget: { setPointerCapture() {} }, preventDefault() {}, stopPropagation() {} })
  assert.match(text(render()), /文字元素/)
  await click(label => label.indexOf('章节') === 0)
  assert.match(text(render()), /此页型还没有固定元素/)
  await click(label => label === '取消')
  assert.match(text(render()), /导入模板（.pptx）/)
})

test('the canvas stores percent boxes and saves inches for a 13.3333 x 7.5 canvas', () => {
  const { plugin } = browserHarness()
  const { templateDraft, templatePayload } = plugin.__internals
  const draft = templateDraft({
    id: 'demo-template', name: { zh: '' }, palette: { bg: '#FFFFFF' },
    assets: { universityLogo: { file: 'assets/universityLogo.png', width: 732, height: 166 } },
    chrome: {
      cover: [{ kind: 'image', asset: 'universityLogo', box: [12.7, 4.4, 8.4, 1.9] }], section: [],
      content: [{ kind: 'text', text: '示例班级名称', size: 14, color: '#1F4E79', font: 'accent', align: 'left', box: [2.6, 17.4, 5.7, 0.9] }],
      closing: [],
    },
  })
  assert.equal(draft.chrome.cover[0].kind, 'image')
  assert.equal(draft.chrome.content[0].kind, 'text')
  assert.ok(Math.abs(draft.chrome.cover[0].box[0] - 95.2502) < 0.01, 'inches convert to canvas percent')
  assert.ok(Math.abs(draft.chrome.cover[0].box[2] - 63.0002) < 0.01)
  assert.ok(Math.abs(draft.chrome.content[0].box[1] - 232) < 0.01, 'boxes outside the canvas stay visible for repair')
  assert.equal(draft.name.zh, '', 'an empty name survives the round trip')
  const payload = templatePayload(draft)
  assert.equal(Object.keys(payload.chrome).join(','), 'cover,section,content,closing')
  assert.ok(Math.abs(payload.chrome.cover[0].box[0] - 12.7) < 0.001, 'percent converts back to inches')
  assert.ok(Math.abs(payload.chrome.content[0].box[3] - 0.9) < 0.001)
  assert.equal(payload.name.zh, '')
  assert.equal(payload.name.en, '')
  assert.equal(payload.canvas.w, 13.3333)
  assert.equal(payload.canvas.h, 7.5)
  assert.equal(payload.chrome.content[0].color, '#1F4E79')
})

test('the panel accepts preview images from draftAssets, a nested draft or a saved detail', () => {
  const { plugin } = browserHarness()
  const { templateAssetUrls } = plugin.__internals
  const nested = templateAssetUrls({ draft: { draftAssets: { classLogo: 'data:image/png;base64,AAAA' } } })
  assert.equal(nested.classLogo, 'data:image/png;base64,AAAA')
  const top = templateAssetUrls({ draftAssets: { universityLogo: 'data:image/png;base64,BBBB' } })
  assert.equal(top.universityLogo, 'data:image/png;base64,BBBB')
  const detail = templateAssetUrls({ assets: { classLogo: 'data:image/png;base64,CCCC' } })
  assert.equal(detail.classLogo, 'data:image/png;base64,CCCC')
  assert.equal(templateAssetUrls({}).classLogo, undefined)
  assert.equal(templateAssetUrls(null).classLogo, undefined)
  const bare = templateAssetUrls({ draftAssets: { classLogo: 'rawbase64' } })
  assert.equal(bare.classLogo, 'data:image/png;base64,rawbase64')
  assert.equal(templateAssetUrls({ draftAssets: { classLogo: 'not base64!' } }).classLogo, undefined)
})
