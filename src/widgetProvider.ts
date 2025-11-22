import * as vscode from "vscode";
import * as path from "path";
import { WidgetManager, ElementorWidget } from "./widgetManager";

export class WidgetProvider implements vscode.TreeDataProvider<WidgetItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<
        WidgetItem | undefined | null | void
    > = new vscode.EventEmitter<WidgetItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        WidgetItem | undefined | null | void
    > = this._onDidChangeTreeData.event;

    private widgetManager: WidgetManager;
    private workspaceRoot: string | undefined;

    constructor(workspaceRoot: string | undefined) {
        this.workspaceRoot = workspaceRoot;
        this.widgetManager = new WidgetManager();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: WidgetItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: WidgetItem): Thenable<WidgetItem[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage(
                "No widget in empty workspace"
            );
            return Promise.resolve([]);
        }

        if (element) {
            const children: WidgetItem[] = [];

            if (element.extraLinks && element.extraLinks.length > 0) {
                children.push(
                    ...element.extraLinks.map(
                        (link) =>
                            new WidgetItem(
                                link.label,
                                "",
                                vscode.TreeItemCollapsibleState.None,
                                link.filePath,
                                "link"
                            )
                    )
                );
            }

            if (element.scssFiles && element.scssFiles.length > 0) {
                children.push(
                    ...element.scssFiles.map(
                        (scss) =>
                            new WidgetItem(
                                scss.label,
                                "",
                                vscode.TreeItemCollapsibleState.None,
                                scss.filePath,
                                "paintcan"
                            )
                    )
                );
            }

            if (
                element.templates &&
                element.templates.length > 0 &&
                element.label !== "Templates"
            ) {
                children.push(
                    new WidgetItem(
                        "Templates",
                        "",
                        vscode.TreeItemCollapsibleState.Collapsed,
                        "",
                        "folder",
                        false,
                        undefined,
                        undefined,
                        element.templates
                    )
                );
            }

            if (element.layouts && element.layouts.length > 0) {
                children.push(
                    ...element.layouts.map((layoutPath) => {
                        const fileName = path.basename(layoutPath);
                        return new WidgetItem(
                            fileName,
                            "",
                            vscode.TreeItemCollapsibleState.None,
                            layoutPath,
                            undefined,
                            true // isLayout
                        );
                    })
                );
            }

            if (element.childTemplates && element.label === "Templates") {
                children.push(
                    ...element.childTemplates.map(
                        (tpl) =>
                            new WidgetItem(
                                tpl.name,
                                tpl.cssClass || "",
                                vscode.TreeItemCollapsibleState.None,
                                tpl.filePath,
                                "file-code",
                                false,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                tpl.line
                            )
                    )
                );
            }

            return Promise.resolve(children);
        } else {
            return this.getWidgets();
        }
    }

    private async getWidgets(): Promise<WidgetItem[]> {
        if (!this.workspaceRoot) {
            return [];
        }

        const widgets = await this.widgetManager.findWidgets(
            this.workspaceRoot
        );
        return widgets.map(
            (widget) =>
                new WidgetItem(
                    widget.title,
                    widget.name,
                    (widget.layouts && widget.layouts.length > 0) ||
                    (widget.templates && widget.templates.length > 0)
                        ? vscode.TreeItemCollapsibleState.Collapsed
                        : vscode.TreeItemCollapsibleState.None,
                    widget.filePath,
                    widget.icon,
                    false,
                    widget.layouts,
                    widget.gitUpdateCount,
                    widget.templates,
                    widget.extraLinks,
                    widget.scssFiles
                )
        );
    }
}

class WidgetItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly filePath: string,
        public readonly iconName?: string,
        public readonly isLayout: boolean = false,
        public readonly layouts?: string[],
        public readonly gitUpdateCount?: number,
        public readonly templates?: {
            name: string;
            filePath: string;
            cssClass?: string;
            line?: number;
        }[],
        public readonly extraLinks?: { label: string; filePath: string }[],
        public readonly scssFiles?: { label: string; filePath: string }[],
        public readonly line?: number
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;

        if (this.isLayout) {
            this.description = "";
        } else if (this.templates && this.label === "Templates") {
            this.description = `${this.templates.length} files`;
        } else if (this.line) {
            this.description = this.version; // version holds cssClass here
        } else {
            this.description = `${this.version} - ${
                this.gitUpdateCount !== undefined
                    ? this.gitUpdateCount + " updates"
                    : ""
            }`;
        }

        if (this.iconName === "link") {
            this.iconPath = new vscode.ThemeIcon("link");
        } else if (this.iconName === "folder") {
            this.iconPath = new vscode.ThemeIcon("folder");
        } else if (this.iconName === "paintcan") {
            this.iconPath = new vscode.ThemeIcon("paintcan");
        } else if (this.isLayout) {
            this.iconPath = new vscode.ThemeIcon("file-media");
            this.contextValue = "layout";
        } else {
            if (this.iconName) {
                this.iconPath = new vscode.ThemeIcon("symbol-class");
            } else {
                this.iconPath = new vscode.ThemeIcon("file-code");
            }
        }

        if (this.line) {
            this.command = {
                command: "vscode.open",
                title: "Open File",
                arguments: [
                    vscode.Uri.file(this.filePath),
                    {
                        selection: new vscode.Range(
                            this.line - 1,
                            0,
                            this.line - 1,
                            0
                        ),
                    },
                ],
            };
        } else if (
            !this.templates &&
            !this.layouts &&
            !this.isLayout &&
            this.collapsibleState === vscode.TreeItemCollapsibleState.None &&
            this.iconName !== "link" &&
            this.iconName !== "paintcan" &&
            this.iconName !== "folder"
        ) {
            this.command = {
                command: "elementor-widget-manager.openWidget",
                title: "Open Widget",
                arguments: [vscode.Uri.file(this.filePath)],
            };
        } else if (this.iconName === "link" || this.iconName === "paintcan") {
            this.command = {
                command: "vscode.open",
                title: "Open File",
                arguments: [vscode.Uri.file(this.filePath)],
            };
        } else if (this.isLayout) {
            this.command = {
                command: "vscode.open",
                title: "Open Image",
                arguments: [vscode.Uri.file(this.filePath)],
            };
        }
    }

    get childTemplates() {
        return this.templates;
    }
}
