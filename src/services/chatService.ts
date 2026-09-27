/**
 * chatService.ts - CORESI SARL
 * Service de messagerie instantanée collaborative entre tous les collaborateurs de l'entreprise.
 * Gère le stockage, la synchronisation temps réel, les accusés de lecture et les pièces jointes/vocaux.
 */

import { NotificationService } from './notificationService';

export interface ChatAttachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface CollaboratorMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderEmail?: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  recipientRole?: string;
  recipientEmail?: string;
  text: string;
  voiceUrl?: string | null;
  voiceDuration?: number;
  attachments?: ChatAttachment[];
  timestamp: string;
  isRead: boolean;
}

const STORAGE_KEY = 'coresi_direct_messages';

// Messages initiaux réalistes entre collaborateurs CORESI
const DEFAULT_MESSAGES: CollaboratorMessage[] = [
  {
    id: 'msg_init_1',
    conversationId: 'conv_user-dg_COR-03',
    senderId: 'COR-03',
    senderName: 'Willy Landry DJOPNANG',
    senderRole: 'Responsable Bureau d\'Études & Calculs',
    recipientId: 'user-dg',
    recipientName: 'Directeur Général',
    recipientRole: 'Direction Générale',
    text: 'Bonjour Monsieur le Directeur Général. Les notes de calcul de structure pour la passerelle métallique du terminal pétrolier de Kribi sont finalisées et prêtes pour validation.',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    isRead: true,
  },
  {
    id: 'msg_init_2',
    conversationId: 'conv_user-dg_COR-03',
    senderId: 'user-dg',
    senderName: 'Directeur Général',
    senderRole: 'Direction Générale',
    recipientId: 'COR-03',
    recipientName: 'Willy Landry DJOPNANG',
    recipientRole: 'Bureau d\'Études',
    text: 'Très bien Willy. Peux-tu me confirmer si le dimensionnement sous sollicitation dynamique respecte l\'Eurocode 3 et les exigences du client ?',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: true,
  },
  {
    id: 'msg_init_3',
    conversationId: 'conv_user-dg_COR-03',
    senderId: 'COR-03',
    senderName: 'Willy Landry DJOPNANG',
    senderRole: 'Responsable Bureau d\'Études & Calculs',
    recipientId: 'user-dg',
    recipientName: 'Directeur Général',
    recipientRole: 'Direction Générale',
    text: 'Absolument, coefficient de sécurité à 1.45 vérifié et contraintes admissibles conformes. Le rapport complet est disponible dans la GED.',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    isRead: false,
  },
  {
    id: 'msg_init_4',
    conversationId: 'conv_user-dg_COR-02',
    senderId: 'COR-02',
    senderName: 'Albertine BIYIHA MAINA',
    senderRole: 'Chef de Projet BTP & Ouvrages d\'Art',
    recipientId: 'user-dg',
    recipientName: 'Directeur Général',
    recipientRole: 'Direction Générale',
    text: 'Bonjour M. le DG, le coulage des radiers sur le lot 3 débutera demain à 06h00. Toutes les équipes de ferraillage et le laboratoire géotechnique sont mobilisés.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: false,
  }
];

// Helper stockage local
const getStoredMessages = (): CollaboratorMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MESSAGES));
      return DEFAULT_MESSAGES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error(e);
    return DEFAULT_MESSAGES;
  }
};

const saveStoredMessages = (messages: CollaboratorMessage[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error(e);
  }
};

// Normalisation robuste des identifiants utilisateurs et rôles
export const normalizeUserId = (id: string = ''): string => {
  if (!id) return 'user-dg';
  const clean = String(id).trim();
  if (clean === 'coresi-dg-user' || clean === 'dg' || clean === 'user-dg') return 'user-dg';
  if (clean === 'user-comptable' || clean === 'comptable' || clean === 'user-compta') return 'user-compta';
  if (clean === 'user-chef_projet' || clean === 'chef_projet' || clean === 'user-ct') return 'user-ct';
  if (clean === 'user-magasinier' || clean === 'magasinier' || clean === 'user-magasin') return 'user-magasin';
  if (clean === 'rh' || clean === 'user-rh') return 'user-rh';
  if (clean === 'admin' || clean === 'user-admin') return 'user-admin';
  return clean;
};

// Système de notification d'écoute temps réel
type ChatListener = (messages: CollaboratorMessage[]) => void;
const listeners: ChatListener[] = [];

export const ChatService = {
  normalizeUserId,

  getConversationId: (userAId: string, userBId: string): string => {
    const normA = normalizeUserId(userAId);
    const normB = normalizeUserId(userBId);
    const sorted = [normA, normB].sort();
    return `conv_${sorted[0]}_${sorted[1]}`;
  },

  getAllMessages: (): CollaboratorMessage[] => {
    return getStoredMessages();
  },

  getConversationMessages: (userAId: string, userBId: string): CollaboratorMessage[] => {
    const normA = normalizeUserId(userAId);
    const normB = normalizeUserId(userBId);
    const convId = ChatService.getConversationId(normA, normB);
    const all = getStoredMessages();
    return all.filter((m) => {
      if (m.conversationId === convId) return true;
      const s = normalizeUserId(m.senderId);
      const r = normalizeUserId(m.recipientId);
      return (s === normA && r === normB) || (s === normB && r === normA);
    });
  },

  getUnreadCountForUser: (userId: string): number => {
    const normUser = normalizeUserId(userId);
    const all = getStoredMessages();
    return all.filter((m) => normalizeUserId(m.recipientId) === normUser && !m.isRead).length;
  },

  getUnreadCount: (userId: string): number => {
    return ChatService.getUnreadCountForUser(userId);
  },

  getUnreadCountBetween: (userId: string, peerId: string): number => {
    const normUser = normalizeUserId(userId);
    const normPeer = normalizeUserId(peerId);
    const all = getStoredMessages();
    return all.filter((m) => {
      const s = normalizeUserId(m.senderId);
      const r = normalizeUserId(m.recipientId);
      return s === normPeer && r === normUser && !m.isRead;
    }).length;
  },

  sendMessage: async (params: {
    senderId: string;
    senderName: string;
    senderRole: string;
    senderEmail?: string;
    recipientId: string;
    recipientName: string;
    recipientRole?: string;
    recipientEmail?: string;
    text: string;
    voiceUrl?: string | null;
    voiceDuration?: number;
    attachments?: ChatAttachment[];
  }): Promise<CollaboratorMessage> => {
    const normSender = normalizeUserId(params.senderId);
    const normRecipient = normalizeUserId(params.recipientId);
    const conversationId = ChatService.getConversationId(normSender, normRecipient);
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    const newMsg: CollaboratorMessage = {
      id,
      conversationId,
      senderId: normSender,
      senderName: params.senderName,
      senderRole: params.senderRole,
      senderEmail: params.senderEmail,
      recipientId: normRecipient,
      recipientName: params.recipientName,
      recipientRole: params.recipientRole,
      recipientEmail: params.recipientEmail,
      text: params.text.trim(),
      voiceUrl: params.voiceUrl || null,
      voiceDuration: params.voiceDuration || 0,
      attachments: params.attachments || [],
      timestamp,
      isRead: false,
    };

    const current = getStoredMessages();
    current.push(newMsg);
    saveStoredMessages(current);

    // Déclencher un événement dans la fenêtre pour mise à jour instantanée
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coresi_chat_message', { detail: newMsg }));
    }

    listeners.forEach((cb) => {
      try {
        cb(current);
      } catch (err) {
        console.error(err);
      }
    });

    // Déclencher une notification interne pour le destinataire
    await NotificationService.notify({
      type: 'system',
      title: `Message de ${params.senderName}`,
      message: params.text ? (params.text.length > 80 ? params.text.slice(0, 80) + '...' : params.text) : 'Note vocale ou pièce jointe partagée',
      recipientRole: 'all',
      recipientUserId: normRecipient,
      priority: 'high',
      deepLink: 'chat',
    });

    return newMsg;
  },

  markConversationAsRead: (userId: string, peerId: string): void => {
    const normUser = normalizeUserId(userId);
    const normPeer = normalizeUserId(peerId);
    const convId = ChatService.getConversationId(normUser, normPeer);
    const all = getStoredMessages();
    let hasChanged = false;

    const updated = all.map((m) => {
      const mRecipient = normalizeUserId(m.recipientId);
      const mSender = normalizeUserId(m.senderId);
      const matches = m.conversationId === convId || (mRecipient === normUser && mSender === normPeer);
      if (matches && mRecipient === normUser && !m.isRead) {
        hasChanged = true;
        return { ...m, isRead: true };
      }
      return m;
    });

    if (hasChanged) {
      saveStoredMessages(updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('coresi_chat_read', { detail: { userId: normUser, peerId: normPeer } }));
      }
      listeners.forEach((cb) => cb(updated));
    }
  },

  subscribe: (callback: ChatListener): (() => void) => {
    listeners.push(callback);
    callback(getStoredMessages());

    const handleCustomEvent = () => {
      callback(getStoredMessages());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('coresi_chat_message', handleCustomEvent);
      window.addEventListener('coresi_chat_read', handleCustomEvent);
    }

    return () => {
      const idx = listeners.indexOf(callback);
      if (idx > -1) listeners.splice(idx, 1);
      if (typeof window !== 'undefined') {
        window.removeEventListener('coresi_chat_message', handleCustomEvent);
        window.removeEventListener('coresi_chat_read', handleCustomEvent);
      }
    };
  }
};
