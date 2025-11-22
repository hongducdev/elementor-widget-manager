import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function createWidget(workspaceRoot: string | undefined) {
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    const widgetName = await vscode.window.showInputBox({
        prompt: 'Enter Widget Name (e.g. My Custom Widget)',
        placeHolder: 'My Custom Widget'
    });

    if (!widgetName) {
        return;
    }

    // Generate class name and file name
    // Example: "My Custom Widget" -> "Pxl_My_Custom_Widget" (Class) -> "pxl_my_custom_widget.php" (File)
    
    const slug = widgetName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const fileName = `pxl_${slug}.php`;
    const className = `Pxl_${widgetName.replace(/[^a-zA-Z0-9]+/g, '_')}`; // Simple sanitization
    
    // Try to find the widgets directory
    // We assume it's in elements/widgets or northway/elements/widgets
    let widgetsDir = path.join(workspaceRoot, 'elements', 'widgets');
    if (!fs.existsSync(widgetsDir)) {
        widgetsDir = path.join(workspaceRoot, 'northway', 'elements', 'widgets');
        if (!fs.existsSync(widgetsDir)) {
             // Fallback: ask user or try to find it?
             // For now, let's just try to create it in the root if not found, or error out.
             // Or search for it.
             const found = await vscode.workspace.findFiles('**/elements/widgets');
             if (found.length > 0) {
                 widgetsDir = found[0].fsPath;
             } else {
                 vscode.window.showErrorMessage('Could not find "elements/widgets" directory.');
                 return;
             }
        }
    }

    const filePath = path.join(widgetsDir, fileName);

    if (fs.existsSync(filePath)) {
        vscode.window.showErrorMessage(`Widget file ${fileName} already exists.`);
        return;
    }

    const content = getWidgetTemplate(widgetName, slug);

    try {
        await fs.promises.writeFile(filePath, content, 'utf-8');
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`Widget ${widgetName} created successfully!`);
        
        // Trigger refresh if possible (we might need to pass the provider or use a command)
        vscode.commands.executeCommand('elementor-widget-manager.refresh');
        
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to create widget: ${error.message}`);
    }
}

function getWidgetTemplate(name: string, slug: string): string {
    return `<?php
pxl_add_custom_widget(
    array(
        'name' => 'pxl_${slug}',
        'title' => esc_html__('${name}', 'northway'),
        'icon' => 'eicon-code',
        'categories' => array('pxltheme-core'),
        'scripts'    => array(),
        'params' => array(
            'sections' => array(
                array(
                    'name' => 'section_content',
                    'label' => esc_html__('Content', 'northway'),
                    'tab' => \\Elementor\\Controls_Manager::TAB_CONTENT,
                    'controls' => array(
                        array(
                            'name' => 'title',
                            'label' => esc_html__('Title', 'northway'),
                            'type' => \\Elementor\\Controls_Manager::TEXT,
                            'default' => esc_html__('Hello World', 'northway'),
                        ),
                    ),
                ),
            ),
        ),
    ),
    northway_get_class_widget_path()
);
`;
}
