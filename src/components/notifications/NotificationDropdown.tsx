import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  FileText,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  Trash2,
  CheckCircle2,
  HardHat,
  ShieldAlert,
  Inbox,
  X,
} from 'lucide-react';
import { AppNotification } from '../../types/advancedModules';
import { DataService } from '../../services/dataService';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onRefresh: () => void;
  onNavigateToModule: (moduleName: string) => void;
  onOpenChatWithPeer?: (peerId?: string) => void;
  onOpenFullCenter?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
  onNavigateToModule,
  onOpenChatWithPeer,
  onOpenFullCenter,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'messages' | 'ged' | 'reminders'>('all');

  if (!isOpen) return null;

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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

    if (notif.deepLink === 'chat') {
      onClose();
      if (onOpenChatWithPeer) {
        onOpenChatWithPeer(notif.recipientUserId || undefined);
      }
    } else if (notif.deepLink) {
      onClose();
      onNavigateToModule(notif.deepLink);
    }
  };

  // Filtrage par onglet
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'messages') {
      return (
        n.type === 'system' &&
        (n.title.toLowerCase().includes('message') || n.deepLink === 'chat')
      );
    }
    if (activeFilter === 'ged') {
      return (
        n.type === 'workflow' ||
        n.entityType === 'document' ||
        n.title.toLowerCase().includes('ged') ||
        n.title.toLowerCase().includes('chantier') ||
        n.title.toLowerCase().includes('plan')
      );
    }
    if (activeFilter === 'reminders') {
      return (
        n.type === 'alert' ||
        n.title.toLowerCase().includes('rappel') ||
        n.title.toLowerCase().includes('échéance') ||
        n.title.toLowerCase().includes('expiration') ||
        n.title.toLowerCase().includes('retard')
      );
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTimeAgo = (isoString: string) => {
    if (!isoString) return 'Récemment';
    try {
      const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
      if (diff < 60) return "À l'instant";
      if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
      if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
      return new Date(isoString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch {
      return 'Récemment';
    }
  };

  const getNotifIcon = (notif: AppNotification) => {
    if (notif.deepLink === 'chat' || notif.title.toLowerCase().includes('message')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4" />
        </div>
      );
    }
    if (notif.type === 'alert' || notif.priority === 'urgent' || notif.priority === 'high') {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    if (notif.entityType === 'document' || notif.type === 'workflow') {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-[#4FA33B] flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center shrink-0">
        <Info className="w-4 h-4" />
      </div>
    );
  };

  return (
    <>
      {/* Backdrop invisible pour fermer au clic extérieur */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu Déroulant Popover */}
      <div className="fixed right-3 sm:right-6 top-16 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[580px]">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3B7A2C]/15 text-[#3B7A2C] dark:text-[#4FA33B] flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#3B7A2C] text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Alertes & flux temps réel</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-[#3B7A2C] dark:text-[#4FA33B] hover:underline px-2 py-1"
                title="Tout marquer comme lu"
              >
                Tout lire
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto text-[11px] font-medium">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-[#3B7A2C] text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tous ({notifications.length})
          </button>
          <button
            onClick={() => setActiveFilter('messages')}
            className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'messages'
                ? 'bg-[#3B7A2C] text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveFilter('ged')}
            className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'ged'
                ? 'bg-[#3B7A2C] text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Chantiers & GED
          </button>
          <button
            onClick={() => setActiveFilter('reminders')}
            className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === 'reminders'
                ? 'bg-[#3B7A2C] text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Rappels & Alertes
          </button>
        </div>

        {/* Liste déroulante */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
              <Inbox className="w-8 h-8 mb-2 opacity-50 text-[#3B7A2C]" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Aucune notification dans cette rubrique
              </p>
              <p className="text-[11px] mt-0.5">Toutes vos alertes sont à jour</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 flex items-start gap-3 transition-colors cursor-pointer group ${
                  notif.read
                    ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-80'
                    : 'bg-[#3B7A2C]/5 dark:bg-[#3B7A2C]/10 hover:bg-[#3B7A2C]/10 dark:hover:bg-[#3B7A2C]/15 font-medium'
                }`}
              >
                {getNotifIcon(notif)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between mt-1.5 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      {notif.priority === 'urgent' && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-red-500/10 text-red-500">
                          Urgent
                        </span>
                      )}
                      {notif.deepLink && (
                        <span className="text-[10px] text-[#3B7A2C] dark:text-[#4FA33B] flex items-center gap-0.5 font-semibold group-hover:underline">
                          Voir <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {!notif.read && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkRead(e, notif.id)}
                        className="text-[10px] text-slate-400 hover:text-[#3B7A2C] dark:hover:text-[#4FA33B] flex items-center gap-1"
                        title="Marquer comme lu"
                      >
                        <CheckCheck className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer avec lien vers le modal complet */}
        <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenFullCenter) onOpenFullCenter();
            }}
            className="text-xs font-bold text-[#3B7A2C] dark:text-[#4FA33B] hover:underline"
          >
            Afficher toutes les notifications & archives →
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;
