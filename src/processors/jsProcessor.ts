import {MarkdownPostProcessorContext} from "obsidian";
import * as plantuml from "plantuml-encoder";
import PlantumlPlugin from "../main";
import {Processor} from "./processor";
import {insertImageWithMap, insertSvgImage, toDiagramLines} from "../functions";
import {renderDiagram} from "./jsRenderer";

const ASCII_UNSUPPORTED = "The bundled PlantUML renderer cannot produce ASCII art. Switch to a PlantUML server or a local jar for plantuml-ascii blocks.";
const EMPTY_SOURCE = "The PlantUML diagram is empty.";
const UNDECODABLE_SVG = "The rendered PlantUML diagram could not be decoded as an image.";
const RENDER_FAILED = "The PlantUML diagram could not be rendered.";
const IMAGE_TOO_LARGE = "The PlantUML diagram is too large to draw as an image. Use a plantuml-svg block instead.";
const PNG_DATA_URL = "data:image/png;base64,";

function renderMessage(el: HTMLElement, message: string): void {
    el.empty();
    el.createEl("p", {text: message, cls: "puml-error"});
}

function toMessage(error: unknown): string {
    if (error instanceof Error && error.message.length > 0) {
        return error.message;
    }
    return RENDER_FAILED;
}

function toBlobUrl(svg: string): string {
    const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
    const serialised = new XMLSerializer().serializeToString(parsed.documentElement);
    return URL.createObjectURL(new Blob([serialised], {type: "image/svg+xml"}));
}

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        // eslint-disable-next-line obsidianmd/prefer-create-el
        const image = activeDocument.createElement("img");
        image.addEventListener("load", () => {
            URL.revokeObjectURL(url);
            resolve(image);
        });
        image.addEventListener("error", () => {
            URL.revokeObjectURL(url);
            reject(new Error(UNDECODABLE_SVG));
        });
        image.src = url;
    });
}

async function rasterise(svg: string): Promise<string> {
    const image = await loadImage(toBlobUrl(svg));

    // eslint-disable-next-line obsidianmd/prefer-create-el
    const canvas = activeDocument.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (context === null) {
        throw new Error(IMAGE_TOO_LARGE);
    }

    let dataUrl: string;
    try {
        context.drawImage(image, 0, 0);
        dataUrl = canvas.toDataURL("image/png");
    } catch {
        throw new Error(IMAGE_TOO_LARGE);
    }
    if (!dataUrl.startsWith(PNG_DATA_URL) || dataUrl.length === PNG_DATA_URL.length) {
        throw new Error(IMAGE_TOO_LARGE);
    }
    return dataUrl.slice(PNG_DATA_URL.length);
}

export class JsProcessor implements Processor {
    plugin: PlantumlPlugin;

    constructor(plugin: PlantumlPlugin) {
        this.plugin = plugin;
    }

    private isDark(): boolean {
        return activeDocument.body.hasClass('theme-dark');
    }

    private async toSvg(source: string): Promise<string> {
        const lines = toDiagramLines(source);
        if (lines.length === 0) {
            throw new Error(EMPTY_SOURCE);
        }
        return renderDiagram(lines, this.isDark());
    }

    svg = async(source: string, el: HTMLElement, _: MarkdownPostProcessorContext) => {
        try {
            insertSvgImage(el, await this.toSvg(source));
        } catch (error) {
            console.error(error);
            renderMessage(el, toMessage(error));
        }
    }

    png = async(source: string, el: HTMLElement, _: MarkdownPostProcessorContext) => {
        try {
            const image = await rasterise(await this.toSvg(source));
            insertImageWithMap(el, image, "", plantuml.encode(source));
            const img = el.querySelector("img");
            img?.addEventListener("error", () => {
                if (el.querySelector("img") !== img) return;
                const error = new Error(IMAGE_TOO_LARGE);
                console.error(error);
                renderMessage(el, IMAGE_TOO_LARGE);
            }, {once: true});
        } catch (error) {
            console.error(error);
            renderMessage(el, toMessage(error));
        }
    }

    ascii = async(_source: string, el: HTMLElement, _: MarkdownPostProcessorContext) => {
        renderMessage(el, ASCII_UNSUPPORTED);
    }
}
