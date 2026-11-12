import { useNavigate, useLocation } from 'react-router';
import {
  Home, Search, Map, FolderOpen, MessageSquare, LayoutDashboard, Briefcase,
  CalendarDays, Image, ClipboardList, Package, Store, User, Users, LogOut, Scissors
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNotificationCounts } from '../useNotifications';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const C = { primary: '#C4623F', dark: '#1A2B3C' };

interface NavItem { label: string; icon: React.ReactNode; path: string; }

export function SideNav() {
  const { userRole, setIsAuthenticated, setUserRole } = useApp();
  const { unreadMessages } = useNotificationCounts();
  const navigate = useNavigate();
  const location = useLocation();

  const customerItems: NavItem[] = [
    { label: 'Home', icon: <Home size={18} />, path: '/customer' },
    { label: 'Discover', icon: <Search size={18} />, path: '/customer/discover' },
    { label: 'Map', icon: <Map size={18} />, path: '/customer/map' },
    { label: 'My Orders', icon: <FolderOpen size={18} />, path: '/customer/orders' },
    { label: 'Messages', icon: <MessageSquare size={18} />, path: '/customer/messages' },
    { label: 'Profile', icon: <User size={18} />, path: '/customer/profile' },
  ];

  const tailorItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/tailor' },
    { label: 'Jobs', icon: <Briefcase size={18} />, path: '/tailor/jobs' },
    { label: 'Fabrics', icon: <Package size={18} />, path: '/tailor/fabrics' },
    { label: 'Schedule', icon: <CalendarDays size={18} />, path: '/tailor/schedule' },
    { label: 'Portfolio', icon: <Image size={18} />, path: '/tailor/portfolio' },
    { label: 'Messages', icon: <MessageSquare size={18} />, path: '/tailor/messages' },
    { label: 'Profile', icon: <User size={18} />, path: '/tailor/profile' },
  ];

  const sellerItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/seller' },
    { label: 'Orders', icon: <ClipboardList size={18} />, path: '/seller/orders' },
    { label: 'Inventory', icon: <Package size={18} />, path: '/seller/inventory' },
    { label: 'Messages', icon: <MessageSquare size={18} />, path: '/seller/messages' },
  ];

  const adminItems: NavItem[] = [
    { label: 'Overview', icon: <LayoutDashboard size={18} />, path: '/admin' },
    { label: 'Users', icon: <Users size={18} />, path: '/admin/users' },
    { label: 'Orders', icon: <ClipboardList size={18} />, path: '/admin/orders' },
    { label: 'Profile', icon: <User size={18} />, path: '/admin/profile' },
  ];

  const items = userRole === 'customer' ? customerItems : userRole === 'tailor' ? tailorItems : userRole === 'admin' ? adminItems : sellerItems;

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/');
  };

  return (
    <aside
      className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 border-r border-gray-100"
      style={{ background: C.dark }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.primary }}>
            <Scissors size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white text-base tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>SewsEra</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Marketplace</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {items.map(item => {
          const isActive = location.pathname === item.path;
          const badge = item.label === 'Messages' ? unreadMessages : 0;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: isActive ? C.primary : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
              }}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
              <span className="ml-auto flex items-center gap-2">
                {badge > 0 && (
                  <span
                    className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center text-white"
                    style={{ background: C.primary }}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/60" />}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10 space-y-0.5">
        {userRole === 'seller' && (
          <button
            onClick={() => navigate('/seller/shop')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
            style={{
              background: location.pathname === '/seller/shop' ? C.primary : 'transparent',
              color: location.pathname === '/seller/shop' ? 'white' : 'rgba(255,255,255,0.6)',
            }}
          >
            <Store size={18} />
            <span className="text-sm">Shop Profile</span>
            {location.pathname === '/seller/shop' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <LogOut size={18} />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
