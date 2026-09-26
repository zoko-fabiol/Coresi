import React, { useEffect, useState } from 'react';

interface ConstructionLoaderProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ConstructionLoader: React.FC<ConstructionLoaderProps> = ({
  fullScreen = true,
  message,
  size = 'md',
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'Initialisation des modules opérationnels...',
    'Vérification des plans ISO & spécifications...',
    'Chargement du registre GED & quittances...',
    'Synchronisation sécurisée des chantiers...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const logoDimension = size === 'sm' ? 'w-14 h-14' : size === 'lg' ? 'w-28 h-28' : 'w-20 h-20';

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
      {/* 1. Official Logo Container with Pulse & Brand Halo */}
      <div className="relative mb-5 group">
        {/* Glow ambient layer */}
        <div className="absolute -inset-3 bg-gradient-to-r from-emerald-600/30 via-amber-500/20 to-orange-600/30 rounded-3xl blur-xl opacity-75 dark:opacity-60 animate-pulse" />

        <div className={`relative ${logoDimension} p-2 rounded-2xl bg-white/90 dark:bg-[#121F16] border border-stone-200/80 dark:border-emerald-800/50 shadow-xl flex items-center justify-center backdrop-blur-sm`}>
          <img
            src="/logo.png"
            alt="Logo CORESI INTERNATIONAL"
            className="w-full h-full object-contain filter drop-shadow-md transition-transform hover:scale-105"
            onError={(e) => {
              // fallback if needed
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Small floating industrial badge */}
        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-700 to-green-800 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-full shadow border border-emerald-500/40">
          SARL
        </div>
      </div>

      {/* 2. Brand Identity Title */}
      <div className="space-y-1 mb-6">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-emerald-50">
          CORESI <span className="text-emerald-700 dark:text-emerald-400">INTERNATIONAL</span>
        </h2>
        <p className="text-[11px] sm:text-xs font-medium tracking-wide uppercase text-stone-600 dark:text-emerald-300/80">
          Tuyauterie · Chaudronnerie · BTP &amp; GED Industrielle
        </p>
      </div>

      {/* 3. Chantier Construction Animation (Poutrelle, Grue & Étincelles) */}
      <div className="w-64 sm:w-80 space-y-3">
        {/* SVG Animated Industrial Crane & Girder */}
        <div className="relative h-14 w-full flex items-center justify-center overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 260 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Ground / Scaffold support baseline */}
            <line x1="20" y1="44" x2="240" y2="44" stroke="currentColor" className="text-stone-300 dark:text-emerald-900/60" strokeWidth="2" strokeDasharray="4 3" />
            
            {/* Pylone / Tour grue */}
            <path d="M 40 44 L 50 10 L 60 44" stroke="currentColor" className="text-stone-400 dark:text-emerald-800" strokeWidth="2" />
            <line x1="44" y1="30" x2="56" y2="30" stroke="currentColor" className="text-stone-400 dark:text-emerald-800" strokeWidth="1.5" />
            <line x1="47" y1="18" x2="53" y2="18" stroke="currentColor" className="text-stone-400 dark:text-emerald-800" strokeWidth="1.5" />

            {/* Fleche de la grue */}
            <line x1="30" y1="10" x2="220" y2="10" stroke="currentColor" className="text-amber-600 dark:text-amber-500" strokeWidth="3" strokeLinecap="round" />
            
            {/* Chariot coulissant sur la fleche */}
            <g className="animate-crane-trolley">
              <rect x="110" y="8" width="14" height="6" rx="2" className="fill-stone-800 dark:fill-emerald-300" />
              {/* Cable du treuil oscillant */}
              <line x1="117" y1="14" x2="117" y2="30" stroke="currentColor" className="text-stone-500 dark:text-emerald-400" strokeWidth="1.5" />
              {/* Crochet de levage */}
              <circle cx="117" cy="31" r="2.5" className="fill-amber-600 dark:fill-amber-400" />
              {/* Poutrelle industrielle en suspension (IPN) */}
              <rect x="92" y="32" width="50" height="5" rx="1.5" className="fill-emerald-700 dark:fill-emerald-400 animate-beam-sway" />
              
              {/* Point de soudure / étincelles */}
              <circle cx="142" cy="34" r="2" className="fill-orange-400 animate-ping" />
              <circle cx="142" cy="34" r="3.5" className="fill-amber-300 animate-pulse" />
            </g>
          </svg>
        </div>

        {/* Industrial Safety Striped Progress Bar */}
        <div className="relative h-2 w-full bg-stone-200/90 dark:bg-emerald-950/80 rounded-full overflow-hidden border border-stone-300 dark:border-emerald-800/60 shadow-inner">
          <div
            className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 animate-stripes-progress"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0px, rgba(255,255,255,0.25) 8px, transparent 8px, transparent 16px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        {/* Dynamic Status Text */}
        <div className="flex items-center justify-center gap-2 pt-1 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-emerald-400 animate-ping shrink-0" />
          <p className="font-mono text-[11px] font-semibold text-stone-700 dark:text-emerald-300 tracking-tight transition-all duration-300">
            {message || steps[stepIndex]}
          </p>
        </div>
      </div>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className="w-full flex items-center justify-center p-8 bg-stone-50/60 dark:bg-[#0B140E]/60 rounded-2xl border border-stone-200 dark:border-emerald-900/40">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center transition-colors duration-300 bg-[#FAF7F2] text-stone-900 dark:bg-[#0B140E] dark:text-emerald-50">
      {/* Subtle blueprint / engineering grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      {content}
    </div>
  );
};
