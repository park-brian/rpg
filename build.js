const fs = require('fs');
const path = require('path');

function build() {
  const templatePath = path.join(__dirname, 'src', 'template.html');
  const simJsPath = path.join(__dirname, 'src', 'sim.js');
  const viewJsPath = path.join(__dirname, 'src', 'view.js');
  const outputPath = path.join(__dirname, 'index.html');
  const distDir = path.join(__dirname, 'dist');
  const distOutputPath = path.join(distDir, 'index.html');

  const template = fs.readFileSync(templatePath, 'utf8');
  const simJs = fs.readFileSync(simJsPath, 'utf8');
  let viewJs = fs.readFileSync(viewJsPath, 'utf8');

  // Strip Node-specific require header from view.js since sim.js is concatenated directly above it
  viewJs = viewJs.replace(/const sim = \(typeof require[\s\S]*?\} = sim;\n/m, '// [Core simulation engine functions loaded from sim.js above]\n');

  const bundledScript = `<script>\n${simJs}\n${viewJs}\n</script>`;
  const outputHtml = template.replace('<!-- GAME_SCRIPT -->', bundledScript);

  fs.writeFileSync(outputPath, outputHtml, 'utf8');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  fs.writeFileSync(distOutputPath, outputHtml, 'utf8');

  console.log(`Successfully built ${outputPath} (${(outputHtml.length / 1024).toFixed(1)} KB)`);
}

if (require.main === module) {
  build();
}

module.exports = { build };
