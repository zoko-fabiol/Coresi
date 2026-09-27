import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Search,
  Mic,
  Paperclip,
  CheckCheck,
  Check,
  FileText,
  Download,
  Trash2,
  ArrowLeft,
  Users,
  Building2,
  Phone,
  Mail,
  HardHat,
  ShieldAlert,
  Calculator,
  Briefcase,
  User,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { ChatService, CollaboratorMessage, ChatAttachment } from '../../services/chatService';
import { iswHrService, ISWEmployee } from '../../services/iswHrService';
import { AudioMessagePlayer } from './AudioMessagePlayer';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';

interface CollaboratorContact {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  isOnline: boolean;
}

interface CollaboratorChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialPeerId?: string | null;
}

export const CollaboratorChatModal: React.FC<CollaboratorChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialPeerId,
}) => {
  const [messages, setMessages] = useState<CollaboratorMessage[]>([]);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(initialPeerId || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [showMobileList, setShowMobileList] = useState<boolean>(!initialPeerId);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  // 1. Charger la liste des collaborateurs (Employés ISW + Rôles système CORESI)
  const contacts: CollaboratorContact[] = useMemo(() => {
    const employees: ISWEmployee[] = (iswHrService.getEmployeesSync ? iswHrService.getEmployeesSync() : []) || [];
    const list: CollaboratorContact[] = [];

    // Ajouter les profils système de référence
    const systemStaff: CollaboratorContact[] = [
      {
        id: 'user-dg',
        name: 'Fabrice TCHOUENKAM',
        role: 'Directeur Général & Fondateur',
        department: 'Direction Générale',
        email: 'direction@coresi-cm.com',
        phone: '+237 677 88 99 00',
        isOnline: true,
      },
      {
        id: 'user-ct',
        name: 'Paul BIKELE',
        role: 'Conducteur de Travaux Principal',
        department: 'Chantiers & Montage',
        email: 'chantiers@coresi-cm.com',
        phone: '+237 699 11 22 33',
        isOnline: true,
      },
      {
        id: 'user-be',
        name: 'Willy Landry DJOPNANG',
        role: 'Responsable Bureau d\'Études & Calculs',
        department: 'Bureau d\'Études & R&D',
        email: 'etudes@coresi-cm.com',
        phone: '+237 670 44 55 66',
        isOnline: true,
      },
      {
        id: 'user-compta',
        name: 'Béatrice NGAKO',
        role: 'Chef Comptable & Financier',
        department: 'Finance & Comptabilité',
        email: 'compta@coresi-cm.com',
        phone: '+237 655 33 22 11',
        isOnline: true,
      },
      {
        id: 'user-rh',
        name: 'Marcelle EBONGO',
        role: 'Responsable Ressources Humaines & Paie',
        department: 'Ressources Humaines',
        email: 'rh@coresi-cm.com',
        phone: '+237 690 77 88 99',
        isOnline: false,
      },
      {
        id: 'user-hse',
        name: 'Ernest MBALLA',
        role: 'Ingénieur HSE & Sécurité Industrielle',
        department: 'Qualité & Sécurité HSE',
        email: 'hse@coresi-cm.com',
        phone: '+237 671 22 33 44',
        isOnline: true,
      },
      {
        id: 'user-magasin',
        name: 'Alain KOUAM',
        role: 'Responsable Magasin & Logistique Acier',
        department: 'Logistique & Approvisionnement',
        email: 'magasin@coresi-cm.com',
        phone: '+237 694 55 66 77',
        isOnline: true,
      },
    ];

    // Fusionner avec la liste des employés RH enregistrés
    const addedIds = new Set<string>();

    // Ne pas afficher l'utilisateur lui-même dans la liste de ses destinataires
    const currentId = currentUser?.uid || 'user-dg';

    systemStaff.forEach((s) => {
      if (s.id !== currentId) {
        list.push(s);
        addedIds.add(s.id);
      }
    });

    employees.forEach((emp, index) => {
      if (emp.id !== currentId && !addedIds.has(emp.id)) {
        list.push({
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          role: emp.role || 'Collaborateur Technique',
          department: emp.department || 'Production & Ateliers',
          email: emp.email || `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@coresi-cm.com`,
          phone: emp.phone,
          avatarUrl: emp.avatarUrl,
          isOnline: index % 2 === 0, // En ligne alterné
        });
        addedIds.add(emp.id);
      }
    });

    return list;
  }, [currentUser]);

  // Si pas de pair sélectionné, prendre le premier par défaut
  useEffect(() => {
    if (!selectedPeerId && contacts.length > 0) {
      setSelectedPeerId(initialPeerId || contacts[0].id);
    }
  }, [contacts, selectedPeerId, initialPeerId]);

  // 2. Synchronisation temps réel des messages
  useEffect(() => {
    const unsubscribe = ChatService.subscribe((allMessages) => {
      setMessages(allMessages);
    });
    return () => unsubscribe();
  }, []);

  // 3. Marquer comme lus les messages du pair actif
  useEffect(() => {
    if (isOpen && selectedPeerId && currentUser?.uid) {
      ChatService.markConversationAsRead(currentUser.uid, selectedPeerId);
    }
  }, [isOpen, selectedPeerId, currentUser?.uid, messages.length]);

  // 4. Auto scroll vers le bas à la réception/envoi de messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPeerId]);

  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedPeerId) || null;
  }, [contacts, selectedPeerId]);

  // Messages de la conversation en cours
  const activeConversationMessages = useMemo(() => {
    if (!selectedPeerId || !currentUser?.uid) return [];
    return ChatService.getConversationMessages(currentUser.uid, selectedPeerId);
  }, [messages, selectedPeerId, currentUser?.uid]);

  // Calcul du nombre de non lus par contact
  const unreadByContact = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!currentUser?.uid) return counts;

    messages.forEach((m) => {
      if (m.recipientId === currentUser.uid && !m.isRead) {
        counts[m.senderId] = (counts[m.senderId] || 0) + 1;
      }
    });
    return counts;
  }, [messages, currentUser?.uid]);

  // Dernier message par contact
  const lastMessageByContact = useMemo(() => {
    const map: Record<string, CollaboratorMessage> = {};
    if (!currentUser?.uid) return map;

    contacts.forEach((c) => {
      const conv = ChatService.getConversationMessages(currentUser.uid, c.id);
      if (conv.length > 0) {
        map[c.id] = conv[conv.length - 1];
      }
    });
    return map;
  }, [messages, contacts, currentUser?.uid]);

  // Filtrage des contacts
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  // Envoi de message texte / pièces jointes
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPeerId || !selectedContact) return;
    if (!inputText.trim() && pendingAttachments.length === 0) return;

    const currentUserId = currentUser?.uid || 'user-dg';
    const currentUserName = currentUser?.displayName || 'Directeur Général';
    const currentUserRole = currentUser?.role ? String(currentUser.role).toUpperCase() : 'DIRECTION';

    await ChatService.sendMessage({
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      senderEmail: currentUser?.email,
      recipientId: selectedContact.id,
      recipientName: selectedContact.name,
      recipientRole: selectedContact.role,
      recipientEmail: selectedContact.email,
      text: inputText.trim(),
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
    });

    setInputText('');
    setPendingAttachments([]);
  };

  // Envoi de note vocale
  const handleStopAndSendVoice = async () => {
    const res = await stopRecording();
    if (!res || !selectedPeerId || !selectedContact) return;

    const currentUserId = currentUser?.uid || 'user-dg';
    const currentUserName = currentUser?.displayName || 'Directeur Général';
    const currentUserRole = currentUser?.role ? String(currentUser.role).toUpperCase() : 'DIRECTION';

    await ChatService.sendMessage({
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      senderEmail: currentUser?.email,
      recipientId: selectedContact.id,
      recipientName: selectedContact.name,
      recipientRole: selectedContact.role,
      recipientEmail: selectedContact.email,
      text: '',
      voiceUrl: res.url,
      voiceDuration: res.duration,
    });
  };

  // Gestion des pièces jointes de fichiers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: ChatAttachment[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newAttachments.push({
        name: file.name,
        url,
        type: file.type || 'application/octet-stream',
        size: file.size,
      });
    });

    setPendingAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatMessageTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getRoleIcon = (dept: string) => {
    const d = dept.toLowerCase();
    if (d.includes('chantier') || d.includes('montage')) return <HardHat className="w-3.5 h-3.5 text-amber-500" />;
    if (d.includes('étude') || d.includes('calcul')) return <Calculator className="w-3.5 h-3.5 text-blue-500" />;
    if (d.includes('sécurité') || d.includes('hse')) return <ShieldAlert className="w-3.5 h-3.5 text-red-500" />;
    if (d.includes('finance') || d.includes('compt')) return <Briefcase className="w-3.5 h-3.5 text-emerald-500" />;
    return <Building2 className="w-3.5 h-3.5 text-slate-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[820px] flex overflow-hidden shadow-2xl relative">
        
        {/* =========================================================================
            COLONNE GAUCHE : ANNUAIRE & COLLABORATEURS
        ========================================================================= */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/70 dark:bg-slate-950/50 ${
            showMobileList ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Header Annuaire */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-[#4FA33B] flex items-center justify-center font-black">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Chat Collaborateurs
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Messagerie interne CORESI
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#3B7A2C]/15 text-[#3B7A2C] dark:text-[#4FA33B]">
                {contacts.length} actifs
              </span>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un collègue, poste..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B7A2C]"
              />
            </div>
          </div>

          {/* Liste déroulante des contacts */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1.5 space-y-1">
            {filteredContacts.map((contact) => {
              const isSelected = contact.id === selectedPeerId;
              const unread = unreadByContact[contact.id] || 0;
              const lastMsg = lastMessageByContact[contact.id];

              return (
                <button
                  key={contact.id}
                  onClick={() => {
                    setSelectedPeerId(contact.id);
                    setShowMobileList(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'bg-[#3B7A2C]/10 dark:bg-[#3B7A2C]/20 border border-[#3B7A2C]/30 shadow-xs'
                      : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {/* Avatar avec présence */}
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-10 h-10 rounded-full bg-[#3B7A2C]/20 text-[#3B7A2C] dark:text-[#4FA33B] flex items-center justify-center font-bold text-xs border border-[#3B7A2C]/30">
                      {contact.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    {contact.isOnline ? (
                      <span
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
                        title="En ligne"
                      />
                    ) : (
                      <span
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900"
                        title="Hors ligne"
                      />
                    )}
                  </div>

                  {/* Infos & Dernier message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {contact.name}
                      </p>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatMessageTime(lastMsg.timestamp)}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      {getRoleIcon(contact.department)}
                      <span>{contact.role}</span>
                    </p>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[190px]">
                        {lastMsg ? (
                          lastMsg.voiceUrl ? (
                            '🎤 Note vocale'
                          ) : (
                            lastMsg.text || 'Pièce jointe partagée'
                          )
                        ) : (
                          <span className="italic text-slate-400">Aucun échange</span>
                        )}
                      </p>

                      {unread > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#3B7A2C] text-white text-[10px] font-black shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer de profil actif */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#2D6020] text-white flex items-center justify-center font-bold text-xs">
                {currentUser?.displayName ? currentUser.displayName.charAt(0) : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {currentUser?.displayName || 'Utilisateur CORESI'}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Connecté ({currentUser?.role || 'Admin'})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLONNE DROITE : CONVERSATION ACTIVE
        ========================================================================= */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/40 dark:bg-slate-900/60 ${
            !showMobileList ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedContact ? (
            <>
              {/* Header Conversation */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#3B7A2C]/20 text-[#3B7A2C] dark:text-[#4FA33B] flex items-center justify-center font-bold text-sm border border-[#3B7A2C]/30">
                      {selectedContact.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    {selectedContact.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {selectedContact.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{selectedContact.role}</span>
                      <span>•</span>
                      <span className="text-[#3B7A2C] dark:text-[#4FA33B] font-medium">
                        {selectedContact.department}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions & Fermer */}
                <div className="flex items-center gap-1.5">
                  {selectedContact.phone && (
                    <a
                      href={`tel:${selectedContact.phone}`}
                      title={selectedContact.phone}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  {selectedContact.email && (
                    <a
                      href={`mailto:${selectedContact.email}`}
                      title={selectedContact.email}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Corps Messages Déroulants */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {activeConversationMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-[#4FA33B] flex items-center justify-center mb-3">
                      <Users className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Début de la discussion avec {selectedContact.name}
                    </p>
                    <p className="text-xs max-w-sm mt-1">
                      Échangez en temps réel sur les plans, notes de calcul, pointages ou chantiers. Vous pouvez envoyer du texte, des notes vocales ou des fichiers.
                    </p>
                  </div>
                ) : (
                  activeConversationMessages.map((msg) => {
                    const isOutgoing = msg.senderId === (currentUser?.uid || 'user-dg');

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
                      >
                        {/* Note Vocale */}
                        {msg.voiceUrl ? (
                          <div className="relative group">
                            <AudioMessagePlayer
                              src={msg.voiceUrl}
                              duration={msg.voiceDuration || 0}
                              isOutgoing={isOutgoing}
                              senderName={isOutgoing ? undefined : msg.senderName}
                              timestamp={msg.timestamp}
                              isRead={msg.isRead}
                            />
                            <div
                              className={`flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1 ${
                                isOutgoing ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <span>{formatMessageTime(msg.timestamp)}</span>
                              {isOutgoing && (
                                <CheckCheck
                                  className={`w-3.5 h-3.5 ${
                                    msg.isRead ? 'text-[#3B7A2C] dark:text-[#4FA33B]' : 'text-slate-400'
                                  }`}
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Message Texte ou Fichiers */
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs ${
                              isOutgoing
                                ? 'bg-[#2D6020] text-white rounded-tr-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700'
                            }`}
                          >
                            {!isOutgoing && (
                              <p className="text-[10px] font-bold text-[#3B7A2C] dark:text-[#4FA33B] mb-1">
                                {msg.senderName}
                              </p>
                            )}

                            {msg.text && (
                              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {msg.text}
                              </p>
                            )}

                            {/* Pièces jointes attachées */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-1.5 pt-2 border-t border-white/20 dark:border-slate-700">
                                {msg.attachments.map((att, idx) => (
                                  <a
                                    key={idx}
                                    href={att.url}
                                    download={att.name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center justify-between gap-2 p-2 rounded-xl text-xs transition-colors ${
                                      isOutgoing
                                        ? 'bg-white/15 hover:bg-white/25 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <FileText className="w-4 h-4 shrink-0" />
                                      <span className="truncate">{att.name}</span>
                                    </div>
                                    <Download className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                  </a>
                                ))}
                              </div>
                            )}

                            <div
                              className={`flex items-center gap-1 text-[10px] mt-1.5 ${
                                isOutgoing ? 'justify-end text-white/70' : 'justify-start text-slate-400'
                              }`}
                            >
                              <span>{formatMessageTime(msg.timestamp)}</span>
                              {isOutgoing && (
                                <CheckCheck
                                  className={`w-3.5 h-3.5 ${
                                    msg.isRead ? 'text-[#DCBB2B]' : 'text-white/60'
                                  }`}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Pièces jointes en attente d'envoi */}
              {pendingAttachments.length > 0 && (
                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                  {pendingAttachments.map((att, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#3B7A2C]" />
                      <span className="truncate max-w-[150px]">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => removePendingAttachment(index)}
                        className="text-slate-400 hover:text-red-500 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Zone de saisie / Enregistrement Vocal */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                {isRecording ? (
                  /* Interface d'enregistrement vocal en cours */
                  <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-2.5 px-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">
                        Enregistrement vocal en cours... {recordingDuration}s
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors"
                        title="Annuler l'enregistrement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleStopAndSendVoice}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B7A2C] hover:bg-[#2D6020] text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Envoyer</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Formulaire normal d'envoi */
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      className="hidden"
                    />

                    {/* Bouton Fichier Joint */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                      title="Joindre un fichier (PDF, plan, note...)"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Champ de texte */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl px-3 py-1.5 border border-transparent focus-within:border-[#3B7A2C] transition-all">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={`Écrire à ${selectedContact.name}... (Entrée pour envoyer)`}
                        rows={1}
                        className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none max-h-28"
                      />
                    </div>

                    {/* Bouton Micro ou Envoyer */}
                    {inputText.trim() || pendingAttachments.length > 0 ? (
                      <button
                        type="submit"
                        className="p-2.5 rounded-xl bg-[#3B7A2C] hover:bg-[#2D6020] text-white transition-transform active:scale-95 shrink-0 shadow-md"
                        title="Envoyer le message"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="p-2.5 rounded-xl bg-[#3B7A2C]/10 hover:bg-[#3B7A2C]/20 text-[#3B7A2C] dark:text-[#4FA33B] transition-transform active:scale-95 shrink-0"
                        title="Enregistrer une note vocale"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    )}
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 p-6">
              Sélectionnez un collaborateur pour ouvrir la discussion
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaboratorChatModal;
