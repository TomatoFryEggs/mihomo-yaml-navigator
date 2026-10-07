const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { runTests } = require('@vscode/test-electron');
const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'myn-'));
runTests({
  ...(process.env.VSCODE_EXECUTABLE_PATH ? {vscodeExecutablePath: process.env.VSCODE_EXECUTABLE_PATH} : {}),
  extensionDevelopmentPath: path.resolve(__dirname, '..'),
  extensionTestsPath: path.resolve(__dirname, 'integration.js'),
  launchArgs: ['--user-data-dir', path.join(isolated, 'data'), '--extensions-dir', path.join(isolated, 'extensions'), '--disable-extensions', '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust'],
}).catch(error => { console.error(error); process.exitCode = 1; });
