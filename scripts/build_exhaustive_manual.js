import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ASSETS_DIR = path.resolve('docs/manual_assets_light');
const OUTPUT_PDF = path.resolve('CORESI_Mode_d_Emploi_Complet_Mode_Clair.pdf');
const OUTPUT_HTML = path.resolve('docs/mode_d_emploi_complet_mode_clair.html');

function getBase64(filename) {
  const p = path.join(ASSETS_DIR, filename);
  if (!fs.existsSync(p)) return '';
  return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
}

console.log('Chargement et encodage des 40 captures d écran en mode clair...');

const PAIRS = [
  {
    num: 1,
    title: 'Activation des Modules & Structure du Menu Opérationnel',
    domain: 'Architecture Système & Gouvernance',
    adminImg: getBase64('admin_01_modules_toggle.png'),
    effectImg: getBase64('effect_01_sidebar_navigation.png'),
    adminDesc: 'Centre d Administration > Modules Système : commutateurs ON/OFF sécurisés avec gestion des dépendances.',
    effectDesc: 'Barre Latérale Plateforme : masquage ou affichage immédiat en temps réel sans rechargement de page.',
    concept: 'L activation à chaud permet au Directeur Général d activer ou désactiver un module métier selon les phases d un contrat sans interrompre l activité des autres équipes.',
    rules: [
      'La désactivation d un module parent (ex: Projets) désactive automatiquement ses modules dépendants (Rapports PV, Chantiers).',
      'Un motif obligatoire de désactivation est exigé et consigné dans le journal d audit.',
      'Les modules masqués ne consomment aucune ressource d arrière-plan et bloquent les routes directes.',
    ],
    steps: [
      'Se connecter avec le profil Direction Générale (DG) ou Administrateur (ADMIN).',
      'Accéder à l onglet "Modules Système" du Centre d Administration.',
      'Cliquer sur le commutateur du module souhaité (ex: Missions & Déplacements).',
      'Vérifier dans la barre latérale gauche : le module apparaît instantanément avec son badge dynamique.',
    ],
  },
  {
    num: 2,
    title: 'Workflows de Validation & Circuits d Approbation des Dépenses',
    domain: 'Achats & Contrôle Budgétaire',
    adminImg: getBase64('admin_02_workflows.png'),
    effectImg: getBase64('effect_02_purchases_approval.png'),
    adminDesc: 'Centre d Administration > Workflows de Validation : définition des seuils N1, N2 et critères de visa.',
    effectDesc: 'Plateforme > Achats & Commandes : affichage dynamique des jalons d approbation et statut des signatures.',
    concept: 'Chaque engagement de dépense suit un circuit rigoureux garantissant qu aucun achat non budgétisé ne puisse être exécuté.',
    rules: [
      'Seuil N1 (Chef de Département / Directeur Technique) : engagement jusqu à 2 500 000 FCFA.',
      'Seuil N2 (Direction Générale) : obligatoire pour tout montant excédant 2 500 000 FCFA.',
      'Règle des 3 Devis : exigence obligatoire de 3 cotations concurrentes pour tout achat supérieur à 1 000 000 FCFA.',
    ],
    steps: [
      'Le Chef de Chantier émet une Demande d Achat (DA) en précisant le code affaire et le besoin.',
      'Le système vérifie le montant total : si > 1 000 000 FCFA, l upload des 3 devis comparatifs est exigé.',
      'Le Chef de Département reçoit une alerte interne et appose son visa électronique N1.',
      'Le Directeur Général examine la liasse documentaire et signe l ordonnancement N2, générant automatiquement le Bon de Commande officiel (BC).',
    ],
  },
  {
    num: 3,
    title: 'Matrice des Rôles, Permissions & Étanchéité des Données',
    domain: 'Sécurité & Contrôle des Accès (RBAC)',
    adminImg: getBase64('admin_03_roles_matrix.png'),
    effectImg: getBase64('effect_03_user_role_scope.png'),
    adminDesc: 'Centre d Administration > Rôles & Permissions : matrice fine (Lecture, Création, Modification, Validation, Suppression).',
    effectDesc: 'Plateforme > Espace Métier : menus et boutons d action conditionnés aux habilitations strictes du collaborateur.',
    concept: 'Le contrôle d accès basé sur les rôles (RBAC) isole les fonctions sensibles (trésorerie, salaires, audit) des opérateurs de terrain.',
    rules: [
      'Le rôle Soudeur ou Magasinier n a aucun droit de visibilité sur les modules Finances, Paie et Administration.',
      'Seul le rôle DG possède le droit de validation financière définitive et de purge.',
      'Toute tentative d accès à une route non autorisée redirige vers le module par défaut du profil.',
    ],
    steps: [
      'Accéder à la vue "Rôles & Permissions" dans l Administration.',
      'Sélectionner le rôle cible (ex: Chef de Projet).',
      'Cocher ou décocher l action spécifique sur le module (ex: Archiver les documents GED).',
      'Les collaborateurs connectés avec ce rôle voient leurs boutons d action grisés ou masqués instantanément.',
    ],
  },
  {
    num: 4,
    title: 'Numérotation Automatique & Normalisation des Pièces',
    domain: 'Standardisation Qualité & Traçabilité ISO',
    adminImg: getBase64('admin_04_numbering.png'),
    effectImg: getBase64('effect_04_documents_numbering.png'),
    adminDesc: 'Centre d Administration > Numérotation : paramétrage des préfixes, millésimes et compteurs annuels.',
    effectDesc: 'Plateforme > Documents & PV : références générées sous forme normalisée (ex: DA-2026-0042, PV-2026-0118).',
    concept: 'Garantit l unicité et la chronologie infalsifiable de chaque document émis par CORESI INTERNATIONAL.',
    rules: [
      'Réinitialisation annuelle automatique à 0001 chaque 1er janvier selon la configuration.',
      'Incrémentation atomique pour prévenir tout doublon même en cas de saisies simultanées par plusieurs chefs d équipe.',
      'Impossibilité de modifier manuellement le numéro de référence d une pièce après émission.',
    ],
    steps: [
      'Ouvrir l onglet "Numérotation" dans l Administration.',
      'Sélectionner le type de document (Demande d Achat, PV d Épreuve, Bon de Commande, Facture).',
      'Modifier le préfixe ou le nombre de chiffres de remplissage (ex: 4 chiffres pour 0001).',
      'Toute nouvelle pièce créée dans l application adopte immédiatement le format prévisualisé.',
    ],
  },
  {
    num: 5,
    title: 'Paramètres Financiers, TVA Légale & Trésorerie d Entreprise',
    domain: 'Finances, Fiscalité CEMAC & Caisse',
    adminImg: getBase64('admin_05_finance_vat.png'),
    effectImg: getBase64('effect_05_finance_invoicing.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > Finance : taux de TVA 18%, devise FCFA, plafond caisse espèces.',
    effectDesc: 'Plateforme > Finances & Factures : calcul instantané HT/TVA/TTC sur factures et alertes de décaissement.',
    concept: 'Assure la conformité fiscale congolaise et le respect strict du règlement bancaire CEMAC sur le maniement des espèces.',
    rules: [
      'Application automatique du taux de TVA de 18% sur tous les devis et factures de travaux.',
      'Plafond espèces strictement bloqué à 2 500 000 FCFA : tout paiement supérieur requiert un virement ou chèque barré.',
      'Clôture journalière obligatoire de la caisse à 17h30 avec journal de pointage.',
    ],
    steps: [
      'Accéder à la section "Finance" des paramètres spécialisés.',
      'Ajuster le taux de TVA ou le délai d échéance des factures (30 jours par défaut).',
      'Enregistrer : les devis et factures créés par la comptabilité intègrent automatiquement la nouvelle règle de calcul.',
    ],
  },
  {
    num: 6,
    title: 'Rétention Documentaire GED & Pièces Obligatoires de Chantier',
    domain: 'Gestion Électronique des Documents (GED)',
    adminImg: getBase64('admin_06_ged_retention.png'),
    effectImg: getBase64('effect_06_ged_archive.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > GED : durée légale 10 ans, quota de 25 Mo, liste des pièces exigées.',
    effectDesc: 'Plateforme > GED : coffre-fort avec catégorisation, historique de versioning et statut de rétention certifié.',
    concept: 'Constitution d un dossier des ouvrages exécutés (DOE) complet et inviolable pour chaque chantier industriel.',
    rules: [
      'Rétention légale de 10 ans conformément aux obligations contractuelles pétrolières et OHADA.',
      'Blocage de la clôture financière d un projet si les documents obligatoires (PV d épreuve, rapport ressuage) manquent.',
      'Chaque nouvelle version d un plan ou d un cahier de soudage conserve les révisions antérieures.',
    ],
    steps: [
      'Dans l Administration > GED, définir la liste des livrables obligatoires (ex: Attestation COFREND, PV épreuve).',
      'Le Chef de Projet téléverse les fichiers scannés dans le dossier du chantier.',
      'Le système vérifie la conformité et appose le visa de certification documentaire.',
    ],
  },
  {
    num: 7,
    title: 'Scanner Mobile de Chantier & Reconnaissance Automatique OCR',
    domain: 'Numérisation Terrain & Intelligence Documentaire',
    adminImg: getBase64('admin_07_scanner_ocr.png'),
    effectImg: getBase64('effect_07_ocr_validation.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > Scanner & OCR : redressement de perspective, dictionnaire FR/EN.',
    effectDesc: 'Plateforme > Scanner Mobile & Validation OCR : extraction des montants, dates et détection de contours.',
    concept: 'Permet au chef d équipe sur le terrain de photographier un bon de livraison ou une facturette avec indexation automatique.',
    rules: [
      'Détection automatique des 4 coins du document et correction du trapèze en temps réel.',
      'Validation humaine obligatoire des données extraites par OCR avant toute imputation comptable.',
      'Dictionnaire bilingue optimisé pour le vocabulaire de la chaudronnerie et des normes ASME.',
    ],
    steps: [
      'Activer le module Scanner et le moteur OCR dans les paramètres d administration.',
      'Depuis un smartphone ou une tablette, ouvrir le Scanner Mobile CORESI sur le chantier.',
      'Prendre la photo : l image est redressée, les montants sont extraits et pré-remplis dans le formulaire d enregistrement.',
    ],
  },
  {
    num: 8,
    title: 'Surveillance Budgétaire des Projets & Causerie Sécurité HSE',
    domain: 'Management de Chantier & Prévention des Risques',
    adminImg: getBase64('admin_08_projects_budget.png'),
    effectImg: getBase64('effect_08_project_budget_alert.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > Projets : alerte 80%, alerte 95%, briefing sécurité hebdomadaire.',
    effectDesc: 'Plateforme > Chantiers & Projets : barres de progression de coûts avec voyants d alerte et check HSE.',
    concept: 'Anticipation des dérives financières sur les contrats à forfait et maintien du standard Zéro Accident sur les sites.',
    rules: [
      'Alerte préventive à 80% du budget engagé transmise par notification au Chef de Projet.',
      'Alerte critique à 95% bloquant tout nouvel engagement d achat sans autorisation expresse de la DG.',
      'Enregistrement obligatoire de la causerie HSE hebdomadaire pour valider les rapports d avancement.',
    ],
    steps: [
      'Configurer les pourcentages d alerte dans l onglet "Projets" de l Administration.',
      'Au fur et à mesure des dépenses et des pointages d heures, la jauge budgétaire du chantier évolue.',
      'En cas de dépassement du seuil de 80%, le système affiche un badge d avertissement orange et notifie la direction.',
    ],
  },
  {
    num: 9,
    title: 'Gestion des Stocks, Traçabilité Numéro de Série & Coulée',
    domain: 'Logistique, Matériaux & Outillages de Chaudronnerie',
    adminImg: getBase64('admin_09_stock_rules.png'),
    effectImg: getBase64('effect_09_stock_inventory.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > Stock : seuil minimum, multi-dépôts, suivi des coulées.',
    effectDesc: 'Plateforme > Parc Matériel & Stocks : fiches articles avec numéros de série, localisation et alertes de réappro.',
    concept: 'Garantit la disponibilité des consommables critiques (tubes, électrodes, disques) et l étiquetage métallurgique.',
    rules: [
      'Alerte automatique dès que la quantité physique passe sous le seuil d alerte défini.',
      'Enregistrement obligatoire du numéro de coulée d usine pour chaque tube ou tôle sous pression.',
      'Traçabilité par numéro de série individuel pour les équipements de valeur (postes TIG, compresseurs).',
    ],
    steps: [
      'Paramétrer le seuil d alerte global (ex: 5 unités) dans l Administration > Stock.',
      'Le Magasinier réceptionne un lot de raccords et saisit le numéro de certificat 3.1.',
      'Lors des sorties chantier, le stock se décrémente automatiquement et déclenche une demande de réapprovisionnement si besoin.',
    ],
  },
  {
    num: 10,
    title: 'Surveillance des Qualifications de Soudage (QS / QMOS) & RH',
    domain: 'Ressources Humaines & Habilitations Techniques',
    adminImg: getBase64('admin_10_hr_welders.png'),
    effectImg: getBase64('effect_10_welders_licences.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > RH : alerte expiration qualification 30 jours, départements.',
    effectDesc: 'Plateforme > Personnel & RH : registre des soudeurs avec compte à rebours de validité de licence ASME 6G.',
    concept: 'Empêche qu un soudeur dont la qualification est arrivée à échéance ne réalise des soudures sur des lignes sous pression.',
    rules: [
      'Alerte préventive 30 jours avant la date de fin de validité de la licence de soudage.',
      'Blocage de l attribution du soudeur sur tout chantier critique si le renouvellement n est pas enregistré.',
      'Archivage obligatoire du coupon d épreuve et du rapport radio dans le dossier collaborateur.',
    ],
    steps: [
      'Fixer le délai de prévenance à 30 jours dans les paramètres RH de l Administration.',
      'Consulter la fiche du soudeur : le badge de certification affiche le nombre de jours restants.',
      'À J-30, le Responsable Qualité et les RH reçoivent un rappel automatique pour programmer l épreuve de renouvellement.',
    ],
  },
  {
    num: 11,
    title: 'GMAO, Compteurs Horaires & Révisions Périodiques des Machines',
    domain: 'Maintenance Industrielle & Disponibilité du Parc',
    adminImg: getBase64('admin_11_gmao_hours.png'),
    effectImg: getBase64('effect_11_gmao_workorders.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > GMAO : seuil révision 250h/500h, diagnostic obligatoire.',
    effectDesc: 'Plateforme > Maintenance & GMAO : état du parc machine, compteurs d heures et ordres de travail (OT).',
    concept: 'Préservation des matériels lourds de production et suppression des pannes imprévues sur les chantiers clients.',
    rules: [
      'Déclenchement automatique d un Ordre de Travail (OT) préventif dès l atteinte du quota horaire.',
      'Exigence d un rapport de diagnostic technique complet avant toute clôture et remise en service d un équipement.',
      'Suivi analytique du coût cumulé de maintenance par machine.',
    ],
    steps: [
      'Définir le seuil d alerte d heures de fonctionnement dans l Administration GMAO (ex: 250 heures).',
      'Le technicien relève l index horaire du compresseur à la fin de la journée.',
      'Dès franchissement du seuil, l équipement passe en statut "Révision Requise" et génère l ordre d intervention avec la liste des pièces à remplacer.',
    ],
  },
  {
    num: 12,
    title: 'Barème des Perdiems, Ordres de Mission & Déplacements',
    domain: 'Logistique Terrain & Indemnités Forfaitaires',
    adminImg: getBase64('admin_12_missions_perdiem.png'),
    effectImg: getBase64('effect_12_mission_order.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > Missions : barèmes Onshore, Offshore, International et avance max.',
    effectDesc: 'Plateforme > Missions : formulaire d ordre de mission officiel avec calcul automatique des indemnités et décharge.',
    concept: 'Cadre légal et transparent pour la mobilité des équipes de tuyauterie et de montage sur les sites pétroliers et miniers.',
    rules: [
      'Perdiem Onshore : 25 000 FCFA / jour (missions nationales hors base).',
      'Perdiem Offshore : 45 000 FCFA / jour (plateformes marines et barges).',
      'Perdiem International : 80 000 FCFA / jour (missions sous-régionales CEMAC).',
      'Plafond d avance de frais limité à 80% du total estimé : solde versé après décharge des justificatifs sous 7 jours.',
    ],
    steps: [
      'Configurer les barèmes dans l onglet "Missions" de l Administration.',
      'Créer un ordre de mission en sélectionnant l agent, la zone (Onshore/Offshore) et les dates.',
      'Le montant des indemnités est calculé automatiquement et soumis à la signature de la DG avant remise de l avance de caisse.',
    ],
  },
  {
    num: 13,
    title: 'Multi-Sites, Gestion des Bases & Règle du Double Visa',
    domain: 'Gestion des Chantiers Déportés & Logistique Fluviale',
    adminImg: getBase64('admin_13_sites_rules.png'),
    effectImg: getBase64('effect_13_sites_transfer.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > Multi-Sites : base par défaut, double visa de transfert, transit max.',
    effectDesc: 'Plateforme > Multi-Sites & Chantiers : tableau de bord des bases, transferts d outillage et statuts de livraison.',
    concept: 'Traçabilité intégrale des mouvements d outillages entre la base centrale de Pointe-Noire et les chantiers de Brazzaville ou du Kouilou.',
    rules: [
      'Double visa obligatoire : signature de l expéditeur au départ de la base et signature du récepteur à l arrivée sur site.',
      'Délai de transit maximum toléré de 3 jours : alerte automatique en cas de non-confirmation de réception.',
      'Zone de quarantaine et contrôle technique à l arrivée avant mise à disposition des techniciens.',
    ],
    steps: [
      'Régler les paramètres de transfert dans l Administration > Multi-Sites.',
      'Le magasinier émetteur génère un bordereau de transfert inter-sites pour un groupe de soudage.',
      'Le matériel passe au statut "En Transit" ; le responsable du chantier destinataire confirme la réception physique, clôturant le transfert.',
    ],
  },
  {
    num: 14,
    title: 'Normes de Conformité & PV d Épreuve Hydraulique CODAP/ASME',
    domain: 'Contrôle Technique, Qualité & Homologation des Épreuves',
    adminImg: getBase64('admin_14_reports_hydro.png'),
    effectImg: getBase64('effect_14_pv_hydro_test.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > Rapports : facteur de surpression (1.50x), durée de palier, visa DT.',
    effectDesc: 'Plateforme > Rapports & PV Techniques : fiche d épreuve hydraulique avec formule de calcul automatique de la pression.',
    concept: 'Garantie absolue de la résistance mécanique et de l étanchéité des tuyauteries haute pression avant mise en service client.',
    rules: [
      'Pression d Épreuve = 1.50 x Pression de Service (PS) selon la réglementation CODAP / ASME B31.3.',
      'Palier d épreuve ininterrompu de 30 minutes sans dépressurisation constatée sur manomètre étalonné.',
      'Visa obligatoire du Directeur Technique avant toute transmission officielle au client.',
    ],
    steps: [
      'Dans les paramètres Rapports de l Administration, vérifier le coefficient de surpression (1.50) et la durée minimale.',
      'Ouvrir le module Rapports & PV Techniques et saisir les paramètres de la tuyauterie (PS = 100 bar).',
      'Le logiciel calcule immédiatement la PE requise (150 bar), consigne les lectures manométriques et génère le PV homologué.',
    ],
  },
  {
    num: 15,
    title: 'Achats, Règle des 3 Devis & Tolérances de Réception',
    domain: 'Contrôle des Approvisionnements & Négociation Fournisseurs',
    adminImg: getBase64('admin_15_purchases_rules.png'),
    effectImg: getBase64('effect_15_purchase_orders.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > Achats : seuils d approbation N1/N2, règle des 3 devis > 1M FCFA.',
    effectDesc: 'Plateforme > Achats & Commandes : comparatif des offres fournisseurs et bons de commande certifiés.',
    concept: 'Optimisation des coûts d approvisionnement et respect des procédures d audit interne des compagnies mandataires.',
    rules: [
      'Exigence obligatoire de 3 offres concurrentes pour tout achat excédant 1 000 000 FCFA.',
      'Tolérance quantitative de réception de ±5% sur les consommables au poids (électrodes, gaz industriels).',
      'Génération automatique du bon d entrée magasin dès la validation de la livraison conforme.',
    ],
    steps: [
      'Ajuster le seuil de consultation obligatoire dans l Administration > Achats.',
      'Lors de la création de la commande, le métreur renseigne les montants des 3 devis reçus.',
      'Le système surligne la meilleure offre économique et soumet le dossier complet au visa de la Direction Générale.',
    ],
  },
  {
    num: 16,
    title: 'Conformité Fiscale NIF/RCCM & Agréments HSE des Partenaires',
    domain: 'Gestion des Tiers, Sous-Traitance & Conformité Juridique',
    adminImg: getBase64('admin_16_partners_rules.png'),
    effectImg: getBase64('effect_16_partner_compliance.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > Partenaires : délai 60 jours, NIF/RCCM obligatoire, pièces HSE.',
    effectDesc: 'Plateforme > Clients & Fournisseurs : fiches tiers avec voyant de conformité fiscale et agrément de sécurité.',
    concept: 'Protection juridique de CORESI contre les risques de sous-traitance occulte ou de défaillance fiscale de tiers.',
    rules: [
      'Attestation de régularité fiscale (NIF) et RCCM valide de moins de 3 mois obligatoires pour tout fournisseur.',
      'Agrément HSE obligatoire pour tout intervenant extérieur accédant aux ateliers ou chantiers CORESI.',
      'Délai de règlement standard fixé à 60 jours fin de mois pour les prestataires.',
    ],
    steps: [
      'Définir la liste des pièces obligatoires dans l Administration > Partenaires.',
      'Créer ou modifier la fiche d un fournisseur dans le module Clients & Fournisseurs.',
      'Si une pièce fiscale est manquante, le tiers apparaît avec le statut "Non Agrée" et empêche l émission de tout bon de commande.',
    ],
  },
  {
    num: 17,
    title: 'Paie, Cotisations Sociales CNSS Congo & Bulletins Officiels',
    domain: 'Rémunérations, Législation Sociale Congolaise & CNSS',
    adminImg: getBase64('admin_17_payroll_cnss.png'),
    effectImg: getBase64('effect_17_payslip_breakdown.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > Paie : taux CNSS salarié 4%, employeur 16%, indemnités transport.',
    effectDesc: 'Plateforme > Paie & Rémunérations : décomposition du bulletin de salaire avec calcul automatique du net à payer.',
    concept: 'Édition rigoureuse des bulletins de paye conforme au Code du Travail congolais et aux déclarations trimestrielles CNSS.',
    rules: [
      'Cotisation Salariale CNSS : 4.0% déduite du salaire brut plafonné.',
      'Cotisation Patronale CNSS : 16.0% prise en charge par CORESI.',
      'Indemnité forfaitaire de transport exonérée de charges sociales selon le barème conventionnel.',
    ],
    steps: [
      'Vérifier les taux légaux dans l Administration > Paie.',
      'Dans le module Paie, ouvrir la période mensuelle et générer les fiches de rémunération des équipes.',
      'Le système ventile automatiquement les primes de chantier, déduit la part ouvrière CNSS et édite le bulletin de paye officiel.',
    ],
  },
  {
    num: 18,
    title: 'Impression A4 Officielle, Filigrane Anti-Falsification & Tampons',
    domain: 'Gabarit Documentaire, Sécurité Juridique & Image de Marque',
    adminImg: getBase64('admin_18_print_charter.png'),
    effectImg: getBase64('effect_18_print_a4_modal.png'),
    adminDesc: 'Centre d Administration > Paramètres Spécialisés > Impression A4 : en-tête, filigrane officiel, mentions OHADA, cachet ASME.',
    effectDesc: 'Plateforme > Aperçu A4 Imprimable : rendu graphique parfait avec filigrane central, blocs signatures et export PDF.',
    concept: 'Standardisation de l ensemble des livrables papier et PDF remis aux clients pétroliers, auditeurs et banques partenaires.',
    rules: [
      'Filigrane central officiel translucide anti-copie sur chaque page émise.',
      'Présence obligatoire des mentions légales OHADA, NIF et RCCM dans le cartouche d en-tête.',
      'Double bloc de signature standardisé : visa technique à gauche, approbation Direction Générale à droite avec tampon ASME.',
    ],
    steps: [
      'Personnaliser le filigrane et les textes de signataires dans l Administration > Impression A4.',
      'Sur n importe quel écran de l ERP (DA, BC, PV, Mission, Facture), cliquer sur le bouton "Imprimer".',
      'Le gabarit A4 officiel intègre instantanément vos personnalisations et permet le téléchargement direct du PDF sécurisé.',
    ],
  },
  {
    num: 19,
    title: 'Politique de Sécurité, Délai d Inactivité & Verrouillage par Code PIN',
    domain: 'Cybersécurité, Protection des Sessions & Confidentialité',
    adminImg: getBase64('admin_19_security_idle.png'),
    effectImg: getBase64('effect_19_admin_overview.png'),
    adminDesc: 'Centre d Administration > Sécurité & Verrouillage : durée maximale de session, délai d inactivité (15 min), sections verrouillées.',
    effectDesc: 'Plateforme > Écran de Verrouillage : modal Quick Unlock sécurisé permettant la reprise instantanée par Code PIN.',
    concept: 'Protection de la confidentialité des données stratégiques de l entreprise en cas d abandon momentané de poste de travail.',
    rules: [
      'Verrouillage automatique de session après 15 minutes sans frappe de touche ni mouvement de souris.',
      'Déverrouillage ultra-rapide par Code PIN personnel sans déconnexion des travaux ou formulaires en cours de saisie.',
      'Verrouillage administratif par mot de passe des sections critiques (modules, workflows, rôles).',
    ],
    steps: [
      'Régler le délai d inactivité dans l Administration > Sécurité (ex: 15 minutes).',
      'Lorsqu un collaborateur s absente, l écran se fige et affiche le pavé de déverrouillage sécurisé.',
      'La saisie du code PIN rétablit immédiatement la session sans perte de données.',
    ],
  },
  {
    num: 20,
    title: 'Piste d Audit des Configurations & Journal Général des Événements',
    domain: 'Conformité ISO 9001, Imputabilité & Contrôle Interne',
    adminImg: getBase64('admin_20_audit_history.png'),
    effectImg: getBase64('effect_20_system_audit_log.png'),
    adminDesc: 'Centre d Administration > Piste d Audit Config : journal spécifique des modifications de règles et paramètres de gestion.',
    effectDesc: 'Plateforme > Journal d Audit Général : historique universel horodaté de toutes les actions opérationnelles utilisateurs.',
    concept: 'Garantie absolue d imputabilité : chaque action, suppression, virement ou changement de paramètre est signé et infalsifiable.',
    rules: [
      'Enregistrement automatique et irréversible de l identifiant opérateur, du rôle, de la date, de l adresse IP et du détail.',
      'Impossibilité technique pour tout utilisateur (y compris l administrateur) de purger ou modifier les lignes d audit.',
      'Exportation certifiée pour transmission aux commissaires aux comptes ou auditeurs qualité.',
    ],
    steps: [
      'Toute action réalisée dans l Administration ou dans les modules métiers génère une écriture instantanée.',
      'Ouvrir le module "Journal d Audit" pour inspecter les événements suspects ou valider la chronologie d une affaire.',
      'Filtrer par date, opérateur ou type d action (admin_finance_saved, admin_module_toggle, document_signed).',
    ],
  },
];

console.log('Construction de la maquette HTML complète...');

const chaptersHtml = PAIRS.map((p) => `
  <div class="page-break"></div>
  <div class="chapter-header">
    <div class="chapter-tag">POINT N° ${p.num} · ${p.domain.toUpperCase()}</div>
    <h1 class="chapter-title">${p.title}</h1>
  </div>

  <div class="concept-box">
    <strong>Enjeu Métier &amp; Objectif Opérationnel :</strong> ${p.concept}
  </div>

  <!-- DOUBLE SCREENSHOT BLOCK (ADMINISTRATION -> EFFET PLATEFORME) -->
  <div class="dual-screen-grid">
    <div class="screen-card">
      <div class="screen-card-header admin-header">
        <span class="step-badge">1. DANS L'ADMINISTRATION (LA CAUSE / LE PARAMÈTRE)</span>
      </div>
      <div class="img-wrapper">
        <img src="${p.adminImg}" class="proof-img" alt="Capture Administration ${p.title}">
      </div>
      <div class="screen-legend">
        ${p.adminDesc}
      </div>
    </div>

    <div class="screen-card">
      <div class="screen-card-header effect-header">
        <span class="step-badge">2. DANS LA PLATEFORME (L'EFFET DIRECT SUR LE TERRAIN)</span>
      </div>
      <div class="img-wrapper">
        <img src="${p.effectImg}" class="proof-img" alt="Capture Effet Plateforme ${p.title}">
      </div>
      <div class="screen-legend">
        ${p.effectDesc}
      </div>
    </div>
  </div>

  <div class="detail-grid">
    <div class="rules-card">
      <h3>Règles de Gestion &amp; Normes Appliquées</h3>
      <ul>
        ${p.rules.map((r) => `<li>${r}</li>`).join('')}
      </ul>
    </div>

    <div class="steps-card">
      <h3>Procédure Opérationnelle Pas-à-Pas</h3>
      <ol>
        ${p.steps.map((s) => `<li>${s}</li>`).join('')}
      </ol>
    </div>
  </div>
`).join('\n');

const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>CORESI INTERNATIONAL — Mode d'Emploi Complet & Liaison Administration / Plateforme</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 10mm 12mm 10mm;
      @bottom-right {
        content: counter(page);
        font-family: sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
      @bottom-left {
        content: "CORESI INTERNATIONAL SARL · Manuel d'Utilisation Officiel Mode Clair";
        font-family: sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 9pt;
      margin: 0;
      padding: 0;
    }

    .page-break {
      page-break-before: always;
    }

    /* Cover Page */
    .cover {
      height: 980px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 3px solid #3B7A2C;
      padding: 40px;
      border-radius: 8px;
      background: #ffffff;
    }

    .cover-top {
      border-bottom: 2px solid #3B7A2C;
      padding-bottom: 20px;
    }

    .company-title {
      font-size: 26pt;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
    }

    .company-sub {
      font-size: 10.5pt;
      font-weight: 800;
      color: #3B7A2C;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }

    .cover-center {
      text-align: center;
      padding: 30px 10px;
    }

    .badge-doc {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 6px 18px;
      border-radius: 9999px;
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }

    .main-title {
      font-size: 28pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.15;
      margin: 0 0 15px 0;
    }

    .main-sub {
      font-size: 11.5pt;
      color: #475569;
      max-width: 620px;
      margin: 0 auto;
      line-height: 1.5;
    }

    .cover-meta {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 16px;
      font-size: 9pt;
      margin-top: 30px;
      text-align: left;
    }

    .cover-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 15px;
      font-size: 8pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }

    /* Chapter Header */
    .chapter-header {
      margin-bottom: 12px;
      border-bottom: 2px solid #3B7A2C;
      padding-bottom: 8px;
    }

    .chapter-tag {
      font-size: 7.5pt;
      font-weight: 800;
      color: #3B7A2C;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .chapter-title {
      font-size: 15pt;
      font-weight: 900;
      color: #0f172a;
      margin: 2px 0 0 0;
      letter-spacing: -0.3px;
    }

    .concept-box {
      background: #f8fafc;
      border-left: 4px solid #3B7A2C;
      padding: 8px 12px;
      font-size: 8.5pt;
      color: #334155;
      margin-bottom: 12px;
      border-radius: 0 4px 4px 0;
    }

    /* Dual Screenshot Grid */
    .dual-screen-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .screen-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .screen-card-header {
      padding: 5px 10px;
      font-size: 7.5pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .admin-header {
      background: #e0f2fe;
      color: #0369a1;
      border-bottom: 1px solid #bae6fd;
    }

    .effect-header {
      background: #ecfdf5;
      color: #047857;
      border-bottom: 1px solid #a7f3d0;
    }

    .img-wrapper {
      background: #f1f5f9;
      display: flex;
      justify-content: center;
      padding: 4px;
    }

    .proof-img {
      width: 100%;
      height: auto;
      max-height: 290px;
      object-fit: contain;
      display: block;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
    }

    .screen-legend {
      padding: 5px 10px;
      font-size: 7.5pt;
      color: #475569;
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
      font-style: italic;
    }

    /* Details Grid */
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      font-size: 8pt;
    }

    .rules-card, .steps-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
    }

    .rules-card h3, .steps-card h3 {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
    }

    ul, ol {
      margin: 0;
      padding-left: 16px;
    }

    li {
      margin-bottom: 4px;
    }

    /* Toc styling */
    .toc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-top: 15px;
    }

    .toc-table th {
      background: #f1f5f9;
      color: #0f172a;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      font-weight: 800;
      text-align: left;
    }

    .toc-table td {
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
    }

    .toc-table tr:nth-child(even) td {
      background: #f8fafc;
    }
  </style>
</head>
<body>

  <!-- ==================== COUVERTURE ==================== -->
  <div class="cover">
    <div class="cover-top">
      <h1 class="company-title">CORESI <span style="color:#3B7A2C;">INTERNATIONAL</span> SARL</h1>
      <p class="company-sub">Chaudronnerie Industrielle · Tuyauterie Haute Pression · Maintenance &amp; GED Certifiée</p>
      <p style="font-size:8pt; color:#64748b; margin-top:4px;">
        Siège Social : Zone Industrielle, Pointe-Noire · Agence : Brazzaville · République du Congo<br>
        RCCM : CG-PNR-01-2018-B12-00452 · NIF : 020181000049281
      </p>
    </div>

    <div class="cover-center">
      <div class="badge-doc">Mode d'Emploi Intégral · Édition Mode Clair 100% Illustrée</div>
      <h2 class="main-title">MANUEL DE FONCTIONNEMENT OPÉRATIONNEL</h2>
      <p class="main-sub">
        Guide de correspondance intégrale point par point : chaque paramètre, règle et commutateur de l'Administration relié directement à sa démonstration visuelle d'effet dans la plateforme CORESI ERP.
      </p>

      <div class="cover-meta">
        <div>
          <strong>Document :</strong> Mode d'Emploi &amp; Guide de Corrélation v2.0<br>
          <strong>Affichage :</strong> Mode Clair Haute Visibilité (Light Theme)<br>
          <strong>Couverture :</strong> 20 Domaines &amp; 40 Captures Appariées
        </div>
        <div>
          <strong>Réglementation :</strong> ASME IX, CODAP, OHADA, CEMAC, CNSS<br>
          <strong>Diffusion :</strong> Direction Générale, Clients Industriels &amp; Auditeurs<br>
          <strong>Moteur d'Audit :</strong> Traçabilité Automatique Inviolable
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>CORESI INTERNATIONAL SARL — Tous droits réservés</span>
      <span>Direction des Opérations &amp; Systèmes d'Information</span>
    </div>
  </div>

  <!-- ==================== SOMMAIRE DES 20 POINTS APPARIÉS ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <div class="chapter-tag">CORRÉLATION EXHAUSTIVE DES 20 DOMAINES OPÉRATIONNELS</div>
    <h1 class="chapter-title">Sommaire des Correspondances Administration &harr; Plateforme</h1>
  </div>

  <p style="font-size:8.5pt; color:#475569;">
    Pour chacun des 20 points ci-dessous, le présent manuel fournit la capture de configuration dans le Centre d'Administration (la cause) mise en regard direct avec la capture d'écran de son résultat visible dans la plateforme (l'effet réel sur le terrain).
  </p>

  <table class="toc-table">
    <thead>
      <tr>
        <th style="width:5%;">N°</th>
        <th style="width:35%;">Domaine &amp; Paramètre Administration</th>
        <th style="width:40%;">Effet Direct Visible dans la Plateforme</th>
        <th style="width:20%;">Règle Industrielle</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Commutateurs d'Activation des Modules</td><td>Barre Latérale (Sidebar) et Menus Métier</td><td>Affichage / Masquage à chaud</td></tr>
      <tr><td>2</td><td>Workflows &amp; Circuits d'Approbation</td><td>Circuit de Validation DA/BC &amp; Visas N1/N2</td><td>Plafond N1 2,5M FCFA / N2 DG</td></tr>
      <tr><td>3</td><td>Matrice des Rôles &amp; Permissions RBAC</td><td>Écran Espace Métier &amp; Actions Autorisées</td><td>Étanchéité des fonctions sensibles</td></tr>
      <tr><td>4</td><td>Règles de Numérotation Séquentielle</td><td>Format des Références des Documents</td><td>Unicité annuelle (ex: DA-2026-0001)</td></tr>
      <tr><td>5</td><td>Paramètres Finance, TVA 18% &amp; Caisse</td><td>Facturation Client &amp; Journal de Trésorerie</td><td>TVA légale 18% &amp; Plafond 2,5M espèces</td></tr>
      <tr><td>6</td><td>Rétention GED &amp; Livrables Obligatoires</td><td>Coffre-Fort Numérique &amp; Dossiers Projets</td><td>Archivage légal 10 ans OHADA</td></tr>
      <tr><td>7</td><td>Scanner Mobile &amp; Moteur d'Extraction OCR</td><td>Redressement d'Image &amp; Reconnaissance</td><td>Validation humaine obligatoire</td></tr>
      <tr><td>8</td><td>Seuils d'Alerte Budgétaire des Projets</td><td>Barre d'Avancement Coûts &amp; Briefing HSE</td><td>Alerte préventive 80% / critique 95%</td></tr>
      <tr><td>9</td><td>Règles de Stock, N° Série &amp; Multi-Dépôts</td><td>Fiches Matières, Magasins &amp; N° de Coulée</td><td>Certificats matière 3.1 EN 10204</td></tr>
      <tr><td>10</td><td>Alertes Péremption Licences Soudeurs</td><td>Dossiers RH &amp; Habilitations ASME 6G</td><td>Alerte J-30 &amp; Blocage chantier</td></tr>
      <tr><td>11</td><td>GMAO &amp; Compteurs Horaires Machines</td><td>Ordres de Travail (OT) Préventifs</td><td>Révision à 250h/500h de marche</td></tr>
      <tr><td>12</td><td>Barème des Perdiems &amp; Avances Mission</td><td>Ordres de Mission &amp; Décharges de Frais</td><td>Onshore 25k / Offshore 45k FCFA</td></tr>
      <tr><td>13</td><td>Règles Multi-Sites &amp; Transferts</td><td>Bases Opérationnelles &amp; Double Visa</td><td>Visa expéditeur + visa récepteur</td></tr>
      <tr><td>14</td><td>Normes Techniques &amp; PV d'Épreuves</td><td>Calcul Pression d'Épreuve (PE = 1.5x PS)</td><td>Palier 30 min &amp; Visa Dir. Technique</td></tr>
      <tr><td>15</td><td>Achats &amp; Règle des 3 Devis Concurrents</td><td>Bons de Commande Officiels (BC)</td><td>3 Devis obligatoires si &gt; 1M FCFA</td></tr>
      <tr><td>16</td><td>Conformité NIF/RCCM &amp; Agréments HSE</td><td>Répertoire Tiers &amp; Évaluation Qualité</td><td>Blocage des commandes si NIF expiré</td></tr>
      <tr><td>17</td><td>Taux CNSS &amp; Fiscalité Sociale Congo</td><td>Bulletins de Paie Officiels avec Retenues</td><td>CNSS Salarié 4% / Employeur 16%</td></tr>
      <tr><td>18</td><td>Charte Graphique d'Impression A4</td><td>Aperçu Document Imprimable &amp; Filigrane</td><td>En-tête officiel, tampon ASME/ISO</td></tr>
      <tr><td>19</td><td>Sécurité de Session &amp; Délai d'Inactivité</td><td>Écran de Verrouillage &amp; Code PIN Rapide</td><td>Verrouillage auto après 15 minutes</td></tr>
      <tr><td>20</td><td>Piste d'Audit des Configurations</td><td>Journal d'Audit Général des Opérations</td><td>Traçabilité inviolable horodatée</td></tr>
    </tbody>
  </table>

  <!-- ==================== CORPS DU DOCUMENT (LES 20 CHAPITRES APPARIÉS) ==================== -->
  ${chaptersHtml}

</body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, fullHtml, 'utf-8');
console.log('Fichier HTML exhaustif généré :', OUTPUT_HTML);

async function convertToPdf() {
  console.log('Lancement de la conversion PDF haute fidélité...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'load', timeout: 60000 });

  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      bottom: '12mm',
      left: '10mm',
      right: '10mm',
    },
  });

  await browser.close();
  console.log('✓ Mode d emploi exhaustif PDF généré avec succès :', OUTPUT_PDF);
}

convertToPdf().catch((err) => {
  console.error('Erreur conversion PDF:', err);
  process.exit(1);
});
