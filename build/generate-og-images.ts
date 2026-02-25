import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
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
}

const publicDir = path.join(process.cwd(), 'public');
const generatedDir = path.join(publicDir, 'generated');
const ogDir = path.join(generatedDir, 'og');

if (!fs.existsSync(ogDir)) {
  fs.mkdirSync(ogDir, { recursive: true });
}

const configPath = path.join(publicDir, 'config.yaml');
const configContent = fs.readFileSync(configPath, 'utf-8');
const config = yaml.load(configContent) as Config;

const themeName = config.ui?.theme?.preset || 'journal';
const baseTheme = loadTheme(themeName);

if (!baseTheme) {
  console.error(`[og-images]: could not load theme: ${themeName}`);
  process.exit(1);
}

const theme = config.ui?.theme?.overrides 
  ? applyOverrides(baseTheme, config.ui.theme.overrides)
  : baseTheme;

const mode = config.ui?.theme?.defaultMode || 'light';
const useLowercase = config.ui?.lowercase || false;
const colors = theme.colors[mode];

const applyCase = (str: string) => useLowercase ? str.toLowerCase() : str;

async function loadFont(): Promise<ArrayBuffer | null> {
  const fontUrl = theme.font.url;
  
  if (fontUrl.startsWith('http')) {
    const cssResponse = await fetch(fontUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36'
      }
    });
    const css = await cssResponse.text();
    const fontFileMatch = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?truetype['"]?\)/);
    
    if (fontFileMatch) {
      const fontFileUrl = fontFileMatch[1];
      const fontResponse = await fetch(fontFileUrl);
      return fontResponse.arrayBuffer();
    }
    
    const anyFontMatch = css.match(/src:\s*url\(([^)]+\.ttf)\)/);
    if (anyFontMatch) {
      const fontResponse = await fetch(anyFontMatch[1]);
      return fontResponse.arrayBuffer();
    }
    
    console.warn('[og-images]: could not find TTF font in Google Fonts CSS, using fallback');
    return null;
  }
  
  if (fs.existsSync(fontUrl) && fontUrl.match(/\.(ttf|otf)$/i)) {
    const buffer = fs.readFileSync(fontUrl);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }
  
  console.warn(`[og-images]: font format not supported by satori: ${fontUrl}`);
  return null;
}

const BATCH_SIZE = 5;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateOgImage(
  title: string,
  subtitle: string,
  slug: string,
  fontData: ArrayBuffer | null
): Promise<void> {
  const fontFamily = fontData ? theme.font.family : 'sans-serif';
  
  const svg = await satori(
    ({
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          padding: '60px',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                width: '80px',
                height: '4px',
                backgroundColor: colors.primary,
                marginBottom: '40px',
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '52px',
                fontFamily,
                color: colors.text,
                textAlign: 'center',
                marginBottom: '20px',
                maxWidth: '90%',
              },
              children: applyCase(title),
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '24px',
                fontFamily,
                color: colors.grey2,
                textAlign: 'center',
              },
              children: applyCase(subtitle),
            },
          },
          {
            type: 'div',
            props: {
              style: {
                width: '80px',
                height: '4px',
                backgroundColor: colors.primary,
                marginTop: '40px',
              },
            },
          },
        ],
      },
    }) as any,
    {
      width: 1200,
      height: 630,
      fonts: fontData ? [
        {
          name: theme.font.family,
          data: fontData,
          weight: 400,
          style: 'normal',
        },
      ] : [],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  fs.writeFileSync(path.join(ogDir, `${slug}.png`), pngBuffer);
}

async function main() {
  let fontData: ArrayBuffer | null = null;
  
  try {
    fontData = await loadFont();
    if (fontData) {
      console.log('[og-images]: loaded custom font');
    } else {
      console.log('[og-images]: using fallback font');
    }
  } catch (error) {
    console.warn('[og-images]: failed to load font, using fallback:', error);
  }

  const siteTitle = config.site.title;
  const siteAuthor = config.site.author;
  const siteTagline = config.site.tagline || '';

  await generateOgImage(siteTitle, siteTagline, 'index', fontData);
  console.log('[og-images]: generated og/index.png');

  const piecesPath = path.join(generatedDir, 'index', 'pieces.json');
  if (fs.existsSync(piecesPath)) {
    const pieces: Piece[] = JSON.parse(fs.readFileSync(piecesPath, 'utf-8'));
    
    for (let i = 0; i < pieces.length; i += BATCH_SIZE) {
      const batch = pieces.slice(i, i + BATCH_SIZE);
      for (const piece of batch) {
        const subtitle = piece.collections?.length 
          ? `${piece.collections[0]} · ${siteAuthor}`
          : siteAuthor;
        await generateOgImage(piece.title, subtitle, piece.slug, fontData);
      }
      if (i + BATCH_SIZE < pieces.length) {
        await delay(50);
      }
    }
    console.log(`[og-images]: generated ${pieces.length} piece images`);
  }

  const pagesPath = path.join(generatedDir, 'index', 'pages.json');
  if (fs.existsSync(pagesPath)) {
    const pages: Page[] = JSON.parse(fs.readFileSync(pagesPath, 'utf-8'));
    
    for (let i = 0; i < pages.length; i += BATCH_SIZE) {
      const batch = pages.slice(i, i + BATCH_SIZE);
      for (const page of batch) {
        await generateOgImage(page.title, siteTitle, page.slug, fontData);
      }
      if (i + BATCH_SIZE < pages.length) {
        await delay(50);
      }
    }
    console.log(`[og-images]: generated ${pages.length} page images`);
  }

  console.log('[og-images]: generation complete');
}

main().catch(console.error);
