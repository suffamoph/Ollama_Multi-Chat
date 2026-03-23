const { spawn } = require('child_process');
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '5173', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  cwd: __dirname,
});
child.on('exit', (code) => process.exit(code));
