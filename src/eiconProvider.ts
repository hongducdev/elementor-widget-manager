import * as vscode from "vscode";

// Danh sách Elementor icons (extracted from elementor-icons.css)
export const ELEMENTOR_ICONS = [
    "eicon-editor-link",
    "eicon-editor-unlink",
    "eicon-editor-external-link",
    "eicon-editor-close",
    "eicon-editor-list-ol",
    "eicon-editor-list-ul",
    "eicon-editor-bold",
    "eicon-editor-italic",
    "eicon-editor-underline",
    "eicon-editor-paragraph",
    "eicon-editor-h1",
    "eicon-editor-h2",
    "eicon-editor-h3",
    "eicon-editor-h4",
    "eicon-editor-h5",
    "eicon-editor-h6",
    "eicon-editor-quote",
    "eicon-editor-code",
    "eicon-elementor",
    "eicon-elementor-circle",
    "eicon-pojome",
    "eicon-plus",
    "eicon-menu-bar",
    "eicon-apps",
    "eicon-accordion",
    "eicon-alert",
    "eicon-animation-text",
    "eicon-animation",
    "eicon-banner",
    "eicon-blockquote",
    "eicon-button",
    "eicon-call-to-action",
    "eicon-captcha",
    "eicon-carousel",
    "eicon-checkbox",
    "eicon-columns",
    "eicon-countdown",
    "eicon-counter",
    "eicon-date",
    "eicon-divider-shape",
    "eicon-divider",
    "eicon-download-button",
    "eicon-dual-button",
    "eicon-email-field",
    "eicon-facebook-comments",
    "eicon-facebook-like-box",
    "eicon-form-horizontal",
    "eicon-form-vertical",
    "eicon-gallery-grid",
    "eicon-gallery-group",
    "eicon-gallery-justified",
    "eicon-gallery-masonry",
    "eicon-icon-box",
    "eicon-image-before-after",
    "eicon-image-box",
    "eicon-image-hotspot",
    "eicon-image-rollover",
    "eicon-info-box",
    "eicon-inner-section",
    "eicon-mailchimp",
    "eicon-menu-card",
    "eicon-navigation-horizontal",
    "eicon-nav-menu",
    "eicon-navigation-vertical",
    "eicon-number-field",
    "eicon-parallax",
    "eicon-php7",
    "eicon-post-list",
    "eicon-post-slider",
    "eicon-post",
    "eicon-posts-carousel",
    "eicon-price-list",
    "eicon-price-table",
    "eicon-radio",
    "eicon-rtl",
    "eicon-scroll",
    "eicon-search",
    "eicon-select",
    "eicon-share",
    "eicon-sidebar",
    "eicon-skill-bar",
    "eicon-slider-3d",
    "eicon-slider-album",
    "eicon-slider-device",
    "eicon-slider-full-screen",
    "eicon-slider-push",
    "eicon-slider-vertical",
    "eicon-slider-video",
    "eicon-slideshow",
    "eicon-social-icons",
    "eicon-spacer",
    "eicon-tabs",
    "eicon-tel-field",
    "eicon-text-area",
    "eicon-text-field",
    "eicon-thumbnails-down",
    "eicon-thumbnails-half",
    "eicon-thumbnails-right",
    "eicon-time-line",
    "eicon-toggle",
    "eicon-url",
    "eicon-t-letter",
    "eicon-wordpress",
    "eicon-widget",
    "eicon-wordpress-light",
    "eicon-anchor",
    "eicon-barcode",
    "eicon-code-highlight",
    "eicon-facebook-like",
    "eicon-lottie",
    "eicon-map-pin",
    "eicon-paypal",
    "eicon-pinterest",
    "eicon-posts-grid",
    "eicon-post-title",
    "eicon-archive-title",
    "eicon-site-logo",
    "eicon-site-search",
    "eicon-site-tagline",
    "eicon-site-title",
    "eicon-soundcloud",
    "eicon-google-maps",
    "eicon-post-content",
    "eicon-post-excerpt",
    "eicon-post-navigation",
    "eicon-woo-cart",
    "eicon-woo-categories",
    "eicon-woo-pages",
    "eicon-woo-products",
    "eicon-woo-settings",
    "eicon-heading",
    "eicon-hotspot",
    "eicon-testimonial",
    "eicon-testimonial-carousel",
    "eicon-media-carousel",
    "eicon-section",
    "eicon-rating",
    "eicon-Review",
    "eicon-table-of-contents",
    "eicon-video-playlist",
    "eicon-flip-box",
    "eicon-settings",
    "eicon-headphones",
    "eicon-testimonials-grid",
    "eicon-breadcrumbs",
    "eicon-favorite",
    "eicon-tags",
    "eicon-bullet-list",
    "eicon-wrap",
    "eicon-nowrap",
    "eicon-stripe",
    "eicon-nerd-chuckle",
    "eicon-nerd",
    "eicon-nerd-wink",
    "eicon-sign-out",
    "eicon-spinner",
];

export class EiconHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const wordRange = document.getWordRangeAtPosition(
            position,
            /'eicon-[\w-]+'/
        );
        if (!wordRange) {
            return;
        }

        const word = document.getText(wordRange);
        const iconName = word.replace(/'/g, "");

        if (!ELEMENTOR_ICONS.includes(iconName)) {
            return;
        }

        const markdown = new vscode.MarkdownString();
        markdown.supportHtml = true;
        markdown.isTrusted = true;

        // Add icon preview using Elementor CDN
        markdown.appendMarkdown(`### Elementor Icon Preview\n\n`);
        markdown.appendMarkdown(`**${iconName}**\n\n`);
        markdown.appendMarkdown(
            `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@elementor/elementor-icons@5.45.0/css/elementor-icons.min.css">` +
                `<div style="font-size: 48px; text-align: center; padding: 20px;">` +
                `<i class="${iconName}"></i>` +
                `</div>`
        );

        return new vscode.Hover(markdown, wordRange);
    }
}

export class EiconBrowserPanel {
    public static currentPanel: EiconBrowserPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getHtmlContent();

        // Handle messages from webview
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case "copy":
                        vscode.env.clipboard.writeText(message.text);
                        vscode.window.showInformationMessage(
                            `Copied: ${message.text}`
                        );
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow() {
        if (EiconBrowserPanel.currentPanel) {
            EiconBrowserPanel.currentPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            "eiconBrowser",
            "Elementor Icons Browser",
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        EiconBrowserPanel.currentPanel = new EiconBrowserPanel(panel);
    }

    private _getHtmlContent(): string {
        const icons = ELEMENTOR_ICONS;

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Elementor Icons Browser</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@elementor/elementor-icons@5.45.0/css/elementor-icons.min.css">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-editor-foreground);
                    background: var(--vscode-editor-background);
                    padding: 20px;
                }
                .header {
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                h1 {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                .search-box {
                    width: 100%;
                    padding: 8px 12px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    font-size: 14px;
                }
                .icon-count {
                    margin-top: 10px;
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }
                .icons-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 12px;
                }
                .icon-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 16px;
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .icon-item:hover {
                    background: var(--vscode-list-hoverBackground);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .icon-item i {
                    font-size: 36px;
                    margin-bottom: 8px;
                }
                .icon-name {
                    font-size: 10px;
                    text-align: center;
                    word-break: break-all;
                    color: var(--vscode-descriptionForeground);
                }
                .icon-item.copied {
                    background: var(--vscode-list-activeSelectionBackground);
                }
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--vscode-descriptionForeground);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Elementor Icons (${icons.length} icons)</h1>
                <input type="search" class="search-box" id="searchBox" placeholder="Search icons... (e.g. 'accordion', 'button', 'social')">
                <div class="icon-count" id="iconCount">${
                    icons.length
                } icons</div>
            </div>

            <div class="icons-grid" id="iconsGrid">
                ${icons
                    .map(
                        (icon) => `
                    <div class="icon-item" data-icon="${icon}" title="Click to copy: ${icon}">
                        <i class="${icon}"></i>
                        <span class="icon-name">${icon.replace(
                            "eicon-",
                            ""
                        )}</span>
                    </div>
                `
                    )
                    .join("")}
            </div>

            <div class="empty-state" id="emptyState" style="display: none;">
                No icons found
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                const searchBox = document.getElementById('searchBox');
                const iconsGrid = document.getElementById('iconsGrid');
                const iconCount = document.getElementById('iconCount');
                const emptyState = document.getElementById('emptyState');
                const allIcons = Array.from(document.querySelectorAll('.icon-item'));

                // Search functionality
                searchBox.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase();
                    let visibleCount = 0;

                    allIcons.forEach(item => {
                        const iconName = item.dataset.icon;
                        if (iconName.includes(query)) {
                            item.style.display = '';
                            visibleCount++;
                        } else {
                            item.style.display = 'none';
                        }
                    });

                    iconCount.textContent = visibleCount + ' icons';
                    emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
                    iconsGrid.style.display = visibleCount === 0 ? 'none' : 'grid';
                });

                // Click to copy
                iconsGrid.addEventListener('click', (e) => {
                    const iconItem = e.target.closest('.icon-item');
                    if (!iconItem) return;

                    const iconName = iconItem.dataset.icon;
                    vscode.postMessage({
                        command: 'copy',
                        text: iconName
                    });

                    // Visual feedback
                    iconItem.classList.add('copied');
                    setTimeout(() => iconItem.classList.remove('copied'), 500);
                });
            </script>
        </body>
        </html>`;
    }

    public dispose() {
        EiconBrowserPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
