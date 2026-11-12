// src/app/components/NotificationsBell.tsx
import { useEffect, useRef, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Bell, MessageSquare, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNotificationCounts } from '../useNotifications';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F' };

interface Item {
  key: string;
  icon: ReactNode;
  label: string;
  path: string;
  color: string;
}

export function NotificationsBell() {
  const { userRole } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { unreadMessages, pendingOrders } = useNotificationCounts();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items: Item[] = [];
  if (unreadMessages > 0) {
    items.push({
      key: 'messages',
      icon: <MessageSquare size={15} />,
      label: `${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}`,
      path: `/${userRole}/messages`,
      color: C.teal,
    });
  }
  if (pendingOrders > 0) {
    items.push({
      key: 'orders',
      icon: <ShoppingBag size={15} />,
      label: `${pendingOrders} new fabric order${pendingOrders > 1 ? 's' : ''}`,
      path: '/seller/orders',
      color: C.primary,
    });
  }
  const total = unreadMessages + pendingOrders;

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={total > 0 ? `Notifications, ${total} new` : 'Notifications'}
        aria-expanded={open}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell size={18} style={{ color: C.dark }} />
        {total > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] flex items-center justify-center"
            style={{ background: C.primary }}
          >
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-72 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm" style={{ color: C.dark }}>Notifications</p>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-xs text-gray-400 text-center">You're all caught up.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setOpen(false);
                  navigate(item.path);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FDF5F2', color: item.color }}
                >
                  {item.icon}
                </span>
                <span className="text-sm" style={{ color: C.dark }}>{item.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
