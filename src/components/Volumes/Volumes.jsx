import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadConfig } from '../../utils/loadConfig';
import './Volumes.scss';

function Volumes() {
  const [collections, setCollections] = useState([]);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/generated/index/pieces-collections.json').then(r => r.json()),
      loadConfig()
    ])
      .then(([collectionsData, configData]) => {
        setCollections(collectionsData);
        setConfig(configData);
      })
      .catch(error => console.error('[volumes]: error loading data:', error));
  }, []);

  if (collections.length === 0) {
    return null;
  }

  return (
    <div className="volumes">
      <h4>{config?.ui?.labels?.volumes || 'Volumes'}</h4>
      <nav className="volumes-list">
        {collections.map((collection) => (
          <Link 
            key={collection.name} 
            to={`/reader/${collection.name}`}
            className="volume-link"
          >
            {collection.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default Volumes;
