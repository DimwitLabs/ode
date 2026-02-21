import { useEffect, useState } from 'react';
import { loadConfig } from '../../utils/loadConfig';
import './WordsWasted.scss';

function WordsWasted() {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      loadConfig(),
      fetch('/generated/index/stats.json').then(r => r.json())
    ])
      .then(([configData, statsData]) => {
        setConfig(configData);
        setStats(statsData);
      })
      .catch(console.error);
  }, []);

  if (!config || !stats) {
    return null;
  }

  const formatString = config.ui?.wordsWasted || '{words} words wasted across {pieces} pieces';
  const displayText = formatString
    .replace('{words}', `<strong>${stats.words.toLocaleString()}</strong>`)
    .replace('{pieces}', `<strong>${stats.pieces.toLocaleString()}</strong>`);

  return (
    <div className="words-wasted">
      <p dangerouslySetInnerHTML={{ __html: displayText }} />
    </div>
  );
}

export default WordsWasted;
