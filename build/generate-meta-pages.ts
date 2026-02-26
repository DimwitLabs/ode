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
    slug?: string;
    description?: string;
  };
}

const publicDir = path.join(process.cwd(), 'public');
const generatedDir = path.join(publicDir, 'generated');
const metaDir = path.join(generatedDir, 'meta');
const templatePath = path.join(__dirname, 'templates', 'meta-page.html');

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

  const template = fs.readFileSync(templatePath, 'utf-8');
  
  const html = template
    .replace(/\{\{fullTitle\}\}/g, fullTitle)
    .replace(/\{\{title\}\}/g, displayTitle)
    .replace(/\{\{description\}\}/g, displayDescription)
    .replace(/\{\{author\}\}/g, siteAuthor)
    .replace(/\{\{canonicalUrl\}\}/g, canonicalUrl)
    .replace(/\{\{ogImageUrl\}\}/g, ogImageUrl)
    .replace(/\{\{siteName\}\}/g, applyCase(siteTitle))
    .replace(/\{\{themeColor\}\}/g, colors.primary)
    .replace(/\{\{fontFamily\}\}/g, theme.font.family)
    .replace(/\{\{fontFallback\}\}/g, theme.font.fallback)
    .replace(/\{\{backgroundColor\}\}/g, colors.background)
    .replace(/\{\{textColor\}\}/g, colors.text)
    .replace(/\{\{primaryColor\}\}/g, colors.primary);

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
      
      const bodyOfWorkSlug = config.bodyOfWork?.slug || 'body-of-work';
      if (page.slug === bodyOfWorkSlug && config.bodyOfWork?.description) {
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
