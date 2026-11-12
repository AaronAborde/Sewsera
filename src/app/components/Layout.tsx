import { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Bell, User, Scissors } from 'lucide-react';
import { SideNav } from './SideNav';
import { BottomNav } from './BottomNav';
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

  const profilePath = userRole ? `/${userRole}/profile` : '/';

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
                <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <Bell size={18} style={{ color: C.dark }} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: C.primary }} />
                </button>
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
              <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Bell size={18} style={{ color: C.dark }} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: C.primary }} />
              </button>
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