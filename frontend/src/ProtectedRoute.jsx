import { Navigate, useLocation } from "react-router-dom";
import { auth } from "./firebase";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!auth.currentUser) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children;
}
