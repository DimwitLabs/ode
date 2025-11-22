import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { parseMarkdown } from '../../utils/parseMarkdown';
import { resolveContentPath } from '../../utils/resolveContentPath';
import './HomepageViewer.scss';

function HomepageViewer({ siteTitle }) {
  const location = useLocation();
  const [pageContent, setPageContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError(null);

      const contentPath = await resolveContentPath({ pathname: location.pathname });
      if (!contentPath) {
        setError('No posts found');
        setLoading(false);
        return;
      }

      try {
        const { content, frontmatter } = await parseMarkdown(contentPath);
        setPageContent({ content, frontmatter });
        if (location.pathname === '/') {
          document.title = siteTitle;
        } else if (frontmatter?.title) {
          document.title = `${frontmatter.title} | ${siteTitle}`;
        } else {
          document.title = siteTitle;
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [location.pathname, siteTitle]);

  if (loading) {
    return <>
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
