import * as vscode from "vscode";
import * as path from "path";

interface ThemeCheckIssue {
    uri: vscode.Uri;
    line: number;
    column: number;
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
            const fileName = path.basename(issue.uri.fsPath);
            this.tooltip = `${fileName}:${issue.line}\n${issue.message}`;
            this.description = `Line ${issue.line}`;
            this.iconPath = this.getIcon(issue.severity);

            // Use direct command to open file at position
            this.command = {
                command: "vscode.open",
                title: "Open Issue",
                arguments: [
                    issue.uri,
                    {
                        selection: new vscode.Range(
                            issue.line - 1,
                            issue.column,
                            issue.line - 1,
                            issue.column
                        ),
                    },
                ],
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
            const fileIssues: ThemeCheckIssue[] = [];

            for (const diagnostic of diagnostics) {
                // Match the source name from EnvatoThemeCheckProvider
                if (diagnostic.source === "Envato Theme Check") {
                    fileIssues.push({
                        uri: uri,
                        line: diagnostic.range.start.line + 1,
                        column: diagnostic.range.start.character,
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
                        "✓ No issues found",
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

                const label = `${fileName} (${errorCount} errors, ${warningCount} warnings)`;
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
