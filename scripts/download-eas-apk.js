const fs = require("fs");
const https = require("https");

const [, , resultPath, outputPath] = process.argv;

if (!resultPath || !outputPath) {
  console.error("Usage: node scripts/download-eas-apk.js <eas-json> <output-apk>");
  process.exit(1);
}

const raw = fs.readFileSync(resultPath, "utf8");
const parsed = JSON.parse(raw);
const build = Array.isArray(parsed) ? parsed[0] : parsed;
const apkUrl = build?.artifacts?.buildUrl ?? build?.artifacts?.applicationArchiveUrl;

if (!apkUrl) {
  console.error("Nie znaleziono linku do APK w wyniku EAS.");
  console.error(raw);
  process.exit(1);
}

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  fs.appendFileSync(summaryPath, `## APK gotowe\n\n[Kliknij tutaj, aby pobrac APK](${apkUrl})\n`);
}

function download(url, destination, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https
      .get(url, (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location &&
          redirectsLeft > 0
        ) {
          file.close();
          fs.unlinkSync(destination);
          resolve(download(response.headers.location, destination, redirectsLeft - 1));
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destination);
          reject(new Error(`Pobieranie APK nie powiodlo sie: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (error) => {
        file.close();
        if (fs.existsSync(destination)) {
          fs.unlinkSync(destination);
        }
        reject(error);
      });
  });
}

download(apkUrl, outputPath).catch((error) => {
  console.error(error);
  process.exit(1);
});
