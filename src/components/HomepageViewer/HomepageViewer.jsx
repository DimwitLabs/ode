import ReactMarkdown from 'react-markdown';

import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { parseMarkdown } from '../../utils/parseMarkdown';
import { resolveContentPath } from '../../utils/resolveContentPath';
import { loadConfig } from '../../utils/loadConfig';

import './HomepageViewer.scss';

function HomepageViewer({ siteTitle }) {
  const location = useLocation();
  const [pageContent, setPageContent] = useState(null);
  const [pieceMetadata, setPieceMetadata] = useState(null);
  const [config, setConfig] = useState(null);
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
        const configData = await loadConfig();
        setConfig(configData);
        
        const { content, frontmatter } = await parseMarkdown(contentPath);
        setPageContent({ content, frontmatter });
        
        if (contentPath.includes('/pieces/')) {
          const piecesResponse = await fetch('/index/pieces.json');
          const pieces = await piecesResponse.json();
          const slug = contentPath.split('/pieces/')[1].replace('.md', '');
          const metadata = pieces.find(p => p.slug === slug);
          setPieceMetadata(metadata);
        } else {
          setPieceMetadata(null);
        }
        
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

  return <div className="homepage-viewer">
    <article>
      {pageContent.frontmatter?.title && pieceMetadata && pieceMetadata.collections && pieceMetadata.collections.length > 0 ? (
        <div className="title-wrapper">
          <Link to={`/reader/${pieceMetadata.collections[0]}?piece=${pieceMetadata.slug}&position=1`}>
            <h2>{pageContent.frontmatter.title}</h2>
          </Link>
          {location.pathname === '/' && config?.ui?.labels?.new && (
            <span className="new-label">{config.ui.labels.new}</span>
          )}
        </div>
      ) : pageContent.frontmatter?.title ? (
        <div className="title-wrapper">
          <h2>{pageContent.frontmatter.title}</h2>
          {location.pathname === '/' && config?.ui?.labels?.new && (
            <span className="new-label">{config.ui.labels.new}</span>
          )}
        </div>
      ) : null}
      {pieceMetadata && (
        <div className="piece-metadata">
          {pieceMetadata.collections && pieceMetadata.collections.length > 0 && (
            <span className="piece-collections">
              {pieceMetadata.collections.map((collection, index) => (
                <span key={collection}>
                  {index > 0 && ', '}
                  <Link to={`/reader/${collection}?piece=${pieceMetadata.slug}&position=1`} className="collection-link">
                    {collection}
                  </Link>
                </span>
              ))}
            </span>
          )}
          {pieceMetadata.date && (
            <span className="piece-date">{pieceMetadata.date}</span>
          )}
        </div>
      )}
      <ReactMarkdown>{pageContent.content}</ReactMarkdown>
    </article>
  </div>;
}

export default HomepageViewer;
