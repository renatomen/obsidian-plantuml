import type {PlantumlRenderOptions} from "@plantuml/core";

export type RenderToString = (
    lines: string[],
    onSuccess: (svg: string) => void,
    onError: (message: string) => void,
    options?: PlantumlRenderOptions,
) => void;

export type EngineLoader = () => Promise<RenderToString>;

export const SOFT_RENDER_TIMEOUT_MS = 10000;
export const HARD_RENDER_TIMEOUT_MS = 30000;

const ENGINE_LOAD_FAILED = "Could not load the PlantUML engine";
const RENDER_FAILED = "The PlantUML engine failed while rendering the diagram";
const ENGINE_STUCK = "The PlantUML engine stopped responding. Reload Obsidian to render diagrams with the bundled renderer again.";

interface RenderJob {
    lines: string[];
    dark: boolean;
    settled: boolean;
    resolve: (svg: string) => void;
    reject: (error: Error) => void;
}

const queue: RenderJob[] = [];

let current: RenderJob | null = null;
let softTimer: ReturnType<typeof setTimeout> | null = null;
let hardTimer: ReturnType<typeof setTimeout> | null = null;
let engine: Promise<RenderToString> | null = null;
let engineStuck = false;
let loadEngine: EngineLoader = loadBundledEngine;

async function loadBundledEngine(): Promise<RenderToString> {
    const viz = await import("@viz-js/viz");
    // `Viz` is a JavaScript global that the engine reads, not a DOM lookup.
    // eslint-disable-next-line obsidianmd/prefer-active-doc
    (globalThis as {Viz?: unknown}).Viz = viz;

    const core = await import("@plantuml/core");
    return core.renderToString;
}

function initEngine(): Promise<RenderToString> {
    const memoised = engine;
    if (memoised !== null) {
        return memoised;
    }

    const started = loadEngine();
    engine = started;
    started.catch(() => {
        if (engine === started) {
            engine = null;
        }
    });
    return started;
}

function resolveJob(job: RenderJob, svg: string): void {
    if (job.settled) {
        return;
    }
    job.settled = true;
    job.resolve(svg);
}

function rejectJob(job: RenderJob, error: Error): void {
    if (job.settled) {
        return;
    }
    job.settled = true;
    job.reject(error);
}

function toError(cause: unknown, fallback: string): Error {
    if (cause instanceof Error) {
        return cause;
    }
    return new Error(typeof cause === "string" ? cause : fallback);
}

function armTimer(handler: () => void, delay: number): ReturnType<typeof setTimeout> {
    // eslint-disable-next-line obsidianmd/prefer-active-window-timers
    return setTimeout(handler, delay);
}

function clearTimers(): void {
    for (const timer of [softTimer, hardTimer]) {
        if (timer !== null) {
            // eslint-disable-next-line obsidianmd/prefer-active-window-timers
            clearTimeout(timer);
        }
    }
    softTimer = null;
    hardTimer = null;
}

function failQueue(): void {
    let job = queue.shift();
    while (job !== undefined) {
        rejectJob(job, new Error(ENGINE_STUCK));
        job = queue.shift();
    }
}

function release(job: RenderJob): void {
    if (current !== job) {
        return;
    }
    clearTimers();
    current = null;
    void drain();
}

async function drain(): Promise<void> {
    if (engineStuck) {
        failQueue();
        return;
    }

    if (current !== null) {
        return;
    }

    const job = queue.shift();
    if (job === undefined) {
        return;
    }
    current = job;

    let render: RenderToString;
    try {
        render = await initEngine();
    } catch (error) {
        rejectJob(job, toError(error, ENGINE_LOAD_FAILED));
        release(job);
        return;
    }

    softTimer = armTimer(() => {
        softTimer = null;
        rejectJob(job, new Error(`PlantUML rendering timed out after ${SOFT_RENDER_TIMEOUT_MS / 1000} seconds`));
    }, SOFT_RENDER_TIMEOUT_MS);

    hardTimer = armTimer(() => {
        hardTimer = null;
        engineStuck = true;
        console.error("PlantUML engine never called back; treating it as unusable and failing every waiting diagram");
        failQueue();
    }, HARD_RENDER_TIMEOUT_MS);

    try {
        render(
            job.lines,
            (svg: string) => {
                resolveJob(job, svg);
                release(job);
            },
            (message: string) => {
                rejectJob(job, new Error(message));
                release(job);
            },
            {dark: job.dark},
        );
    } catch (error) {
        rejectJob(job, toError(error, RENDER_FAILED));
        release(job);
    }
}

/**
 * Renders one diagram with the bundled PlantUML JavaScript engine, queued behind
 * every render already in flight. The engine keeps shared internal state, so only
 * one diagram is rendered at a time.
 */
export function renderDiagram(lines: string[], dark: boolean): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        queue.push({lines, dark, settled: false, resolve, reject});
        void drain();
    });
}

/**
 * Test seam. Replaces the loader that binds Graphviz and imports the engine, and
 * drops the memoised engine so the next render loads through the replacement.
 */
export function setEngineLoader(loader: EngineLoader | null): void {
    loadEngine = loader ?? loadBundledEngine;
    engine = null;
}
