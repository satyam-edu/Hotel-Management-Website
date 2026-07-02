import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { HomePage } from "./pages/public/HomePage";
import { AdminLogin } from "./features/admin/AdminLogin";
import { Dashboard } from "./pages/admin/Dashboard";
import { FrontDesk } from "./pages/admin/FrontDesk";
import { RoomMap } from "./pages/admin/RoomMap";
import { Ledger } from "./pages/admin/Ledger";
import { Settings } from "./pages/admin/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
        </Route>

        <Route path="/admin" element={<AdminLogin />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/front-desk" element={<FrontDesk />} />
          <Route path="/admin/room-map" element={<RoomMap />} />
          <Route path="/admin/ledger" element={<Ledger />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
