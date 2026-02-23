import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Login, Signup } from "./pages";
import HomePage from "./landing_page/home/HomePage";
import AboutPage from "./landing_page/about/AboutPage";
import ProductsPage from "./landing_page/products/ProductsPage";
import PricingPage from "./landing_page/pricing/PricingPage";
import SupportPage from "./landing_page/support/SupportPage";
import Navbar from "./landing_page/Navbar";
import Footer from "./landing_page/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import TradingLayout from "./trading/TradingLayout";
import DashboardPage from "./trading/DashboardPage";
import TradingPage from "./trading/TradingPage";
import PortfolioPage from "./trading/PortfolioPage";
import OrdersPage from "./trading/OrdersPage";
import FundsPage from "./trading/FundsPage";
import ProfilePage from "./trading/ProfilePage";

const App = () => {
  const location = useLocation();
  const protectedPaths = ["/dashboard", "/trading", "/portfolio", "/orders", "/funds", "/profile"];
  const isTradingRoute = protectedPaths.some((path) => location.pathname.startsWith(path));

  return (
    <div className="App">
      {!isTradingRoute ? <Navbar /> : null}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/product" element={<ProductsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/support" element={<SupportPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TradingLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="trading" element={<TradingPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="funds" element={<FundsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isTradingRoute ? <Footer /> : null}
    </div>
  );
};

export default App;
