"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// VSCode Extension for Fusion 360 MCP Integration
const vscode = __importStar(require("vscode"));
const socket_io_client_1 = require("socket.io-client");
const ImageUploadPanel_1 = require("./ImageUploadPanel");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
let mcpServerProcess = null;
function activate(context) {
    console.log('Fusion 360 MCP Extension is now active!');
    // Start the MCP server
    const serverPath = path.join(context.extensionPath, '..', 'mcp-server', 'out', 'index.js');
    mcpServerProcess = (0, child_process_1.spawn)('node', [serverPath]);
    mcpServerProcess.stdout?.on('data', (data) => {
        console.log(`MCP Server: ${data}`);
    });
    mcpServerProcess.stderr?.on('data', (data) => {
        console.error(`MCP Server Error: ${data}`);
    });
    // Create output channel for Fusion 360 feedback
    const outputChannel = vscode.window.createOutputChannel('Fusion 360 MCP');
    context.subscriptions.push(outputChannel);
    // Get configuration settings
    const config = vscode.workspace.getConfiguration('fusion360');
    const serverPort = config.get('serverPort', 3001);
    // Connect to MCP server via Socket.IO
    const socket = (0, socket_io_client_1.io)(`ws://localhost:${serverPort}`, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });
    // Socket connection handling
    socket.on('connect', () => {
        outputChannel.appendLine('🔗 Connected to MCP server');
    });
    socket.on('disconnect', () => {
        outputChannel.appendLine('🔌 Disconnected from MCP server');
    });
    socket.on('fusion360-response', (data) => {
        outputChannel.appendLine(`📥 Fusion 360 Response: ${data}`);
    });
    socket.on('active-document-info', (docInfo) => {
        console.log('📄 Active document info received:', docInfo);
        outputChannel.appendLine(`📄 Current Fusion 360 Document: ${JSON.stringify(docInfo, null, 2)}`);
        // Show in a webview for better formatting
        const panel = vscode.window.createWebviewPanel('fusion360-doc-info', 'Fusion 360 Document Info', vscode.ViewColumn.Two, {});
        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fusion 360 Document</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    .status { font-weight: bold; }
                    .error { color: var(--vscode-notificationsErrorIcon-foreground); }
                    .success { color: var(--vscode-charts-green); }
                </style>
            </head>
            <body>
                <h2>Current Fusion 360 Document</h2>
                <pre id="doc-info">${JSON.stringify(docInfo, null, 2)}</pre>
            </body>
            </html>
        `;
    });
    socket.on('active-document-error', (errorData) => {
        outputChannel.appendLine(`❌ Active Document Error: ${JSON.stringify(errorData)}`);
        vscode.window.showErrorMessage(`Failed to get active document: ${errorData.error}`);
    });
    socket.on('ruler-info', (rulerData) => {
        console.log('📏 Ruler/measurement info received:', rulerData);
        outputChannel.appendLine(`📏 Fusion 360 Ruler/Measurement Info: ${JSON.stringify(rulerData, null, 2)}`);
        // Create a formatted display for ruler information
        const panel = vscode.window.createWebviewPanel('fusion360-ruler-info', 'Fusion 360 Measurement Tools', vscode.ViewColumn.Two, {});
        const measurementTypes = rulerData.measurement_tools || {};
        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fusion 360 Ruler & Measurement</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        line-height: 1.5;
                    }
                    .header {
                        background: var(--vscode-banner-background);
                        padding: 15px;
                        margin: -20px -20px 20px -20px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    .tool { margin: 15px 0; padding: 10px; border-left: 4px solid var(--vscode-focusBorder); }
                    .tool-name { font-weight: bold; color: var(--vscode-textLink-foreground); }
                    .geometry-info { background: var(--vscode-editor-inactiveSelectionBackground); padding: 10px; margin: 10px 0; }
                    .status-available { color: var(--vscode-charts-green); font-weight: bold; }
                    .instructions { background: var(--vscode-textBlockQuote-background); border: 1px solid var(--vscode-textBlockQuote-border); padding: 10px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>📏 Fusion 360 Ruler & Measurement Tools</h2>
                    <p><strong>Ruler Status:</strong> <span class="status-available">${rulerData.ruler_available}</span></p>
                    <p><strong>Fusion 360 Version:</strong> ${rulerData.fusion360_version}</p>
                </div>

                <h3>🔍 Available Measurement Tools:</h3>

                <div class="tool">
                    <div class="tool-name">📐 Distance Measurement</div>
                    <p><strong>Uses:</strong> ${measurementTypes.distance?.usage || 'Measure straight-line distances'}</p>
                    <p><strong>Description:</strong> ${measurementTypes.distance?.description || 'Measure between points and entities'}</p>
                </div>

                <div class="tool">
                    <div class="tool-name">📏 Angle Measurement</div>
                    <p><strong>Uses:</strong> ${measurementTypes.angle?.usage || 'Measure angles between lines'}</p>
                    <p><strong>Description:</strong> ${measurementTypes.angle?.description || 'Measure angle between two linear entities'}</p>
                </div>

                <div class="tool">
                    <div class="tool-name">🔄 Loop Length Measurement</div>
                    <p><strong>Uses:</strong> ${measurementTypes.loop_length?.usage || 'Measure perimeter of closed curves'}</p>
                    <p><strong>Description:</strong> ${measurementTypes.loop_length?.description || 'Measure total length around closed loops'}</p>
                </div>

                <div class="tool">
                    <div class="tool-name">📏 Surface Area Measurement</div>
                    <p><strong>Uses:</strong> ${measurementTypes.surface_area?.usage || 'Measure surface area of faces'}</p>
                    <p><strong>Description:</strong> ${measurementTypes.surface_area?.description || 'Calculate surface areas of faces and bodies'}</p>
                </div>

                <div class="tool">
                    <div class="tool-name">📦 Volume Measurement</div>
                    <p><strong>Uses:</strong> ${measurementTypes.volume?.usage || 'Measure volume of solid bodies'}</p>
                    <p><strong>Description:</strong> ${measurementTypes.volume?.description || 'Calculate volume of solid geometry'}</p>
                </div>

                ${rulerData.geometry_info && Object.keys(rulerData.geometry_info).length > 0 ?
            `
                    <h3>🏗️ Current Design Geometry:</h3>
                    <div class="geometry-info">
                        <p><strong>Bodies:</strong> ${rulerData.geometry_info.bodies || 0}</p>
                        <p><strong>Faces:</strong> ${rulerData.geometry_info.faces || 0}</p>
                        <p><strong>Edges:</strong> ${rulerData.geometry_info.edges || 0}</p>
                        ${rulerData.sample_measurement && typeof rulerData.sample_measurement === 'object' ?
                `
                            <p><strong>Sample Measurement:</strong> ${rulerData.sample_measurement.value ? rulerData.sample_measurement.value + ' ' + rulerData.sample_measurement.unit : 'None'}</p>
                            <p><strong>Measurement Type:</strong> ${rulerData.sample_measurement.type || 'Unknown'}</p>
                            ` :
                `<p><strong>Sample Measurement:</strong> ${rulerData.sample_measurement || 'No sample available'}</p>`}
                    </div>
                    ` : ''}

                <div class="instructions">
                    <h4>🚀 How to Use Ruler in Fusion 360:</h4>
                    <p>${rulerData.toolbar_instructions}</p>
                    <ol>
                        <li>Select measurement tool from Inspector → Measure</li>
                        <li>Click on geometry to measure</li>
                        <li>View measurements in Measurement panel</li>
                        <li>Use dimensions for parametric models</li>
                    </ol>
                </div>
            </body>
            </html>
        `;
    });
    socket.on('ruler-error', (errorData) => {
        outputChannel.appendLine(`❌ Ruler Error: ${JSON.stringify(errorData)}`);
        vscode.window.showErrorMessage(`Failed to get ruler info: ${errorData.error}`);
    });
    socket.on('error', (error) => {
        outputChannel.appendLine(`❌ Server Error: ${error}`);
    });
    // Register commands
    const executeCommand = vscode.commands.registerCommand('fusion360.executeCommand', async () => {
        const command = await vscode.window.showInputBox({
            prompt: 'Enter Fusion 360 Python command to execute',
            placeHolder: 'e.g., app.activeDocument.activeProduct.createComponent("Test");'
        });
        if (command) {
            socket.emit('execute-fusion360-command', { command });
            outputChannel.appendLine(`📤 Executing: ${command}`);
            vscode.window.showInformationMessage('Command sent to Fusion 360');
        }
    });
    const uploadImage = vscode.commands.registerCommand('fusion360.uploadImage', async () => {
        const fileUris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'Images': ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff']
            },
            openLabel: 'Upload for Analysis'
        });
        if (fileUris && fileUris[0]) {
            const fileUri = fileUris[0];
            socket.emit('analyze-image', { imagePath: fileUri.fsPath });
            outputChannel.appendLine(`📤 Analyzing image: ${fileUri.fsPath}`);
            vscode.window.showInformationMessage('Image sent for analysis');
        }
    });
    const getActiveDocument = vscode.commands.registerCommand('fusion360.getActiveDocument', async () => {
        outputChannel.appendLine('📄 Requesting active Fusion 360 document information...');
        socket.emit('get-active-document');
        vscode.window.showInformationMessage('Fetching active Fusion 360 document...');
    });
    const getActiveDocumentSimulated = vscode.commands.registerCommand('fusion360.getActiveDocumentSimulated', async () => {
        outputChannel.appendLine('📄 Requesting simulated active document for testing...');
        socket.emit('get-active-document-simulated');
        vscode.window.showInformationMessage('Fetching simulated document for testing...');
    });
    const openImageUpload = vscode.commands.registerCommand('fusion360.openImageUpload', async () => {
        outputChannel.appendLine('📁 Opening image upload panel...');
        ImageUploadPanel_1.ImageUploadPanel.createOrShow(context.extensionUri);
        vscode.window.showInformationMessage('Image upload panel opened!');
    });
    const getRulerInfo = vscode.commands.registerCommand('fusion360.getRulerInfo', async () => {
        outputChannel.appendLine('📏 Requesting Fusion 360 ruler/measurement information...');
        socket.emit('get-ruler-info');
        vscode.window.showInformationMessage('Getting Fusion 360 measurement tools info...');
    });
    const openSettings = vscode.commands.registerCommand('fusion360.openSettings', () => {
        const panel = vscode.window.createWebviewPanel('fusion360Settings', 'Fusion 360 Settings', vscode.ViewColumn.One, {
            enableScripts: true
        });
        panel.webview.html = getWebviewContent(panel.webview, context);
    });
    context.subscriptions.push(executeCommand);
    context.subscriptions.push(uploadImage);
    context.subscriptions.push(getActiveDocument);
    context.subscriptions.push(getActiveDocumentSimulated);
    context.subscriptions.push(openImageUpload);
    context.subscriptions.push(getRulerInfo);
    context.subscriptions.push(openSettings);
    // Store socket connection in global state
    context.globalState.update('fusion360-socket', socket);
    outputChannel.appendLine('🚀 Fusion 360 MCP Extension loaded successfully!');
    vscode.window.showInformationMessage('Fusion 360 MCP Extension activated!');
}
function deactivate() {
    console.log('Fusion 360 MCP Extension deactivated');
    if (mcpServerProcess) {
        mcpServerProcess.kill();
    }
}
function getWebviewContent(webview, context) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'out', 'webview.js'));
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Fusion 360 Settings</title>
        </head>
        <body>
            <div id="root"></div>
            <script src="${scriptUri}"></script>
        </body>
        </html>
    `;
}
//# sourceMappingURL=extension.js.map