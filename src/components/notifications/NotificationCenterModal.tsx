import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  X,
  ExternalLink,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { AppNotification } from '../../types/advancedModules';
import { DataService } from '../../services/dataService';

interface NotificationCenterModalProps {
  notifications: AppNotification[];
  onClose: () => void;
  onNavigateToModule: (moduleName: string) => void;
  onRefresh: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  notifications,
  onClose,
  onNavigateToModule,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await DataService.markNotificationRead(id);
    onRefresh();
  };

  const handleMarkAllRead = async () => {
    await DataService.markAllNotificationsRead();
    onRefresh();
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await DataService.markNotificationRead(notif.id);
      onRefresh();
    }
    if (notif.deepLink) {
      onNavigateToModule(notif.deepLink);
      onClose();
    }
  };

  const filteredNotifs = notifications.filter((n) => (filter === 'unread' ? !n.read : true));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Centre de Notifications</h3>
              <p className="text-xs text-slate-400">
                {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Toutes les alertes sont à jour'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                title="Tout marquer comme lu"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex bg-slate-950/60 p-2 gap-2 border-b border-slate-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              filter === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Toutes ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              filter === 'unread'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Non Lues ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
          {filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/40 relative group ${
                !notif.read ? 'bg-slate-800/20 border-l-4 border-cyan-400' : 'opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                      notif.priority === 'critical'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : notif.priority === 'high'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}
                  >
                    {notif.type}
                  </span>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  {notif.createdAt ? notif.createdAt.split('T')[0] : 'Récent'}
                </span>
              </div>

              <h4 className="font-bold text-white text-xs mb-1 group-hover:text-cyan-400 transition-colors">
                {notif.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>

              {notif.deepLink && (
                <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-bold mt-2 pt-2 border-t border-slate-800/40">
                  <span>Accéder au module {notif.deepLink}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              )}
            </div>
          ))}
          {filteredNotifs.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              Aucune notification trouvée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
