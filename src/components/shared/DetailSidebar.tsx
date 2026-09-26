import React, { useRef, useEffect, useCallback } from 'react';
import { X, FileText, Download, ExternalLink } from 'lucide-react';

export interface SidebarAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
}

export interface SidebarDocument {
  id: string;
  title: string;
  type?: string;
  url?: string;
  date?: string;
}

interface DetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  referenceCode?: string;
  badge?: { text: string; color: string };
  actions?: SidebarAction[];
  documents?: SidebarDocument[];
  onDocumentClick?: (doc: SidebarDocument) => void;
  width?: 'default' | 'wide' | 'full';
  children: React.ReactNode;
}

export const DetailSidebar: React.FC<DetailSidebarProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  referenceCode,
  badge,
  actions,
  documents,
  onDocumentClick,
  width = 'default',
  children,
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside the sidebar panel
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  const widthClass =
    width === 'wide'
      ? 'w-full sm:w-[600px] lg:w-[720px]'
      : width === 'full'
      ? 'w-full sm:w-[85vw] lg:w-[70vw]'
      : 'w-full sm:w-[460px] lg:w-[500px]';

  const actionVariantClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-bold border-green-500 shadow-md shadow-green-700/20 active:scale-95';
      case 'danger':
        return 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/60 font-semibold active:scale-95';
      case 'success':
        return 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 font-semibold active:scale-95';
      default:
        return 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-semibold active:scale-95';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          isOpen
            ? 'opacity-100 pointer-events-auto bg-black/35 dark:bg-black/50 backdrop-blur-[3px]'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      >
        {/* Sidebar Panel */}
        <div
          ref={sidebarRef}
          className={`fixed top-0 right-0 bottom-0 z-50 ${widthClass} bg-white dark:bg-slate-900 border-l border-slate-200/70 dark:border-slate-800/70 shadow-[-12px_0_40px_rgba(59,122,44,0.08),-4px_0_20px_rgba(0,0,0,0.2)] flex flex-col transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="shrink-0 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200/70 dark:border-slate-800/70 navbar-glass">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* Reference Code + Badge */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {referenceCode && (
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/80 dark:to-emerald-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 shadow-xs">
                      {referenceCode}
                    </span>
                  )}
                  {badge && (
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border status-pill ${badge.color}`}
                    >
                      {badge.text}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug break-words">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words font-medium">{subtitle}</p>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="shrink-0 p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer active:scale-95 shadow-xs backdrop-blur-sm"
                title="Fermer (Echap)"
                aria-label="Fermer le volet lateral"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ─── SCROLLABLE CONTENT ─── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 space-y-5 text-sm text-slate-700 dark:text-slate-300">
            {children}

            {/* ─── DOCUMENTS ASSOCIÉS ─── */}
            {documents && documents.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Documents Associés ({documents.length})
                </h4>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => onDocumentClick?.(doc)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent hover:border-green-300 dark:hover:border-green-700 transition-all text-left group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-green-700 dark:text-green-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                          {doc.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {doc.type && <span>{doc.type}</span>}
                          {doc.type && doc.date && <span> • </span>}
                          {doc.date && <span>{doc.date}</span>}
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-green-600 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── ACTION BAR ─── */}
          {actions && actions.length > 0 && (
            <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center gap-2 flex-wrap">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`flex-1 sm:flex-initial min-w-[130px] justify-center px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${actionVariantClass(
                    action.variant
                  )}`}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ─── Reusable Section Components for DetailSidebar content ─── */

interface SidebarSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  icon,
  children,
}) => {
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
        {icon}
        {title}
      </h4>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
};

interface SidebarFieldProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}

export const SidebarField: React.FC<SidebarFieldProps> = ({
  label,
  value,
  mono = false,
  highlight = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800/40 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span
        className={`text-xs sm:text-right break-words ${
          mono ? 'font-mono' : ''
        } ${
          highlight
            ? 'font-bold text-slate-900 dark:text-white'
            : 'text-slate-700 dark:text-slate-300'
        }`}
      >
        {value}
      </span>
    </div>
  );
};

interface SidebarStatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const SidebarStatusBadge: React.FC<SidebarStatusBadgeProps> = ({
  status,
  variant = 'neutral',
}) => {
  const colorMap = {
    success: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
    warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    danger: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
    info: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <span className={`inline-flex text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${colorMap[variant]}`}>
      {status}
    </span>
  );
};

export const SidebarDivider: React.FC = () => (
  <hr className="border-slate-200 dark:border-slate-800" />
);
