import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { parseMarkdown } from '../../utils/parseMarkdown';
import './HomepageViewer.scss';

function HomepageViewer() {
  const location = useLocation();
  const [pageContent, setPageContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError(null);

      let isHome = location.pathname === '/';
      let contentPath = '';
      if (isHome) {
        try {
          const res = await fetch('/index/pieces.json');
          const pieces = await res.json();
          if (pieces && pieces.length > 0) {
            const mostRecent = pieces[0];
            contentPath = `/content/pieces/${mostRecent.slug}.md`;
          } else {
            setError('No posts found');
            setLoading(false);
            return;
          }
        } catch (err) {
          setError('Could not load posts index');
          setLoading(false);
          return;
        }
      } else {
        const slug = location.pathname.slice(1);
        contentPath = `/content/pages/${slug}.md`;
      }

      try {
        const { content, frontmatter } = await parseMarkdown(contentPath);
        setPageContent({ content, frontmatter });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [location.pathname]);

  if (loading) {
    return <>
      <div className='loading'>
        <span className='ellipsis'></span>
      </div>
    </>;
  }

  if (error) {
    return <>
      <div className='error'>Error loading page: {error}</div>
    </>;
  }

  if (!pageContent) {
    return <>
      <div className='error'>Page not found</div>
    </>;
  }

  return <>
    <article>
      {pageContent.frontmatter?.title && (
        <h2>{pageContent.frontmatter.title}</h2>
      )}
      <ReactMarkdown>{pageContent.content}</ReactMarkdown>
    </article>
  </>;
}

export default HomepageViewer;
