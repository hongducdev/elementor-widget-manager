import * as vscode from "vscode";
import * as path from "path";

interface ThemeCheckIssue {
    file: string;
    line: number;
    message: string;
    severity: "error" | "warning" | "info";
    category: string;
}

/**
 * Tree item for theme check issues
 */
class ThemeCheckItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly issue?: ThemeCheckIssue
    ) {
        super(label, collapsibleState);

        if (issue) {
            this.tooltip = `${issue.file}:${issue.line}\n${issue.message}`;
            this.description = `Dòng ${issue.line}`;
            this.iconPath = this.getIcon(issue.severity);
            this.command = {
                command: "elementor-widget-manager.openIssue",
                title: "Mở Lỗi",
                arguments: [issue],
            };
        }
    }

    private getIcon(severity: string): vscode.ThemeIcon {
        switch (severity) {
            case "error":
                return new vscode.ThemeIcon(
                    "error",
                    new vscode.ThemeColor("errorForeground")
                );
            case "warning":
                return new vscode.ThemeIcon(
                    "warning",
                    new vscode.ThemeColor("editorWarning.foreground")
                );
            default:
                return new vscode.ThemeIcon("info");
        }
    }
}

/**
 * Tree data provider for theme check issues
 */
export class ThemeCheckTreeProvider
    implements vscode.TreeDataProvider<ThemeCheckItem>
{
    private _onDidChangeTreeData: vscode.EventEmitter<
        ThemeCheckItem | undefined | null | void
    > = new vscode.EventEmitter<ThemeCheckItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        ThemeCheckItem | undefined | null | void
    > = this._onDidChangeTreeData.event;

    private issues: Map<string, ThemeCheckIssue[]> = new Map();

    constructor(private diagnosticCollection: vscode.DiagnosticCollection) {
        // Listen to diagnostic changes
        vscode.languages.onDidChangeDiagnostics((e) => {
            this.updateIssues();
        });
    }

    refresh(): void {
        this.updateIssues();
        this._onDidChangeTreeData.fire();
    }

    private updateIssues(): void {
        this.issues.clear();

        this.diagnosticCollection.forEach((uri, diagnostics) => {
            const fileName = path.basename(uri.fsPath);
            const fileIssues: ThemeCheckIssue[] = [];

            for (const diagnostic of diagnostics) {
                if (diagnostic.source === "Kiểm Tra Theme Envato") {
                    fileIssues.push({
                        file: fileName,
                        line: diagnostic.range.start.line + 1,
                        message: diagnostic.message,
                        severity: this.getSeverityString(diagnostic.severity),
                        category: diagnostic.code as string,
                    });
                }
            }

            if (fileIssues.length > 0) {
                this.issues.set(uri.fsPath, fileIssues);
            }
        });
    }

    private getSeverityString(
        severity: vscode.DiagnosticSeverity
    ): "error" | "warning" | "info" {
        switch (severity) {
            case vscode.DiagnosticSeverity.Error:
                return "error";
            case vscode.DiagnosticSeverity.Warning:
                return "warning";
            default:
                return "info";
        }
    }

    getTreeItem(element: ThemeCheckItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ThemeCheckItem): Thenable<ThemeCheckItem[]> {
        if (!element) {
            // Root level - show files
            const items: ThemeCheckItem[] = [];

            if (this.issues.size === 0) {
                return Promise.resolve([
                    new ThemeCheckItem(
                        "✓ Không có lỗi",
                        vscode.TreeItemCollapsibleState.None
                    ),
                ]);
            }

            this.issues.forEach((fileIssues, filePath) => {
                const fileName = path.basename(filePath);
                const errorCount = fileIssues.filter(
                    (i) => i.severity === "error"
                ).length;
                const warningCount = fileIssues.filter(
                    (i) => i.severity === "warning"
                ).length;

                const label = `${fileName} (${errorCount} lỗi, ${warningCount} cảnh báo)`;
                const item = new ThemeCheckItem(
                    label,
                    vscode.TreeItemCollapsibleState.Expanded
                );
                item.contextValue = "file";
                item.resourceUri = vscode.Uri.file(filePath);
                items.push(item);
            });

            return Promise.resolve(items);
        } else {
            // File level - show issues
            const filePath = element.resourceUri?.fsPath;
            if (!filePath) {
                return Promise.resolve([]);
            }

            const fileIssues = this.issues.get(filePath) || [];
            const items = fileIssues.map(
                (issue) =>
                    new ThemeCheckItem(
                        issue.message,
                        vscode.TreeItemCollapsibleState.None,
                        issue
                    )
            );

            return Promise.resolve(items);
        }
    }
}
