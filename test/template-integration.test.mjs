import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { unzipSync } from 'fflate'
import { createSampleDeck } from '../tools/sample-deck.mjs'

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const rootDir = decodeURIComponent(root).replace(/\/$/, '')
const sampleDeck = await createSampleDeck()
const sampleBytes = sampleDeck.bytes

const { setTemplateDir, extractFromPptxFile, listTemplates, readTemplate, saveTemplate, removeTemplate } = await import('../lib/templates.js')
const { createPptExecutors } = await import('../lib/execution.js')
const { resolvePptConfig } = await import('../lib/config.js')

const templatesDir = mkdtempSync(join(tmpdir(), 'dsh-ppt-tpl-lib-'))
setTemplateDir(templatesDir)
const config = resolvePptConfig({ templatesDir })
const tools = createPptExecutors(config)
const execution = (cwd) => ({ agent: { session: { header: { cwd } } } })


test('模板库：抽取→保存→列表→详情→删除', async () => {
  const bytes = sampleBytes
  const extracted = await extractFromPptxFile(bytes, 'deck.pptx')
  assert.ok(extracted.draft, '需返回 draft')
  assert.ok(extracted.draftAssets, '需返回顶层 draftAssets')
  assert.deepEqual(Object.keys(extracted.draftAssets).sort(), Object.keys(extracted.draft.assets).sort())
  assert.equal(extracted.draft.draftAssets, undefined, 'draft 内不应残留 draftAssets')

  const saved = await saveTemplate({ template: { ...extracted.draft, id: 'integration-demo' }, assets: extracted.draftAssets })
  assert.equal(saved.id, 'integration-demo')
  assert.ok(listTemplates().some((t) => t.id === 'integration-demo'))
  const detail = readTemplate('integration-demo')
  assert.ok(Object.keys(detail.assets).length >= 1, '至少一个品牌素材')
  assert.ok(detail.template.chrome.content.length >= 1)
  assert.equal(removeTemplate('integration-demo'), true)
  assert.equal(removeTemplate('integration-demo'), false)
})

test('模板 id 与素材校验', async () => {
  await assert.rejects(() => saveTemplate({ template: { id: 'BAD ID' } }), /模板 id/)
  await assert.rejects(() => saveTemplate({ template: { id: 'data' } }), /内置主题/)
  assert.throws(() => readTemplate('../escape'), /模板 id|不存在/)
})

test('生成：designTemplate 同时作用于 HTML 与 PPTX，并写入工程', async () => {
  const extracted = await extractFromPptxFile(sampleBytes, 'deck.pptx')
  await saveTemplate({ template: { ...extracted.draft, id: 'integration-create' }, assets: extracted.draftAssets })
  const outDir = mkdtempSync(join(tmpdir(), 'dsh-ppt-deck-'))
  const created = await tools.create({
    title: '模板集成验证',
    content: '# 模板集成验证\n\n## 研究背景\n\n- 第一条\n- 第二条\n\n## 章节过渡\n\n## 结论\n\n- 完成\n',
    designTemplate: 'integration-create',
    outputDir: outDir,
  }, execution(outDir))
  assert.equal(created.ok, true)
  assert.equal(created.designTemplate, 'integration-create')

  const html = readFileSync(created.htmlPath, 'utf8')
  assert.match(html, /class="chrome"/)
  assert.match(html, /--bg:#[0-9A-F]{6}/i, '模板配色需写入 HTML')
  assert.ok((html.match(/class="chrome-item/g) || []).length >= 4, 'HTML 应有多处模板标志')

  const zip = unzipSync(new Uint8Array(readFileSync(created.pptxPath)))
  const pics = Object.keys(zip).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .reduce((sum, name) => sum + (Buffer.from(zip[name]).toString('utf8').match(/<p:pic>/g) || []).length, 0)
  assert.ok(pics >= 3, 'PPTX 应注入模板标志图片，实际 ' + pics)

  const project = JSON.parse(readFileSync(created.jsonPath, 'utf8'))
  assert.equal(project.designTemplate, 'integration-create')

  // 编辑后仍保留模板
  const checked = await tools.check({ deckPath: created.jsonPath }, execution(outDir))
  assert.ok(Number.isInteger(checked.slideCount))
  const edited = await tools.edit({ deckPath: created.jsonPath, expectedRevision: project.revision, edits: [{ slide: 1, patch: { title: '改过的标题' } }] }, execution(outDir))
  const editedProject = JSON.parse(readFileSync(edited.jsonPath, 'utf8'))
  assert.equal(editedProject.designTemplate, 'integration-create')
  const editedHtml = readFileSync(edited.htmlPath, 'utf8')
  assert.match(editedHtml, /改过的标题/)
  assert.match(editedHtml, /class="chrome"/, '编辑后仍需保留模板层')

  // 撤销后模板与标志仍在
  await tools.undo({ deckPath: edited.jsonPath, expectedRevision: editedProject.revision }, execution(outDir))
  const undone = JSON.parse(readFileSync(edited.jsonPath, 'utf8'))
  assert.equal(undone.designTemplate, 'integration-create')

  // 主题列表包含导入模板
  const themes = await tools.themes({}, execution(outDir))
  assert.ok(themes.themes.some((t) => t.id === 'integration-create' && t.custom === true))
  const builtin = themes.themes.filter((t) => !t.custom)
  assert.equal(builtin.length, 5, '内置主题数量不变')
})

test('模板工具：dryRun 不落盘、update 只改传入字段、remove 需确认', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-ppt-import-'))
  const before = listTemplates().length
  const dry = await tools.templateImport({ file: sampleDeck.pptxPath, dryRun: true, id: 'integration-import' }, execution(rootDir))
  assert.equal(dry.dryRun, true)
  assert.ok(dry.draft)
  assert.ok(dry.draftAssets && Object.keys(dry.draftAssets).length >= 1)
  assert.equal(listTemplates().length, before, 'dryRun 不应落盘')

  const saved = await tools.templateImport({ file: sampleDeck.pptxPath, id: 'integration-import' }, execution(rootDir))
  assert.equal(saved.template.id, 'integration-import')
  const detail = readTemplate('integration-import')
  const originalChrome = JSON.stringify(detail.template.chrome)
  await tools.templateUpdate({ id: 'integration-import', palette: { ...detail.template.palette, accent: '#112233' } }, execution(rootDir))
  const updated = readTemplate('integration-import')
  assert.equal(updated.template.palette.accent, '#112233')
  assert.equal(JSON.stringify(updated.template.chrome), originalChrome, '未传的字段必须保持不变')
  await assert.rejects(() => tools.templateRemove({ id: 'integration-import' }, execution(rootDir)), /confirmed/)
  await tools.templateRemove({ id: 'integration-import', confirmed: true }, execution(rootDir))
  assert.ok(!listTemplates().some((t) => t.id === 'integration-import'))
})
