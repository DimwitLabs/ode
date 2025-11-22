import { Link, useLocation } from "react-router-dom";
import LampToggle from "../LampToggle/LampToggle";
import "./Header.scss";

function Header({ config }) {
  const location = useLocation();
  if (!config?.site) return null;
  const { site } = config;
  const isHome = location.pathname === "/";

  return (
    <header className="header-bar">
      <div className="header-left">
        <Link to="/" className={`site-title ${isHome ? "large" : "small"}`}>
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