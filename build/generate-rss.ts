import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import fm from 'front-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const contentDir = path.join(publicDir, 'content', 'pieces');
const configPath = path.join(publicDir, 'config.yaml');
const piecesJsonPath = path.join(publicDir, 'index', 'pieces.json');
const rssPath = path.join(publicDir, 'feed');

interface Piece {
  slug: string;
  title: string;
  date?: string;
  collections?: string[];
}

interface FrontMatter {
  attributes: {
    title?: string;
    date?: string;
    collections?: string[];
  };
  body: string;
}

try {
  const configFile = fs.readFileSync(configPath, 'utf-8');
  const config: any = yaml.load(configFile);
  
  const baseUrl = config.site?.url || 'https://example.com';
  const siteTitle = config.site?.title || 'Site';
  const siteAuthor = config.site?.author || '';
  const siteTagline = config.site?.tagline || '';
  
  const piecesData: Piece[] = JSON.parse(fs.readFileSync(piecesJsonPath, 'utf-8'));
  
  const sortedPieces = [...piecesData].sort((a, b) => {
    const dateA = new Date(a.date || '1970-01-01');
    const dateB = new Date(b.date || '1970-01-01');
    return dateB.getTime() - dateA.getTime();
  });
  
  const buildDate = new Date().toUTCString();
  
  const rssLines: string[] = [];
  rssLines.push('<?xml version="1.0" encoding="UTF-8"?>');
  rssLines.push('<rss version="2.0"');
  rssLines.push('  xmlns:content="http://purl.org/rss/1.0/modules/content/"');
  rssLines.push('  xmlns:dc="http://purl.org/dc/elements/1.1/"');
  rssLines.push('  xmlns:atom="http://www.w3.org/2005/Atom">');
  rssLines.push('');
  rssLines.push('<channel>');
  rssLines.push(`  <title>${escapeXml(siteTitle)}</title>`);
  rssLines.push(`  <atom:link href="${baseUrl}/feed" rel="self" type="application/rss+xml" />`);
  rssLines.push(`  <link>${baseUrl}/</link>`);
  rssLines.push(`  <description>${escapeXml(siteTagline)}</description>`);
  rssLines.push(`  <lastBuildDate>${buildDate}</lastBuildDate>`);
  rssLines.push(`  <language>en</language>`);
  
  if (siteAuthor) {
    rssLines.push(`  <managingEditor>${escapeXml(siteAuthor)}</managingEditor>`);
  }
  rssLines.push('');
  
  sortedPieces.forEach((piece: Piece) => {
    const pieceUrl = `${baseUrl}/${piece.slug}`;
    const pubDate = piece.date ? new Date(piece.date).toUTCString() : buildDate;
    
    const mdPath = path.join(contentDir, `${piece.slug}.md`);
    let content = '';
    
    if (fs.existsSync(mdPath)) {
      const mdFile = fs.readFileSync(mdPath, 'utf-8');
      const parsed = fm<FrontMatter['attributes']>(mdFile);
      content = parsed.body.trim();
    }
    
    rssLines.push('  <item>');
    rssLines.push(`    <title>${escapeXml(piece.title)}</title>`);
    rssLines.push(`    <link>${pieceUrl}</link>`);
    rssLines.push('');
    if (siteAuthor) {
      rssLines.push(`    <dc:creator><![CDATA[${siteAuthor}]]></dc:creator>`);
    }
    rssLines.push(`    <pubDate>${pubDate}</pubDate>`);
    
    if (piece.collections && piece.collections.length > 0) {
      piece.collections.forEach((collection: string) => {
        rssLines.push(`    <category><![CDATA[${collection}]]></category>`);
      });
    }
    
    rssLines.push(`    <guid isPermaLink="true">${pieceUrl}</guid>`);
    rssLines.push('');
    
    if (content) {
      rssLines.push(`    <content:encoded><![CDATA[${content}]]></content:encoded>`);
    }
    
    rssLines.push('  </item>');
  });
  
  rssLines.push('</channel>');
  rssLines.push('</rss>');
  
  fs.writeFileSync(rssPath, rssLines.join('\n'));
  console.log(`RSS feed generated successfully with ${sortedPieces.length} pieces`);
} catch (error) {
  console.error('Error generating RSS feed:', error);
  process.exit(1);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
