import * as vscode from "vscode";
import { WidgetProvider } from "./widgetProvider";
import { createWidget } from "./commands";
import { DashboardPanel } from "./dashboardPanel";
import { IconHoverProvider } from "./hoverProvider";
import { ClassDefinitionProvider, addControlCommand } from "./codeHelpers";
import { FilePreviewProvider } from "./filePreviewProvider";
import { EiconHoverProvider, EiconBrowserPanel } from "./eiconProvider";

export function activate(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    const widgetProvider = new WidgetProvider(workspaceRoot);
    vscode.window.registerTreeDataProvider("elementorWidgets", widgetProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.refresh",
            () => widgetProvider.refresh()
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.openWidget",
            (resource) => {
                vscode.window.showTextDocument(resource);
            }
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.createWidget",
            () => createWidget(workspaceRoot)
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.openDashboard",
            () =>
                DashboardPanel.createOrShow(context.extensionUri, workspaceRoot)
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.addControl",
            addControlCommand
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "elementor-widget-manager.openEiconBrowser",
            () => EiconBrowserPanel.createOrShow()
        )
    );

    // Register hover provider for Elementor icons in PHP
    context.subscriptions.push(
        vscode.languages.registerHoverProvider("php", new IconHoverProvider())
    );

    // Register hover provider for Eicon references
    context.subscriptions.push(
        vscode.languages.registerHoverProvider("php", new EiconHoverProvider())
    );

    // Register definition provider for CSS class navigation
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            "php",
            new ClassDefinitionProvider()
        )
    );

    // Register custom editor for font and SVG preview
    context.subscriptions.push(FilePreviewProvider.register(context));
}

export function deactivate() {}
