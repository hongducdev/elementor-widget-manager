# Elementor Widget Manager

This VS Code extension helps you manage Elementor widgets in your `northway` theme (or any theme with a similar structure).

## Features

-   **List Widgets**: Automatically discovers widgets in `elements/widgets` and lists them in the "Elementor Widgets" view in the Activity Bar.
-   **Open Widget**: Click on a widget in the list to open its PHP file.
-   **Create Widget**: Right-click in the view or run the command `Elementor Widget Manager: Create New Widget` to generate a new widget from a template.
-   **View Layouts**: If a widget has layout images in `elements/widgets/img-layout/{widget_name}`, they will be listed under the widget. Click to preview.

## How to Use

1.  Open your project folder (e.g., `d:\MyProjects\pixelart_project`) in VS Code.
2.  The "Elementor Widgets" icon will appear in the Activity Bar.
3.  Click it to see the list of widgets.
4.  To create a new widget, click the "+" icon in the view title or run the command from the Command Palette.
5.  Expand a widget to see its available layouts (if any).

## Requirements

-   The extension looks for widgets in `elements/widgets` or `northway/elements/widgets`.
