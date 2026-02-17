import Intro from '../Intro/Intro.jsx';
import HomepageViewer from '../HomepageViewer/HomepageViewer.jsx';
import Navigation from '../Navigation/Navigation.jsx';
import WordsWasted from '../WordsWasted/WordsWasted.jsx';
import Volumes from '../Volumes/Volumes.jsx';

import './HomeView.scss';

function HomeView({ config }) {
  const siteTitle = config?.site?.title || '';
  const author = config?.site?.author || '';
  const siteTagline = config?.site?.tagline || '';
  const fullTitle = author ? `${siteTitle} by ${author}` : siteTitle;
  
  return <div className='home-view'>
    <div className='sidebar'>
      <Navigation />
      <Intro />
      <WordsWasted />
      <Volumes />
    </div>
    <HomepageViewer siteTitle={fullTitle} siteTagline={siteTagline} />
  </div>;
}

export default HomeView;
