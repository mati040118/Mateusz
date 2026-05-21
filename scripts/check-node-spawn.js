const { spawnSync } = require("child_process");

const result = spawnSync("cmd.exe", ["/c", "echo", "ok"], { encoding: "utf8" });

if (result.error) {
  console.error("Windows blokuje uruchamianie procesow z Node.");
  console.error(String(result.error));
  process.exit(1);
}

process.exit(0);
