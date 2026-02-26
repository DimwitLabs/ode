import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const publicDir = path.join(__dirname, '..', 'public');
const piecesJsonPath = path.join(publicDir, 'generated', 'index', 'pieces.json');
const collectionsJsonPath = path.join(publicDir, 'generated', 'index', 'pieces-collections.json');
const configPath = path.join(publicDir, 'config.yaml');

const config = yaml.load(fs.readFileSync(configPath, 'utf-8')) as {
  bodyOfWork?: {
    title?: string;
    slug?: string;
    order?: string;
  };
};

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

const bodyOfWorkOrder = config?.bodyOfWork?.order || 'descending';

if (bodyOfWorkOrder !== 'ascending' && bodyOfWorkOrder !== 'descending') {
  throw new Error(`Invalid order "${bodyOfWorkOrder}" in config.yaml bodyOfWork.order. Must be "ascending" or "descending".`);
}

console.log(`[body-of-work]: sorting in ${bodyOfWorkOrder} order`);

const sortedKeys = Object.keys(grouped).sort((a, b) => {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return bodyOfWorkOrder === 'ascending' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
});

const bodyOfWorkTitle = config?.bodyOfWork?.title || 'Body of Work';
const bodyOfWorkSlug = config?.bodyOfWork?.slug || 'body-of-work';
const bodyOfWorkFilePath = path.join(publicDir, 'content', 'pages', `${bodyOfWorkSlug}.md`);

let markdown = '---\n';
markdown += `title: "${bodyOfWorkTitle}"\n`;
markdown += `slug: "${bodyOfWorkSlug}"\n`;
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

fs.writeFileSync(bodyOfWorkFilePath, markdown);

console.log(`[body-of-work]: generated ${bodyOfWorkSlug}.md with ${pieces.length} pieces across ${sortedKeys.length} months`);
