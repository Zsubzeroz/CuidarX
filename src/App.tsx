import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ClinicProvider } from "./contexts/ClinicContext";
import AppRoutes from "./routes";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "./components/Toast";

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <ClinicProvider>
            <AppRoutes />
            <Toaster />
          </ClinicProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}