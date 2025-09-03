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
exports.ImageUploadPanel = void 0;
// Image Upload Panel for Fusion 360 MCP Extension
const vscode = __importStar(require("vscode"));
// Generate nonce for CSP
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
class ImageUploadPanel {
    static createOrShow(extensionUri) {
        const column = vscode.ViewColumn.One;
        if (ImageUploadPanel.currentPanel) {
            ImageUploadPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel(ImageUploadPanel.viewType, 'Fusion 360 Image Analysis', column, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'media')
            ]
        });
        ImageUploadPanel.currentPanel = new ImageUploadPanel(panel, extensionUri);
    }
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'file-selected':
                    this._handleFileSelection(message.files);
                    break;
                case 'drag-drop':
                    this._handleDragDrop(message.files);
                    break;
                case 'analyze-image':
                    this._handleImageAnalysis(message.filePath);
                    break;
            }
        }, null, this._disposables);
    }
    dispose() {
        ImageUploadPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        const webview = this._panel.webview;
        this._panel.title = 'Upload & Analyze Image';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }
    _handleFileSelection(files) {
        if (files && files.length > 0) {
            const fileUri = files[0];
            vscode.window.showInformationMessage(`Selected file: ${fileUri.path}`);
            // Send to MCP server for analysis
            vscode.commands.executeCommand('fusion360.uploadImage', fileUri);
        }
    }
    _handleDragDrop(files) {
        this._handleFileSelection(files);
    }
    _handleImageAnalysis(filePath) {
        // Send image for OCR analysis
        vscode.window.showInformationMessage(`Analyzing image: ${filePath}`);
        // The actual OCR processing will be handled by the MCP server
        // For now, show a placeholder
        this._panel.webview.html = `
            <html>
            <body>
                <h2>Image Analysis in Progress...</h2>
                <p>Processing: ${filePath}</p>
                <div id="progress">🔄 Analyzing image with AI agents...</div>
            </body>
            </html>
        `;
    }
    _getHtmlForWebview(webview) {
        const nonce = getNonce();
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Upload & Analyze Image</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }

                    .upload-area {
                        border: 2px dashed var(--vscode-panel-border);
                        border-radius: 8px;
                        padding: 40px;
                        text-align: center;
                        margin: 20px 0;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        min-height: 200px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }

                    .upload-area:hover {
                        border-color: var(--vscode-focusBorder);
                        background-color: var(--vscode-panel-background);
                    }

                    .upload-area.drag-over {
                        border-color: var(--vscode-charts-green);
                        background-color: var(--vscode-terminal-ansiGreen);
                        opacity: 0.7;
                    }

                    .upload-button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 12px 24px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-top: 20px;
                        font-size: 14px;
                    }

                    .upload-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }

                    .file-list {
                        margin-top: 20px;
                        max-height: 200px;
                        overflow-y: auto;
                    }

                    .file-item {
                        background-color: var(--vscode-quickInput-background);
                        padding: 8px;
                        margin: 4px 0;
                        border-radius: 4px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .analyze-btn {
                        background-color: var(--vscode-charts-green);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    }

                    .analyze-btn:hover {
                        opacity: 0.9;
                    }
                </style>
            </head>
            <body>
                <h1>🖼️ Fusion 360 Image Analysis</h1>
                <p>Upload any technical drawing, sketch, or design document for AI-powered analysis and automated Fusion 360 workflow generation.</p>

                <div class="upload-area" id="uploadArea">
                    <div>
                        📁 Choose File or Drag & Drop
                        <input type="file" id="fileInput" accept="image/*" style="display: none;" />
                    </div>
                    <button class="upload-button" id="selectFileBtn">Select Image File</button>
                </div>

                <div id="selectedFiles" class="file-list" style="display: none;">
                    <h3>Selected Files:</h3>
                    <div id="fileItems"></div>
                </div>

                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    const uploadArea = document.getElementById('uploadArea');
                    const fileInput = document.getElementById('fileInput');
                    const selectFileBtn = document.getElementById('selectFileBtn');
                    const fileItems = document.getElementById('fileItems');
                    const selectedFilesContainer = document.getElementById('selectedFiles');

                    let currentFiles = [];

                    // Select file button click
                    selectFileBtn.addEventListener('click', () => {
                        fileInput.click();
                    });

                    // Upload area click
                    uploadArea.addEventListener('click', () => {
                        fileInput.click();
                    });

                    // File input change
                    fileInput.addEventListener('change', (e) => {
                        const files = Array.from(e.target.files);
                        if (files.length > 0) {
                            currentFiles = files;
                            displaySelectedFile(files[0]);
                            vscode.postMessage({
                                type: 'file-selected',
                                files: files.map(f => ({ path: f.name, size: f.size }))
                            });
                        }
                    });

                    // Drag and drop
                    uploadArea.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        uploadArea.classList.add('drag-over');
                    });

                    uploadArea.addEventListener('dragleave', () => {
                        uploadArea.classList.remove('drag-over');
                    });

                    uploadArea.addEventListener('drop', (e) => {
                        e.preventDefault();
                        uploadArea.classList.remove('drag-over');
                        const files = Array.from(e.dataTransfer.files);
                        if (files.length > 0) {
                            currentFiles = files;
                            displaySelectedFile(files[0]);
                            vscode.postMessage({
                                type: 'drag-drop',
                                files: files.map(f => ({ path: f.name, size: f.size }))
                            });
                        }
                    });

                    function displaySelectedFile(file) {
                        const fileDiv = document.createElement('div');
                        fileDiv.className = 'file-item';
                        fileDiv.innerHTML = \`
                            <div>
                                <strong>\${file.name}</strong><br>
                                Size: \${(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                            <button class="analyze-btn" onclick="analyzeImage('\${file.name}')">
                                📊 Analyze with AI
                            </button>
                        \`;
                        selectedFilesContainer.style.display = 'block';
                        fileItems.innerHTML = '';
                        fileItems.appendChild(fileDiv);
                    }

                    function analyzeImage(filePath) {
                        vscode.postMessage({
                            type: 'analyze-image',
                            filePath: filePath
                        });
                    }
                </script>
            </body>
        </html>
        `;
    }
}
exports.ImageUploadPanel = ImageUploadPanel;
ImageUploadPanel.viewType = 'fusion360ImageUpload';
//# sourceMappingURL=ImageUploadPanel.js.map