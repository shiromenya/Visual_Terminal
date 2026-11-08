const fs = require('fs');
const code = fs.readFileSync('public/app.js', 'utf8');

const catalogMatch = code.match(/const COMMAND_CATALOG = \[([\s\S]*?)\];\s*const BUILTIN_BLOCKS/);
if (catalogMatch) {
  const ids = [...catalogMatch[1].matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(x => x[1]);
  console.log('COMMAND_CATALOG entries:', ids.length);
}

const objMatch = code.match(/Object\.assign\(BUILTIN_BLOCKS,\s*\{([\s\S]*?)\n\}\);/);
if (objMatch) {
  const keys = [...objMatch[1].matchAll(/[\n\r]\s{2}'([a-zA-Z0-9_\-]+)':/g)].map(x => x[1]);
  console.log('Object.assign BUILTIN_BLOCKS entries:', keys.length);
}
