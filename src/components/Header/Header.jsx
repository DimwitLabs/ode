import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";

import LampToggle from "../LampToggle/LampToggle";

import "./Header.scss";

function Header({ config }) {
  const location = useLocation();
  const params = useParams();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 576);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!config?.site) return null;
  const { site } = config;
  const isHome = location.pathname === "/";
  const isCollection = location.pathname.startsWith("/reader/");

  const collection = isCollection 
    ? location.pathname.split('/reader/')[1] 
    : params.collection;

  let titleClass = "site-title";
  if (isMobile) {
    titleClass += " medium";
  } else {
    titleClass += isHome ? " large" : " small";
  }

  return (
    <>
      <Helmet>
        <title>{site.title}</title>
        <meta name="description" content={site.description} />
        <meta property="og:title" content={site.title} />
        <meta property="og:description" content={site.description} />
        <meta property="og:url" content={site.url} />
        <meta property="og:type" content="website" />
      </Helmet>
      {isCollection ? (
        <header className="header-bar">
          <div className="header-left collection-view">
            <Link to="/" className="close-button">
              {config?.ui?.close || "Close"}
            </Link>
            <span className="separator">|</span>
            <span className="collection-title">{collection}</span>
          </div>
          <div className="header-right">
            <LampToggle />
          </div>
        </header>
      ) : (
        <header className="header-bar">
          <div className="header-left">
            <Link to="/" className={titleClass}>
              {site.title}
            </Link>
            <p className="site-author">by {site.author}</p>
          </div>
          <div className="header-right">
            <LampToggle />
          </div>
        </header>
      )}
    </>
  );
}

export default Header;