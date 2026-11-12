import { useNavigate, useLocation } from 'react-router';
import { Home, Search, Map, FolderOpen, MessageSquare, LayoutDashboard, Briefcase, CalendarDays, Image, ClipboardList, Package, Store, Users, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F' };

interface NavItem { label: string; icon: React.ReactNode; path: string; }

export function BottomNav() {
  const { userRole } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const customerItems: NavItem[] = [
    { label: 'Home', icon: <Home size={20} />, path: '/customer' },
    { label: 'Discover', icon: <Search size={20} />, path: '/customer/discover' },
    { label: 'Map', icon: <Map size={20} />, path: '/customer/map' },
    { label: 'Projects', icon: <FolderOpen size={20} />, path: '/customer/projects' },
    { label: 'Messages', icon: <MessageSquare size={20} />, path: '/customer/messages' },
  ];

  const tailorItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/tailor' },
    { label: 'Jobs', icon: <Briefcase size={20} />, path: '/tailor/jobs' },
    { label: 'Schedule', icon: <CalendarDays size={20} />, path: '/tailor/schedule' },
    { label: 'Portfolio', icon: <Image size={20} />, path: '/tailor/portfolio' },
    { label: 'Messages', icon: <MessageSquare size={20} />, path: '/tailor/messages' },
  ];

  const sellerItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/seller' },
    { label: 'Orders', icon: <ClipboardList size={20} />, path: '/seller/orders' },
    { label: 'Inventory', icon: <Package size={20} />, path: '/seller/inventory' },
    { label: 'Messages', icon: <MessageSquare size={20} />, path: '/seller/messages' },
    { label: 'Shop', icon: <Store size={20} />, path: '/seller/shop' },
  ];

  const adminItems: NavItem[] = [
    { label: 'Overview', icon: <LayoutDashboard size={20} />, path: '/admin' },
    { label: 'Users', icon: <Users size={20} />, path: '/admin/users' },
    { label: 'Orders', icon: <ClipboardList size={20} />, path: '/admin/orders' },
    { label: 'Profile', icon: <User size={20} />, path: '/admin/profile' },
  ];

  const items = userRole === 'customer' ? customerItems : userRole === 'tailor' ? tailorItems : userRole === 'admin' ? adminItems : sellerItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 md:hidden safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[52px]"
              style={{ color: isActive ? C.primary : '#9CA3AF' }}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full" style={{ background: C.primary }} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
