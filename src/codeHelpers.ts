import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export async function addControlCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const label = await vscode.window.showInputBox({
        prompt: "Control Label (e.g. Title Color)",
    });
    if (!label) return;

    const type = await vscode.window.showQuickPick(
        [
            "TEXT",
            "COLOR",
            "SELECT",
            "SWITCHER",
            "IMAGE",
            "MEDIA",
            "SLIDER",
            "WYSIWYG",
            "TEXTAREA",
            "NUMBER",
        ],
        { placeHolder: "Control Type" }
    );
    if (!type) return;

    const id = await vscode.window.showInputBox({
        prompt: "Control ID",
        value: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    });
    if (!id) return;

    const snippet = `
        $this->add_control(
            '${id}',
            [
                'label' => esc_html__('${label}', 'northway'),
                'type' => \\Elementor\\Controls_Manager::${type},
                'default' => '',
            ]
        );
    `;

    editor.edit((editBuilder) => {
        editBuilder.insert(editor.selection.active, snippet);
    });
}

export class ClassDefinitionProvider implements vscode.DefinitionProvider {
    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition> {
        const range = document.getWordRangeAtPosition(
            position,
            /['"][a-zA-Z0-9-_ ]+['"]/
        );
        if (!range) return undefined;

        const text = document.getText(range).replace(/['"]/g, ""); // Remove quotes
        // Check if it looks like a class (e.g. pxl-...)
        if (!text.includes("pxl-")) return undefined;

        // Find associated SCSS file
        // Heuristic: widget file is in elements/widgets/pxl_name.php
        // SCSS is in assets/scss/elements/name.scss

        const widgetFilePath = document.fileName;
        const widgetName = path.basename(widgetFilePath, ".php");
        const cleanName = widgetName.replace(/^pxl_/, "").replace(/_/g, "");

        // Try to find the SCSS file
        // We need to search in the workspace
        // This is a bit expensive, so we try to guess the path first

        // Assuming standard structure: .../elements/widgets/pxl_foo.php
        // SCSS: .../assets/scss/elements/foo.scss

        const workspaceRoot = vscode.workspace.getWorkspaceFolder(document.uri)
            ?.uri.fsPath;
        if (!workspaceRoot) return undefined;

        const scssDir = path.join(
            workspaceRoot,
            "northway",
            "assets",
            "scss",
            "elements"
        );

        // We can't easily know the exact SCSS filename without searching,
        // but we can try to match the widget name.
        // For now, let's try to find a file that matches the widget name roughly.

        // Actually, let's just search for the class name in ALL scss files in elements folder.
        // That's safer.

        return this.findClassInScss(scssDir, text);
    }

    private async findClassInScss(
        scssDir: string,
        className: string
    ): Promise<vscode.Location | undefined> {
        if (!fs.existsSync(scssDir)) return undefined;

        const files = await fs.promises.readdir(scssDir);
        for (const file of files) {
            if (file.endsWith(".scss")) {
                const filePath = path.join(scssDir, file);
                const content = await fs.promises.readFile(filePath, "utf-8");
                const index = content.indexOf(`.${className}`);
                if (index !== -1) {
                    const doc = await vscode.workspace.openTextDocument(
                        filePath
                    );
                    const pos = doc.positionAt(index);
                    return new vscode.Location(vscode.Uri.file(filePath), pos);
                }
            }
        }
        return undefined;
    }
}
