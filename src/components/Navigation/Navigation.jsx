import "./Navigation.scss";
import React from 'react';
import { NavLink, useNavigate } from "react-router-dom";
import { loadConfig } from '../../utils/loadConfig';


function Navigation() {
  const pagesIndexPath = '/index/pages.json';
  const piecesIndexPath = '/index/pieces.json';
  const [pages, setPages] = React.useState([]);
  const [pieces, setPieces] = React.useState([]);
  const [config, setConfig] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    Promise.all([
      fetch(pagesIndexPath).then(r => r.json()),
      fetch(piecesIndexPath).then(r => r.json()),
      loadConfig()
    ])
      .then(([pagesData, piecesData, configData]) => {
        setPages(pagesData);
        setPieces(piecesData);
        setConfig(configData);
      })
      .catch(error => console.error('Error loading data:', error));
  }, []);

  const handleRandomPiece = () => {
    if (pieces.length > 0) {
      const randomIndex = Math.floor(Math.random() * pieces.length);
      const randomPiece = pieces[randomIndex];
      navigate(`/${randomPiece.slug}`);
    }
  };

  return (
    <nav>
      <NavLink key="home" to="/">
        Home
      </NavLink>
      {pages.map((page) => (
        <NavLink key={page.slug} to={`/${page.slug}`}>
          {page.title}
        </NavLink>
      ))}
      <button onClick={handleRandomPiece} className="random-piece-button">
        {config?.ui?.labels?.randomPiece || 'Random Piece'}
      </button>
      <a href="/feed" target="_blank" rel="noopener noreferrer" className="rss-link">
        {config?.ui?.labels?.rss || 'RSS'}
      </a>
    </nav>
  );
}

export default Navigation;
