import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Game from "./pages/Game";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
