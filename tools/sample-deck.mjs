// 合成示例 deck：不依赖任何个人素材，供测试与沙箱验证使用。
// 生成一个带统一 logo 与页脚的 16:9 演示文稿，logo 由代码绘制成 PNG。
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

/** @returns {Promise<{dir:string, pptxPath:string, bytes:Buffer}>} */
export async function createSampleDeck(options = {}) {
  const dir = options.dir ?? mkdtempSync(join(tmpdir(), 'dsh-ppt-sample-'))
  const { encodePng } = await import('../skills/dsh-ppt/scripts/deck-pixels.mjs')
  const { buildDeckAsync } = await import('../skills/dsh-ppt/scripts/deck-advanced.mjs')
  const size = 32
  const data = new Uint8ClampedArray(size * size * 4)
  for (let i = 0; i < size * size; i += 1) {
    data[i * 4] = 31
    data[i * 4 + 1] = 78
    data[i * 4 + 2] = 121
    data[i * 4 + 3] = 255
  }
  const logo = join(dir, 'sample-logo.png')
  writeFileSync(logo, encodePng({ width: size, height: size, data }))
  const deck = await buildDeckAsync({
    title: '示例演示文稿',
    theme: 'data',
    cwd: dir,
    outputDir: dir,
    content: '# 示例演示文稿\n\n## 第一章\n\n- 要点一\n- 要点二\n\n## 第二章\n\n- 要点三\n- 要点四\n',
    brand: { logo, footer: '示例单位 · 2026' },
  })
  return { dir, pptxPath: deck.pptxPath, bytes: readFileSync(deck.pptxPath) }
}
