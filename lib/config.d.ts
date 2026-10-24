import type { PptConfig } from './types.js';
export declare const PPT_OUTPUT_DIR_ENV = "DSH_PPT_OUTPUT_DIR";
export declare const DEFAULT_MAX_SLIDES = 60;
export interface ResolvedPptConfig {
    outputDir: string;
    maxSlides: number;
    defaultTheme: string;
    defaultLang: string;
    /** 用户模板库目录；空串表示用 <DSH_HOME>/dsh-ppt/templates。 */
    templatesDir: string;
}
/** 解析并校验插件行配置。本插件无必填项，空配置永远可用。 */
export declare function resolvePptConfig(config: PptConfig | undefined | null): ResolvedPptConfig;
export declare function clampInt(value: unknown, fallback: number, min: number, max: number): number;
