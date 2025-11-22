import * as vscode from "vscode";

export class IconHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const range = document.getWordRangeAtPosition(
            position,
            /eicon-[a-zA-Z0-9-]+/
        );
        if (!range) {
            return undefined;
        }

        const word = document.getText(range);
        if (word.startsWith("eicon-")) {
            const iconName = word.replace("eicon-", "");
            // Using Elementor Icons GitHub raw SVG
            const imageUrl = `https://raw.githubusercontent.com/elementor/elementor-icons/master/svg/${iconName}.svg`;

            const markdown = new vscode.MarkdownString(
                `**Elementor Icon Preview**: \`${word}\``
            );
            markdown.appendMarkdown(`\n\n![${word}](${imageUrl})`);
            markdown.supportHtml = true;
            markdown.isTrusted = true;

            return new vscode.Hover(markdown, range);
        }
        return undefined;
    }
}
