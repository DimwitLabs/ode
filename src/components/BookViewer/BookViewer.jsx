import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { loadConfig } from '../../utils/loadConfig';
import './BookViewer.scss';
import Spinner from '../Spinner/Spinner';

function BookViewer() {
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [pagesIndex, setPagesIndex] = useState(null);
  const [collectionsIndex, setCollectionsIndex] = useState(null);
  const [piecesIndex, setPiecesIndex] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPieceIndex, setCurrentPieceIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(1);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [pagesRes, collectionsRes, piecesRes, configData] = await Promise.all([
          fetch('/generated/index/pieces-pages.json'),
          fetch('/generated/index/pieces-collections.json'),
          fetch('/generated/index/pieces.json'),
          loadConfig()
        ]);
        
        if (!pagesRes.ok || !collectionsRes.ok || !piecesRes.ok) {
          console.error('[reader]: failed to load index files');
          return;
        }

        const pagesData = await pagesRes.json();
        const collectionsData = await collectionsRes.json();
        const piecesData = await piecesRes.json();
        
        setPagesIndex(pagesData);
        setCollectionsIndex(collectionsData);
        setPiecesIndex(piecesData);
        setConfig(configData);
      } catch (error) {
        console.error('[reader]: error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!collectionsIndex || !pagesIndex) return;
    
    const pieceSlug = searchParams.get('piece');
    const positionNum = parseInt(searchParams.get('position') || '1', 10);
    
    const currentCollection = collectionsIndex.find(c => c.name === collection);
    if (!currentCollection || !currentCollection.pieces.length) return;
    
    if (pieceSlug) {
      const pieceIdx = currentCollection.pieces.indexOf(pieceSlug);
      if (pieceIdx !== -1) {
        setCurrentPieceIndex(pieceIdx);
        setCurrentPosition(positionNum);
      } else {
        const firstSlug = currentCollection.pieces[0];
        navigate(`/reader/${collection}?piece=${firstSlug}&position=1`, { replace: true });
      }
    } else {
      const firstSlug = currentCollection.pieces[0];
      navigate(`/reader/${collection}?piece=${firstSlug}&position=1`, { replace: true });
    }
  }, [collection, searchParams, collectionsIndex, pagesIndex, navigate]);

  useEffect(() => {
    document.body.classList.add('reading-mode');
    return () => {
      document.body.classList.remove('reading-mode');
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [collection, currentPieceIndex, currentPosition]);

  const handleNext = useCallback(() => {
    if (!collectionsIndex || !pagesIndex) return;
    
    const currentCollection = collectionsIndex.find(c => c.name === collection);
    if (!currentCollection) return;
    
    const currentPieceSlug = currentCollection.pieces[currentPieceIndex];
    const currentPieceData = pagesIndex[currentPieceSlug];
    
    if (!currentPieceData) return;
    
    if (currentPosition < currentPieceData.totalPages) {
      const nextPosition = currentPosition + 1;
      navigate(`/reader/${collection}?piece=${currentPieceSlug}&position=${nextPosition}`);
    } 
    else if (currentPieceIndex < currentCollection.pieces.length - 1) {
      const nextPieceSlug = currentCollection.pieces[currentPieceIndex + 1];
      navigate(`/reader/${collection}?piece=${nextPieceSlug}&position=1`);
    }
  }, [collectionsIndex, pagesIndex, collection, currentPieceIndex, currentPosition, navigate]);

  const handlePrevious = useCallback(() => {
    if (!collectionsIndex || !pagesIndex) return;
    
    const currentCollection = collectionsIndex.find(c => c.name === collection);
    if (!currentCollection) return;
    
    const currentPieceSlug = currentCollection.pieces[currentPieceIndex];
    
    if (currentPosition > 1) {
      const prevPosition = currentPosition - 1;
      navigate(`/reader/${collection}?piece=${currentPieceSlug}&position=${prevPosition}`);
    }
    else if (currentPieceIndex > 0) {
      const prevPieceSlug = currentCollection.pieces[currentPieceIndex - 1];
      const prevPieceData = pagesIndex[prevPieceSlug];
      if (prevPieceData) {
        navigate(`/reader/${collection}?piece=${prevPieceSlug}&position=${prevPieceData.totalPages}`);
      }
    }
  }, [collectionsIndex, pagesIndex, collection, currentPieceIndex, currentPosition, navigate]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext, handlePrevious]);

  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeDistance = touchStartX - touchEndX;
      
      if (Math.abs(swipeDistance) < minSwipeDistance) return;
      
      if (swipeDistance > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    };

    const handleWheelDebounced = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 10) {
        e.preventDefault();
        
        if (isNavigatingRef.current) {
          return;
        }
        
        isNavigatingRef.current = true;
        
        if (e.deltaX > 0) {
          handleNext();
        } else {
          handlePrevious();
        }
        
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 500);
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('wheel', handleWheelDebounced, { passive: false });
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheelDebounced);
    };
  }, [handleNext, handlePrevious]);

  const getTotalCollectionPositions = () => {
    if (!collectionsIndex || !pagesIndex) return 0;
    
    const currentCollection = collectionsIndex.find(c => c.name === collection);
    if (!currentCollection) return 0;
    
    return currentCollection.pieces.reduce((total, slug) => {
      const pieceData = pagesIndex[slug];
      return total + (pieceData?.totalPages || 0);
    }, 0);
  };

  const getCurrentAbsolutePosition = () => {
    if (!collectionsIndex || !pagesIndex) return 1;
    
    const currentCollection = collectionsIndex.find(c => c.name === collection);
    if (!currentCollection) return 1;
    
    let absolutePosition = 0;
    
    for (let i = 0; i < currentPieceIndex; i++) {
      const slug = currentCollection.pieces[i];
      const pieceData = pagesIndex[slug];
      absolutePosition += pieceData?.totalPages || 0;
    }
    
    absolutePosition += currentPosition;
    
    return absolutePosition;
  };

  if (loading || !pagesIndex || !collectionsIndex || !piecesIndex || !config) {
    return (
      <div className="book-viewer">
        <div className="book-viewer-content">
          <Spinner />
        </div>
      </div>
    );
  }

  const currentCollection = collectionsIndex.find(c => c.name === collection);
  
  if (!currentCollection || currentCollection.pieces.length === 0) {
    return (
      <div className="book-viewer">
        <div className="book-viewer-content">
          <h1>{collection}</h1>
          <p>{config?.ui?.labels?.noContent || 'No pieces found in this collection.'}</p>
        </div>
      </div>
    );
  }

  const currentPieceSlug = currentCollection.pieces[currentPieceIndex];
  const currentPieceData = pagesIndex[currentPieceSlug];
  
  if (!currentPieceData) {
    return (
      <div className="book-viewer">
        <div className="book-viewer-content">
          <p>{config?.ui?.labels?.errorLoading || 'Error loading content.'}</p>
        </div>
      </div>
    );
  }

  const positionData = currentPieceData.pages[currentPosition - 1];
  
  const disablePrevious = currentPieceIndex === 0 && currentPosition === 1;
  const disableNext = currentPieceIndex === currentCollection.pieces.length - 1 && currentPosition === currentPieceData.totalPages;
  
  const totalCollectionPositions = getTotalCollectionPositions();
  const absolutePosition = getCurrentAbsolutePosition();
  
  const pieceMetadata = piecesIndex?.find(p => p.slug === currentPieceSlug);
  const showTitle = currentPosition === 1;
  
  const contentLength = positionData.content.length;
  const allowBreaks = contentLength > 1200;

  return (
    <div className="book-viewer">
      <div className="book-viewer-content">
        <div className="page-navigation page-navigation-top">
          <button 
            className="nav-button prev" 
            onClick={handlePrevious}
            disabled={disablePrevious}
          >
            {config?.ui?.labels?.previous || 'Previous'}
          </button>
          <span className="page-counter">
            {config?.ui?.labels?.page || 'Page'} {absolutePosition} {config?.ui?.labels?.of || 'of'} {totalCollectionPositions}
          </span>
          <button 
            className="nav-button next" 
            onClick={handleNext}
            disabled={disableNext}
          >
            {config?.ui?.labels?.next || 'Next'}
          </button>
        </div>
        <div className="reading-panes">
          <article className="piece-article">
            <div className={`page-content ${allowBreaks ? 'allow-breaks' : ''}`}>
              {showTitle && pieceMetadata && (
                <div className="piece-header">
                  <Link to={`/${currentPieceSlug}`} className="piece-title-link">
                    <h2 className="piece-title">{pieceMetadata.title}</h2>
                  </Link>
                  <div className="piece-meta">
                    <span className="piece-date">{pieceMetadata.date}</span>
                  </div>
                </div>
              )}
              <ReactMarkdown>{positionData.content}</ReactMarkdown>
            </div>
          </article>
        </div>
        <div className="page-navigation">
          <button 
            className="nav-button prev" 
            onClick={handlePrevious}
            disabled={disablePrevious}
          >
            {config?.ui?.labels?.previous || 'Previous'}
          </button>
          <span className="page-counter">
            {config?.ui?.labels?.page || 'Page'} {absolutePosition} {config?.ui?.labels?.of || 'of'} {totalCollectionPositions}
          </span>
          <button 
            className="nav-button next" 
            onClick={handleNext}
            disabled={disableNext}
          >
            {config?.ui?.labels?.next || 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookViewer;
