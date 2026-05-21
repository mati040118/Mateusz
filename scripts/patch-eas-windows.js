const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "node_modules", "eas-cli", "build", "utils", "expoCli.js");

if (!fs.existsSync(filePath)) {
  process.exit(0);
}

const source = fs.readFileSync(filePath, "utf8");
const original = "const spawnPromise = (0, spawn_async_1.default)(expoCliPath, args, {";
const patched = "const spawnPromise = (0, spawn_async_1.default)(process.execPath, [expoCliPath, ...args], {";

if (!source.includes(original) || source.includes(patched)) {
  process.exit(0);
}

fs.writeFileSync(filePath, source.replace(original, patched));
