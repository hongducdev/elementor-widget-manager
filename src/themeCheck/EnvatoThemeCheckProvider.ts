import * as vscode from "vscode";
import { ALL_PATTERNS, CheckPattern } from "./checkPatterns";

/**
 * Envato Theme Check Diagnostic Provider
 * Provides real-time linting for PHP files based on Envato theme standards
 */
export class EnvatoThemeCheckProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private enabled: boolean = true;

    constructor(diagnosticCollection: vscode.DiagnosticCollection) {
        this.diagnosticCollection = diagnosticCollection;
    }

    /**
     * Scan a PHP document for issues
     */
    public scan(document: vscode.TextDocument): void {
        if (!this.enabled || document.languageId !== "php") {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split("\n");

        // Scan each pattern
        for (const pattern of ALL_PATTERNS) {
            this.scanPattern(document, lines, pattern, diagnostics);
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    /**
     * Scan for a specific pattern
     */
    private scanPattern(
        document: vscode.TextDocument,
        lines: string[],
        pattern: CheckPattern,
        diagnostics: vscode.Diagnostic[]
    ): void {
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const matches = line.matchAll(new RegExp(pattern.pattern, "g"));

            for (const match of matches) {
                if (match.index === undefined) {
                    continue;
                }

                const startPos = new vscode.Position(lineIndex, match.index);
                const endPos = new vscode.Position(
                    lineIndex,
                    match.index + match[0].length
                );
                const range = new vscode.Range(startPos, endPos);

                const diagnostic = new vscode.Diagnostic(
                    range,
                    pattern.message,
                    this.getSeverity(pattern.severity)
                );

                diagnostic.source = "Kiểm Tra Theme Envato";
                diagnostic.code = pattern.category;

                // Add related information if replacement exists
                if (pattern.replacement) {
                    diagnostic.relatedInformation = [
                        new vscode.DiagnosticRelatedInformation(
                            new vscode.Location(document.uri, range),
                            `Đề xuất thay thế: ${pattern.replacement}`
                        ),
                    ];
                }

                diagnostics.push(diagnostic);
            }
        }
    }

    /**
     * Convert severity string to VS Code DiagnosticSeverity
     */
    private getSeverity(
        severity: "error" | "warning" | "info"
    ): vscode.DiagnosticSeverity {
        switch (severity) {
            case "error":
                return vscode.DiagnosticSeverity.Error;
            case "warning":
                return vscode.DiagnosticSeverity.Warning;
            case "info":
                return vscode.DiagnosticSeverity.Information;
        }
    }

    /**
     * Clear diagnostics for a document
     */
    public clear(document: vscode.TextDocument): void {
        this.diagnosticCollection.delete(document.uri);
    }

    /**
     * Clear all diagnostics
     */
    public clearAll(): void {
        this.diagnosticCollection.clear();
    }

    /**
     * Enable/disable the provider
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (!enabled) {
            this.clearAll();
        }
    }
}
