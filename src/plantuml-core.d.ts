declare module "@plantuml/core" {
    export interface PlantumlRenderOptions {
        dark?: boolean;
        maxSvgSize?: number;
    }

    export function render(lines: string[], targetId: string, options?: PlantumlRenderOptions): void;

    export function renderToString(
        lines: string[],
        onSuccess: (svg: string) => void,
        onError: (message: string) => void,
        options?: PlantumlRenderOptions,
    ): void;
}
