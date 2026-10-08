// import { Navigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

/**
 * Wrap any <Route element={...}> with this to enforce login and,
 * optionally, specific roles.
 *
 *   <Route path="/dashboard" element={
 *     <ProtectedRoute><Dashboard /></ProtectedRoute>
 *   } />
 *
 *   <Route path="/admin" element={
 *     <ProtectedRoute allowedRoles={["admin"]}><AdminPanel /></ProtectedRoute>
 *   } />
 *
 * Not logged in -> bounced to /login.
 * Logged in but wrong role -> bounced to /dashboard (not a 403 page,
 * since a logged-in user just landing somewhere they can't use isn't
 * an error state -- send them back to something they *can* use).
 */
// function ProtectedRoute({ children, allowedRoles }) {
//   const { isAuthenticated, role } = useAuth();

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   if (allowedRoles && !allowedRoles.includes(role)) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// }

// export default ProtectedRoute;
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();

  // User is not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no specific roles are required,
  // any authenticated user can access the route.
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  // User has the wrong role
  if (!allowedRoles.includes(role)) {
    // Send them to their own dashboard
    if (role === "dermatologist") {
      return <Navigate to="/dermatologist" replace />;
    }

    if (role === "consultant") {
      return <Navigate to="/consultant" replace />;
    }

    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    // Normal user
    return <Navigate to="/dashboard" replace />;
  }

  // Correct role
  return children;
}

export default ProtectedRoute;
