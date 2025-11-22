import fs from 'fs';
import path from 'path';
import fm from "front-matter";

const piecesPath = './public/content/pieces/';
const indexPath = './public/content/pieces.json';
const collectionsPath = './public/content/collections.json';
const errorsPath = './public/content/errors.json';

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
};

const files = fs.readdirSync(piecesPath);
if (files.length === 0) {
  console.log('No files found in the pieces directory.');
  process.exit(0);
}

const index: Piece[] = [];
const errors: string[] = [];

files.forEach(file => {
  const filePath = path.join(piecesPath, file);
  const stats = fs.statSync(filePath);
  if (stats.isFile()) {
    console.log(`Indexing: ${file}, Size: ${stats.size} bytes`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = fm<FrontMatter>(raw);
    
    const { title, date, categories } = parsed.attributes;
    const slug = path.basename(file, path.extname(file));
    
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
    
    if (!slug || slug.trim() === '') {
      console.warn(`Skipping ${file}: Invalid filename`);
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
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
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
fs.writeFileSync(collectionsPath, JSON.stringify(collections, null, 2));
console.log(`collections.json created successfully with ${collections.length} categories and ${pieces.length} total pieces.`);

fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2));
if (errors.length > 0) {
  console.log(`${errors.length} file(s) skipped due to missing front matter. See errors.json for details.`);
} else {
  console.log('All files processed successfully.');
}