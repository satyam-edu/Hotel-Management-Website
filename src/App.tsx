import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { HomePage } from "./pages/public/HomePage";
import { AdminLogin } from "./features/admin/AdminLogin";
import { Dashboard } from "./pages/admin/Dashboard";
import { Enquiries } from "./pages/admin/Enquiries";
import { FrontDesk } from "./pages/admin/FrontDesk";
import { RoomMap } from "./pages/admin/RoomMap";
import { AvailabilityCalendar } from "./pages/admin/AvailabilityCalendar";
import { Ledger } from "./pages/admin/Ledger";
import { Settings } from "./pages/admin/Settings";
import { PrintableInvoice } from "./components/billing/PrintableInvoice";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
          </Route>

          <Route path="/admin" element={<AdminLogin />} />

          <Route
            path="/admin/invoice/:reservationId"
            element={
              <ProtectedRoute>
                <PrintableInvoice />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/enquiries" element={<Enquiries />} />
            <Route path="/admin/front-desk" element={<FrontDesk />} />
            <Route path="/admin/room-map" element={<RoomMap />} />
            <Route
              path="/admin/availability-calendar"
              element={<AvailabilityCalendar />}
            />
            <Route path="/admin/ledger" element={<Ledger />} />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={["master_admin", "head_admin"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
