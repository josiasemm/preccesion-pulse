import React from 'react';

export default function ProtocolSvgIllustration({ protocolId, lang = 'es' }) {
  const isEn = lang === 'en';

  const renderSvg = () => {
    switch (protocolId) {
      case 'pocus_onsd':
        return {
          caption: isEn
            ? 'Closed eyelid + finger braced on orbital rim · Measure sheath 3.0 mm behind retina (MI ≤ 0.23)'
            : 'Párpado cerrado + apoyo en reborde orbitario · Medir vaina 3.0 mm detrás de retina (MI ≤ 0.23)',
          svg: (
            <svg viewBox="0 0 260 205" className="w-full h-64 lg:h-72">
              <style>{`
                @keyframes eimoWave { 0%,100% { opacity: 0.14; } 50% { opacity: 0.34; } }
                .eimo-wave { animation: eimoWave 2s ease-in-out infinite; }
              `}</style>
              {/* Sonda suspendida en gel con apoyo óseo lateral */}
              <rect x="92" y="10" width="76" height="22" rx="6" fill="#0284c7" />
              <text x="130" y="25" textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="700">
                POCUS (MI ≤ 0.23)
              </text>
              <path d="M 74 28 L 74 62" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="74" cy="64" r="3.5" fill="#64748b" />
              <text x="68" y="45" textAnchor="end" fill="#475569" fontSize="7.5" fontWeight="600">
                {isEn ? 'Bony brace' : 'Apoyo óseo'}
              </text>
              {/* Gel grueso + párpado cerrado */}
              <path d="M 88 35 Q 130 43 172 35 L 172 52 Q 130 60 88 52 Z" fill="#bae6fd" opacity="0.9" />
              <text x="178" y="45" fill="#0369a1" fontSize="8.5" fontWeight="600">
                {isEn ? 'Thick gel' : 'Gel grueso'}
              </text>
              <path d="M 96 58 Q 130 66 164 58" fill="none" stroke="#334155" strokeWidth="2.8" strokeLinecap="round" />
              <polygon points="103,45 157,45 168,160 92,160" fill="#38bdf8" className="eimo-wave" />
              <circle cx="130" cy="96" r="34" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
              <path d="M 118 128 L 118 182 M 142 128 L 142 182" stroke="#d97706" strokeWidth="2.5" />
              <rect x="121" y="129" width="18" height="52" fill="#fde68a" opacity="0.7" />
              <line x1="106" y1="152" x2="154" y2="152" stroke="#e11d48" strokeWidth="1.8" strokeDasharray="3 2" />
              <text x="160" y="155" fill="#e11d48" fontSize="8.5" fontWeight="700">
                3.0 mm → ONSD
              </text>
            </svg>
          ),
        };

      case 'pocus_dvt':
        return {
          caption: isEn
            ? 'Unilateral gentle compression every 2 cm · Healthy vein walls touch completely'
            : 'Compresión unilateral suave cada 2 cm · Vena sana colapsa hasta tocar paredes',
          svg: (
            <svg viewBox="0 0 260 205" className="w-full h-64 lg:h-72">
              <style>{`
                @keyframes eimoPress { 0%,100% { transform: translateY(0); } 50% { transform: translateY(12px); } }
                @keyframes eimoSquish { 0%,100% { ry: 18; } 50% { ry: 0.6; } }
                .eimo-press { animation: eimoPress 2.2s ease-in-out infinite; }
                .eimo-squish { animation: eimoSquish 2.2s ease-in-out infinite; }
              `}</style>
              <g className="eimo-press">
                <rect x="96" y="16" width="68" height="24" rx="6" fill="#0284c7" />
                <text x="130" y="32" textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="700">
                  {isEn ? 'GENTLE PRESS' : 'COMPRESIÓN'}
                </text>
                <path d="M 130 44 L 130 60 M 125 55 L 130 61 L 135 55" stroke="#0284c7" strokeWidth="2" fill="none" />
              </g>
              <rect x="35" y="72" width="190" height="96" rx="14" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
              {/* Arteria (no colapsa) */}
              <circle cx="88" cy="120" r="17" fill="#fecdd3" stroke="#e11d48" strokeWidth="2.2" />
              <text x="88" y="150" textAnchor="middle" fill="#be123c" fontSize="8" fontWeight="700">
                {isEn ? 'Artery (pulsatile)' : 'Arteria (late)'}
              </text>
              {/* Vena (colapsa) */}
              <ellipse cx="164" cy="120" rx="22" ry="18" fill="#bae6fd" stroke="#0284c7" strokeWidth="2.2" className="eimo-squish" />
              <text x="164" y="150" textAnchor="middle" fill="#0369a1" fontSize="8" fontWeight="700">
                {isEn ? 'Vein (collapses)' : 'Vena (colapsa)'}
              </text>
            </svg>
          ),
        };

      case 'pcba_istat':
        return {
          caption: isEn
            ? '0g blood dome (DO NOT milk finger) → Capillary fill ~95 µL → 120 s read'
            : 'Domo sanguíneo en 0g (NO exprimir dedo) → Llenado ~95 µL → Lectura 120 s',
          svg: (
            <svg viewBox="0 0 260 205" className="w-full h-64 lg:h-72">
              <style>{`
                @keyframes eimoDrop { 0%,100% { transform: scale(0.94); } 50% { transform: scale(1.06); } }
                .eimo-drop { transform-origin: 95px 86px; animation: eimoDrop 1.8s ease-in-out infinite; }
              `}</style>
              {/* Dedo */}
              <path d="M 35 120 Q 35 88 85 88 L 105 88 Q 118 88 118 104 Q 118 120 102 120 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1.8" />
              {/* Domo sanguíneo en 0g */}
              <circle cx="95" cy="83" r="9" fill="#e11d48" className="eimo-drop" />
              <text x="72" y="64" fill="#be123c" fontSize="8.5" fontWeight="700">
                {isEn ? '0g dome (no milking)' : 'Domo 0g (sin exprimir)'}
              </text>
              {/* Cartucho CHEM8+ */}
              <rect x="136" y="68" width="90" height="44" rx="7" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
              <path d="M 110 83 L 136 83" stroke="#e11d48" strokeWidth="2.5" strokeDasharray="3 2" />
              <text x="181" y="88" textAnchor="middle" fill="#0369a1" fontSize="9" fontWeight="700">CHEM8+</text>
              <text x="181" y="102" textAnchor="middle" fill="#0284c7" fontSize="8">95 µL · 120 s</text>
              <text x="130" y="156" textAnchor="middle" fill="#475569" fontSize="8.5" fontWeight="600">
                iCa²⁺ · Creat · BUN · Gluc · TCO₂
              </text>
            </svg>
          ),
        };

      case 'lbnp_safety':
        return {
          caption: isEn
            ? 'Controlled vacuum (-15 → -25/-40 mmHg) · Stop if SBP drops > 20 or < 90 mmHg'
            : 'Vacío gradual (-15 → -25/-40 mmHg) · Cortar si PAS cae > 20 o < 90 mmHg',
          svg: (
            <svg viewBox="0 0 260 205" className="w-full h-64 lg:h-72">
              <style>{`
                @keyframes eimoFluid { 0% { transform: translateY(-6px); opacity: 0.3; } 50% { transform: translateY(6px); opacity: 0.95; } 100% { transform: translateY(-6px); opacity: 0.3; } }
                .eimo-fluid { animation: eimoFluid 2.1s ease-in-out infinite; }
              `}</style>
              <circle cx="130" cy="28" r="14" fill="#e2e8f0" stroke="#334155" strokeWidth="1.8" />
              <path d="M 105 46 L 155 46 L 150 94 L 110 94 Z" fill="#e2e8f0" stroke="#334155" strokeWidth="1.8" />
              <rect x="92" y="94" width="76" height="88" rx="10" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
              <line x1="88" y1="94" x2="172" y2="94" stroke="#0369a1" strokeWidth="4" strokeLinecap="round" />
              <g className="eimo-fluid" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" fill="none">
                <path d="M 118 62 L 118 134 M 113 127 L 118 135 L 123 127" />
                <path d="M 142 62 L 142 134 M 137 127 L 142 135 L 147 127" />
              </g>
              <text x="130" y="168" textAnchor="middle" fill="#0369a1" fontSize="9.5" fontWeight="700">
                -15 → -25/-40 mmHg
              </text>
            </svg>
          ),
        };

      case 'abcde_0g_fast':
        return {
          caption: isEn
            ? 'Evetts-Russomano 0g CPR (100–120/min) · Scissor legs anchored behind patient torso'
            : 'RCP Evetts-Russomano en 0g (100–120/min) · Piernas en tijera detrás del torso',
          svg: (
            <svg viewBox="0 0 260 205" className="w-full h-64 lg:h-72">
              <style>{`
                @keyframes eimoCpr { 0%,100% { transform: translateY(0); } 45% { transform: translateY(6px); } }
                .eimo-cpr { animation: eimoCpr 0.65s ease-in-out infinite; }
              `}</style>
              {/* Paciente en 0g */}
              <circle cx="58" cy="134" r="13" fill="#fecdd3" stroke="#be123c" strokeWidth="1.8" />
              <rect x="74" y="120" width="96" height="28" rx="10" fill="#fecdd3" stroke="#be123c" strokeWidth="1.8" />
              <path d="M 170 134 L 214 134" stroke="#be123c" strokeWidth="7" strokeLinecap="round" />
              {/* Reanimador: piernas envuelven la espalda del paciente como pinza de contrafuerza */}
              <path d="M 134 94 Q 160 116 146 156 L 106 156 Q 88 156 96 148" fill="none" stroke="#1e40af" strokeWidth="5.5" strokeLinecap="round" />
              <path d="M 130 94 Q 116 106 112 154 L 146 154" fill="none" stroke="#1d4ed8" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="4 2" />
              <g className="eimo-cpr">
                <circle cx="130" cy="36" r="12" fill="#dbeafe" stroke="#1d4ed8" strokeWidth="1.8" />
                <path d="M 130 50 L 132 95" stroke="#1d4ed8" strokeWidth="6" strokeLinecap="round" />
                <path d="M 128 64 L 122 120" stroke="#1d4ed8" strokeWidth="4.5" strokeLinecap="round" />
              </g>
              <text x="130" y="185" textAnchor="middle" fill="#be123c" fontSize="9" fontWeight="700">
                100–120/min · 5–6 cm · F = 0g Counterforce
              </text>
            </svg>
          ),
        };

      case 'spe_storm_shelter':
        return {
          caption: isEn
            ? '360° ≥ 45 g/cm² H₂O/polyethylene shelter (isotropic SPE/GCR) · CBC 4–6 h & 24/48/72 h'
            : 'Refugio 360° ≥ 45 g/cm² H₂O/polietileno (radiación isotrópica) · BH 4–6 h y 24/48/72 h',
          svg: (
            <svg viewBox="0 0 260 205" className="w-full h-64 lg:h-72">
              <style>{`
                @keyframes eimoRay { 0%,100% { opacity: 0.3; } 50% { opacity: 0.95; } }
                .eimo-ray { animation: eimoRay 1.7s ease-in-out infinite; }
              `}</style>
              {/* Flujo omnidireccional alrededor de escudo 360° */}
              <g stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" className="eimo-ray">
                <line x1="20" y1="66" x2="54" y2="78" />
                <line x1="20" y1="126" x2="54" y2="114" />
                <line x1="240" y1="66" x2="206" y2="78" />
                <line x1="240" y1="126" x2="206" y2="114" />
                <line x1="130" y1="10" x2="130" y2="30" />
              </g>
              {/* Escudo envolvente 360° de agua/polietileno */}
              <ellipse cx="130" cy="100" rx="70" ry="64" fill="#e0f2fe" stroke="#0284c7" strokeWidth="10" />
              <text x="130" y="50" textAnchor="middle" fill="#0369a1" fontSize="8.5" fontWeight="700">
                45 g/cm² 360° H₂O / PE
              </text>
              <circle cx="130" cy="84" r="14" fill="#dcfce7" stroke="#059669" strokeWidth="2" />
              <rect x="112" y="102" width="36" height="44" rx="10" fill="#dcfce7" stroke="#059669" strokeWidth="2" />
              <text x="130" y="184" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="700">
                {isEn ? 'BFO Shielded (Isotropic ALARA)' : 'BFO Protegido (ALARA Isotrópico)'}
              </text>
            </svg>
          ),
        };

      case 'renal_stone_pocus':
        return {
          caption: isEn
            ? 'Check Creatinine BEFORE NSAIDs · Flank POCUS + Suprapubic Doppler jets (3–5 min)'
            : 'Checar Creatinina ANTES de AINEs · POCUS flanco + Doppler vesical (3–5 min)',
          svg: (
            <svg viewBox="0 0 260 205" className="w-full h-64 lg:h-72">
              <style>{`
                @keyframes eimoJet { 0%,100% { opacity: 0.25; } 50% { opacity: 0.95; } }
                .eimo-jet { animation: eimoJet 1.6s ease-in-out infinite; }
              `}</style>
              <path d="M 88 45 C 62 45 50 74 58 102 C 66 132 94 128 96 108 C 98 92 84 86 92 72 C 98 62 96 45 88 45 Z" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
              <path d="M 172 45 C 198 45 210 74 202 102 C 194 132 166 128 164 108 C 162 92 176 86 168 72 C 162 62 164 45 172 45 Z" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
              <path d="M 96 96 Q 112 106 114 146 M 164 96 Q 148 106 146 146" fill="none" stroke="#d97706" strokeWidth="2" />
              <ellipse cx="130" cy="158" rx="34" ry="22" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
              <path d="M 116 148 L 126 162 M 144 148 L 134 162" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" className="eimo-jet" />
              <text x="130" y="194" textAnchor="middle" fill="#0369a1" fontSize="8.5" fontWeight="700">
                {isEn ? 'Doppler Ureteral Jets (3–5 min)' : 'Jets Ureterales Doppler (3–5 min)'}
              </text>
            </svg>
          ),
        };

      case 'fluid_loading_reentry':
        return {
          caption: isEn
            ? 'T-2h to T-1h: 8–9 NaCl 1g tabs in sealed 1L 0g pouch · 3-step post-landing stand-up'
            : 'T-2h a T-1h: 8–9 tabletas NaCl 1g en bolsa sellada 1L (sin menisco en 0g) · 3 tiempos',
          svg: (
            <svg viewBox="0 0 260 205" className="w-full h-64 lg:h-72">
              <style>{`
                @keyframes eimoSqueeze { 0%,100% { rx: 28; } 50% { rx: 22; } }
                .eimo-squeeze { animation: eimoSqueeze 2.4s ease-in-out infinite; }
              `}</style>
              {/* Bolsa blanda sellada completamente llena (sin nivel libre por gravedad) */}
              <rect x="64" y="44" width="58" height="110" rx="22" fill="#bae6fd" stroke="#0284c7" strokeWidth="2.2" className="eimo-squeeze" />
              <rect x="85" y="34" width="16" height="10" rx="3" fill="#0284c7" />
              <text x="93" y="88" textAnchor="middle" fill="#0369a1" fontSize="9" fontWeight="700">1.0 L H₂O</text>
              <text x="93" y="103" textAnchor="middle" fill="#0369a1" fontSize="8.5" fontWeight="700">+ 8–9g NaCl</text>
              <text x="93" y="122" textAnchor="middle" fill="#0284c7" fontSize="7.5" fontWeight="600">
                {isEn ? '0g Sealed Pouch' : 'Bolsa Sellada 0g'}
              </text>
              <path d="M 134 96 L 164 96 M 158 90 L 166 96 L 158 102" stroke="#059669" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <rect x="176" y="64" width="46" height="84" rx="10" fill="#dcfce7" stroke="#059669" strokeWidth="2" />
              <text x="199" y="102" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="700">OIG /</text>
              <text x="199" y="114" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="700">Kentavr</text>
              <text x="130" y="182" textAnchor="middle" fill="#475569" fontSize="8.5" fontWeight="600">
                {isEn ? 'Check SANS/BP lock before NaCl load' : 'Verificar candado SANS/PA antes de carga'}
              </text>
            </svg>
          ),
        };

      case 'eva_dcs_hypoxia':
        return {
          caption: isEn
            ? '100% O₂ at 15 L/min (watch cabin O₂ < 23.5%) · Immobilize joint · No return to EVA'
            : 'O₂ 100% a 15 L/min (vigilar O₂ cabina < 23.5%) · Inmovilizar · Prohibido EVA',
          svg: (
            <svg viewBox="0 0 260 205" className="w-full h-64 lg:h-72">
              <style>{`
                @keyframes eimoO2 { 0%,100% { r: 18; opacity: 0.85; } 50% { r: 23; opacity: 0.45; } }
                .eimo-o2 { animation: eimoO2 2s ease-in-out infinite; }
              `}</style>
              <circle cx="84" cy="96" r="20" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" className="eimo-o2" />
              <text x="84" y="94" textAnchor="middle" fill="#0369a1" fontSize="11" fontWeight="800">100% O₂</text>
              <text x="84" y="108" textAnchor="middle" fill="#0284c7" fontSize="8" fontWeight="700">15 L/min</text>
              <path d="M 112 96 L 148 96 M 142 90 L 150 96 L 142 102" stroke="#0284c7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <rect x="158" y="64" width="66" height="64" rx="12" fill="#f1f5f9" stroke="#334155" strokeWidth="2" />
              <text x="191" y="91" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="700">N₂ Washout</text>
              <text x="191" y="105" textAnchor="middle" fill="#e11d48" fontSize="8" fontWeight="700">O₂ Cab &lt; 23.5%</text>
              <text x="130" y="168" textAnchor="middle" fill="#475569" fontSize="8.5" fontWeight="600">
                {isEn ? 'Recompression + Oral/IV Fluids' : 'Recompresión + Hidratación Isotónica'}
              </text>
            </svg>
          ),
        };

      case 'thigh_cuff_sans':
      default:
        return {
          caption: isEn
            ? '30–50 mmHg daytime (max 8–10 h, off for sleep) · Keep pedal pulse palpable'
            : '30–50 mmHg diurno (máx 8–10 h, retirar al dormir) · Mantener pulso pedio',
          svg: (
            <svg viewBox="0 0 260 205" className="w-full h-64 lg:h-72">
              <style>{`
                @keyframes eimoCuff { 0%,100% { stroke-width: 2; } 50% { stroke-width: 4; } }
                .eimo-cuff { animation: eimoCuff 2s ease-in-out infinite; }
              `}</style>
              <rect x="86" y="34" width="28" height="128" rx="12" fill="#e2e8f0" stroke="#475569" strokeWidth="1.8" />
              <rect x="146" y="34" width="28" height="128" rx="12" fill="#e2e8f0" stroke="#475569" strokeWidth="1.8" />
              <rect x="80" y="54" width="40" height="26" rx="5" fill="#bae6fd" stroke="#0284c7" className="eimo-cuff" />
              <rect x="140" y="54" width="40" height="26" rx="5" fill="#bae6fd" stroke="#0284c7" className="eimo-cuff" />
              <text x="130" y="42" textAnchor="middle" fill="#0369a1" fontSize="8.5" fontWeight="700">30–50 mmHg</text>
              <circle cx="100" cy="154" r="4" fill="#059669" />
              <circle cx="160" cy="154" r="4" fill="#059669" />
              <text x="130" y="184" textAnchor="middle" fill="#047857" fontSize="8.5" fontWeight="700">
                {isEn ? 'Pedal Pulse Present · +B-Complex' : 'Pulso Pedio Presente · +Complejo B'}
              </text>
            </svg>
          ),
        };
    }
  };

  const { caption, svg } = renderSvg();

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2.5 shadow-2xs">
      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full">
        {isEn ? 'Visual Procedure Guide' : 'Guía Visual del Procedimiento'}
      </span>
      <div className="w-full flex items-center justify-center bg-slate-50/70 rounded-xl p-2 border border-slate-100">
        {svg}
      </div>
      <p className="text-[11px] text-slate-600 text-center font-medium leading-snug">{caption}</p>
    </div>
  );
}
