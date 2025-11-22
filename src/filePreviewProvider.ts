import * as vscode from "vscode";
import * as path from "path";

export class FilePreviewProvider
    implements vscode.CustomReadonlyEditorProvider
{
    public static register(
        context: vscode.ExtensionContext
    ): vscode.Disposable {
        const provider = new FilePreviewProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            "elementor-widget-manager.filePreview",
            provider
        );
        return providerRegistration;
    }

    constructor(private readonly context: vscode.ExtensionContext) {}

    async openCustomDocument(
        uri: vscode.Uri,
        openContext: vscode.CustomDocumentOpenContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CustomDocument> {
        return { uri, dispose: () => {} };
    }

    async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.dirname(document.uri.fsPath)),
            ],
        };

        const ext = path.extname(document.uri.fsPath).toLowerCase();

        if (ext === ".svg") {
            webviewPanel.webview.html = this.getSvgPreviewHtml(
                webviewPanel.webview,
                document.uri
            );
        } else if ([".ttf", ".otf", ".woff", ".woff2"].includes(ext)) {
            webviewPanel.webview.html = this.getFontPreviewHtml(
                webviewPanel.webview,
                document.uri
            );
        }
    }

    private getSvgPreviewHtml(
        webview: vscode.Webview,
        uri: vscode.Uri
    ): string {
        const svgUri = webview.asWebviewUri(uri);
        const fileName = path.basename(uri.fsPath);

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SVG Preview</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        padding: 20px;
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                        font-family: var(--vscode-font-family);
                    }
                    .header {
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    h1 {
                        font-size: 18px;
                        font-weight: 600;
                    }
                    .preview-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-top: 20px;
                    }
                    .preview-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 20px;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 8px;
                        gap: 10px;
                    }
                    .size-label {
                        font-weight: bold;
                        color: var(--vscode-textPreformat-foreground);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SVG Preview: ${fileName}</h1>
                </div>
                <div class="preview-grid">
                    <div class="preview-item">
                        <span class="size-label">16×16</span>
                        <img src="${svgUri}" width="16" height="16" alt="16px">
                    </div>
                    <div class="preview-item">
                        <span class="size-label">32×32</span>
                        <img src="${svgUri}" width="32" height="32" alt="32px">
                    </div>
                    <div class="preview-item">
                        <span class="size-label">64×64</span>
                        <img src="${svgUri}" width="64" height="64" alt="64px">
                    </div>
                    <div class="preview-item">
                        <span class="size-label">128×128</span>
                        <img src="${svgUri}" width="128" height="128" alt="128px">
                    </div>
                    <div class="preview-item">
                        <span class="size-label">256×256</span>
                        <img src="${svgUri}" width="256" height="256" alt="256px">
                    </div>
                </div>
            </body>
            </html>`;
    }

    private getFontPreviewHtml(
        webview: vscode.Webview,
        uri: vscode.Uri
    ): string {
        const fontUri = webview.asWebviewUri(uri);
        const fileName = path.basename(uri.fsPath);

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Font Preview</title>
                <script src="https://cdn.jsdelivr.net/npm/opentype.js@latest/dist/opentype.min.js"></script>
                <style>
                    @font-face {
                        font-family: 'PreviewFont';
                        src: url('${fontUri}');
                    }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                        font-family: var(--vscode-font-family);
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    .header {
                        padding: 16px 20px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        background: var(--vscode-sideBar-background);
                    }
                    h1 {
                        font-size: 14px;
                        font-weight: 600;
                        margin-bottom: 12px;
                    }
                    .controls {
                        display: flex;
                        gap: 12px;
                        flex-wrap: wrap;
                        align-items: center;
                    }
                    .control-group {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    label {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                    }
                    input[type="text"], input[type="search"] {
                        padding: 4px 8px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 2px;
                        font-family: var(--vscode-font-family);
                        font-size: 12px;
                        min-width: 200px;
                    }
                    input[type="range"] {
                        width: 150px;
                    }
                    .size-value {
                        min-width: 35px;
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                    }
                    .tabs {
                        display: flex;
                        gap: 2px;
                        padding: 0 20px;
                        background: var(--vscode-sideBar-background);
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    .tab {
                        padding: 8px 16px;
                        background: transparent;
                        color: var(--vscode-tab-inactiveForeground);
                        border: none;
                        cursor: pointer;
                        font-size: 13px;
                        border-bottom: 2px solid transparent;
                        transition: all 0.2s;
                    }
                    .tab:hover {
                        color: var(--vscode-tab-activeForeground);
                    }
                    .tab.active {
                        color: var(--vscode-tab-activeForeground);
                        border-bottom-color: var(--vscode-tab-activeBorder, var(--vscode-focusBorder));
                    }
                    .content {
                        flex: 1;
                        overflow-y: auto;
                        padding: 20px;
                    }
                    .tab-content {
                        display: none;
                    }
                    .tab-content.active {
                        display: block;
                    }
                    .preview-text {
                        font-family: 'PreviewFont', sans-serif;
                        word-wrap: break-word;
                        margin-bottom: 16px;
                        padding: 12px;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 4px;
                        line-height: 1.5;
                    }
                    .glyphs-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 16px;
                    }
                    .glyph-count {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                    }
                    .glyphs-grid {
                        display: grid;
                        grid-template-columns: repeat(12, 1fr);
                        gap: 12px;
                    }
                    .glyph-item {
                        aspect-ratio: 1;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 6px;
                        font-family: 'PreviewFont', sans-serif;
                        font-size: 48px;
                        cursor: pointer;
                        transition: all 0.2s;
                        position: relative;
                        padding: 12px;
                    }
                    .glyph-item:hover {
                        background: var(--vscode-list-hoverBackground);
                        transform: scale(1.08);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    }
                    .glyph-item.selected {
                        background: var(--vscode-list-activeSelectionBackground);
                        outline: 2px solid var(--vscode-focusBorder);
                    }
                    .glyph-name {
                        font-size: 9px;
                        font-family: var(--vscode-editor-font-family);
                        color: var(--vscode-descriptionForeground);
                        text-align: center;
                        margin-top: 6px;
                        word-break: break-all;
                        line-height: 1.2;
                    }
                    .glyph-unicode {
                        position: absolute;
                        top: 4px;
                        right: 6px;
                        font-size: 9px;
                        font-family: var(--vscode-editor-font-family);
                        color: var(--vscode-descriptionForeground);
                        opacity: 0.7;
                        background: var(--vscode-editor-background);
                        padding: 2px 4px;
                        border-radius: 2px;
                    }
                    .copy-btn {
                        position: absolute;
                        top: 4px;
                        left: 6px;
                        font-size: 8px;
                        padding: 2px 6px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 2px;
                        cursor: pointer;
                        opacity: 0;
                        transition: opacity 0.2s;
                        font-family: var(--vscode-editor-font-family);
                    }
                    .glyph-item:hover .copy-btn {
                        opacity: 1;
                    }
                    .copy-btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .glyph-details {
                        margin-top: 16px;
                        padding: 16px;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 4px;
                        display: none;
                    }
                    .glyph-details.show {
                        display: block;
                    }
                    .glyph-details h3 {
                        font-size: 14px;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .glyph-details .preview-char {
                        font-family: 'PreviewFont', sans-serif;
                        font-size: 48px;
                        margin-right: 16px;
                    }
                    .details-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 8px;
                        font-size: 12px;
                        font-family: var(--vscode-editor-font-family);
                    }
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 4px 0;
                    }
                    .detail-label {
                        color: var(--vscode-descriptionForeground);
                    }
                    .detail-value {
                        font-weight: 600;
                        font-family: monospace;
                    }
                    .license-info {
                        line-height: 1.6;
                        white-space: pre-wrap;
                        font-family: var(--vscode-editor-font-family);
                        font-size: 12px;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        padding: 16px;
                        border-radius: 4px;
                    }
                    .loading {
                        text-align: center;
                        padding: 40px;
                        color: var(--vscode-descriptionForeground);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Font Preview: ${fileName}</h1>
                    <div class="controls">
                        <div class="control-group">
                            <label>Custom Text:</label>
                            <input type="text" id="customText" value="The quick brown fox jumps over the lazy dog" />
                        </div>
                        <div class="control-group">
                            <label>Size:</label>
                            <input type="range" id="fontSize" min="12" max="128" value="48" />
                            <span class="size-value" id="fontSizeValue">48px</span>
                        </div>
                    </div>
                </div>

                <div class="tabs">
                    <button class="tab active" data-tab="preview">Preview</button>
                    <button class="tab" data-tab="glyphs">Glyphs</button>
                    <button class="tab" data-tab="info">Info</button>
                </div>

                <div class="content">
                    <div class="tab-content active" id="preview-tab">
                        <div class="preview-text" id="previewText" style="font-size: 48px;">
                            The quick brown fox jumps over the lazy dog
                        </div>
                        <div class="preview-text" style="font-size: 32px;">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
                        <div class="preview-text" style="font-size: 28px;">abcdefghijklmnopqrstuvwxyz</div>
                        <div class="preview-text" style="font-size: 24px;">0123456789</div>
                        <div class="preview-text" style="font-size: 20px;">!@#$%^&*()_+-=[]{}|;:',.<>?/</div>
                    </div>

                    <div class="tab-content" id="glyphs-tab">
                        <div class="glyphs-header">
                            <div class="glyph-count" id="glyphCount">Loading glyphs...</div>
                            <input type="search" id="glyphSearch" placeholder="Search by name or unicode..." />
                        </div>
                        <div class="glyphs-grid" id="glyphsGrid">
                            <div class="loading">Loading font data...</div>
                        </div>
                        <div class="glyph-details" id="glyphDetails"></div>
                    </div>

                    <div class="tab-content" id="info-tab">
                        <div class="license-info" id="fontInfo">
                            <div class="loading">Loading font information...</div>
                        </div>
                    </div>
                </div>

                <script>
                    let fontData = null;
                    let allGlyphs = [];
                    let selectedGlyph = null;

                    // Load font using opentype.js
                    opentype.load('${fontUri}', function(err, font) {
                        if (err) {
                            console.error('Could not load font:', err);
                            document.getElementById('glyphsGrid').innerHTML = '<div class="loading">Error loading font</div>';
                            return;
                        }

                        fontData = font;
                        displayFontInfo(font);
                    });

                    function displayFontInfo(font) {
                        const info = document.getElementById('fontInfo');
                        const names = font.names;
                        
                        let infoHtml = '<strong>Font Information:</strong><br><br>';
                        infoHtml += \`<strong>Family:</strong> \${names.fontFamily?.en || 'Unknown'}<br>\`;
                        infoHtml += \`<strong>Subfamily:</strong> \${names.fontSubfamily?.en || 'Unknown'}<br>\`;
                        infoHtml += \`<strong>Full Name:</strong> \${names.fullName?.en || 'Unknown'}<br>\`;
                        infoHtml += \`<strong>Version:</strong> \${names.version?.en || 'Unknown'}<br>\`;
                        infoHtml += \`<strong>PostScript Name:</strong> \${names.postScriptName?.en || 'Unknown'}<br>\`;
                        infoHtml += \`<strong>Designer:</strong> \${names.designer?.en || 'Unknown'}<br>\`;
                        infoHtml += \`<strong>Manufacturer:</strong> \${names.manufacturer?.en || 'Unknown'}<br>\`;
                        infoHtml += \`<strong>License:</strong> \${names.license?.en || 'Not available'}<br>\`;
                        infoHtml += \`<strong>Copyright:</strong> \${names.copyright?.en || 'Not available'}<br><br>\`;
                        infoHtml += \`<strong>Units Per EM:</strong> \${font.unitsPerEm}<br>\`;
                        infoHtml += \`<strong>Ascender:</strong> \${font.ascender}<br>\`;
                        infoHtml += \`<strong>Descender:</strong> \${font.descender}<br>\`;
                        infoHtml += \`<strong>Number of Glyphs:</strong> \${font.numGlyphs}<br>\`;

                        info.innerHTML = infoHtml;
                    }

                    // Tab switching
                    document.querySelectorAll('.tab').forEach(tab => {
                        tab.addEventListener('click', () => {
                            const tabName = tab.dataset.tab;
                            
                            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                            
                            tab.classList.add('active');
                            document.getElementById(tabName + '-tab').classList.add('active');
                            
                            if (tabName === 'glyphs' && fontData && allGlyphs.length === 0) {
                                generateGlyphs();
                            }
                        });
                    });

                    // Custom text input
                    document.getElementById('customText').addEventListener('input', (e) => {
                        document.getElementById('previewText').textContent = e.target.value || 'Type something...';
                    });

                    // Font size slider
                    document.getElementById('fontSize').addEventListener('input', (e) => {
                        const size = e.target.value;
                        document.getElementById('fontSizeValue').textContent = size + 'px';
                        document.getElementById('previewText').style.fontSize = size + 'px';
                    });

                    // Search glyphs
                    document.getElementById('glyphSearch').addEventListener('input', (e) => {
                        const query = e.target.value.toLowerCase();
                        filterGlyphs(query);
                    });

                    function filterGlyphs(query) {
                        const items = document.querySelectorAll('.glyph-item');
                        items.forEach(item => {
                            const name = item.dataset.name.toLowerCase();
                            const unicode = item.dataset.unicode.toLowerCase();
                            if (name.includes(query) || unicode.includes(query)) {
                                item.style.display = '';
                            } else {
                                item.style.display = 'none';
                            }
                        });
                    }

                    function generateGlyphs() {
                        if (!fontData) return;

                        const grid = document.getElementById('glyphsGrid');
                        grid.innerHTML = '';
                        allGlyphs = [];

                        for (let i = 0; i < fontData.numGlyphs; i++) {
                            const glyph = fontData.glyphs.get(i);
                            if (glyph) {
                                allGlyphs.push(glyph);
                                addGlyph(grid, glyph, i);
                            }
                        }

                        document.getElementById('glyphCount').textContent = \`\${allGlyphs.length} glyphs\`;
                    }

                    function addGlyph(grid, glyph, index) {
                        const item = document.createElement('div');
                        item.className = 'glyph-item';
                        item.dataset.index = index;
                        item.dataset.name = glyph.name || '';
                        item.dataset.unicode = glyph.unicode ? glyph.unicode.toString(16).toUpperCase() : '';

                        // Add copy button
                        const copyBtn = document.createElement('button');
                        copyBtn.className = 'copy-btn';
                        copyBtn.textContent = '📋';
                        copyBtn.title = 'Copy Unicode';
                        copyBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const unicode = glyph.unicode ? 'U+' + glyph.unicode.toString(16).toUpperCase() : '';
                            navigator.clipboard.writeText(unicode);
                            copyBtn.textContent = '✓';
                            setTimeout(() => copyBtn.textContent = '📋', 1000);
                        });
                        item.appendChild(copyBtn);

                        // Render glyph character
                        if (glyph.unicode) {
                            const char = document.createElement('span');
                            char.textContent = String.fromCodePoint(glyph.unicode);
                            char.style.fontSize = '48px';
                            item.appendChild(char);
                        }

                        // Add name
                        const name = document.createElement('div');
                        name.className = 'glyph-name';
                        name.textContent = glyph.name || 'glyph' + index;
                        item.appendChild(name);

                        // Add unicode
                        if (glyph.unicode) {
                            const unicode = document.createElement('span');
                            unicode.className = 'glyph-unicode';
                            unicode.textContent = glyph.unicode.toString(16).toUpperCase();
                            item.appendChild(unicode);
                        }

                        item.title = 'Click to view details\\n' + (glyph.name || 'unnamed') + ' (U+' + (glyph.unicode ? glyph.unicode.toString(16).toUpperCase().padStart(4, '0') : 'N/A') + ')';
                        
                        item.addEventListener('click', () => showGlyphDetails(glyph, index, item));
                        
                        grid.appendChild(item);
                    }

                    function showGlyphDetails(glyph, index, element) {
                        // Update selection
                        document.querySelectorAll('.glyph-item').forEach(item => item.classList.remove('selected'));
                        element.classList.add('selected');

                        const details = document.getElementById('glyphDetails');
                        const bbox = glyph.getBoundingBox();

                        let detailsHtml = '<h3>';
                        if (glyph.unicode) {
                            detailsHtml += '<span class="preview-char">' + String.fromCodePoint(glyph.unicode) + '</span>';
                        }
                        detailsHtml += 'Glyph Details: ' + (glyph.name || 'unnamed') + '</h3>';
                        
                        // Copy actions
                        if (glyph.unicode) {
                            const unicodeStr = glyph.unicode.toString(16).toUpperCase();
                            const htmlEntity = '&#x' + unicodeStr + ';';
                            const cssContent = '\\\\' + unicodeStr;
                            
                            detailsHtml += '<div style="margin-bottom: 12px; display: flex; gap: 8px;">';
                            detailsHtml += '<button onclick="copyToClipboard(\\'U+' + unicodeStr + '\\')" style="padding: 4px 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 2px; cursor: pointer; font-size: 11px;">Copy Unicode</button>';
                            detailsHtml += '<button onclick="copyToClipboard(\\'' + htmlEntity + '\\')" style="padding: 4px 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 2px; cursor: pointer; font-size: 11px;">Copy HTML</button>';
                            detailsHtml += '<button onclick="copyToClipboard(\\'' + cssContent + '\\')" style="padding: 4px 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 2px; cursor: pointer; font-size: 11px;">Copy CSS</button>';
                            detailsHtml += '</div>';
                        }
                        
                        detailsHtml += '<div class="details-grid">';
                        detailsHtml += '<div class="detail-row"><span class="detail-label">name</span><span class="detail-value">' + (glyph.name || 'unnamed') + '</span></div>';
                        detailsHtml += '<div class="detail-row"><span class="detail-label">unicode</span><span class="detail-value">' + (glyph.unicode ? glyph.unicode.toString(16).toUpperCase() : 'N/A') + '</span></div>';
                        detailsHtml += '<div class="detail-row"><span class="detail-label">index</span><span class="detail-value">' + index + '</span></div>';
                        detailsHtml += '<div class="detail-row"><span class="detail-label">ascender</span><span class="detail-value">' + fontData.ascender.toFixed(2) + '</span></div>';
                        detailsHtml += '<div class="detail-row"><span class="detail-label">sTypoAscender</span><span class="detail-value">' + (fontData.tables.os2?.sTypoAscender?.toFixed(2) || 'N/A') + '</span></div>';
                        detailsHtml += '<div class="detail-row"><span class="detail-label">xMax</span><span class="detail-value">' + bbox.x2.toFixed(2) + '</span></div>';
                        detailsHtml += '<div class="detail-row"><span class="detail-label">yMin</span><span class="detail-value">' + bbox.y1.toFixed(2) + '</span></div>';
                        detailsHtml += '<div class="detail-row"><span class="detail-label">yMax</span><span class="detail-value">' + bbox.y2.toFixed(2) + '</span></div>';
                        detailsHtml += '<div class="detail-row"><span class="detail-label">advanceWidth</span><span class="detail-value">' + glyph.advanceWidth.toFixed(2) + '</span></div>';
                        detailsHtml += '<div class="detail-row"><span class="detail-label">leftSideBearing</span><span class="detail-value">' + bbox.x1.toFixed(2) + '</span></div>';
                        detailsHtml += '<div class="detail-row"><span class="detail-label">contourPoints</span><span class="detail-value">' + (glyph.path?.commands?.length || 0) + '</span></div>';
                        detailsHtml += '<div class="detail-row"><span class="detail-label">unitsPerEm</span><span class="detail-value">' + fontData.unitsPerEm.toFixed(2) + '</span></div>';
                        detailsHtml += '</div>';

                        details.innerHTML = detailsHtml;
                        details.classList.add('show');
                    }

                    function copyToClipboard(text) {
                        navigator.clipboard.writeText(text).then(() => {
                            // Optional: Show a toast notification
                            console.log('Copied:', text);
                        });
                    }
                </script>
            </body>
            </html>`;
    }
}
