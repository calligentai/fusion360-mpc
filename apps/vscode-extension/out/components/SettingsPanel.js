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
exports.SettingsPanel = void 0;
const React = __importStar(require("react"));
const vscode = __importStar(require("vscode"));
const SettingsPanel = () => {
    const [executablePath, setExecutablePath] = React.useState('');
    React.useEffect(() => {
        const config = vscode.workspace.getConfiguration('fusion360');
        setExecutablePath(config.get('executablePath', ''));
    }, []);
    const handlePathChange = (e) => {
        setExecutablePath(e.target.value);
    };
    const handleSave = () => {
        const config = vscode.workspace.getConfiguration('fusion360');
        config.update('executablePath', executablePath, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('Fusion 360 executable path saved.');
    };
    return (React.createElement("div", null,
        React.createElement("h2", null, "Fusion 360 Settings"),
        React.createElement("div", null,
            React.createElement("label", { htmlFor: "executablePath" }, "Executable Path:"),
            React.createElement("input", { type: "text", id: "executablePath", value: executablePath, onChange: handlePathChange, style: { width: '100%', marginTop: '5px' } })),
        React.createElement("button", { onClick: handleSave, style: { marginTop: '10px' } }, "Save")));
};
exports.SettingsPanel = SettingsPanel;
//# sourceMappingURL=SettingsPanel.js.map