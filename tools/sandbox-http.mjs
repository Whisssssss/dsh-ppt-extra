// 在隔离实例上验证 dsh-ppt 的模板导入 HTTP 接口（走 /api/dsh-ppt/workbench）。
// 用法：node tools/sandbox-http.mjs <baseUrl> <workspace>
import { createSampleDeck } from './sample-deck.mjs'

const [base, workspace] = process.argv.slice(2)
if (!base || !workspace) { console.error('usage: node sandbox-http.mjs <baseUrl> <workspace>'); process.exit(2) }
const url = new URL('/api/dsh-ppt/workbench', base).href
const cookie = process.env.DSH_COOKIE || ''
const token = process.env.DSH_TOKEN || ''
let failures = 0
const check = (name, ok, detail) => {
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? ' -- ' + detail : ''))
  if (!ok) failures += 1
}
async function call(body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-dsh-ppt-action': '1',
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...(token && !cookie ? { authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  let value
  try { value = JSON.parse(text) } catch { value = { raw: text.slice(0, 300) } }
  return { status: response.status, value }
}

console.log('-- template-list（初始）')
let r = await call({ operation: 'template-list' })
check('template-list 200', r.status === 200 && r.value.ok === true, JSON.stringify(r.value).slice(0, 160))

{
  console.log('-- template-extract（合成示例 PPTX）')
  const sample = await createSampleDeck()
  const base64 = sample.bytes.toString('base64')
  r = await call({ operation: 'template-extract', file: base64, filename: 'deck.pptx' })
  const ok = r.status === 200 && r.value.ok !== false && r.value.draft
  check('template-extract 返回 draft', ok, ok ? 'assets=' + Object.keys(r.value.draftAssets || {}).length + ' candidates=' + (r.value.candidates || []).length : JSON.stringify(r.value).slice(0, 300))
  if (ok) {
    const draft = Object.assign({}, r.value.draft, { id: 'sandbox-check', name: { zh: '沙箱校验模板' } })
    const save = await call({ operation: 'template-save', template: draft, assets: r.value.draftAssets })
    check('template-save', save.status === 200 && save.value.ok === true, JSON.stringify(save.value).slice(0, 200))
    const list = await call({ operation: 'template-list' })
    check('列表含新模板', Array.isArray(list.value.templates) && list.value.templates.some(t => t.id === 'sandbox-check'))
    const detail = await call({ operation: 'template-list', id: 'sandbox-check' })
    check('详情含 chrome', Boolean(detail.value && detail.value.template && detail.value.template.template && detail.value.template.template.chrome))
    const palette = Object.assign({}, (detail.value.template.template.palette || {}), { accent: '#1F4E79' })
    const patch = await call({ operation: 'template-update', id: 'sandbox-check', palette })
    check('template-update', patch.status === 200 && patch.value.ok === true, JSON.stringify(patch.value).slice(0, 160))
    const denied = await call({ operation: 'template-remove', id: 'sandbox-check' })
    check('未确认删除被拒', denied.status === 400)
    const removed = await call({ operation: 'template-remove', id: 'sandbox-check', confirmed: true })
    check('template-remove', removed.status === 200 && removed.value.ok === true)
  }
}

console.log('-- 非法输入')
r = await call({ operation: 'template-list', id: '../etc' })
check('拒绝非法 id', r.status === 400, JSON.stringify(r.value).slice(0, 120))

console.log(failures === 0 ? '\n全部通过' : '\n失败 ' + failures + ' 项')
process.exit(failures === 0 ? 0 : 1)
