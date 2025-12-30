import { Link, useLocation } from "react-router-dom";

/**
 * Header component with navigation.
 * Displays logo and nav links (Articles, external blog link).
 * Uses React Router's useLocation for active link highlighting.
 */
export function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">
          <span className="logo-icon">🔍</span>
          <span>ArticleSearch</span>
        </Link>

        <nav>
          <ul className="nav-links">
            <li>
              <Link
                to="/"
                className={location.pathname === "/" ? "active" : ""}
              >
                Articles
              </Link>
            </li>
            <li>
              <a
                href="https://beyondchats.com/blogs/"
                target="_blank"
                rel="noopener noreferrer"
              >
                BeyondChats Blog ↗
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
