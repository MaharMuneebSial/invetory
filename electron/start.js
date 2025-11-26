// Helper script to launch Electron properly
// This removes the ELECTRON_RUN_AS_NODE environment variable that VSCode sets
delete process.env.ELECTRON_RUN_AS_NODE;

const { spawn } = require('child_process');
const path = require('path');

const electronPath = require('electron');
const appPath = path.join(__dirname, '..');

const child = spawn(electronPath, [appPath], {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined }
});

child.on('close', (code) => {
  process.exit(code);
});
