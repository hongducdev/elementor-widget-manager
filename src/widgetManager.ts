import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";

export interface ElementorWidget {
    name: string;
    title: string;
    filePath: string;
    icon?: string;
    layouts?: string[];
    gitUpdateCount?: number;
    templates?: {
        name: string;
        filePath: string;
        cssClass?: string;
        line?: number;
    }[];
    extraLinks?: { label: string; filePath: string }[];
    scssFiles?: { label: string; filePath: string }[];
}

export class WidgetManager {
    constructor() {}

    public async findWidgets(
        workspaceRoot: string
    ): Promise<ElementorWidget[]> {
        const widgets: ElementorWidget[] = [];

        const pattern = new vscode.RelativePattern(
            workspaceRoot,
            "**/elements/widgets/*.php"
        );
        const files = await vscode.workspace.findFiles(pattern);

        // Find git root from the first file found, or workspace root
        let gitRoot = workspaceRoot;
        if (files.length > 0) {
            try {
                const firstFileDir = path.dirname(files[0].fsPath);
                const { stdout } = await this.execGit(
                    "git rev-parse --show-toplevel",
                    firstFileDir
                );
                gitRoot = stdout.trim();
            } catch (e) {
                console.warn(
                    "Could not find git root, using workspace root",
                    e
                );
            }
        }

        const gitCounts = await this.getGitUpdateCounts(gitRoot);

        for (const file of files) {
            const widget = await this.parseWidgetFile(file.fsPath);
            if (widget) {
                // Calculate path relative to the GIT ROOT, not workspace root
                const relativePath = path
                    .relative(gitRoot, file.fsPath)
                    .replace(/\\/g, "/");
                widget.gitUpdateCount = gitCounts.get(relativePath) || 0;
                widgets.push(widget);
            }
        }

        return widgets;
    }

    private async parseWidgetFile(
        filePath: string
    ): Promise<ElementorWidget | null> {
        try {
            const content = await fs.promises.readFile(filePath, "utf-8");

            const nameMatch = content.match(/'name'\s*=>\s*'([^']+)'/);
            const titleMatch = content.match(
                /'title'\s*=>\s*esc_html__\('([^']+)'/
            );
            const iconMatch = content.match(/'icon'\s*=>\s*'([^']+)'/);

            if (nameMatch && titleMatch) {
                const widgetName = nameMatch[1];
                const layouts = await this.findLayouts(filePath, widgetName);
                const templates = await this.findTemplates(
                    filePath,
                    widgetName
                );
                const scssFiles = await this.findScss(filePath, widgetName);

                const extraLinks: { label: string; filePath: string }[] = [];
                if (widgetName === "pxl_post_grid") {
                    // Assuming structure: .../elements/widgets/pxl_post_grid.php
                    // element-templates.php is in .../elements/element-templates.php
                    const elementTemplatesPath = path.join(
                        path.dirname(path.dirname(filePath)),
                        "element-templates.php"
                    );
                    if (fs.existsSync(elementTemplatesPath)) {
                        extraLinks.push({
                            label: "Global Templates (element-templates.php)",
                            filePath: elementTemplatesPath,
                        });
                    }
                }

                return {
                    name: widgetName,
                    title: titleMatch[1],
                    filePath: filePath,
                    icon: iconMatch ? iconMatch[1] : undefined,
                    layouts: layouts,
                    templates: templates,
                    extraLinks: extraLinks,
                    scssFiles: scssFiles,
                };
            }
        } catch (error) {
            console.error(`Error parsing file ${filePath}:`, error);
        }
        return null;
    }

    private async findTemplates(
        widgetFilePath: string,
        widgetName: string
    ): Promise<
        { name: string; filePath: string; cssClass?: string; line?: number }[]
    > {
        const widgetDir = path.dirname(widgetFilePath);
        // templates are in ../templates/{widgetName} relative to widgets folder
        // widgetFilePath: .../elements/widgets/pxl_something.php
        // templates: .../elements/templates/pxl_something/*.php

        const elementsDir = path.dirname(widgetDir); // .../elements
        const templatesDir = path.join(elementsDir, "templates", widgetName);

        const templates: {
            name: string;
            filePath: string;
            cssClass?: string;
            line?: number;
        }[] = [];

        if (fs.existsSync(templatesDir)) {
            try {
                const files = await fs.promises.readdir(templatesDir);
                for (const file of files) {
                    if (file.endsWith(".php")) {
                        const fullPath = path.join(templatesDir, file);
                        const { cssClass, line } = await this.extractCssClass(
                            fullPath
                        );
                        templates.push({
                            name: file,
                            filePath: fullPath,
                            cssClass: cssClass,
                            line: line,
                        });
                    }
                }
            } catch (e) {
                console.error(
                    `Error reading templates dir ${templatesDir}:`,
                    e
                );
            }
        }
        return templates;
    }

    private async extractCssClass(
        filePath: string
    ): Promise<{ cssClass?: string; line?: number }> {
        try {
            const content = await fs.promises.readFile(filePath, "utf-8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
                const lineContent = lines[i];
                // Match 'class' => trim('...') or class="..."
                const matchPhp = lineContent.match(
                    /'class'\s*=>\s*trim\(['"]([^'"]+)['"]\)/
                );
                if (matchPhp) {
                    return { cssClass: matchPhp[1], line: i + 1 };
                }
                const matchHtml = lineContent.match(/class=["']([^"']+)["']/);
                if (matchHtml && !lineContent.includes("pxl_print_html")) {
                    if (matchHtml[1].includes("pxl-")) {
                        return { cssClass: matchHtml[1], line: i + 1 };
                    }
                }
            }
        } catch (e) {
            // ignore
        }
        return {};
    }

    private async findLayouts(
        widgetFilePath: string,
        widgetName: string
    ): Promise<string[]> {
        // Layouts are in ../img-layout/{widgetName}/*.jpg|png
        const widgetDir = path.dirname(widgetFilePath);
        const layoutDir = path.join(widgetDir, "img-layout", widgetName);

        if (fs.existsSync(layoutDir)) {
            try {
                const files = await fs.promises.readdir(layoutDir);
                return files
                    .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file))
                    .map((file) => path.join(layoutDir, file));
            } catch (e) {
                console.error(`Error reading layout dir ${layoutDir}:`, e);
            }
        }
        return [];
    }

    private async findScss(
        widgetFilePath: string,
        widgetName: string
    ): Promise<{ label: string; filePath: string }[]> {
        const scssFiles: { label: string; filePath: string }[] = [];

        const widgetDir = path.dirname(widgetFilePath); // .../elements/widgets
        const elementsDir = path.dirname(widgetDir); // .../elements
        const themeRoot = path.dirname(elementsDir); // .../northway
        const scssDir = path.join(themeRoot, "assets", "scss", "elements");

        if (fs.existsSync(scssDir)) {
            try {
                const files = await fs.promises.readdir(scssDir);
                for (const file of files) {
                    if (file.endsWith(".scss")) {
                        // 1. Name match
                        // widgetName: pxl_post_grid -> posts.scss? pxl_icon_box -> iconbox.scss?
                        // Remove 'pxl_' prefix
                        const cleanName = widgetName
                            .replace(/^pxl_/, "")
                            .replace(/_/g, "");
                        const cleanFile = file
                            .replace(".scss", "")
                            .replace(/_/g, "")
                            .replace(/-/g, "");

                        if (
                            cleanFile.includes(cleanName) ||
                            cleanName.includes(cleanFile)
                        ) {
                            scssFiles.push({
                                label: file,
                                filePath: path.join(scssDir, file),
                            });
                            continue;
                        }
                    }
                }
            } catch (e) {
                console.error(`Error reading scss dir ${scssDir}:`, e);
            }
        }
        return scssFiles;
    }

    private async getGitUpdateCounts(
        repoRoot: string
    ): Promise<Map<string, number>> {
        const counts = new Map<string, number>();
        try {
            const { stdout } = await this.execGit(
                'git log --name-only --format=""',
                repoRoot
            );
            const lines = stdout.split("\n");
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed) {
                    counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
                }
            }
        } catch (error) {
            console.warn("Failed to get git history:", error);
        }
        return counts;
    }

    private execGit(
        command: string,
        cwd: string
    ): Promise<{ stdout: string; stderr: string }> {
        return new Promise<{ stdout: string; stderr: string }>(
            (resolve, reject) => {
                cp.exec(
                    command,
                    { cwd: cwd, maxBuffer: 1024 * 1024 * 10 },
                    (err: any, stdout: string, stderr: string) => {
                        if (err) reject(err);
                        else resolve({ stdout, stderr });
                    }
                );
            }
        );
    }
}
