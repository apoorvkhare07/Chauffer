const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
async function main() {
  const root = path.resolve(__dirname, "..");
  const source = path.join(root, "../public/brand/chauffer-icon.svg");
  await fs.mkdir(path.join(root, "assets"), { recursive: true });
  // Rasterise the approved vector; no new logo or AI-generated brand mark.
  await sharp(source, { density: 600 })
    .resize(1024, 1024)
    .flatten({ background: "#ffffff" })
    .png()
    .toFile(path.join(root, "assets/icon.png"));
  await sharp(source, { density: 600 })
    .resize(720, 720)
    .extend({
      top: 152,
      bottom: 152,
      left: 152,
      right: 152,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(path.join(root, "assets/adaptive-icon.png"));
}
main().catch(() => {
  process.stderr.write("Could not generate native brand assets.\n");
  process.exitCode = 1;
});
