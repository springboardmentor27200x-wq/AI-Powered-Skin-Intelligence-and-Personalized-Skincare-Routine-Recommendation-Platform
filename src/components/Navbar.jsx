import { NavLink, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }

    navigate("/login");
  };

  return (
    <nav className="navbar">

      {/* LOGO */}

      <div
        className="navbar-logo"
        onClick={() => navigate("/home")}
      >
        SKINSENSE ✨
      </div>

      {/* NAVIGATION */}

      <div className="navbar-links">

        <NavLink to="/home">
          Home
        </NavLink>

        <NavLink to="/assessment">
          Assessment
        </NavLink>

        <NavLink to="/ingredients">
          Ingredients
        </NavLink>

        <NavLink to="/products">
          Products
        </NavLink>

        <NavLink to="/routine">
          Routine
        </NavLink>

        <NavLink to="/progress">
          Progress
        </NavLink>

      </div>

      {/* ACTIONS */}

      <div className="navbar-actions">

        <button
          className="profile-button"
          onClick={() => navigate("/profile")}
        >
          👤 Profile
        </button>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </nav>
  );
}

export default Navbar;