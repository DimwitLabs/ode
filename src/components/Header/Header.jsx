import { Link } from "react-router-dom";
import LampToggle from "../LampToggle/LampToggle";
import "./Header.scss";

function Header({ site }) {
  if (!site) return null;

  return (
    <header className="header-bar">
      <div className="header-left">
        <Link to="/" className="site-title">
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