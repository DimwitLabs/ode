import { loadConfig } from './loadConfig';

export async function resolveContentPath({ pathname }) {
  if (pathname === '/') {
    try {
      const res = await fetch('/index/pieces.json');
      const pieces = await res.json();
      if (pieces && pieces.length > 0) {
        const mostRecent = pieces[0];
        return `/content/pieces/${mostRecent.slug}.md`;
      }
      return null;
    } catch {
      return null;
    }
  } else {
    const slug = pathname.slice(1);
    let isPage = false;
    let isPiece = false;
    try {
      const pagesRes = await fetch('/index/pages.json');
      const pages = await pagesRes.json();
      isPage = pages.some(page => page.slug === slug);
    } catch (error) {
      console.log('Error fetching pages index:', error);
      isPage = false;
    }
    if (!isPage) {
      try {
        const piecesRes = await fetch('/index/pieces.json');
        const pieces = await piecesRes.json();
        isPiece = pieces.some(piece => piece.slug === slug);
      } catch (error) {
        console.log('Error fetching pieces index:', error);
        isPiece = false;
      }
    }
    if (isPage) {
      return `/content/pages/${slug}.md`;
    } else if (isPiece) {
      return `/content/pieces/${slug}.md`;
    } else {
      const config = await loadConfig();
      const notFoundSlug = config?.pages?.notFound || 'obscured';
      return `/content/pages/${notFoundSlug}.md`;
    }
  }
}
