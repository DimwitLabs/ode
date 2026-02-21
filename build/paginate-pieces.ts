import fs from 'fs';
import path from 'path';
import fm from "front-matter";

const publicDir = path.join(__dirname, '..', 'public');
const piecesPath = path.join(publicDir, 'content', 'pieces');
const pagesIndexPath = path.join(publicDir, 'generated', 'index', 'pieces-pages.json');
const piecesIndexPath = path.join(publicDir, 'generated', 'index', 'pieces.json');

const CHARS_PER_PAGE = 2200;

type PiecePage = {
  pieceSlug: string;
  pageNumber: number;
  content: string;
  totalPages: number;
};

type PiecePageIndex = {
  [pieceSlug: string]: {
    totalPages: number;
    pages: PiecePage[];
  };
};

function chunkContent(content: string, charsPerPage: number): string[] {
  const chunks: string[] = [];
  const paragraphs = content.split('\n\n');
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;
    
    if (currentChunk.length > 0 && (currentChunk.length + trimmedParagraph.length + 2) > charsPerPage) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    
    if (trimmedParagraph.length > charsPerPage) {
      const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [trimmedParagraph];
      
      for (const sentence of sentences) {
        if (currentChunk.length > 0 && (currentChunk.length + sentence.length) > charsPerPage) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      }
      currentChunk += '\n\n';
    } else {
      currentChunk += trimmedParagraph + '\n\n';
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  if (chunks.length === 0) {
    chunks.push(content);
  }
  
  return chunks;
}

const piecesIndexRaw = fs.readFileSync(piecesIndexPath, 'utf-8');
const piecesIndex = JSON.parse(piecesIndexRaw);

const pageIndex: PiecePageIndex = {};

piecesIndex.forEach((piece: any) => {
  const { slug } = piece;
  const filePath = path.join(piecesPath, `${slug}.md`);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found for slug: ${slug}`);
    return;
  }
  
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = fm(raw);
  const content = parsed.body;
  
  const chunks = chunkContent(content, CHARS_PER_PAGE);
  const totalPages = chunks.length;
  
  const pages: PiecePage[] = chunks.map((chunk, index) => ({
    pieceSlug: slug,
    pageNumber: index + 1,
    content: chunk,
    totalPages
  }));
  
  pageIndex[slug] = {
    totalPages,
    pages
  };
  
  console.log(`Paginated ${slug}: ${totalPages} page(s)`);
});

fs.writeFileSync(pagesIndexPath, JSON.stringify(pageIndex, null, 2));
console.log(`\nCreated pieces-pages.json with ${Object.keys(pageIndex).length} pieces.`);
