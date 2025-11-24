import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const configPath = path.join(publicDir, 'config.yaml');
const piecesJsonPath = path.join(publicDir, 'index', 'pieces.json');
const pagesJsonPath = path.join(publicDir, 'index', 'pages.json');
const collectionsJsonPath = path.join(publicDir, 'index', 'pieces-collections.json');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

interface Piece {
  slug: string;
  title: string;
  date: string;
  collections: string[];
}

interface Page {
  slug: string;
  title: string;
}

interface Collection {
  name: string;
  total: number;
  pieces: string[];
}

(async () => {
  try {
    const configFile = fs.readFileSync(configPath, 'utf-8');
    const config: any = yaml.load(configFile);
    
    const baseUrl = config.site?.url || 'https://example.com';
    const currentDate = new Date().toISOString().split('T')[0];
    
    const pieces: Piece[] = JSON.parse(fs.readFileSync(piecesJsonPath, 'utf-8'));
    const pages: Page[] = JSON.parse(fs.readFileSync(pagesJsonPath, 'utf-8'));
    const collections: Collection[] = JSON.parse(fs.readFileSync(collectionsJsonPath, 'utf-8'));
    
    const sitemapLines: string[] = [];
    sitemapLines.push('<?xml version="1.0" encoding="UTF-8"?>');
    sitemapLines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    
    // Homepage
    sitemapLines.push('  <url>');
    sitemapLines.push(`    <loc>${baseUrl}/</loc>`);
    sitemapLines.push(`    <lastmod>${currentDate}</lastmod>`);
    sitemapLines.push('    <changefreq>daily</changefreq>');
    sitemapLines.push('    <priority>1.0</priority>');
    sitemapLines.push('  </url>');
    
    // Pages
    for (const page of pages) {
      sitemapLines.push('  <url>');
      sitemapLines.push(`    <loc>${baseUrl}/${page.slug}</loc>`);
      sitemapLines.push(`    <lastmod>${currentDate}</lastmod>`);
      sitemapLines.push('    <changefreq>weekly</changefreq>');
      sitemapLines.push('    <priority>0.8</priority>');
      sitemapLines.push('  </url>');
    }
    
    // Collections/Reader pages
    for (const collection of collections) {
      sitemapLines.push('  <url>');
      sitemapLines.push(`    <loc>${baseUrl}/reader/${encodeURIComponent(collection.name)}</loc>`);
      sitemapLines.push(`    <lastmod>${currentDate}</lastmod>`);
      sitemapLines.push('    <changefreq>weekly</changefreq>');
      sitemapLines.push('    <priority>0.7</priority>');
      sitemapLines.push('  </url>');
    }
    
    // Individual pieces
    for (const piece of pieces) {
      sitemapLines.push('  <url>');
      sitemapLines.push(`    <loc>${baseUrl}/${piece.slug}</loc>`);
      sitemapLines.push(`    <lastmod>${piece.date}</lastmod>`);
      sitemapLines.push('    <changefreq>monthly</changefreq>');
      sitemapLines.push('    <priority>0.6</priority>');
      sitemapLines.push('  </url>');
    }
    
    sitemapLines.push('</urlset>');
    
    fs.writeFileSync(sitemapPath, sitemapLines.join('\n'));
    console.log(`Sitemap generated successfully with ${1 + pages.length + collections.length + pieces.length} URLs`);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
})();
