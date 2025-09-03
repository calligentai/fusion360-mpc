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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
require("ts-node/register/transpile-only");
const path = __importStar(require("path"));
const mocha_1 = __importDefault(require("mocha"));
const glob_1 = require("glob");
const fs = __importStar(require("fs"));
// Prevent multiple runs / duplicate handlers
let runStarted = false;
async function run() {
    if (runStarted) {
        console.log('[test-runner] run() already started — skipping duplicate invocation');
        return;
    }
    runStarted = true;
    // Create the mocha test
    const mocha = new mocha_1.default({
        ui: 'tdd',
        color: true,
        reporter: 'spec'
    });
    // small default timeout to fail fast for hanging tests
    mocha.timeout = mocha.timeout || 5000;
    const testsRoot = path.resolve(__dirname, '..');
    console.log('[test-runner] testsRoot =', testsRoot);
    // surface uncaught errors early
    // use once to avoid adding many listeners if run() is called multiple times
    process.once('uncaughtException', (err) => {
        console.error('[test-runner] uncaughtException:', err && ((err.stack) || err));
    });
    process.once('unhandledRejection', (reason) => {
        console.error('[test-runner] unhandledRejection:', reason && ((reason.stack) || reason));
    });
    // glob API changed across versions — handle promise or callback flavors
    let files = [];
    try {
        const g = glob_1.glob;
        const pattern = '**/*.test.{js,ts}';
        const opts = { cwd: testsRoot, nodir: true };
        // If glob returns a Promise when called, await it.
        const maybe = g(pattern, opts);
        if (maybe && typeof maybe.then === 'function') {
            files = await maybe;
        }
        else {
            // callback-style: promisify
            files = await new Promise((resolve, reject) => {
                try {
                    g(pattern, opts, (err, matches) => {
                        if (err)
                            return reject(err);
                        resolve(matches || []);
                    });
                }
                catch (e) {
                    reject(e);
                }
            });
        }
    }
    catch (err) {
        console.error('[test-runner] error while globbing test files:', err && ((err.stack) || err));
        runStarted = false;
        throw err;
    }
    console.log('[test-runner] found test files (relative):', files);
    if (!files || files.length === 0) {
        console.warn('[test-runner] no test files found — nothing to run');
    }
    // Filter out Playwright e2e tests which use @playwright/test and are not
    // compatible with Mocha. These usually live under an `e2e` folder.
    const filteredOut = [];
    files = (files || []).filter(f => {
        const lowered = f.toLowerCase();
        if (lowered.includes('/e2e/') || lowered.startsWith('e2e/') || lowered.includes('/__e2e__/') || lowered.includes('playwright')) {
            filteredOut.push(f);
            return false;
        }
        return true;
    });
    if (filteredOut.length > 0) {
        console.log('[test-runner] filtered out files not compatible with Mocha:', filteredOut);
    }
    files.forEach(f => {
        const full = path.resolve(testsRoot, f);
        // Read file contents and skip tests that are Jest-specific (jest.mock,
        // @testing-library/jest-dom, etc.) which aren't compatible with Mocha.
        let content = '';
        try {
            content = fs.readFileSync(full, 'utf8');
        }
        catch (e) {
            // if we can't read the compiled file, still try to add it
            console.warn('[test-runner] could not read file for heuristics, adding anyway:', full);
        }
        const isJestSpecific = /\bjest\.|@testing-library\/jest-dom/.test(content);
        if (isJestSpecific) {
            console.log('[test-runner] skipping Jest-specific test file for Mocha:', full);
            return;
        }
        console.log('[test-runner] adding', full);
        mocha.addFile(full);
    });
    // Ensure a Jest-like `expect` global exists so packages like
    // @testing-library/jest-dom (which augment `expect`) can run under Mocha.
    try {
        if (!global.expect) {
            try {
                const mod = await Promise.resolve().then(() => __importStar(require('@jest/globals')));
                global.expect = mod.expect;
                console.log('[test-runner] provided global.expect from @jest/globals');
            }
            catch (e1) {
                try {
                    const mod2 = await Promise.resolve().then(() => __importStar(require('expect')));
                    // `expect` package may export default or module itself
                    global.expect = mod2.default || mod2;
                    console.log('[test-runner] provided global.expect from expect package');
                }
                catch (e2) {
                    console.warn('[test-runner] could not provide global.expect; jest-dom/assertion helpers may fail');
                }
            }
        }
    }
    catch (err) {
        console.warn('[test-runner] error while setting up global.expect:', err.stack || err);
    }
    // Ensure files are loaded before running and surface any loader errors
    try {
        await mocha.loadFilesAsync();
    }
    catch (err) {
        console.error('[test-runner] error while loading test files:', err && ((err.stack) || err));
        runStarted = false;
        throw err;
    }
    return new Promise((resolve, reject) => {
        try {
            mocha.run(failures => {
                if (failures > 0) {
                    runStarted = false;
                    reject(new Error(`${failures} tests failed.`));
                }
                else {
                    runStarted = false;
                    resolve();
                }
            });
        }
        catch (err) {
            console.error('[test-runner] error while running tests', err && ((err.stack) || err));
            runStarted = false;
            reject(err);
        }
    });
}
//# sourceMappingURL=index.js.map