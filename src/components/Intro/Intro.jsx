import React from 'react';
import ReactMarkdown from 'react-markdown';

import './Intro.scss';

import { parseMarkdown } from '../../utils/parseMarkdown';

function Intro() {
  const [intro, setIntro] = React.useState(null);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    parseMarkdown('/content/intro.md')
      .then(({ content }) => setIntro(content))
      .catch(setError);
  }, []);

  if (error) {
    return <div style={{ color: 'red' }}>
      Error loading intro: {error.message}
    </div>;
  }

  if (!intro) {
    return <div></div>;
  }

  return <div className="intro">
    <ReactMarkdown>{intro}</ReactMarkdown>
  </div>;
}

export default Intro;
