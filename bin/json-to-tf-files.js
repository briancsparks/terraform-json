
const fs                = require('fs');

const jsonfilename      = process.argv[2];

// We at least need 'node', 'app', 'myfilename.js'
if (process.argv.length < 3) {
  bigWarning(`Need argv[2] is tf file`);
}

const jsonStr = fs.readFileSync(jsonfilename, 'utf8');
const json    = JSON.parse(jsonStr);
const keys    = Object.keys(json);

let i;
for (i=0; i<keys.length; ++i) {
  const key   = keys[i];
  const value = json[key];

  fs.writeFileSync(`${key}.tf.json`, JSON.stringify(value, null, 2), 'utf8');
}


function bigWarning(message) {
  console.error("=================================================================================");
  console.error(`Warning: ${message}.`);
  console.error("=================================================================================");
}


