import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/trading", label: "Trading" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/orders", label: "Orders" },
  { to: "/funds", label: "Funds" },
];

const TradingLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = useMemo(() => {
    const name = user?.username || "U";
    return name
      .split(" ")
      .slice(0, 2)
      .map((piece) => piece[0]?.toUpperCase())
      .join("");
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="trading-shell">
      <header className="trading-header">
        <div className="brand-wrap">
          <Link className="brand-logo" to="/dashboard">
            TradeDesk
          </Link>
        </div>
        <nav className="trading-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "trade-link active" : "trade-link")}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="profile-menu-wrap">
          <button className="avatar-btn" onClick={() => setMenuOpen((prev) => !prev)} type="button">
            <span className="avatar-chip">{initials}</span>
            <span className="avatar-name">{user?.username}</span>
          </button>
          {menuOpen ? (
            <div className="profile-dropdown">
              <p className="profile-row">{user?.username}</p>
              <p className="profile-row muted">{user?.email}</p>
              <Link className="profile-action" to="/profile" onClick={() => setMenuOpen(false)}>
                Profile
              </Link>
              <Link className="profile-action" to="/portfolio" onClick={() => setMenuOpen(false)}>
                Portfolio
              </Link>
              <button className="profile-action danger" type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <main className="trading-content">
        <Outlet />
      </main>
    </div>
  );
};

export default TradingLayout;
