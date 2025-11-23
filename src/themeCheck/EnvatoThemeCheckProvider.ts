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
        const relativePath = vscode.workspace.asRelativePath(document.uri);

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

                // Shorter message for better UX
                const lineNumber = lineIndex + 1;
                const enhancedMessage = `${pattern.message} [${relativePath}:${lineNumber}]`;

                const diagnostic = new vscode.Diagnostic(
                    range,
                    enhancedMessage,
                    this.getSeverity(pattern.severity)
                );

                diagnostic.source = "Envato Theme Check";
                diagnostic.code = pattern.category;

                // Add related information if replacement exists
                if (pattern.replacement) {
                    diagnostic.relatedInformation = [
                        new vscode.DiagnosticRelatedInformation(
                            new vscode.Location(document.uri, range),
                            `Suggested replacement: ${pattern.replacement}`
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
     * Scan all PHP files in the workspace
     */
    public async scanWorkspace(): Promise<void> {
        if (!this.enabled) {
            return;
        }

        const files = await vscode.workspace.findFiles(
            "**/*.php",
            "**/node_modules/**"
        );

        // Debug logging
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0];
        console.log("=== Envato Theme Check: Workspace Scan Started ===");
        console.log(
            "Workspace Root:",
            workspaceRoot?.uri.fsPath || "No workspace"
        );
        console.log("PHP Files Found:", files.length);

        // Global state for workspace scan
        const textDomains = new Set<string>();
        const foundFeatures = new Set<string>();
        let mainFileUri: vscode.Uri | undefined;

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Đang quét theme...",
                cancellable: true,
            },
            async (progress, token) => {
                const total = files.length;
                let processed = 0;

                for (const file of files) {
                    if (token.isCancellationRequested) {
                        break;
                    }

                    // Identify functions.php or style.css as main file for global errors
                    if (
                        file.path.endsWith("functions.php") ||
                        (!mainFileUri && file.path.endsWith("style.css"))
                    ) {
                        mainFileUri = file;
                    }

                    const relativePath = vscode.workspace.asRelativePath(file);
                    progress.report({
                        message: `${processed}/${total} - ${relativePath}`,
                        increment: (1 / total) * 100,
                    });

                    try {
                        const document =
                            await vscode.workspace.openTextDocument(file);
                        const text = document.getText();

                        // Scan for local issues (Prohibited patterns)
                        this.scan(document);

                        // Collect text domains
                        const domainMatches = text.matchAll(
                            /(?:_e|__|esc_html__|esc_attr__|esc_html_e|esc_attr_e)\s*\(\s*['"][^'"]+['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g
                        );
                        for (const match of domainMatches) {
                            textDomains.add(match[1]);
                        }

                        // Collect found features (Recommended & Required)
                        const {
                            RECOMMENDED_FEATURES,
                            REQUIRED_PATTERNS,
                        } = require("./checkPatterns");

                        // Check Recommended
                        for (const feature of RECOMMENDED_FEATURES) {
                            if (feature.pattern.test(text)) {
                                foundFeatures.add(feature.message);
                            }
                        }

                        // Check Required
                        for (const feature of REQUIRED_PATTERNS) {
                            if (new RegExp(feature.pattern).test(text)) {
                                foundFeatures.add(feature.message);
                            }
                        }
                    } catch (error) {
                        console.error(
                            `Error scanning file ${file.fsPath}:`,
                            error
                        );
                    }

                    processed++;
                }

                // Report global issues
                if (mainFileUri) {
                    const globalDiagnostics: vscode.Diagnostic[] = [];

                    // Check multiple text domains
                    if (textDomains.size > 1) {
                        const domains = Array.from(textDomains).join(", ");
                        const message = `WARNING: More than one text-domain is being used in this theme. The domains found are: ${domains}.`;
                        globalDiagnostics.push(
                            new vscode.Diagnostic(
                                new vscode.Range(0, 0, 0, 0),
                                message,
                                vscode.DiagnosticSeverity.Warning
                            )
                        );
                    }

                    const {
                        RECOMMENDED_FEATURES,
                        REQUIRED_PATTERNS,
                    } = require("./checkPatterns");

                    // Check missing Recommended features
                    for (const feature of RECOMMENDED_FEATURES) {
                        if (!foundFeatures.has(feature.message)) {
                            globalDiagnostics.push(
                                new vscode.Diagnostic(
                                    new vscode.Range(0, 0, 0, 0),
                                    feature.message,
                                    vscode.DiagnosticSeverity.Information
                                )
                            );
                        }
                    }

                    // Check missing Required features
                    for (const feature of REQUIRED_PATTERNS) {
                        if (!foundFeatures.has(feature.message)) {
                            globalDiagnostics.push(
                                new vscode.Diagnostic(
                                    new vscode.Range(0, 0, 0, 0),
                                    feature.message,
                                    vscode.DiagnosticSeverity.Error
                                )
                            );
                        }
                    }

                    // File Existence Checks
                    const workspaceRoot =
                        vscode.workspace.workspaceFolders?.[0]?.uri;
                    if (workspaceRoot) {
                        // Check for screenshot
                        const screenshotPng = vscode.Uri.joinPath(
                            workspaceRoot,
                            "screenshot.png"
                        );
                        const screenshotJpg = vscode.Uri.joinPath(
                            workspaceRoot,
                            "screenshot.jpg"
                        );
                        try {
                            await vscode.workspace.fs.stat(screenshotPng);
                        } catch {
                            try {
                                await vscode.workspace.fs.stat(screenshotJpg);
                            } catch {
                                globalDiagnostics.push(
                                    new vscode.Diagnostic(
                                        new vscode.Range(0, 0, 0, 0),
                                        "REQUIRED: Screenshot is missing! Add a screenshot.png or screenshot.jpg.",
                                        vscode.DiagnosticSeverity.Error
                                    )
                                );
                            }
                        }

                        // Check for license file
                        const license = vscode.Uri.joinPath(
                            workspaceRoot,
                            "LICENSE"
                        );
                        const licenseTxt = vscode.Uri.joinPath(
                            workspaceRoot,
                            "LICENSE.txt"
                        );
                        try {
                            await vscode.workspace.fs.stat(license);
                        } catch {
                            try {
                                await vscode.workspace.fs.stat(licenseTxt);
                            } catch {
                                globalDiagnostics.push(
                                    new vscode.Diagnostic(
                                        new vscode.Range(0, 0, 0, 0),
                                        "REQUIRED: License file is missing! Add a LICENSE or LICENSE.txt file.",
                                        vscode.DiagnosticSeverity.Error
                                    )
                                );
                            }
                        }

                        // Check for readme
                        const readme = vscode.Uri.joinPath(
                            workspaceRoot,
                            "readme.txt"
                        );
                        try {
                            await vscode.workspace.fs.stat(readme);
                        } catch {
                            globalDiagnostics.push(
                                new vscode.Diagnostic(
                                    new vscode.Range(0, 0, 0, 0),
                                    "RECOMMENDED: readme.txt is missing.",
                                    vscode.DiagnosticSeverity.Information
                                )
                            );
                        }

                        // Check style.css headers
                        const styleCss = vscode.Uri.joinPath(
                            workspaceRoot,
                            "style.css"
                        );
                        try {
                            const styleDoc =
                                await vscode.workspace.openTextDocument(
                                    styleCss
                                );
                            const styleText = styleDoc.getText();
                            const requiredHeaders = [
                                "Theme Name:",
                                "Description:",
                                "Author:",
                                "Version:",
                                "License:",
                                "License URI:",
                                "Text Domain:",
                            ];

                            for (const header of requiredHeaders) {
                                if (!styleText.includes(header)) {
                                    globalDiagnostics.push(
                                        new vscode.Diagnostic(
                                            new vscode.Range(0, 0, 0, 0),
                                            `REQUIRED: style.css is missing required header: ${header}`,
                                            vscode.DiagnosticSeverity.Error
                                        )
                                    );
                                }
                            }

                            // Check for Tested up to
                            if (!styleText.includes("Tested up to:")) {
                                globalDiagnostics.push(
                                    new vscode.Diagnostic(
                                        new vscode.Range(0, 0, 0, 0),
                                        "RECOMMENDED: style.css should include 'Tested up to:' header.",
                                        vscode.DiagnosticSeverity.Information
                                    )
                                );
                            }
                        } catch (error) {
                            globalDiagnostics.push(
                                new vscode.Diagnostic(
                                    new vscode.Range(0, 0, 0, 0),
                                    "REQUIRED: style.css is missing!",
                                    vscode.DiagnosticSeverity.Error
                                )
                            );
                        }
                    }

                    // Append to existing diagnostics of main file
                    const existing =
                        this.diagnosticCollection.get(mainFileUri) || [];
                    this.diagnosticCollection.set(mainFileUri, [
                        ...existing,
                        ...globalDiagnostics,
                    ]);

                    // Debug summary
                    console.log("=== Scan Summary ===");
                    console.log("Text Domains Found:", Array.from(textDomains));
                    console.log("Features Found:", foundFeatures.size);
                    console.log(
                        "Global Diagnostics:",
                        globalDiagnostics.length
                    );
                    console.log("=== Scan Complete ===");
                }
            }
        );
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
