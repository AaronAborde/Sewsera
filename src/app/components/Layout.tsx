import { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { User, Scissors } from 'lucide-react';
import { SideNav } from './SideNav';
import { BottomNav } from './BottomNav';
import { NotificationsBell } from './NotificationsBell';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useApp } from '../context/AppContext';

const C = { primary: '#C4623F', dark: '#1A2B3C', bg: '#F5F0E8' };

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

export function Layout({ children, title, showHeader = true }: LayoutProps) {
  const { currentUser, userRole } = useApp();
  const navigate = useNavigate();

  const profilePath = userRole === 'seller' ? '/seller/shop' : userRole ? `/${userRole}/profile` : '/';

  return (
    <div className="flex min-h-screen" style={{ background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <SideNav />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile/Tablet Header */}
        {showHeader && (
          <header className="sticky top-0 z-30 bg-white border-b border-gray-100 md:hidden">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.primary }}>
                  <Scissors size={14} className="text-white" />
                </div>
                <span className="text-base" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>
                  {title || 'SewsEra'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <NotificationsBell />
                <button onClick={() => navigate(profilePath)} className="w-8 h-8 rounded-full" aria-label="Open profile">
                  <Avatar className="w-8 h-8">
                    {currentUser?.avatarUrl && <AvatarImage src={currentUser.avatarUrl} alt="" />}
                    <AvatarFallback className="text-white text-xs" style={{ background: C.primary }}>
                      {currentUser?.name?.slice(0, 2).toUpperCase() || <User size={14} />}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Desktop Header */}
        {showHeader && (
          <header className="hidden md:flex sticky top-0 z-30 bg-white border-b border-gray-100 items-center justify-between px-8 h-16">
            <div>
              <h1 className="text-lg" style={{ color: C.dark }}>{title || 'Dashboard'}</h1>
            </div>
            <div className="flex items-center gap-3">
              <NotificationsBell />
              <button onClick={() => navigate(profilePath)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
                <Avatar className="w-8 h-8">
                  {currentUser?.avatarUrl && <AvatarImage src={currentUser.avatarUrl} alt="" />}
                  <AvatarFallback className="text-white text-xs" style={{ background: C.primary }}>
                    {currentUser?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm" style={{ color: C.dark }}>{currentUser?.name}</span>
              </button>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}