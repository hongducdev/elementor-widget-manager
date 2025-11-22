import * as vscode from "vscode";
import { WidgetProvider } from "./widgetProvider";
import { createWidget } from "./commands";
import { DashboardPanel } from "./dashboardPanel";
import { FilePreviewProvider } from "./filePreviewProvider";
import { addControlCommand, ClassDefinitionProvider } from "./codeHelpers";

export function activate(context: vscode.ExtensionContext) {
    console.log(
        'Congratulations, your extension "elementor-widget-manager" is now active!'
    );

    const workspaceRoot =
        vscode.workspace.workspaceFolders &&
        vscode.workspace.workspaceFolders.length > 0
            ? vscode.workspace.workspaceFolders[0].uri.fsPath
            : undefined;

    const widgetProvider = new WidgetProvider(workspaceRoot);
    vscode.window.registerTreeDataProvider("elementorWidgets", widgetProvider);

    context.subscriptions.push(
        FilePreviewProvider.register(context),
        vscode.commands.registerCommand(
            "elementor-widget-manager.refresh",
            () => widgetProvider.refresh()
        ),
        vscode.commands.registerCommand(
            "elementor-widget-manager.openWidget",
            (resource) => vscode.window.showTextDocument(resource)
        ),
        vscode.commands.registerCommand(
            "elementor-widget-manager.createWidget",
            () => createWidget(workspaceRoot)
        ),
        vscode.commands.registerCommand(
            "elementor-widget-manager.openDashboard",
            () => {
                if (workspaceRoot) {
                    DashboardPanel.createOrShow(
                        context.extensionUri,
                        workspaceRoot
                    );
                } else {
                    vscode.window.showErrorMessage("No workspace open");
                }
            }
        ),
        vscode.commands.registerCommand(
            "elementor-widget-manager.addControl",
            addControlCommand
        ),
        vscode.languages.registerDefinitionProvider(
            "php",
            new ClassDefinitionProvider()
        )
    );
}
