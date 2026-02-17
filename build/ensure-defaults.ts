import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

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

const configRaw = fs.readFileSync(configPath, 'utf-8');
const config = yaml.load(configRaw) as any;
const notFoundSlug = config?.pages?.notFound || 'obscured';
const notFoundPath = path.join(pagesDir, `${notFoundSlug}.md`);

if (!fs.existsSync(notFoundPath)) {
  console.warn(`WARNING: 404 page "${notFoundSlug}.md" missing — using default`);
  const defaultNotFound = fs.readFileSync(path.join(defaultsDir, 'obscured.md'), 'utf-8');
  fs.writeFileSync(notFoundPath, defaultNotFound);
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

const nonNotFoundPages = pageFiles.filter(f => f !== `${notFoundSlug}.md`);

if (nonNotFoundPages.length === 0) {
  console.warn('WARNING: No pages found — creating default "About" page');
  const defaultPage = fs.readFileSync(path.join(defaultsDir, 'about.md'), 'utf-8');
  const defaultPagePath = path.join(pagesDir, 'about.md');
  fs.writeFileSync(defaultPagePath, defaultPage);
}

const robotsPath = path.join(publicDir, 'robots.txt');
const siteUrl = config.site?.url?.replace(/\/+$/, '') || 'https://example.com';
const robotsContent = `User-agent: *
Disallow:
Sitemap: ${siteUrl}/sitemap.xml
`;
fs.writeFileSync(robotsPath, robotsContent);
console.log('Generated robots.txt');

console.log('\nDefaults check complete.\n');
