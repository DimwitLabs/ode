import { Link, useLocation } from "react-router-dom";
import LampToggle from "../LampToggle/LampToggle";
import "./Header.scss";


import { useEffect, useState } from "react";

function Header({ config }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  if (!config?.site) return null;
  const { site } = config;
  const isHome = location.pathname === "/";

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 576);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  let titleClass = "site-title";
  if (isMobile) {
    titleClass += " medium";
  } else {
    titleClass += isHome ? " large" : " small";
  }

  return (
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
  );
}

export default Header;