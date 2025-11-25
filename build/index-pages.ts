import fs from 'fs';
import path from 'path';
import fm from "front-matter";
import yaml from 'js-yaml';

const publicDir = path.join(__dirname, '..', 'public');
const pagesPath = path.join(publicDir, 'content', 'pages');
const indexPath = path.join(publicDir, 'index', 'pages.json');
const errorsPath = path.join(publicDir, 'index', 'page-errors.json');
const configPath = path.join(publicDir, 'config.yaml');

type Page = {
  slug: string;
  title: string;
  date: string;
}

type FrontMatter = {
  title?: string;
  date?: string | Date;
  slug?: string;
};

const configRaw = fs.readFileSync(configPath, 'utf-8');
const config = yaml.load(configRaw) as any;
const rawNotFound = config?.pages?.notFound || 'obscured';
const notFoundFile = rawNotFound.endsWith('.md') ? rawNotFound : `${rawNotFound}.md`;
const rawExcludedPages = (config?.exclude?.pages || []).filter(Boolean);

const excludedPages = rawExcludedPages.map((page: string) => 
  page.endsWith('.md') ? page : `${page}.md`
);

if (!excludedPages.includes(notFoundFile)) {
  excludedPages.push(notFoundFile);
}

const files = fs.readdirSync(pagesPath);
if (files.length === 0) {
  console.log('No files found in the pages directory.');
  process.exit(0);
}

const index: Page[] = [];
const errors: string[] = [];

files.forEach(file => {
  if (!file.endsWith('.md')) {
    return;
  }
  
  if (excludedPages.includes(file)) {
    console.log(`Excluding: ${file} (listed in config.yaml)`);
    return;
  }
  
  const filePath = path.join(pagesPath, file);
  const stats = fs.statSync(filePath);
  if (stats.isFile()) {
    console.log(`Indexing: ${file}, Size: ${stats.size} bytes`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = fm<FrontMatter>(raw);
    
    const { title, date, slug } = parsed.attributes;
    
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
    
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      console.warn(`Skipping ${file}: Missing or invalid slug`);
      errors.push(file);
      return;
    }
    
    index.push({
      slug,
      title: title.trim(),
      date: new Date(date).toISOString()
    });
  }
});

const pagesOrder = config?.pages?.order || [];
if (pagesOrder.length > 0) {
  index.sort((a, b) => {
    const aIndex = pagesOrder.indexOf(a.slug);
    const bIndex = pagesOrder.indexOf(b.slug);
    
    if (aIndex === -1 && bIndex === -1) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });
} else {
  index.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
console.log(`pages.json created successfully with ${index.length} entries.`);

if (errors.length > 0) {
  fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2));
  console.log(`Errors logged for ${errors.length} files.`);
}
