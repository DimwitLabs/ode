import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const publicDir = path.join(__dirname, '..', 'public');
const piecesJsonPath = path.join(publicDir, 'index', 'pieces.json');
const collectionsJsonPath = path.join(publicDir, 'index', 'pieces-collections.json');
const bodyOfWorkPath = path.join(publicDir, 'content', 'pages', 'body-of-work.md');
const configPath = path.join(publicDir, 'config.yaml');

type Piece = {
  slug: string;
  title: string;
  date: string;
  collections: string[];
};

type Collection = {
  name: string;
  total: number;
  pieces: string[];
};

const pieces: Piece[] = JSON.parse(fs.readFileSync(piecesJsonPath, 'utf-8'));
const collections: Collection[] = JSON.parse(fs.readFileSync(collectionsJsonPath, 'utf-8'));

const collectionsMap = new Map<string, string[]>();
collections.forEach(collection => {
  collection.pieces.forEach(slug => {
    if (!collectionsMap.has(slug)) {
      collectionsMap.set(slug, []);
    }
    collectionsMap.get(slug)!.push(collection.name);
  });
});

type GroupedPieces = {
  [key: string]: Piece[];
};

const grouped: GroupedPieces = {};

pieces.forEach(piece => {
  const date = new Date(piece.date);
  const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  if (!grouped[monthYear]) {
    grouped[monthYear] = [];
  }
  
  grouped[monthYear].push(piece);
});

const sortedKeys = Object.keys(grouped).sort((a, b) => {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return dateB.getTime() - dateA.getTime();
});

let markdown = '---\n';
markdown += 'title: "Body of Work"\n';
markdown += 'slug: "body-of-work"\n';
markdown += `date: ${new Date().toISOString()}\n`;
markdown += '---\n\n';

sortedKeys.forEach(monthYear => {
  markdown += `### ${monthYear}\n\n`;
  
  grouped[monthYear].forEach(piece => {
    const categories = collectionsMap.get(piece.slug) || piece.collections;
    const categoryStr = categories.join(', ');
    markdown += `- [${piece.title}](/${piece.slug}) | ${categoryStr}\n`;
  });
  
  markdown += '\n';
});

fs.writeFileSync(bodyOfWorkPath, markdown);

console.log(`Body of work page generated successfully at ${bodyOfWorkPath}`);
console.log(`Total pieces: ${pieces.length}`);
console.log(`Months covered: ${sortedKeys.length}`);
