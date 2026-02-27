import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const piecesJsonPath = path.join(publicDir, 'generated', 'index', 'pieces.json');
const piecesPagesJsonPath = path.join(publicDir, 'generated', 'index', 'pieces-pages.json');
const statsJsonPath = path.join(publicDir, 'generated', 'index', 'stats.json');

try {
  const piecesData = JSON.parse(fs.readFileSync(piecesJsonPath, 'utf-8'));
  const piecesCount = piecesData.length;
  const piecesPagesData = JSON.parse(fs.readFileSync(piecesPagesJsonPath, 'utf-8'));
  const pieceSlugs = Object.keys(piecesPagesData);

  const wordsCount = pieceSlugs.reduce((sum: number, slug: string) => {
    const piece = piecesPagesData[slug];
    const pages = piece.pages || [];
    const pieceWords = pages.reduce((pageSum: number, page: any) => {
      const wordCount = page.content?.split(/\s+/).filter((w: string) => w.length > 0).length || 0;
      return pageSum + wordCount;
    }, 0);   
    return sum + pieceWords;
  }, 0);
  
  const stats = {
    pieces: piecesCount,
    words: wordsCount
  }; 
  
  fs.writeFileSync(statsJsonPath, JSON.stringify(stats, null, 2));
  console.log(`[stats]: ${wordsCount.toLocaleString()} words across ${piecesCount} pieces`);
} catch (error) {
  console.error('[stats]: error calculating stats:', error);
  process.exit(1);
}
