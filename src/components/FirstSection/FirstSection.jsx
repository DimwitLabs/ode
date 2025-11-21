import React from 'react';
import Intro from '../Intro/Intro.jsx';
import RecentPiece from '../RecentPiece/RecentPiece.jsx';
import './FirstSection.scss';

function FirstSection({ site }) {
  return <div className='first-section'>
    <Intro />
    <RecentPiece />
  </div>;
}

export default FirstSection;
