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
exports.FusionStatusMonitor = void 0;
const React = __importStar(require("react"));
const vscode = __importStar(require("vscode"));
const FusionStatusMonitor = () => {
    const [status, setStatus] = React.useState('Disconnected');
    const attachedSocketRef = React.useRef(undefined);
    const extChangeDisposableRef = React.useRef(undefined);
    React.useEffect(() => {
        const onConnect = () => setStatus('Connected');
        const onDisconnect = () => setStatus('Disconnected');
        function attach(socket) {
            if (!socket || attachedSocketRef.current === socket)
                return;
            // detach previous first
            detach();
            if (socket?.on) {
                socket.on('connect', onConnect);
                socket.on('disconnect', onDisconnect);
                attachedSocketRef.current = socket;
            }
        }
        function detach() {
            const s = attachedSocketRef.current;
            if (s?.off) {
                try {
                    s.off('connect', onConnect);
                    s.off('disconnect', onDisconnect);
                }
                catch {
                    // some socket libs use removeListener/removeEventListener
                    s.removeListener?.('connect', onConnect);
                    s.removeListener?.('disconnect', onDisconnect);
                }
            }
            attachedSocketRef.current = undefined;
            setStatus('Disconnected');
        }
        // initial attach
        const initialSocket = vscode.extensions.getExtension('fusion360-mcp-vscode-extension')?.exports?.socket;
        attach(initialSocket);
        // re-attach if extension list changes (extension gets activated later)
        extChangeDisposableRef.current = vscode.extensions.onDidChange(() => {
            const socket = vscode.extensions.getExtension('fusion360-mcp-vscode-extension')?.exports?.socket;
            attach(socket);
        });
        return () => {
            extChangeDisposableRef.current?.dispose();
            detach();
        };
    }, []);
    return (React.createElement("div", { role: "status", "aria-live": "polite", style: {
            padding: '5px',
            backgroundColor: status === 'Connected' ? 'green' : 'red',
            color: 'white',
            borderRadius: 4,
            fontSize: 12
        } },
        "Fusion 360 MCP Server: ",
        status));
};
exports.FusionStatusMonitor = FusionStatusMonitor;
//# sourceMappingURL=FusionStatusMonitor.js.map