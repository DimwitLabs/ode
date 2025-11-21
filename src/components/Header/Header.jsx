import { Link } from "react-router-dom";
import "./Header.scss";

function Header({ site }) {
  if (!site) return null; // safety

  return (
    <header>
      <Link to="/" className="site-title">
        {site.title}
      </Link>
      <p className="site-author">by {site.author}</p>
    </header>
  );
}

export default Header;