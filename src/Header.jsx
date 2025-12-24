// Header.jsx (only the search part)
import { CartIcon } from './CartIcon';
import { ProfileDropdown } from './ProfileDropdown';
import './assets/styles.css';
import Logo from './Logo';

export function Header({ cartCount, username, onSearch }) {
  const handleSearchChange = (e) => {
    onSearch && onSearch(e.target.value);
  };

  return (
    <header className="header">
      <div className="header-content">
        <Logo />

        {/* Search bar exactly like screenshot */}
        <div className="search-bar">
          <span className="search-icon-left">
            {/* simple magnifier icon (SVG) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search Products & Brands"
            onChange={handleSearchChange}
          />
        </div>

        <div className="header-actions">
          <CartIcon count={cartCount} />
          <ProfileDropdown username={username} />
        </div>
      </div>
    </header>
  );
}
