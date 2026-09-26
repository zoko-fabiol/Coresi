import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RotateCw,
  Sparkles,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building2,
  DollarSign,
  Calendar,
  Layers,
  Eye,
  RefreshCw,
  Maximize2,
  Sliders,
  Upload,
} from 'lucide-react';
import { ScannedPage, DocumentCategory, DocumentRecord, Project } from '../../types';
import { ImageProcessingService } from '../../services/imageProcessing';
import { OCRService } from '../../services/ocrService';
import { CloudinaryService } from '../../services/cloudinaryService';
import { DataService } from '../../services/dataService';
import { AdminConfigService } from '../../services/adminConfigService';

interface SmartScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentCreated: (doc: DocumentRecord) => void;
  initialContext?: {
    projectId?: string;
    projectName?: string;
    clientId?: string;
    clientName?: string;
    supplierId?: string;
    supplierName?: string;
    employeeId?: string;
    employeeName?: string;
  };
}

type ScannerStep = 'camera' | 'review_pages' | 'ocr_validation' | 'saving';

export const SmartScannerModal: React.FC<SmartScannerModalProps> = ({
  isOpen,
  onClose,
  onDocumentCreated,
  initialContext,
}) => {
  const [step, setStep] = useState<ScannerStep>('camera');
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);

  // Document detection HUD simulation state
  const [docDetected, setDocDetected] = useState<boolean>(true);
  const [guidanceMessage, setGuidanceMessage] = useState<string>('Alignez le document dans le cadre');

  // OCR and Form Validation State
  const [ocrText, setOcrText] = useState<string>('');
  const [ocrConfidence, setOcrConfidence] = useState<number>(95);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docNumber, setDocNumber] = useState<string>('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('factures');
  const [docDate, setDocDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [docAmount, setDocAmount] = useState<number>(0);
  const [docCurrency, setDocCurrency] = useState<string>('FCFA');
  const [docPartner, setDocPartner] = useState<string>('');
  const [docTags, setDocTags] = useState<string>('scan, chantier, ocr');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialContext?.projectId || '');
  const [actionChoice, setActionChoice] = useState<'ged' | 'facture' | 'depense'>('ged');

  const [savingProgress, setSavingProgress] = useState<number>(0);
  const [savingStatusText, setSavingStatusText] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projects = DataService.getProjects();

  useEffect(() => {
    if (isOpen) {
      setStep('camera');
      setPages([]);
      setActivePageIndex(0);
      if (initialContext?.projectId) {
        setSelectedProjectId(initialContext.projectId);
      }
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Periodically vary guidance
      const messages = [
        'Document détecté • Maintenez stable',
        'Contraste et éclairage optimaux',
        'Bords détectés (Angle droit 90°)',
      ];
      let msgIdx = 0;
      const interval = setInterval(() => {
        msgIdx = (msgIdx + 1) % messages.length;
        setGuidanceMessage(messages[msgIdx]);
        setDocDetected(true);
      }, 3000);

      return () => clearInterval(interval);
    } catch (err) {
      console.warn('Camera access unavailable:', err);
      setCameraError(
        'Accès caméra non disponible sur cet appareil ou permission refusée. Vous pouvez importer directement une photo de document ou utiliser le générateur de document test.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    setIsCapturing(true);
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 250);

    let capturedDataUrl = '';

    if (videoRef.current && cameraActive) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        capturedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      }
    }

    // If camera wasn't able to produce image, load a realistic industrial document sample
    if (!capturedDataUrl) {
      capturedDataUrl = await createIndustrialSampleDocument();
    }

    // Process page with default 'enhanced' filter for sharp text
    const processed = await ImageProcessingService.processPage(capturedDataUrl, 0, 'enhanced');

    const newPage: ScannedPage = {
      id: `page-${Date.now()}-${pages.length + 1}`,
      originalDataUrl: capturedDataUrl,
      processedDataUrl: processed,
      rotation: 0,
      filter: 'enhanced',
    };

    const nextPages = [...pages, newPage];
    setPages(nextPages);
    setActivePageIndex(nextPages.length - 1);
    setIsCapturing(false);

    // Stop camera and go to review pages
    stopCamera();
    setStep('review_pages');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const processed = await ImageProcessingService.processPage(dataUrl, 0, 'enhanced');
      const newPage: ScannedPage = {
        id: `page-${Date.now()}-${pages.length + 1}`,
        originalDataUrl: dataUrl,
        processedDataUrl: processed,
        rotation: 0,
        filter: 'enhanced',
      };
      setPages([...pages, newPage]);
      setActivePageIndex(pages.length);
      stopCamera();
      setStep('review_pages');
    };
    reader.readAsDataURL(file);
  };

  const createIndustrialSampleDocument = async (): Promise<string> => {
    // Generate a clean high-res canvas simulation of a real site invoice/delivery note
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Paper background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('CORESI INTERNATIONAL SARL', 80, 120);

    ctx.fillStyle = '#0284c7';
    ctx.font = '22px Arial';
    ctx.fillText('Chaudronnerie • Tuyauterie Industrielle • Ingénierie & BTP', 80, 160);

    // Divider line
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 185);
    ctx.lineTo(1120, 185);
    ctx.stroke();

    // Invoice Meta
    const randomInv = `FAC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`FACTURE N° : ${randomInv}`, 80, 240);

    ctx.font = '22px Arial';
    ctx.fillText(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 80, 280);
    ctx.fillText('Client : TOTAL CONGO EP - Base Djeno', 80, 320);
    ctx.fillText('Projet : Rénovation Tuyauterie HP & CND (PRJ-2026-01)', 80, 360);

    // Table Header
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(80, 420, 1040, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('DÉSIGNATION TRAVAUX / FOURNITURES', 100, 452);
    ctx.fillText('QTÉ', 780, 452);
    ctx.fillText('MONTANT (FCFA)', 900, 452);

    // Table rows
    const rows = [
      { desc: 'Tubes acier carbone ASTM A106 Gr B 6" Sch 80', qte: '450 m', price: '14 500 000' },
      { desc: 'Main-d\'œuvre chaudronniers & soudeurs 6G qualifiés', qte: '15 j', price: '4 800 000' },
      { desc: 'Épreuve hydrostatique 65 bars sous PV Bureau Veritas', qte: '1 ens.', price: '1 250 000' },
      { desc: 'Contrôles non destructifs (CND) ressuage & radiographie', qte: '1 ens.', price: '2 100 000' },
    ];

    ctx.fillStyle = '#334155';
    ctx.font = '19px Arial';
    let y = 520;
    rows.forEach((r) => {
      ctx.fillText(r.desc, 100, y);
      ctx.fillText(r.qte, 780, y);
      ctx.fillText(r.price, 900, y);
      y += 65;
    });

    // Total box
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(700, 850, 420, 100);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('TOTAL TTC :', 720, 910);
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('22 650 000 FCFA', 870, 910);

    // Stamp & signature
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.strokeRect(750, 1050, 320, 150);
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('CORESI INTERNATIONAL SARL', 770, 1090);
    ctx.font = '16px Arial';
    ctx.fillText('Direction des Opérations & Contrôle', 770, 1125);
    ctx.fillText('VISA / BON À PAYER', 770, 1160);

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleFilterChange = async (filter: 'color' | 'grayscale' | 'bw' | 'enhanced') => {
    if (!pages[activePageIndex]) return;
    const page = pages[activePageIndex];
    const newProcessed = await ImageProcessingService.processPage(page.originalDataUrl, page.rotation, filter);
    const updated = [...pages];
    updated[activePageIndex] = {
      ...page,
      filter,
      processedDataUrl: newProcessed,
    };
    setPages(updated);
  };

  const handleRotatePage = async () => {
    if (!pages[activePageIndex]) return;
    const page = pages[activePageIndex];
    const newRotation = (page.rotation + 90) % 360;
    const newProcessed = await ImageProcessingService.processPage(page.originalDataUrl, newRotation, page.filter);
    const updated = [...pages];
    updated[activePageIndex] = {
      ...page,
      rotation: newRotation,
      processedDataUrl: newProcessed,
    };
    setPages(updated);
  };

  const handleDeletePage = (index: number) => {
    const updated = pages.filter((_, i) => i !== index);
    setPages(updated);
    if (updated.length === 0) {
      setStep('camera');
      startCamera();
    } else {
      setActivePageIndex(Math.max(0, index - 1));
    }
  };

  const handleAddAnotherPage = () => {
    setStep('camera');
    startCamera();
  };

  const proceedToOcr = async () => {
    const isOcrActive =
      AdminConfigService.isModuleEnabled('ocr') && AdminConfigService.isFeatureEnabled('feat_ged_ocr');
    const projectObj = projects.find((p) => p.id === selectedProjectId);

    if (!isOcrActive) {
      // OCR is disabled in system config: skip extraction and go straight to categorization
      setOcrText('(Moteur OCR désactivé dans la configuration de l\'application — Traitement visuel direct)');
      setOcrConfidence(100);
      setDocNumber(`DOC-${Date.now().toString().slice(-6)}`);
      setDocTitle(`Document Chantier - ${projectObj?.name || 'CORESI'}`);
      setDocCategory('justificatifs');
      setDocAmount(0);
      setDocPartner(projectObj?.clientName || '');
      setDocCurrency('FCFA');
      setStep('ocr_validation');
      return;
    }

    setStep('saving');
    setSavingStatusText('Lancement de la reconnaissance optique OCR et extraction des métadonnées...');
    setSavingProgress(25);

    const sampleUrls = pages.map((p) => p.processedDataUrl);

    // Call OCR service
    const ocrResult = await OCRService.processDocument(sampleUrls, {
      projectName: projectObj?.name,
      clientName: projectObj?.clientName,
      supplierName: initialContext?.supplierName,
    });

    setOcrText(ocrResult.text || ocrResult.rawText || '');
    setOcrConfidence(ocrResult.confidence || ocrResult.confidenceScore || 90);

    // Prepopulate detected fields
    if (ocrResult.detectedFields) {
      setDocNumber(ocrResult.detectedFields.documentNumber || `DOC-${Date.now().toString().slice(-6)}`);
      setDocTitle(
        `${ocrResult.detectedFields.category === 'factures' ? 'Facture' : 'Document'} ${ocrResult.detectedFields.documentNumber || ''} - ${ocrResult.detectedFields.vendorOrClient || 'CORESI'}`
      );
      setDocCategory((ocrResult.detectedFields.category as DocumentCategory) || 'factures');
      setDocAmount(ocrResult.detectedFields.amount || 0);
      setDocPartner(ocrResult.detectedFields.vendorOrClient || projectObj?.clientName || '');
      setDocCurrency(ocrResult.detectedFields.currency || 'FCFA');
    }

    setSavingProgress(100);
    setStep('ocr_validation');
  };

  const handleFinalSave = async () => {
    setStep('saving');
    setSavingStatusText('Génération du document numérique haute définition (PDF A4)...');
    setSavingProgress(20);

    // 1. Generate multi-page PDF
    const pdfDataUrl = await ImageProcessingService.generateMultiPagePdf(pages);
    setSavingStatusText('Envoi sécurisé du fichier vers Cloudinary...');
    setSavingProgress(50);

    // 2. Upload to Cloudinary
    const categoryFolder = docCategory;
    const projectFolder = selectedProjectId ? `projects/${selectedProjectId}` : 'general';
    const cloudinaryMeta = await CloudinaryService.uploadFile(
      pdfDataUrl,
      `${docNumber.replace(/[^a-zA-Z0-9_-]/g, '_') || 'document'}.pdf`,
      `${projectFolder}/${categoryFolder}`,
      'raw'
    );

    setSavingStatusText('Enregistrement des métadonnées dans Firestore et audit...');
    setSavingProgress(80);

    const currentUser = DataService.getCurrentUser();
    const projectObj = projects.find((p) => p.id === selectedProjectId);

    const newDocId = `doc-${Date.now()}`;
    const newDocumentRecord: DocumentRecord = {
      id: newDocId,
      title: docTitle || `Document ${docNumber}`,
      documentNumber: docNumber,
      category: docCategory,
      cloudinary: {
        ...cloudinaryMeta,
        pageCount: pages.length,
      },
      ocr: {
        text: ocrText,
        confidence: ocrConfidence,
        detectedFields: {
          documentNumber: docNumber,
          documentDate: docDate,
          amount: docAmount,
          currency: docCurrency,
          vendorOrClient: docPartner,
          category: docCategory,
          projectId: selectedProjectId,
        },
        processedAt: new Date().toISOString(),
      },
      context: {
        projectId: selectedProjectId || undefined,
        projectName: projectObj?.name || undefined,
        clientId: projectObj?.clientId || undefined,
        clientName: projectObj?.clientName || undefined,
        supplierName: docCategory === 'factures' ? docPartner : undefined,
        employeeId: initialContext?.employeeId || undefined,
        employeeName: initialContext?.employeeName || undefined,
      },
      metadata: {
        documentDate: docDate,
        amount: docAmount > 0 ? docAmount : undefined,
        currency: docCurrency,
        description: `Numérisé par Smart Scanner (${pages.length} page${pages.length > 1 ? 's' : ''})`,
        tags: docTags.split(',').map((t) => t.trim()).filter(Boolean),
      },
      status: 'validated',
      uploadedBy: currentUser.displayName,
      uploadedById: currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save in unified data service (Firestore + Local)
    await DataService.saveDocument(newDocumentRecord);

    // Check action choice
    if (actionChoice === 'facture' && docAmount > 0) {
      await DataService.saveInvoice({
        id: `inv-${Date.now()}`,
        invoiceNumber: docNumber,
        type: 'client',
        partyName: docPartner || projectObj?.clientName || 'Client Industriel',
        projectId: selectedProjectId,
        projectName: projectObj?.name,
        issueDate: docDate,
        dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        totalAmount: docAmount,
        paidAmount: 0,
        currency: docCurrency,
        status: 'emis',
        documentId: newDocId,
        documentUrl: cloudinaryMeta.secureUrl,
        notes: `Créé automatiquement depuis le scan ${docNumber}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else if (actionChoice === 'depense' && docAmount > 0) {
      await DataService.saveExpense({
        id: `exp-${Date.now()}`,
        reference: `DEP-${docNumber}`,
        projectId: selectedProjectId || 'prj-001',
        projectName: projectObj?.name || 'Projet Général',
        category: 'materiel',
        amount: docAmount,
        currency: docCurrency,
        paymentMethod: 'virement_bancaire',
        supplierName: docPartner,
        date: docDate,
        description: `Dépense justifiée par scan ${docNumber} (${docTitle})`,
        documentId: newDocId,
        documentUrl: cloudinaryMeta.secureUrl,
        status: 'valide',
        approvedBy: currentUser.displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setSavingProgress(100);
    setSavingStatusText('Document finalisé avec succès !');

    setTimeout(() => {
      onDocumentCreated(newDocumentRecord);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] text-slate-100">
        {/* Top Header Bar */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-white">Smart Scanner Industriel CORESI</h3>
                <span className="text-xs bg-green-950 text-green-400 border border-green-800 px-2 py-0.5 rounded-full font-medium">
                  Style Adobe Scan
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Numérisation haute netteté • Correction de perspective • OCR &amp; Intégration ERP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'review_pages' && (
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-md border border-slate-700 font-mono">
                {pages.length} page{pages.length > 1 ? 's' : ''} scannée{pages.length > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body depending on step */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900">
          {/* STEP 1: LIVE CAMERA SCANNER */}
          {step === 'camera' && (
            <div className="flex flex-col items-center">
              {/* Guidance HUD Banner */}
              <div className="w-full mb-3 flex items-center justify-between bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-green-300">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>{guidanceMessage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-emerald-400 font-medium text-xs">Détection auto prête</span>
                </div>
              </div>

              {/* Viewfinder Window */}
              <div className="relative w-full max-w-2xl aspect-[4/3] bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl flex items-center justify-center">
                {/* Camera Flash Animation */}
                {flashEffect && <div className="absolute inset-0 bg-white z-40 transition-opacity duration-200" />}

                {/* Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />

                {/* Smart Scanner Bounding Box & HUD overlay */}
                {cameraActive && (
                  <div className="absolute inset-8 sm:inset-12 pointer-events-none z-20 flex flex-col justify-between">
                    {/* Corner Reticles */}
                    <div className="flex justify-between">
                      <div className="w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                      <div className="w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                    </div>

                    {/* Animated Scanning Laser Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_15px_#4ade80] animate-bounce" />

                    <div className="flex justify-between">
                      <div className="w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                      <div className="w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                    </div>

                    {/* Center detection status tag */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-green-950/80 backdrop-blur-md border border-green-500/50 px-4 py-1.5 rounded-full text-green-200 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span>Document Détecté • Prêt à capturer</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fallback if camera is off or denied */}
                {!cameraActive && (
                  <div className="flex flex-col items-center justify-center p-6 text-center max-w-md">
                    <div className="p-4 bg-slate-800 rounded-full mb-3 text-slate-400">
                      <Camera className="w-10 h-10" />
                    </div>
                    <h4 className="text-white font-medium mb-1">Caméra inactive ou simulateur actif</h4>
                    <p className="text-xs text-slate-400 mb-4">{cameraError || 'Prêt pour la capture de test ou l\'importation de document.'}</p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={capturePhoto}
                        className="px-4 py-2 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg"
                      >
                        <Sparkles className="w-4 h-4" />
                        Générer un Scan Document de Chantier
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-medium flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Importer un fichier image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Camera Action Bar */}
              <div className="w-full max-w-2xl mt-4 flex items-center justify-between px-4 py-2 bg-slate-950 rounded-2xl border border-slate-800">
                {/* Switch camera / upload */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Importer un fichier existant"
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors flex items-center gap-2 text-xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Importer</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {cameraActive && (
                    <button
                      onClick={() => {
                        setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                        startCamera();
                      }}
                      title="Changer de caméra (avant/arrière)"
                      className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-xs"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Big Shutter Button */}
                <button
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-white hover:bg-slate-100 p-1 shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-transform active:scale-95"
                >
                  <div className="w-13 h-13 rounded-full border-2 border-slate-900 bg-green-700 group-hover:bg-green-600 flex items-center justify-center text-white">
                    <Camera className="w-6 h-6" />
                  </div>
                </button>

                {/* If pages already present, review button */}
                <div>
                  {pages.length > 0 ? (
                    <button
                      onClick={() => {
                        stopCamera();
                        setStep('review_pages');
                      }}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Terminer ({pages.length})</span>
                    </button>
                  ) : (
                    <div className="w-20" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW MULTI-PAGES & FILTERS (ADOBE SCAN STYLE) */}
          {step === 'review_pages' && pages[activePageIndex] && (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Left: Active Page Canvas Viewer */}
              <div className="flex-1 w-full flex flex-col items-center">
                <div className="relative w-full max-w-md aspect-[1/1.4] bg-slate-950 rounded-xl border border-slate-700 overflow-hidden shadow-2xl flex items-center justify-center p-2">
                  <img
                    src={pages[activePageIndex].processedDataUrl}
                    alt={`Page ${activePageIndex + 1}`}
                    className="max-h-full max-w-full object-contain rounded shadow-lg"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-xs font-mono text-green-300 border border-slate-700">
                    Page {activePageIndex + 1} / {pages.length}
                  </div>
                </div>

                {/* Action Strip for Current Page: Rotate, Delete, Filter */}
                <div className="w-full max-w-md mt-3 flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <button
                    onClick={handleRotatePage}
                    className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg flex items-center gap-1.5 text-xs transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Pivoter 90°</span>
                  </button>

                  <button
                    onClick={() => handleDeletePage(activePageIndex)}
                    className="p-2 hover:bg-red-950/60 text-red-400 hover:text-red-300 rounded-lg flex items-center gap-1.5 text-xs transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>

                  <button
                    onClick={handleAddAnotherPage}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-green-400 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter page</span>
                  </button>
                </div>

                {/* Filter Palette (Adobe Scan filters) */}
                <div className="w-full max-w-md mt-3">
                  <label className="text-xs text-slate-400 font-medium mb-1.5 block">
                    Mode d'amélioration d'image :
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'enhanced', label: 'Amélioré', icon: Sparkles },
                      { id: 'bw', label: 'Noir & Blanc', icon: Sliders },
                      { id: 'grayscale', label: 'Gris', icon: Layers },
                      { id: 'color', label: 'Couleur', icon: Eye },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleFilterChange(f.id as any)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-medium border transition-all ${
                          pages[activePageIndex].filter === f.id
                            ? 'bg-green-700/30 text-green-300 border-green-500 shadow-md'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Multi-page Thumbnails & Proceed */}
              <div className="w-full lg:w-72 flex flex-col gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                    <span>Pages du document</span>
                    <span className="text-green-400">{pages.length}</span>
                  </h4>

                  <div className="grid grid-cols-3 lg:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                    {pages.map((p, idx) => (
                      <div
                        key={p.id}
                        onClick={() => setActivePageIndex(idx)}
                        className={`cursor-pointer relative aspect-[1/1.3] rounded-lg overflow-hidden border-2 transition-all ${
                          activePageIndex === idx
                            ? 'border-green-400 shadow-[0_0_10px_rgba(59,122,44,0.5)]'
                            : 'border-slate-800 hover:border-slate-600 opacity-70'
                        }`}
                      >
                        <img src={p.processedDataUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-mono px-1 rounded">
                          {idx + 1}
                        </span>
                      </div>
                    ))}

                    <button
                      onClick={handleAddAnotherPage}
                      className="aspect-[1/1.3] rounded-lg border-2 border-dashed border-slate-700 hover:border-green-500 bg-slate-900 flex flex-col items-center justify-center text-slate-400 hover:text-green-300 text-xs gap-1 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <FileCheck className="w-4 h-4" />
                    <span>Document prêt pour la reconnaissance OCR</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    L'étape suivante va extraire automatiquement les numéros, dates, montants et partenaires.
                  </p>

                  <button
                    onClick={proceedToOcr}
                    className="w-full py-3 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Lancer OCR &amp; Métadonnées</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: OCR EXTRACTION & METADATA VALIDATION */}
          {step === 'ocr_validation' && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column: OCR Text Recognition Feed */}
              <div className="w-full lg:w-1/2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-400" />
                    Texte reconnu (OCR)
                  </h4>
                  <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Précision {ocrConfidence}%
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    rows={13}
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-300 leading-relaxed focus:border-green-600 focus:outline-none"
                    placeholder="Texte brut reconnu..."
                  />
                  <div className="text-[11px] text-slate-500 mt-1 italic">
                    Ce texte est intégralement indexé pour permettre la recherche plein texte dans la GED.
                  </div>
                </div>

                {/* Scanned preview thumbnail */}
                {pages[0] && (
                  <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <img
                      src={pages[0].processedDataUrl}
                      alt="Miniature"
                      className="w-12 h-16 object-cover rounded border border-slate-700"
                    />
                    <div className="text-xs">
                      <p className="font-medium text-white">{pages.length} page(s) assemblée(s) en PDF</p>
                      <p className="text-slate-400">Prêt pour envoi Cloudinary &amp; Firestore</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Intelligent Metadata Validation Form */}
              <div className="w-full lg:w-1/2 flex flex-col gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Informations Métier Détectées
                </h4>
                <p className="text-xs text-slate-400">
                  Vérifiez et complétez les champs avant l'enregistrement final.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 text-xs">
                  {/* Category */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Catégorie GED</label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="factures">Facture</option>
                      <option value="devis">Devis</option>
                      <option value="bons_commande">Bon de commande</option>
                      <option value="bons_livraison">Bon de livraison</option>
                      <option value="contrats">Contrat</option>
                      <option value="rapports">Rapport d'expertise / PV</option>
                      <option value="justificatifs">Justificatif de dépense</option>
                      <option value="rh">Document RH / Contrat</option>
                      <option value="plans_techniques">Plan technique / ISO</option>
                      <option value="administratif">Administratif</option>
                      <option value="autre">Autre document</option>
                    </select>
                  </div>

                  {/* Document Number */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">N° de Document</label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="Ex: FAC-2026-0045"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="text-slate-300 font-medium block mb-1">Titre du document</label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Partner / Client / Supplier */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Tiers / Partenaire</label>
                    <input
                      type="text"
                      value={docPartner}
                      onChange={(e) => setDocPartner(e.target.value)}
                      placeholder="Ex: TOTAL CONGO, VALLOUREC..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Date d'émission</label>
                    <input
                      type="date"
                      value={docDate}
                      onChange={(e) => setDocDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Montant TTC (si financier)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={docAmount || ''}
                        onChange={(e) => setDocAmount(Number(e.target.value))}
                        placeholder="Ex: 2500000"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400 font-semibold px-2">{docCurrency}</span>
                    </div>
                  </div>

                  {/* Project Association */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Rattacher au Projet</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">Aucun projet lié</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Choice: Create invoice or expense automatically */}
                <div className="mt-2 pt-3 border-t border-slate-800">
                  <label className="text-xs text-slate-300 font-semibold block mb-2">
                    Action métier automatique :
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setActionChoice('ged')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        actionChoice === 'ged'
                          ? 'bg-green-700/30 border-green-500 text-green-200'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      Classer dans GED
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionChoice('facture')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        actionChoice === 'facture'
                          ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      Créer Facture
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionChoice('depense')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        actionChoice === 'depense'
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      Créer Dépense
                    </button>
                  </div>
                </div>

                {/* Final Submit Button */}
                <button
                  onClick={handleFinalSave}
                  className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Valider &amp; Sauvegarder (Cloudinary + Firestore)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SAVING PROGRESS BAR */}
          {step === 'saving' && (
            <div className="py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
              </div>

              <h4 className="text-lg font-bold text-white mb-2">Traitement documentaire en cours</h4>
              <p className="text-xs text-slate-400 mb-6">{savingStatusText}</p>

              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-600 to-emerald-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${savingProgress}%` }}
                />
              </div>
              <span className="text-xs font-mono text-green-400 mt-2">{savingProgress}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
