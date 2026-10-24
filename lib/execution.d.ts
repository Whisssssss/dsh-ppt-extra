import type { ResolvedPptConfig } from './config.js';
import type { DeckEngine, PptThemesResult } from './types.js';
/** The Harness execution fields used by this plugin; optional for direct callers. */
export interface PptExecution {
    readonly signal?: AbortSignal;
    readonly agent?: {
        readonly session: {
            readonly header: {
                readonly cwd?: string;
            };
            requestContext?(): any;
            requestHeader?(): any;
        };
    };
}
export declare function getEngine(): Promise<DeckEngine>;
/** Build executors with a shared engine loader; resolve paths separately for each call. */
export declare function createPptExecutors(config: ResolvedPptConfig, loadEngine?: () => Promise<DeckEngine>): {
    themes(rawArgs: unknown, exec?: PptExecution): Promise<PptThemesResult>;
    create(rawArgs: unknown, exec?: PptExecution): Promise<import("./types.js").PptCreateResult>;
    templates(rawArgs: unknown, exec?: PptExecution): Promise<{
        ok: boolean;
        templates: unknown[];
    }>;
    edit(rawArgs: unknown, exec?: PptExecution): Promise<import("./types.js").PptCreateResult>;
    undo(rawArgs: unknown, exec?: PptExecution): Promise<import("./types.js").PptCreateResult>;
    check(rawArgs: unknown, exec?: PptExecution): Promise<import("./types.js").PptQualityResult | import("./types.js").PptCheckResult>;
    render(rawArgs: unknown, exec?: PptExecution): Promise<import("./types.js").PptRenderResult>;
    templateList(rawArgs: unknown, exec?: PptExecution): Promise<{
        ok: boolean;
        template: import("./templates.js").PptTemplateDetail;
        templates?: undefined;
    } | {
        ok: boolean;
        templates: import("./templates.js").PptTemplateSummary[];
        template?: undefined;
    }>;
    templateImport(rawArgs: unknown, exec?: PptExecution): Promise<{
        ok: boolean;
        dryRun: boolean;
        draft: any;
        draftAssets: any;
        candidates: any;
        stats: any;
        template?: undefined;
    } | {
        ok: boolean;
        template: import("./templates.js").PptTemplateDetail;
        candidates: any;
        dryRun?: undefined;
        draft?: undefined;
        draftAssets?: undefined;
        stats?: undefined;
    }>;
    templateUpdate(rawArgs: unknown, exec?: PptExecution): Promise<{
        ok: boolean;
        template: import("./templates.js").PptTemplateDetail;
    }>;
    templateRemove(rawArgs: unknown, exec?: PptExecution): Promise<{
        ok: boolean;
        removed: boolean;
    }>;
    data(rawArgs: unknown, exec?: PptExecution): Promise<Record<string, any> | import("./types.js").PptCreateResult>;
};
