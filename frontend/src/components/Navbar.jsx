import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./notificationbell";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", roles: ["user", "skincare_consultant", "dermatologist", "administrator"] },
  { to: "/skin-profile", label: "Skin Profile", roles: ["user"] },
  { to: "/lifestyle", label: "Lifestyle & Sleep", roles: ["user"] },
  { to: "/plan", label: "My Plan", roles: ["user"] },
  { to: "/ingredients", label: "Ingredients", roles: ["user"] },
  { to: "/progress", label: "Progress", roles: ["user"] },
  { to: "/products", label: "Products", roles: ["user"] },
  { to: "/my-products", label: "My Products", roles: ["user"] },
  { to: "/admin", label: "Admin", roles: ["administrator"] },
  { to: "/profile", label: "Profile", roles: ["user", "skincare_consultant", "dermatologist", "administrator"] },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleLinks = user ? NAV_LINKS.filter((l) => l.roles.includes(user.role)) : [];

  return (
    <header className="sticky top-0 z-10 border-b border-clay/70 bg-mist/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="shrink-0 whitespace-nowrap font-display text-lg tracking-tight text-ink">
          Skin Intelligence
        </Link>

        {user && (
          <nav className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto md:flex">
            {visibleLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`focus-ring shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
                    active ? "bg-clinical-500 text-white" : "text-ink/70 hover:bg-clinical-50 hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        <nav className="flex shrink-0 items-center gap-4 whitespace-nowrap text-sm">
          {user ? (
            <>
              <NotificationBell/>
              <span className="hidden font-mono text-xs uppercase tracking-wide text-clinical-600 lg:inline">
                {user.role.replace("_", " ")}
              </span>
              <span className="hidden text-ink/70 lg:inline">Hi, {user.full_name.split(" ")[0]}</span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="focus-ring rounded-full border border-clinical-500 px-4 py-1.5 text-clinical-600 transition hover:bg-clinical-50"
              >

                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="focus-ring rounded-full px-3 py-1.5 text-ink/80 hover:text-ink">
                Log in
              </Link>
              <Link
                to="/register"
                className="focus-ring rounded-full bg-clinical-500 px-4 py-1.5 text-white transition hover:bg-clinical-600"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>

      {user && (
        <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap border-t border-clay/60 px-4 py-2 md:hidden">
          {visibleLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`focus-ring shrink-0 rounded-full px-3 py-1 text-xs transition ${
                  active ? "bg-clinical-500 text-white" : "text-ink/70 hover:bg-clinical-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
