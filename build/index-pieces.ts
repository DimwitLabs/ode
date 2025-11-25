import fs from 'fs';
import path from 'path';
import fm from "front-matter";
import yaml from 'js-yaml';

const publicDir = path.join(__dirname, '..', 'public');
const piecesPath = path.join(publicDir, 'content', 'pieces');
const piecesIndexPath = path.join(publicDir, 'index', 'pieces.json');
const collectionsPath = path.join(publicDir, 'index', 'pieces-collections.json');
const errorsPath = path.join(publicDir, 'index', 'pieces-errors.json');
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
const excludedPieces = config?.exclude?.pieces || [];

const files = fs.readdirSync(piecesPath);
if (files.length === 0) {
  console.log('No files found in the pieces directory.');
  process.exit(0);
}

const index: Piece[] = [];
const errors: string[] = [];

files.forEach(file => {
  if (!file.endsWith('.md')) {
    return;
  }
  
  if (excludedPieces.includes(file)) {
    console.log(`Excluding: ${file} (listed in config.yaml)`);
    return;
  }
  
  const filePath = path.join(piecesPath, file);
  const stats = fs.statSync(filePath);
  if (stats.isFile()) {
    console.log(`Indexing: ${file}, Size: ${stats.size} bytes`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = fm<FrontMatter>(raw);
    
    const { title, date, categories, slug } = parsed.attributes;
    
    if (!title || typeof title !== 'string' || title.trim() === '') {
      console.warn(`Skipping ${file}: Missing or invalid title`);
      errors.push(file);
      return;
    }
    
    if (!date) {
      console.warn(`Skipping ${file}: Missing date`);
      errors.push(file);
      return;
    }
    
    const dateObj = date instanceof Date ? date : new Date(date as string);
    if (isNaN(dateObj.getTime())) {
      console.warn(`Skipping ${file}: Invalid date`);
      errors.push(file);
      return;
    }

    const dateString = dateObj.toISOString().split('T')[0];
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      console.warn(`Skipping ${file}: Missing or invalid categories (must be non-empty array)`);
      errors.push(file);
      return;
    }
    
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      console.warn(`Skipping ${file}: Missing or invalid slug`);
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
console.log(`pieces.json created successfully with ${index.length} entries.`);

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

  console.log(`Sorting collection "${collection.name}" ${order} order, using ${readerOrderConfig[collection.name] ? 'custom' : 'default'} setting.`);
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
console.log(`collections.json created successfully with ${collections.length} categories and ${pieces.length} total pieces.`);

fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2));
if (errors.length > 0) {
  console.log(`${errors.length} file(s) skipped due to missing front matter. See errors.json for details.`);
} else {
  console.log('All files processed successfully.');
}