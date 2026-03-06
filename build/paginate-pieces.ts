import fs from 'fs';
import path from 'path';
import fm from "front-matter";
import yaml from 'js-yaml';
import { chunkContent } from './utils/markdown-chunker';

const publicDir = path.join(__dirname, '..', 'public');
const piecesPath = path.join(publicDir, 'content', 'pieces');
const pagesIndexPath = path.join(publicDir, 'generated', 'index', 'pieces-pages.json');
const piecesIndexPath = path.join(publicDir, 'generated', 'index', 'pieces.json');
const configPath = path.join(publicDir, 'config.yaml');

const configRaw = fs.readFileSync(configPath, 'utf-8');
const config = yaml.load(configRaw) as any;
const CHARS_PER_PAGE = config?.reader?.charsPerPage ?? 2200;

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

const piecesIndexRaw = fs.readFileSync(piecesIndexPath, 'utf-8');
const piecesIndex = JSON.parse(piecesIndexRaw);

const pageIndex: PiecePageIndex = {};

piecesIndex.forEach((piece: any) => {
  const { slug } = piece;
  const filePath = path.join(piecesPath, `${slug}.md`);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`[pagination]: file not found for slug: ${slug}`);
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
  
  console.log(`[pagination]: ${slug}: ${totalPages} page(s)`);
});

fs.writeFileSync(pagesIndexPath, JSON.stringify(pageIndex, null, 2));
console.log(`[pagination]: created pieces-pages.json with ${Object.keys(pageIndex).length} pieces`);

