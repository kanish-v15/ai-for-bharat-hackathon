import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, FlaskConical, MessageCircle, Stethoscope, UserCircle, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const TYPE_ICONS = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
  success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll } = useNotifications();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-gray-500 hover:text-primary-500 transition-colors border border-gray-200/60 relative"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden z-50 animate-slide-up">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm text-dark">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-primary-500 hover:text-primary-600 font-heading font-medium"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-gray-400 hover:text-red-500 font-heading font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-body">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => {
                const typeConfig = TYPE_ICONS[notif.type] || TYPE_ICONS.info;
                const Icon = typeConfig.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (notif.link) {
                        setOpen(false);
                        window.location.hash = ''; // navigate if needed
                      }
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors flex gap-3 ${
                      !notif.read ? 'bg-primary-50/30' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${typeConfig.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={14} className={typeConfig.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-heading font-medium truncate ${!notif.read ? 'text-dark' : 'text-gray-500'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-body truncate">{notif.message}</p>
                      <p className="text-[10px] text-gray-300 font-body mt-0.5">{timeAgo(notif.timestamp)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
