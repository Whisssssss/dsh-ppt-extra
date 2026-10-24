export declare const TEMPLATE_ID_PATTERN: RegExp;
export declare const BUILTIN_THEME_IDS: readonly ["swiss", "velvet", "data", "soft", "bold"];
export interface PptTemplateSummary {
    id: string;
    name: string;
    dark: boolean;
    palette: Record<string, string>;
}
export interface PptTemplateDetail extends PptTemplateSummary {
    /** 模板 JSON 原文（含 chrome / fonts / typeScale / assets 元数据）。 */
    template: Record<string, any>;
    /** slot -> data:image/png;base64,...，供界面直接预览。 */
    assets: Record<string, string>;
}
/** 测试或宿主覆盖模板目录；传 undefined 恢复默认。 */
export declare function setTemplateDir(dir: string | undefined): void;
/** 解析模板根目录：覆盖值 > config.templatesDir > <DSH_HOME>/dsh-ppt/templates。 */
export declare function templatesDir(): string;
/** 只读摘要列表；目录不存在时返回空数组。 */
export declare function listTemplates(): PptTemplateSummary[];
/** 完整模板 + 素材 dataURI；不存在抛错。 */
export declare function readTemplate(id: string): PptTemplateDetail;
/** 写入（新建或覆盖）一个模板；assets 为 slot -> dataURI。 */
export declare function saveTemplate(input: {
    template: unknown;
    assets?: Record<string, string>;
}): Promise<PptTemplateDetail>;
/** 合并更新（chrome / palette / fonts / typeScale / name 等）。 */
export declare function updateTemplate(id: string, patch: unknown): Promise<PptTemplateDetail>;
/** 删除模板；返回是否实际删除。 */
export declare function removeTemplate(id: string): boolean;
/**
 * 注册 theme provider（幂等）；任何模板相关调用前必须 await。
 * 模板模块损坏或缺失时静默降级：内置主题、普通生成不受影响。
 */
export declare function ensureTemplateProvider(): Promise<void>;
/** 模板模块是否可用（供工具层给出明确错误而不是「未知主题」）。 */
export declare function templateModulesReady(): Promise<boolean>;
/** 从 .pptx 字节抽取模板草稿（不落盘）。 */
export declare function extractFromPptxFile(bytes: Buffer, filename: string): Promise<unknown>;
