import { createBrowserRouter, Navigate } from 'react-router';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VerifyOtp from './pages/auth/VerifyOtp';
import CustomerHome from './pages/customer/CustomerHome';
import Discover from './pages/customer/Discover';
import MapPage from './pages/customer/MapPage';
import TailorProfile from './pages/customer/TailorProfile';
import Booking from './pages/customer/Booking';
import CustomerOrders from './pages/customer/Projects';
import Messages from './pages/shared/Messages';
import Profile from './pages/shared/Profile';
import SetLocationPage from './pages/shared/SetLocationPage';
import TailorDashboard from './pages/tailor/TailorDashboard';
import Jobs from './pages/tailor/Jobs';
import Fabrics from './pages/tailor/Fabrics';
import FabricDetail from './pages/tailor/FabricDetail';
import Schedule from './pages/tailor/Schedule';
import Portfolio from './pages/tailor/Portfolio';
import SellerDashboard from './pages/seller/SellerDashboard';
import Orders from './pages/seller/Orders';
import Inventory from './pages/seller/Inventory';
import Shop from './pages/seller/Shop';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';

export const router = createBrowserRouter([
  { path: '/', Component: Landing },
  { path: '/onboarding', Component: Onboarding },
  { path: '/auth/login', Component: Login },
  { path: '/auth/signup', Component: Signup },
  { path: '/auth/verify-otp', Component: VerifyOtp },

  // Customer Routes
  { path: '/customer', Component: CustomerHome },
  { path: '/customer/discover', Component: Discover },
  { path: '/customer/map', Component: MapPage },
  { path: '/customer/tailor/:id', Component: TailorProfile },
  { path: '/customer/booking', Component: Booking },
  { path: '/customer/orders', Component: CustomerOrders },
  { path: '/customer/projects', element: <Navigate to="/customer/orders" replace /> },
  { path: '/customer/messages', Component: Messages },
  { path: '/customer/profile', Component: Profile },

  // Tailor Routes
  { path: '/tailor', Component: TailorDashboard },
  { path: '/tailor/jobs', Component: Jobs },
  { path: '/tailor/fabrics', Component: Fabrics },
  { path: '/tailor/fabric/:id', Component: FabricDetail },
  { path: '/tailor/schedule', Component: Schedule },
  { path: '/tailor/portfolio', Component: Portfolio },
  { path: '/tailor/location', element: <SetLocationPage collectionName="tailors" /> },
  { path: '/tailor/messages', Component: Messages },
  { path: '/tailor/profile', Component: Profile },

  // Seller Routes
  { path: '/seller', Component: SellerDashboard },
  { path: '/seller/orders', Component: Orders },
  { path: '/seller/inventory', Component: Inventory },
  { path: '/seller/shop', Component: Shop },
  { path: '/seller/location', element: <SetLocationPage collectionName="sellers" /> },
  { path: '/seller/messages', Component: Messages },
  { path: '/seller/profile', element: <Navigate to="/seller/shop" replace /> },

  // Admin Routes
  { path: '/admin', Component: AdminOverview },
  { path: '/admin/users', Component: AdminUsers },
  { path: '/admin/orders', Component: AdminOrders },
  { path: '/admin/profile', Component: Profile },

  // Fallback
  { path: '*', Component: Landing },
]);