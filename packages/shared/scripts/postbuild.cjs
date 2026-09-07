// Tandai dist/cjs sebagai CommonJS (root package.json memakai "type":"module").
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'dist', 'cjs');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ type: 'commonjs' }) + '\n');
