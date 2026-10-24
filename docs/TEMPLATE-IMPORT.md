# 导入模板

把一份现成 PPT 的视觉风格（配色、字体、字号）和固定品牌层（校徽、班徽、班名、页脚标志）抽出来，存成可复用的模板，之后每次生成演示文稿都自动套用。

## 两种导入方式

### 1. 从 .pptx 自动抽取

最适合「我有一份做得不错的答辩 PPT，以后都按这个样子做」。

~~~bash
# Agent 里说：把这个 pptx 的模板导入进来
# 等价工具调用：
ppt_template_import { file: "旧演示文稿.pptx", dryRun: true }
~~~

抽取器会：

1. 读 ppt/theme/theme1.xml 的配色与字体方案；
2. 统计整份文稿里真实用到的颜色、字体、字号（主题色 ≠ 页面主色时以实际用色为准）；
3. 找出跨 3 页以上、位置一致出现的图片和文本，判定为固定品牌元素（校徽、班徽、班名、页脚）；
4. 按封面 / 章节 / 内容 / 结尾四类页型归类这些元素，得到各自的坐标与尺寸；
5. 把所有素材统一转成带透明通道的 PNG（白底自动抠除，保留标志内部的高光白）。

dryRun 只返回草稿不落盘。确认后去掉 dryRun 再调一次即保存。

### 2. 手动创建（表单）

没有现成 PPT、或只想用几张图配自己挑的颜色：

- 上传校徽、班徽、班徽班名等图片（PNG 带透明底最佳）；
- 选 6 个颜色：背景、面板、正文、次要文字、主强调、次强调；
- 在设置页画布上把标志拖到四类页型的位置。

## 在设置页调整

「设置 → 演示文稿 → 模板」：

- 列表里内置 5 套主题只读，自定义模板可编辑/删除；
- 点开一个自定义模板进入摆位画布：16:9 画布、四个页型标签页；
- 拖拽移动、右下角拖拽缩放、Delete 删除、方向键微调（Shift ×10）；
- 保存后立即对新生成的演示文稿生效。

## 坐标约定

所有位置用英寸，画布 13.3333 × 7.5（16:9）。页型映射：

| 页型 | 对应布局 |
| --- | --- |
| cover | cover |
| section | section |
| content | bullets / statement / quote / table / image / image-left / image-right / chart |
| closing | closing |

## 工具接口

| 工具 | 用途 |
| --- | --- |
| ppt_template_import | 从 .pptx 或模板 JSON 导入（dryRun 可预览） |
| ppt_template_list | 列出模板；带 id 返回完整定义与素材 |
| ppt_template_update | 改配色/字体/字号刻度/位置 |
| ppt_template_remove | 删除（需 confirmed:true） |

生成时用 ppt_create 的 designTemplate 参数指定模板 id；与 theme 同时给出时 designTemplate 优先。

## 存储位置

<DSH_HOME>/dsh-ppt/templates/<id>/
  template.json
  assets/*.png

config.templatesDir 可改到工作区（便于团队共享）。

## 边界

- 只继承「视觉令牌 + 固定标志层」，不继承母版的占位符几何与装饰形状。页内排版仍由 dsh-ppt 的布局引擎决定。
- 深色底模板需要反白版校徽；自动反色会破坏渐变与细节，插件不做。
- 中文字体需接收方机器已安装，缺失时按 fallback 字体渲染，ppt_check 会报告。
