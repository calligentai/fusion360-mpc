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
const React = __importStar(require("react"));
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const SettingsPanel_1 = require("../../components/SettingsPanel");
const vscode = __importStar(require("vscode"));
// Mock vscode API
jest.mock('vscode', () => ({
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn(() => 'initial/path'),
            update: jest.fn(),
        })),
    },
    window: {
        showInformationMessage: jest.fn(),
    },
    ConfigurationTarget: {
        Global: 1,
    },
}));
describe('SettingsPanel', () => {
    it('renders correctly and loads initial path', () => {
        (0, react_1.render)(React.createElement(SettingsPanel_1.SettingsPanel, null));
        expect(react_1.screen.getByLabelText(/Executable Path:/i)).toHaveValue('initial/path');
    });
    it('updates path on change', () => {
        (0, react_1.render)(React.createElement(SettingsPanel_1.SettingsPanel, null));
        const input = react_1.screen.getByLabelText(/Executable Path:/i);
        react_1.fireEvent.change(input, { target: { value: 'new/path' } });
        expect(input).toHaveValue('new/path');
    });
    it('saves path on button click', () => {
        (0, react_1.render)(React.createElement(SettingsPanel_1.SettingsPanel, null));
        const input = react_1.screen.getByLabelText(/Executable Path:/i);
        react_1.fireEvent.change(input, { target: { value: 'new/path' } });
        const saveButton = react_1.screen.getByText(/Save/i);
        react_1.fireEvent.click(saveButton);
        expect(vscode.workspace.getConfiguration().update).toHaveBeenCalledWith('executablePath', 'new/path', vscode.ConfigurationTarget.Global);
        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Fusion 360 executable path saved.');
    });
});
//# sourceMappingURL=SettingsPanel.test.js.map