import fs from 'fs';
import path from 'path';

const publicDir = path.join(__dirname, '..', 'public');
const defaultsDir = path.join(__dirname, 'defaults');
const configPath = path.join(publicDir, 'config.yaml');
const contentDir = path.join(publicDir, 'content');
const introPath = path.join(contentDir, 'intro.md');
const piecesDir = path.join(contentDir, 'pieces');
const pagesDir = path.join(contentDir, 'pages');
const indexDir = path.join(publicDir, 'index');

console.log('\nChecking for missing content...\n');

[contentDir, piecesDir, pagesDir, indexDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.warn(`WARNING: Directory missing: ${path.basename(dir)}/ — created`);
  }
});

if (!fs.existsSync(introPath)) {
  console.warn('WARNING: intro.md missing — using default');
  const defaultIntro = fs.readFileSync(path.join(defaultsDir, 'intro.md'), 'utf-8');
  fs.writeFileSync(introPath, defaultIntro);
}

if (!fs.existsSync(configPath)) {
  console.warn('WARNING: config.yaml missing — using default');
  const defaultConfig = fs.readFileSync(path.join(defaultsDir, 'config.yaml'), 'utf-8');
  fs.writeFileSync(configPath, defaultConfig);
}

const pieceFiles = fs.existsSync(piecesDir) 
  ? fs.readdirSync(piecesDir).filter(f => f.endsWith('.md'))
  : [];

if (pieceFiles.length === 0) {
  console.warn('WARNING: No pieces found — creating default piece "It\'s A Start"');
  const defaultPiece = fs.readFileSync(path.join(defaultsDir, 'its-a-start.md'), 'utf-8');
  const defaultPiecePath = path.join(piecesDir, 'its-a-start.md');
  fs.writeFileSync(defaultPiecePath, defaultPiece);
}

const pageFiles = fs.existsSync(pagesDir)
  ? fs.readdirSync(pagesDir).filter(f => f.endsWith('.md'))
  : [];

if (pageFiles.length === 0) {
  console.warn('WARNING: No pages found — creating default "About" page');
  const defaultPage = fs.readFileSync(path.join(defaultsDir, 'about.md'), 'utf-8');
  const defaultPagePath = path.join(pagesDir, 'about.md');
  fs.writeFileSync(defaultPagePath, defaultPage);
}

console.log('\nDefaults check complete.\n');
