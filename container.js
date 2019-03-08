const path = require("path");
const fs = require("fs");

let script = process.argv[2];
require.main.filename = script;

process.chdir(path.dirname(script));
require(process.argv[2]);

fs.writeFileSync("pid", process.pid);
