import React, { useEffect } from 'react';
import { Atom, BookOpenCheck, ShieldCheck, X } from 'lucide-react';

function Frac({ num, den }) {
  return (
    <span className="inline-flex flex-col items-center align-middle mx-1 leading-tight">
      <span className="border-b border-current px-1.5 pb-0.5 text-[0.88em]">{num}</span>
      <span className="px-1.5 pt-0.5 text-[0.88em]">{den}</span>
    </span>
  );
}

function Sub({ children }) {
  return <sub className="text-[0.72em] align-sub ml-0.5">{children}</sub>;
}

function Sup({ children }) {
  return <sup className="text-[0.72em] align-super ml-0.5">{children}</sup>;
}

export default function PhysicsFormulasModal({ isOpen, lang = 'es', onClose }) {
  const isEn = lang === 'en';

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const models = [
    {
      title: isEn
        ? '1. Hydrostatics & Cephalad Fluid Shift (SANS · ΔTRT250 / ONSD)'
        : '1. Hidrostática y Redistribución Cefálica (SANS · ΔTRT250 / ONSD)',
      equations: [
        <span key="eq1a">
          ΔP<Sub>shift</Sub> = <Frac num={<>ρ · (g<Sub>0</Sub> − g<Sub>eff</Sub>) · h</>} den="133.322" />
        </span>,
        <span key="eq1b">
          V<Sub>p</Sub>(t) = V<Sub>eq</Sub> + (V<Sub>0</Sub> − V<Sub>eq</Sub>) · e<Sup>−t / τ</Sup>
        </span>,
      ],
      vars: isEn
        ? [
            'ρ = 1060 kg/m³ (whole blood)',
            'h = 0.35 m (heart–eye column)',
            'τ = 2.5 days · ΔV_eq = −13%·(1−g_eff/g₀)',
            'SANS OCT ΔTRT250: <20 / ≥20 / ≥55 µm',
          ]
        : [
            'ρ = 1060 kg/m³ (sangre)',
            'h = 0.35 m (corazón–ojo)',
            'τ = 2.5 días · ΔV_eq = −13%·(1−g_eff/g₀)',
            'OCT ΔTRT250: <20 / ≥20 / ≥55 µm',
          ],
      desc: isEn
        ? 'As hydrostatic gravity drops (g_eff → 0), cephalad pressure increases +27.3 mmHg relative to upright 1g posture while plasma volume contracts toward ΔV_eq (τ = 2.5 d). Monitored via optic nerve sheath (ONSD 5.0 / 5.8 mm) and peripapillary macular OCT ΔTRT250.'
        : 'Al perder el gradiente gravitatorio (g_eff → 0), el desplazamiento hidrostático cefálico respecto a 1g alcanza +27.3 mmHg en el cráneo mientras el volumen plasmático decae hasta ΔV_eq (τ = 2.5 días). Vigilado con ONSD (5.0 / 5.8 mm) y OCT peripapilar ΔTRT250.',
    },
    {
      title: isEn
        ? '2. Cabin ppCO₂ Mass Balance & Alveolar Gas Equation'
        : '2. Conservación de ppCO₂ y Ecuación de Gas Alveolar',
      equations: [
        <span key="eq2a">
          <Frac num={<>d(ppCO<Sub>2</Sub>)</>} den="dt" /> ={' '}
          <Frac
            num={<>R<Sub>met</Sub> · (N − 1.15 · η<Sub>CDRA</Sub> · N<Sub>nom</Sub> · f<Sub>c</Sub>)</>}
            den={<>V<Sub>cab</Sub></>}
          />
        </span>,
        <span key="eq2b">
          P<Sub>A</Sub>O<Sub>2</Sub> = (P<Sub>atm</Sub> − 47) · F<Sub>i</Sub>O<Sub>2</Sub> −{' '}
          <Frac num={<>P<Sub>a</Sub>CO<Sub>2</Sub></>} den="RQ" />
        </span>,
      ],
      vars: isEn
        ? [
            'R_met = 18.0 mmHg·m³/(h·crew)',
            'f_c = clamp(ppCO₂ / 2.1, 0.3, 2.5)',
            'NASA-STD-3001 ppCO₂ ≤ 3.0 mmHg [V2 6004]',
            'Flammability O₂ < 23.5% [V2 11040] · RQ = 0.82',
          ]
        : [
            'R_met = 18.0 mmHg·m³/(h·tripulante)',
            'f_c = clamp(ppCO₂ / 2.1, 0.3, 2.5)',
            'Límite NASA-STD-3001 ppCO₂ ≤ 3.0 mmHg [V2 6004]',
            'Inflamabilidad O₂ < 23.5% [V2 11040] · RQ = 0.82',
          ],
      desc: isEn
        ? 'Metabolic CO₂ generation scales with crew count N whereas CDRA unit removal depends on fixed design capacity N_nom and cabin concentration factor f_c (both inversely scaled by cabin volume V_cab). PAO₂ tracks dynamic cabin pressure P_atm and O₂ fraction FiO₂.'
        : 'La generación metabólica escala con la tripulación N mientras la remoción CDRA depende de su capacidad nominal de diseño N_nom y el factor de concentración f_c (escalados por 1/V_cab). La PAO₂ integra presión total P_atm y fracción FiO₂ dinámicas.',
    },
    {
      title: isEn
        ? '3. SPE Radiation Attenuation & Andrews Lymphocyte Kinetics'
        : '3. Atenuación de Radiación (SPE/GCR) y Cinética de Andrews',
      equations: [
        <span key="eq3a">
          D<Sub>SPE</Sub>(x) = D<Sub>ref</Sub> · e<Sup>−(x − x_ref) / λ_SPE</Sup>
        </span>,
        <span key="eq3b">
          L(t) = L<Sub>0</Sub> · e<Sup>−k(D) · t</Sup>
        </span>,
      ],
      vars: isEn
        ? [
            'x_ref = 5–30 g/cm² (Rover 5 / Transit 15 / ISS 20 / Mars 30)',
            'Storm Shelter: 45 g/cm² H₂O/PE (when available in SWaP)',
            '30d BFO limit: 250 mGy-Eq · Career: 600 mSv',
          ]
        : [
            'x_ref = 5–30 g/cm² (Rover 5 / Tránsito 15 / ISS 20 / Marte 30)',
            'Refugio Tormenta: 45 g/cm² H₂O/PE (si disponible en SWaP)',
            'Límite BFO 30d: 250 mGy-Eq · Carrera: 600 mSv',
          ],
      desc: isEn
        ? 'Solar particle event (SPE) proton fluence is attenuated relative to nominal vehicle shielding x_ref when an onboard 45 g/cm² Storm Shelter exists. Above 250 mGy-Eq BFO (0.25 Gy-Eq), depletion rate k(D) = 0.018·(D_Gy − 0.25) triggers 24/48/72h CBC tracking.'
        : 'Los protones solares (SPE) se atenúan respecto al blindaje base x_ref cuando el vehículo dispone de Storm Shelter de 45 g/cm². Sobre 250 mGy-Eq BFO (0.25 Gy-Eq), la tasa continua k(D) = 0.018·(D_Gy − 0.25) activa biometría seriada 24/48/72h.',
    },
    {
      title: isEn
        ? '4. Wolff Bone Remodeling Law & Renal Supersaturation'
        : '4. Ley de Wolff Ósea y Sobresaturación Renal',
      equations: [
        <span key="eq4a">
          <Frac num="d(DMO)" den="dt" /> = −α · (1 − <Frac num={<>g<Sub>eff</Sub></>} den={<>g<Sub>0</Sub></>} />) · max(0.05, 1 − η<Sub>ARED</Sub>·r − 𝟙<Sub>Alend</Sub>·η<Sub>Alend</Sub>)
        </span>,
        <span key="eq4b">
          DMO<Sub>acum</Sub>(t) = −35% · [ 1 − exp(−<Frac num={<>|d(DMO)/dt| · t<Sub>mes</Sub></>} den="35%" />) ] &nbsp;·&nbsp;
          I<Sub>renal</Sub> = <Frac num={<>0.4 + |ΔDMO<Sub>mes</Sub>|</>} den={<>V<Sub>orina</Sub></>} /> · f<Sub>citrato</Sub> · f<Sub>waiver</Sub>
        </span>,
      ],
      vars: isEn
        ? [
            'α = 1.4%/mo (0g baseline, capped −35%)',
            'η_ARED = 0.65 · η_Alend = 0.30',
            'Hydration ≥ 2.5 L/d + K+ Citrate',
          ]
        : [
            'α = 1.4%/mes (basal 0g, tope asintótico −35%)',
            'η_ARED = 0.65 · η_Alend = 0.30',
            'Hidratación ≥ 2.5 L/d + Citrato de K+',
          ],
      desc: isEn
        ? 'Mechanical unloading drives trabecular calcium efflux (asymptotically bounded at −35% total loss), raising urinary stone supersaturation I_renal. ARED resistive exercise, weekly alendronate, K+ citrate, and ≥ 2.5 L/d hydration mitigate nephrolithiasis.'
        : 'Sin carga mecánica la resorción ósea libera calcio al torrente y orina (con límite asintótico en −35%), elevando I_renal. Ejercicio resistivo ARED, alendronato, citrato de potasio e hidratación ≥ 2.5 L/día frenan la litiasis.',
    },
    {
      title: isEn
        ? '5. 3-Layer Organic Rule-Out & 0.1 Hz Baroreflex Pacing'
        : '5. Descarte Orgánico en 3 Capas y Resonancia Vagal (0.1 Hz)',
      equations: [
        <span key="eq5a">
          f<Sub>res</Sub> = 0.1 Hz = <Frac num={isEn ? '6 breaths' : '6 resp'} den="min" /> &nbsp;({isEn ? '4 s inhale → 6 s exhale' : '4 s inhalar → 6 s exhalar'})
        </span>,
      ],
      vars: isEn
        ? ['Layer 1: ppCO₂ > 3.0 mmHg', 'Layer 2: SpO₂ < 94%', 'Layer 3: Glucose < 70 mg/dL']
        : ['Capa 1: ppCO₂ > 3.0 mmHg', 'Capa 2: SpO₂ < 94%', 'Capa 3: Glucosa < 70 mg/dL'],
      desc: isEn
        ? 'EIMO never labels distress as primary anxiety until hypercapnia, hypoxia, and hypoglycemia are ruled out. Once physical layers are clean, 0.1 Hz resonance breathing engages arterial baroreflex HRV.'
        : 'El motor nunca etiqueta ansiedad sin descartar primero hipercapnia, hipoxia o hipoglucemia. Cuando las 3 capas orgánicas están limpias, acopla el marcapasos respiratorio barorreflejo a 0.1 Hz.',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="physics-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Atom className="w-5 h-5 text-sky-600" />
            <h2 id="physics-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
              {isEn
                ? 'Coupled Biophysical Models & Congress Transparency'
                : 'Modelo Físico-Matemático Acoplado y Rigor Científico'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close' : 'Cerrar'}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-5">
          {models.map((m) => (
            <div
              key={m.title}
              className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col gap-3"
            >
              <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {m.equations.map((eq, idx) => (
                  <div
                    key={idx}
                    className={`bg-white border border-sky-200/80 rounded-xl px-4 py-3.5 flex items-center justify-center text-center shadow-2xs ${
                      m.equations.length === 1 ? 'md:col-span-2' : ''
                    }`}
                  >
                    <div className="font-serif text-base sm:text-lg font-semibold text-sky-900 tracking-wide leading-relaxed">
                      {eq}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {m.vars.map((v) => (
                  <span
                    key={v}
                    className="text-[11px] font-medium bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
                  >
                    {v}
                  </span>
                ))}
              </div>

              <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">{m.desc}</p>
            </div>
          ))}

          {/* Separación explícita para defensa científica ante Congreso */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <BookOpenCheck className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {isEn
                  ? 'Scientific Validation Boundary (NASA Standards vs Parametric Approximations)'
                  : 'Frontera de Validación Científica (Estándar NASA vs Aproximación Paramétrica)'}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5 text-emerald-950">
                <p className="font-bold">
                  {isEn ? 'Verified NASA / OCHMO Standards & Exact Physics' : 'Leyes Exactas y Estándares Oficiales NASA / OCHMO'}
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11.5px]">
                  <li>Stevin hydrostatic ΔP = ρ·Δg·h &amp; Alveolar Gas Equation (PAO₂).</li>
                  <li>NASA-STD-3001 ppCO₂ ≤ 3.0 mmHg [V2 6004], noise 60/85 dBA [V2 6078/6080], O₂ &lt; 23.5% [V2 11040].</li>
                  <li>Radiobiology limits: 250 mGy-Eq 30d BFO &amp; 600 mSv career (OCHMO / REMM).</li>
                  <li>SANS diagnostic OCT ΔTRT250 (≥ 20 / ≥ 55 µm) &amp; ONSD (≥ 5.0 / ≥ 5.8 mm).</li>
                </ul>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5 text-amber-950">
                <p className="font-bold">
                  {isEn ? 'EIMO v1.0 Parametric Approximations' : 'Aproximaciones Paramétricas Operativas EIMO v1.0'}
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11.5px]">
                  <li>
                    {isEn
                      ? 'First-order plasma decay (τ = 2.5 d) & linear ΔONSD coupling.'
                      : 'Decaimiento plasmático de 1er orden (τ = 2.5 d) y acoplamiento lineal ΔONSD.'}
                  </li>
                  <li>
                    {isEn
                      ? 'Single-exponent SPE attenuation (λ_SPE = 12 g/cm²) replacing full Monte Carlo GEANT4.'
                      : 'Atenuación monoexponencial SPE (λ_SPE = 12 g/cm²) como proxy ligero de transporte HZETRN/GEANT4.'}
                  </li>
                  <li>
                    {isEn
                      ? 'Wolff BMD loss (α = 1.4%/mo, capped −35%) & scalar renal saturation index I_renal.'
                      : 'Pérdida ósea Wolff (α = 1.4%/mes, tope −35%) e índice escalar heurístico I_renal.'}
                  </li>
                  <li>
                    {isEn
                      ? 'CDRA concentration driving factor f_c = clamp(ppCO₂/2.1, 0.3, 2.5) & empirical PaCO₂ proxy (40 + 1.4·max(0, ppCO₂ − 0.5)).'
                      : 'Factor de arrastre CDRA f_c = clamp(ppCO₂/2.1, 0.3, 2.5) y proxy empírico PaCO₂ (40 + 1.4·max(0, ppCO₂ − 0.5)).'}
                  </li>
                  <li>
                    {isEn
                      ? '30 s screening PVT-B & Web Audio relative dBFS audiometry (non-diagnostic).'
                      : 'Tamizaje rápido PVT 30 s y audiometría relativa dBFS (orientativa, no diagnóstica).'}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              {isEn
                ? 'Official Challenge Resources & Standards (NASA / CSA / OCHMO / REMM)'
                : 'Recursos Oficiales del Reto y Estándares (NASA / CSA / OCHMO / REMM)'}
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>NASA Space Apps 2026 HRP Resources:</strong>{' '}
                <a href="https://www.nasa.gov/hrp/hazards/" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline hover:text-sky-900">
                  5 Hazards of Human Spaceflight
                </a>
                {' · '}
                <a href="https://www.nasa.gov/hrp/risks/" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline hover:text-sky-900">
                  Risks of Human Spaceflight
                </a>
                {' · '}
                <a href="https://www.nasa.gov/hrp/ongoing-hrp-research/" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline hover:text-sky-900">
                  Ongoing HRP Research in Space
                </a>
                .
              </li>
              <li>
                <strong>Canadian Space Agency (CSA Partner Resources):</strong>{' '}
                <a href="https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline hover:text-sky-900">
                  Monitoring Radiation for Astronaut Health
                </a>
                {' · '}
                <a href="https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline hover:text-sky-900">
                  Why Do We Conduct Science Experiments in Space?
                </a>
                .
              </li>
              <li>
                <strong>NASA-STD-3001 Vol. 1 &amp; Vol. 2:</strong> ppCO₂ ([V2 6004], cabin model), acoustic limits ([V2 6078], [V2 6080]), EVA PICO₂ ([V2 11039]), O₂ flammability &lt; 23.5% ([V2 11040]), BFO 30d (250 mGy-Eq) &amp; career (&lt; 600 mSv) —{' '}
                <a href="https://standards.nasa.gov/" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline hover:text-sky-900">
                  standards.nasa.gov
                </a>
                .
              </li>
              <li>
                <strong>OCHMO-STD-100.1A &amp; Technical Briefs:</strong> Medical Waivers, CO₂ (TB-004), Hypoxia (TB-003), Radiation (TB-020), Orthostatic Intolerance (TB-019 / TB-051), SANS (MTB-001), Renal Health (MTB-003) —{' '}
                <a href="https://www.nasa.gov/ochmo/hsa-standards/" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline hover:text-sky-900">
                  nasa.gov/ochmo/hsa-standards
                </a>
                .
              </li>
              <li>
                <strong>REMM (HHS — Radiation Emergency Medical Management):</strong> Andrews lymphocyte depletion kinetics &amp; serial CBC —{' '}
                <a href="https://remm.hhs.gov/" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline hover:text-sky-900">
                  remm.hhs.gov
                </a>
                .
              </li>
            </ul>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-sky-50 border border-sky-200 flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <div className="text-xs text-sky-950 leading-relaxed">
              <strong>{isEn ? 'Deterministic Runtime & SI Disclosure:' : 'Declaración de Uso de Superinteligencia (SI):'}</strong>{' '}
              {isEn
                ? 'Superintelligence (SI) tools assisted solely during software engineering and layout design. In orbital or Mars execution, EIMO (Engine for In-Flight Medical Operations) runs 100% deterministically and offline over explicit differential equations and clinical thresholds.'
                : 'Las herramientas de Superinteligencia (SI) se utilizaron exclusivamente en el diseño arquitectónico y desarrollo del software. En ejecución operativa en órbita o Marte, EIMO (Engine for In-Flight Medical Operations) es 100% determinista, offline y auditable sobre ecuaciones físicas y estándares NASA-STD-3001 / OCHMO-STD-100.1A / REMM.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
