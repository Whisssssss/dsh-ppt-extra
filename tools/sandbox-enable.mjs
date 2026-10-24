// 在隔离 profile 中启用 dsh-ppt bundle（幂等）。
// 用法：node tools/sandbox-enable.mjs <profile/package.json>
import { readFileSync, writeFileSync } from 'node:fs'

const path = process.argv[2]
if (!path) { console.error('usage: node sandbox-enable.mjs <profile/package.json>'); process.exit(2) }
const data = JSON.parse(readFileSync(path, 'utf8'))
const bundles = data.dsh?.profile?.bundles
if (!Array.isArray(bundles)) { console.error('不是有效的 dsh profile package.json'); process.exit(1) }
if (bundles.includes('dsh-ppt')) {
  console.log('dsh-ppt 已启用')
} else {
  bundles.push('dsh-ppt')
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log('bundles += dsh-ppt（共 ' + bundles.length + ' 个）')
}
