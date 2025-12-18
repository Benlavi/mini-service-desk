import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TicketsPage from "./pages/TicketsPage";
import RequireAuth from "./auth/RequireAuth";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tickets" replace />} />
      <Route path="/login" element={<LoginPage /> } />
      <Route 
        path="/tickets"
        element={
          <RequireAuth>
            <TicketsPage />
          </RequireAuth>
        }
        />
      <Route path="*" element={<h2>404</h2>} />
    </Routes>
  );
}