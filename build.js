import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function build() {
  const templatePath = path.join(__dirname, 'src', 'template.html');
  const simJsPath = path.join(__dirname, 'src', 'sim.js');
  const viewJsPath = path.join(__dirname, 'src', 'view.js');
  const outputPath = path.join(__dirname, 'index.html');
  const distDir = path.join(__dirname, 'dist');
  const distOutputPath = path.join(distDir, 'index.html');

  const template = fs.readFileSync(templatePath, 'utf8');
  let simJs = fs.readFileSync(simJsPath, 'utf8');
  let viewJs = fs.readFileSync(viewJsPath, 'utf8');

  // Strip module import/export lines for single-file browser bundle
  const simJsClean = simJs.replace(/^export\s*\{[\s\S]*?\};/m, '');
  const viewJsClean = viewJs
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"]\.\/sim\.js['"];/m, '')
    .replace(/^export\s*\{[\s\S]*?\};/m, '');

  const bundledScript = `<script>\nwindow.__SIM_SRC__ = ${JSON.stringify(simJsClean)};\n${simJsClean}\n${viewJsClean}\n</script>`;
  const outputHtml = template.replace('<!-- GAME_SCRIPT -->', bundledScript);

  fs.writeFileSync(outputPath, outputHtml, 'utf8');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  fs.writeFileSync(distOutputPath, outputHtml, 'utf8');

  console.log(`Successfully built ${outputPath} (${(outputHtml.length / 1024).toFixed(1)} KB)`);
}

if (process.argv[1] === __filename) {
  build();
}
