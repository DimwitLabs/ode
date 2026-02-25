import fs from 'fs';
import path from 'path';
import fm from "front-matter";
import yaml from 'js-yaml';

const publicDir = path.join(__dirname, '..', 'public');
const piecesPath = path.join(publicDir, 'content', 'pieces');
const piecesIndexPath = path.join(publicDir, 'generated', 'index', 'pieces.json');
const collectionsPath = path.join(publicDir, 'generated', 'index', 'pieces-collections.json');
const errorsPath = path.join(publicDir, 'generated', 'index', 'pieces-errors.json');
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

type FrontMatter = {
  title?: string;
  date?: string | Date;
  categories?: string[];
  slug?: string;
};

const configRaw = fs.readFileSync(configPath, 'utf-8');
const config = yaml.load(configRaw) as any;
const rawExcludedPieces = (config?.exclude?.pieces || []).filter(Boolean);

const excludedPieces = rawExcludedPieces.map((piece: string | number) => {
  const pieceStr = String(piece);
  return pieceStr.endsWith('.md') ? pieceStr : `${pieceStr}.md`;
});

const files = fs.readdirSync(piecesPath);
if (files.length === 0) {
  console.log('[pieces]: no files found in pieces directory');
  process.exit(0);
}

const index: Piece[] = [];
const errors: string[] = [];

files.forEach(file => {
  if (!file.endsWith('.md')) {
    return;
  }
  
  if (excludedPieces.includes(file)) {
    console.log(`[pieces]: excluding ${file} (listed in config.yaml)`);
    return;
  }
  
  const filePath = path.join(piecesPath, file);
  const stats = fs.statSync(filePath);
  if (stats.isFile()) {
    console.log(`[pieces]: indexing ${file} (${stats.size} bytes)`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = fm<FrontMatter>(raw);
    
    const { title, date, categories, slug } = parsed.attributes;
    
    if (!title || typeof title !== 'string' || title.trim() === '') {
      console.warn(`[pieces]: skipping ${file}: missing or invalid title`);
      errors.push(file);
      return;
    }
    
    if (!date) {
      console.warn(`[pieces]: skipping ${file}: missing date`);
      errors.push(file);
      return;
    }
    
    const dateObj = date instanceof Date ? date : new Date(date as string);
    if (isNaN(dateObj.getTime())) {
      console.warn(`[pieces]: skipping ${file}: invalid date`);
      errors.push(file);
      return;
    }

    const dateString = dateObj.toISOString().split('T')[0];
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      console.warn(`[pieces]: skipping ${file}: missing or invalid categories`);
      errors.push(file);
      return;
    }
    
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      console.warn(`[pieces]: skipping ${file}: missing or invalid slug`);
      errors.push(file);
      return;
    }
    
    index.push({
      slug,
      title,
      date: dateString,
      collections: categories
    });
  }
});

index.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const piecesIndexDir = path.dirname(piecesIndexPath);

if (!fs.existsSync(piecesIndexDir)) {
  fs.mkdirSync(piecesIndexDir, { recursive: true });
}

fs.writeFileSync(piecesIndexPath, JSON.stringify(index, null, 2));
console.log(`[pieces]: created pieces.json with ${index.length} entries`);

const pieces: Piece[] = index;
const collectionsMap: { [key: string]: Collection } = {};

pieces.forEach(piece => {
  piece.collections.forEach(collectionName => {
    if (!collectionsMap[collectionName]) {
      collectionsMap[collectionName] = { name: collectionName, pieces: [], total: 0 };
    }
    collectionsMap[collectionName].total += 1;
    collectionsMap[collectionName].pieces.push(piece.slug);
  });
});

const collections = Object.values(collectionsMap);

const readerOrderConfig = config?.reader?.order || {};

if (readerOrderConfig['default']) {
  const defaultOrder = readerOrderConfig['default'];
  if (defaultOrder !== 'ascending' && defaultOrder !== 'descending') {
    throw new Error(`Invalid default order "${defaultOrder}" in config.yaml. Must be "ascending" or "descending".`);
  }
}

collections.forEach(collection => {
  const order = readerOrderConfig[collection.name] || readerOrderConfig['default'] || 'descending';
  
  if (order !== 'ascending' && order !== 'descending') {
    throw new Error(`Invalid order "${order}" for collection "${collection.name}". Must be "ascending" or "descending".`);
  }

  console.log(`[pieces]: sorting collection "${collection.name}" ${order} (${readerOrderConfig[collection.name] ? 'custom' : 'default'})`);
  collection.pieces.sort((a, b) => {
    const pieceA = pieces.find(p => p.slug === a);
    const pieceB = pieces.find(p => p.slug === b);
    if (!pieceA || !pieceB) return 0;
    const dateA = new Date(pieceA.date).getTime();
    const dateB = new Date(pieceB.date).getTime();
    return order === 'ascending' ? dateA - dateB : dateB - dateA;
  });
});

fs.writeFileSync(collectionsPath, JSON.stringify(collections, null, 2));
console.log(`[pieces]: created collections.json with ${collections.length} categories`);

fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2));
if (errors.length > 0) {
  console.log(`[pieces]: ${errors.length} files skipped (see errors.json)`);
} else {
  console.log('[pieces]: all files processed successfully');
}