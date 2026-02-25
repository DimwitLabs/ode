import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import fm from 'front-matter';
import { loadTheme, applyOverrides, ThemeConfig, ThemeOverrides } from './utils/theme-loader';

interface Piece {
  slug: string;
  title: string;
  date: string;
  collections?: string[];
}

interface Page {
  slug: string;
  title: string;
  date: string;
}

interface Config {
  site: {
    title: string;
    author: string;
    tagline?: string;
    description?: string;
    url?: string;
  };
  ui?: {
    lowercase?: boolean;
    theme?: {
      preset?: string;
      defaultMode?: 'light' | 'dark';
      overrides?: ThemeOverrides;
    };
  };
  bodyOfWork?: {
    description?: string;
  };
}

const publicDir = path.join(process.cwd(), 'public');
const generatedDir = path.join(publicDir, 'generated');
const metaDir = path.join(generatedDir, 'meta');

if (!fs.existsSync(metaDir)) {
  fs.mkdirSync(metaDir, { recursive: true });
}

const configPath = path.join(publicDir, 'config.yaml');
const configContent = fs.readFileSync(configPath, 'utf-8');
const config = yaml.load(configContent) as Config;

const themeName = config.ui?.theme?.preset || 'journal';
const baseTheme = loadTheme(themeName);

if (!baseTheme) {
  console.error(`[meta]: could not load theme: ${themeName}`);
  process.exit(1);
}

const theme = config.ui?.theme?.overrides 
  ? applyOverrides(baseTheme, config.ui.theme.overrides)
  : baseTheme;

const mode = config.ui?.theme?.defaultMode || 'light';
const useLowercase = config.ui?.lowercase || false;
const colors = theme.colors[mode];

const applyCase = (str: string) => useLowercase ? str.toLowerCase() : str;

const siteUrl = config.site.url || '';
const siteTitle = config.site.title;
const siteAuthor = config.site.author;
const siteDescription = config.site.description || config.site.tagline || '';

function stripMarkdown(text: string): string {
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/!\[.*?\]\(.+?\)/g, '')
    .replace(/>\s+/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getContentDescription(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return '';
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = fm(raw);
  const body = stripMarkdown(parsed.body);
  return body.substring(0, 160);
}

function generateMetaPage(
  slug: string,
  title: string,
  description: string,
  ogImageSlug: string,
  canonicalPath: string
): void {
  const displayTitle = applyCase(title);
  const displayDescription = applyCase(description);
  const fullTitle = `${displayTitle} | ${applyCase(siteTitle)}`;
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const ogImageUrl = `${siteUrl}/generated/og/${ogImageSlug}.png`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>
  
  <!-- Primary Meta Tags -->
  <meta name="title" content="${fullTitle}">
  <meta name="description" content="${displayDescription}">
  <meta name="author" content="${siteAuthor}">
  
  <!-- Canonical -->
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${displayTitle}">
  <meta property="og:description" content="${displayDescription}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${applyCase(siteTitle)}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${displayTitle}">
  <meta name="twitter:description" content="${displayDescription}">
  <meta name="twitter:image" content="${ogImageUrl}">
  
  <!-- Theme Color -->
  <meta name="theme-color" content="${colors.primary}">
  
  <!-- Redirect for humans -->
  <script>
    if (!/bot|crawl|spider|slurp|facebook|twitter|linkedin|pinterest|telegram|whatsapp|discord/i.test(navigator.userAgent)) {
      window.location.replace('${canonicalUrl}');
    }
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0; url=${canonicalUrl}">
  </noscript>
  
  <style>
    body {
      font-family: ${theme.font.family}, ${theme.font.fallback};
      background: ${colors.background};
      color: ${colors.text};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 2rem;
      text-align: center;
    }
    a {
      color: ${colors.primary};
    }
  </style>
</head>
<body>
  <div>
    <h1>${displayTitle}</h1>
    <p>${displayDescription}</p>
    <p><a href="${canonicalUrl}">Continue to ${applyCase(siteTitle)}</a></p>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(metaDir, `${slug}.html`), html, { mode: 0o644 });
}

function main() {
  generateMetaPage(
    'index',
    siteTitle,
    siteDescription,
    'index',
    '/'
  );
  console.log('[meta]: generated meta/index.html');

  const piecesPath = path.join(generatedDir, 'index', 'pieces.json');
  if (fs.existsSync(piecesPath)) {
    const pieces: Piece[] = JSON.parse(fs.readFileSync(piecesPath, 'utf-8'));
    
    for (const piece of pieces) {
      const pieceFilePath = path.join(publicDir, 'content', 'pieces', `${piece.slug}.md`);
      const description = getContentDescription(pieceFilePath) || 
        (piece.collections?.length 
          ? `${piece.collections.join(', ')} by ${siteAuthor}`
          : `A piece by ${siteAuthor}`);
      
      generateMetaPage(
        piece.slug,
        piece.title,
        description,
        piece.slug,
        `/${piece.slug}`
      );
    }
    console.log(`[meta]: generated ${pieces.length} piece meta pages`);
  }
  
  const pagesPath = path.join(generatedDir, 'index', 'pages.json');
  if (fs.existsSync(pagesPath)) {
    const pages: Page[] = JSON.parse(fs.readFileSync(pagesPath, 'utf-8'));
    
    for (const page of pages) {
      let description: string;
      
      if (page.slug === 'body-of-work' && config.bodyOfWork?.description) {
        description = config.bodyOfWork.description;
      } else {
        const pageFilePath = path.join(publicDir, 'content', 'pages', `${page.slug}.md`);
        description = getContentDescription(pageFilePath) || `${page.title} - ${siteTitle}`;
      }
      
      generateMetaPage(
        page.slug,
        page.title,
        description,
        page.slug,
        `/${page.slug}`
      );
    }
    console.log(`[meta]: generated ${pages.length} page meta pages`);
  }

  console.log('[meta]: generation complete');
}

main();
