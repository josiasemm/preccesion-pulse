import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Atom,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Cpu,
  Database,
  Droplets,
  ExternalLink,
  FileCode2,
  HeartPulse,
  HelpCircle,
  Layers,
  Plus,
  Minus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Users,
} from 'lucide-react';

const CONTENT = {
  es: {
    nav: {
      about: 'Sobre EIMO',
      users: 'Usuarios',
      how: 'Cómo Funciona',
      cases: 'Casos de Uso',
      sources: 'Fuentes',
      cta: 'Abrir Dashboard',
    },
    hero: {
      eyebrow: 'Medicina Aeroespacial · Motor Biofísico Offline-First',
      titleStart: 'Autonomía Médica ',
      titleAccent: 'para Vuelo Espacial',
      subtitle:
        'EIMO integra fisiología espacial, ambiente de cabina y recursos disponibles a bordo para guiar decisiones clínicas cuando Tierra está a minutos de distancia.',
      primaryCta: 'Abrir Dashboard',
      demoCta: 'o iniciar en Modo Demo',
    },
    why: {
      pill: 'Por qué importa',
      titleStart: 'Preparando la salud humana ',
      titleAccent: 'para espacio profundo',
      cards: [
        {
          icon: Activity,
          title: 'Efectos combinados, no aislados',
          body: 'Un alza de CO₂ en cabina agrava la presión cefálica ocular y reduce la velocidad de reacción. Evaluar signos sueltos oculta el problema real.',
        },
        {
          icon: Clock,
          title: 'Tierra no responde al instante',
          body: 'En la Luna son segundos, pero en tránsito o Marte la comunicación ida y vuelta tarda de 14 a 44 minutos. La tripulación necesita criterio autónomo.',
        },
        {
          icon: Layers,
          title: 'Cada vehículo tiene equipo distinto',
          body: 'Un Rover Lunar no lleva el mismo equipo ni blindaje que la ISS. Las recomendaciones clínicas deben adaptarse al inventario real a bordo.',
        },
      ],
    },
    about: {
      pill: 'Sobre EIMO',
      titleStart: '¿Qué hace diferente ',
      titleAccent: 'a EIMO?',
      pillars: [
        {
          icon: HeartPulse,
          title: 'Motor Biofísico Acoplado',
          body: 'Conecta redistribución de fluidos, atmósfera de cabina, radiación solar, pérdida ósea y respuesta neuroconductual en tiempo real.',
        },
        {
          icon: ShieldCheck,
          title: 'Descarte Orgánico Antes del Estrés',
          body: 'Verifica primero CO₂ elevado, falta de oxígeno o hipoglucemia antes de catalogar un cuadro como ansiedad o insomnio.',
        },
        {
          icon: Compass,
          title: 'Adaptación Automática por Entorno',
          body: 'Ajusta gravedad, latencia y contramedidas entre ISS (0g), Tránsito (0g), Rover Lunar (0.165g) y Base en Marte (0.38g).',
        },
      ],
      valueTitleStart: '¿Dónde aporta valor ',
      valueTitleAccent: 'EIMO?',
      values: [
        {
          icon: Stethoscope,
          title: 'Triaje inmediato en cabina',
          body: 'Cuando falla un subsistema o cambian los signos vitales, ordena prioridades sin ruido visual.',
        },
        {
          icon: Cpu,
          title: 'Contramedidas filtradas por SWaP',
          body: 'Recomienda solo procedimientos y dispositivos físicamente disponibles en el vehículo actual.',
        },
        {
          icon: ShieldAlert,
          title: 'Paquetes listos para Control de Misión',
          body: 'Estructura eventos agudos y signos vitales en cola offline para sincronizar apenas abra el enlace.',
        },
      ],
    },
    users: {
      pill: 'Nuestros usuarios',
      titleStart: 'Diseñado para ',
      titleAccent: 'quienes cuidan la misión',
      cards: [
        {
          role: 'Oficial Médico a Bordo (CMO)',
          summary:
            'Pasos claros, pruebas integradas en navegador (PVT-B, audiometría, rejilla de Amsler, respiración 0.1 Hz) y protocolos sin saturación visual.',
        },
        {
          role: 'Flight Surgeons en Tierra',
          summary:
            'Paquetes clínicos ordenados con vitales, escala de coma y banderas rojas ya tamizadas tras superar la latencia orbital.',
        },
        {
          role: 'Investigadores y Planificadores',
          summary:
            'Simulación continua paso a paso y lectura directa de series reales de telemetría en formato CSV o JSON.',
        },
      ],
    },
    how: {
      pill: 'Cómo funciona',
      titleStart: '3 pasos simples para ',
      titleAccent: 'decidir en tiempo real',
      steps: [
        {
          num: '1',
          title: 'Entrada: Perfil, Entorno y Telemetría',
          body: 'Configura los valores basales del tripulante, elige el vehículo (ISS, Tránsito, Rover o Marte) y registra mediciones manuales o carga un archivo CSV/JSON.',
        },
        {
          num: '2',
          title: 'Análisis: Evaluación Clínica Acoplada',
          body: 'El motor evalúa cinco dominios fisiológicos al mismo tiempo, revisa contraindicaciones cruzadas y aplica límites reales de NASA-STD-3001 y OCHMO sin depender de internet.',
        },
        {
          num: '3',
          title: 'Salida: Prioridades y Protocolo Guiado',
          body: 'Muestra un mapa anatómico por colores, ordena qué atender primero según el equipo disponible a bordo y prepara el paquete clínico si se requiere soporte de Control de Misión.',
        },
      ],
    },
    cases: {
      pill: 'Casos de uso',
      titleStart: 'Escenarios reales de ',
      titleAccent: 'Salud Espacial',
      note: 'Todos estos escenarios corren en vivo dentro del Dashboard usando el Modo Demo o los registros de ejemplo del repositorio.',
      items: [
        {
          tag: 'Caso 1',
          icon: Droplets,
          title: 'Adaptación a Microgravedad: SANS, Hueso y Litiasis Renal',
          question:
            '¿Cómo la falta de gravedad afecta al mismo tiempo la visión del astronauta, su masa ósea y el riesgo de cálculos renales?',
          body: 'Integra el desplazamiento de fluidos hacia la cabeza (SANS: ultrasonido ocular ONSD, OCT y rejilla de Amsler) con la pérdida de calcio óseo y el riesgo renal de litiasis. Además activa candados automáticos de seguridad (bloquea LBNP ante sospecha de trombosis o deshidratación) y adapta las medidas entre 0g, Luna y Marte.',
          action: 'Probar en Modo Demo',
        },
        {
          tag: 'Caso 2',
          icon: Activity,
          title: 'Habitabilidad en Cabina y Desempeño Cognitivo',
          question:
            '¿La fatiga o ansiedad de un tripulante es estrés normal de misión o una falla ambiental silenciosa en cabina?',
          body: 'Cruza ambiente respiratorio, presión cefálica ocular y velocidad de reacción (PVT-B) para descartar causas físicas antes de intervenir y evitar falsos diagnósticos de estrés.',
          action: 'Probar en Modo Demo',
        },
        {
          tag: 'Caso 3',
          icon: Sun,
          title: 'Protección ante Tormentas Solares en Espacio Profundo',
          question:
            '¿Qué tanto protege realmente cada vehículo ante una tormenta solar repentina y qué seguimiento médico exige después?',
          body: 'Ajusta el riesgo según el blindaje disponible en cada misión (Estación, Nave en Tránsito, Rover Lunar o Base en Marte) y activa el monitoreo hematológico temprano para radiación aguda.',
          action: 'Probar en Modo Demo',
        },
        {
          tag: 'Caso 4',
          icon: ShieldAlert,
          title: 'Emergencias Médicas con Latencia hacia Tierra',
          question:
            '¿Cómo actúa la tripulación si ocurre una urgencia clínica cuando Control de Misión tarda entre 14 y 44 minutos en contestar?',
          body: 'Guía la estabilización inmediata paso a paso adaptada a gravedad cero, distingue elevaciones moderadas de crisis reales y prepara el paquete clínico listo para enviarse a Tierra.',
          action: 'Probar en Modo Demo',
        },
      ],
    },
    conclusion: {
      pill: 'Conclusión',
      titleStart: 'Alcance e ',
      titleAccent: 'Impacto en Tierra',
      cards: [
        {
          title: 'Lo que resuelve el prototipo hoy',
          bullets: [
            'Evita protocolos innecesarios o riesgosos (candados LBNP por TVP/hipovolemia y estratificación clínica de presión arterial).',
            'Ejecuta todo el motor determinista de forma local en el navegador, sin latencia ni dependencia de servidores.',
            'Incluye herramientas de tamizaje integradas (PVT-B, audiometría Web Audio, Amsler y guía respiratoria 0.1 Hz).',
          ],
        },
        {
          title: 'Aplicaciones en Tierra y siguiente etapa',
          bullets: [
            'Base auditable para telemedicina rural, expediciones marítimas/polares o minería aislada donde falla la conexión continua.',
            'Siguiente etapa: enlace directo con monitores biomédicos portátiles y validación clínica con médicos aeroespaciales.',
          ],
        },
      ],
      closingHighlight: 'Prototipo funcional y abierto:',
      closingRest:
        ' pensado para que cualquier juez, investigador o estudiante audite cada regla clínica directamente en vivo.',
    },
    faq: {
      pill: 'Preguntas frecuentes',
      titleStart: 'Dudas comunes ',
      titleAccent: 'resueltas',
      items: [
        {
          q: '¿Usa Inteligencia Artificial para diagnosticar?',
          a: 'No. EIMO utiliza un motor biofísico y clínico 100% determinista basado en principios físicos y estándares médicos oficiales, garantizando trazabilidad total sin alucinaciones.',
        },
        {
          q: '¿Necesita internet o servidor externo para funcionar?',
          a: 'No. Todo el motor corre de manera nativa en el navegador guardando estado en almacenamiento local (offline-first). También incluye un backend opcional en FastAPI + SQLite.',
        },
        {
          q: '¿Dónde puedo consultar las ecuaciones físicas completas?',
          a: 'Una vez dentro del Dashboard, haz clic en el botón "Fórmulas" (ícono de átomo en la barra superior) para ver las 5 derivaciones y sus variables.',
        },
        {
          q: '¿Qué estándares respaldan los umbrales y protocolos?',
          a: 'Todos los límites provienen de NASA-STD-3001 Vol. 1 y 2, OCHMO-STD-100.1A, Technical Briefs de OCHMO, NASA HRP PVT-B y las guías REMM del HHS.',
        },
      ],
    },
    sources: {
      pill: 'Fuentes y código',
      titleStart: 'Detrás ',
      titleAccent: 'del Dashboard',
      cards: [
        {
          icon: BookOpen,
          title: 'Estándares NASA-STD-3001 y OCHMO',
          desc: 'Documentación oficial sobre salud de tripulación, habitabilidad, límites de CO₂, inflamabilidad, acústica y neuro-ocular (SANS).',
          links: [
            {
              label: 'NASA OCHMO Briefs',
              href: 'https://www.nasa.gov/ochmo/health-operations-and-oversight/hsa-standards/',
            },
            {
              label: 'NASA Standards',
              href: 'https://standards.nasa.gov',
            },
          ],
        },
        {
          icon: ShieldCheck,
          title: 'Guías de Radiación (REMM / HHS)',
          desc: 'Criterios clínicos de triaje por emesis prodrómica y cinética de depleción linfocitaria (Andrews) tras exposición aguda.',
          links: [
            {
              label: 'Ver Guías REMM',
              href: 'https://www.remm.nlm.gov/',
            },
          ],
        },
        {
          icon: FileCode2,
          title: 'Código Abierto, Datasets y Pruebas',
          desc: 'Repositorio completo de EIMO en Python/React, archivos CSV/JSON de telemetría en data/ y suite automatizada de 14 pruebas.',
          links: [
            {
              label: 'Ver en GitHub',
              href: 'https://github.com/josiasemm/preccesion-pulse',
            },
          ],
        },
      ],
    },
    bottomCta: {
      titleStart: '¿Listo para explorar ',
      titleAccent: 'EIMO en acción?',
      subtitle: 'Simulador clínico-biofísico multi-entorno (ISS · Tránsito · Luna · Marte)',
      btn: 'Abrir Dashboard',
    },
    footer: {
      teamLabel: 'Equipo Preccesion & Pulse',
      members: 'Josias Emmanuel González Moreno · Axel Adolfo Hinojosa Martinez',
      sub: 'EIMO | Astronaut Health CDSS — Ingeniería Física (UAM-A) & Medicina Aeroespacial',
      repoLabel: 'Repositorio GitHub',
    },
  },
  en: {
    nav: {
      about: 'About EIMO',
      users: 'Our Users',
      how: 'How It Works',
      cases: 'Use Cases',
      sources: 'Sources',
      cta: 'Explore Dashboard',
    },
    hero: {
      eyebrow: 'Aerospace Medicine · Offline-First Biophysical Engine',
      titleStart: 'Autonomous Medical Care ',
      titleAccent: 'for Deep Spaceflight',
      subtitle:
        'EIMO integrates space physiology, cabin atmosphere, and onboard vehicle hardware to guide clinical crew decisions when Earth is minutes away.',
      primaryCta: 'Explore Dashboard',
      demoCta: 'or launch Judge Demo Mode',
    },
    why: {
      pill: 'Why this matters',
      titleStart: 'Preparing human health ',
      titleAccent: 'for deep space',
      cards: [
        {
          icon: Activity,
          title: 'Coupled risks, not isolated vitals',
          body: 'Rising cabin CO₂ worsens intracranial fluid pressure and slows cognitive reaction. Checking vitals in isolation misses the true root cause.',
        },
        {
          icon: Clock,
          title: 'Earth cannot respond in real time',
          body: 'Moon links take seconds, while Mars transit and surface missions face 14 to 44-minute round-trip delays. Crews need onboard autonomy.',
        },
        {
          icon: Layers,
          title: 'Every spacecraft carries different gear',
          body: 'A Lunar Rover lacks the imaging and shielding found on the ISS. Clinical guidance must adapt dynamically to available vehicle hardware.',
        },
      ],
    },
    about: {
      pill: 'About EIMO',
      titleStart: 'What makes ',
      titleAccent: 'EIMO different?',
      pillars: [
        {
          icon: HeartPulse,
          title: 'Coupled Biophysical Engine',
          body: 'Links cephalad fluid shifts, cabin gas dynamics, radiation attenuation, bone remodeling, and neuro-behavioral response in real time.',
        },
        {
          icon: ShieldCheck,
          title: 'Organic Rule-Out Before Stress',
          body: 'Screens high CO₂, hypoxia, and hypoglycemia first before attributing symptoms to primary anxiety or insomnia.',
        },
        {
          icon: Compass,
          title: 'Multi-Gravity SWaP Adaptation',
          body: 'Automatically adjusts gravity loading, communication lag, and countermeasures across ISS (0g), Transit (0g), Lunar Rover (0.165g), and Mars Base (0.38g).',
        },
      ],
      valueTitleStart: 'Where does ',
      valueTitleAccent: 'EIMO help most?',
      values: [
        {
          icon: Stethoscope,
          title: 'Immediate cabin triage',
          body: 'Orders clinical priorities clearly without visual crowding when a subsystem or vital sign drifts.',
        },
        {
          icon: Cpu,
          title: 'Hardware-aware countermeasures',
          body: 'Substitutes procedures automatically based on what medical devices actually exist onboard.',
        },
        {
          icon: ShieldAlert,
          title: 'Mission Control ready packets',
          body: 'Queues acute emergency telemetry offline for Store-and-Forward sync when Earth contact resumes.',
        },
      ],
    },
    users: {
      pill: 'Our users',
      titleStart: 'Built for ',
      titleAccent: 'every mission role',
      cards: [
        {
          role: 'Crew Medical Officer (CMO)',
          summary:
            'Step-by-step microgravity checklists plus zero-hardware browser screening tools (PVT-B, audiometry, Amsler grid, 0.1 Hz breathing).',
        },
        {
          role: 'Earth Flight Surgeons',
          summary:
            'Structured clinical packets containing vitals, GCS score, and ruled-out red flags after orbital communication delays.',
        },
        {
          role: 'Researchers & Mission Planners',
          summary:
            'Continuous step-by-step simulation and direct ingestion of multi-row mission logs via CSV or JSON.',
        },
      ],
    },
    how: {
      pill: 'How it works',
      titleStart: '3 simple steps to ',
      titleAccent: 'act with clinical clarity',
      steps: [
        {
          num: '1',
          title: 'Input: Crew Baseline, Habitat & Telemetry',
          body: 'Set astronaut baseline values, pick the active spacecraft (ISS, Transit, Rover, or Mars), and log measurements or import a CSV/JSON file.',
        },
        {
          num: '2',
          title: 'Analysis: Coupled Physiological Evaluation',
          body: 'The engine evaluates five interconnected clinical domains together, verifies safety locks, and enforces NASA-STD-3001 and OCHMO thresholds offline.',
        },
        {
          num: '3',
          title: 'Output: Prioritized Care & Guided Protocols',
          body: 'Displays a color-coded anatomical map, ranks actions using available onboard hardware, and builds emergency Store-and-Forward packets when needed.',
        },
      ],
    },
    cases: {
      pill: 'Example use cases',
      titleStart: 'Real ',
      titleAccent: 'Space Health Scenarios',
      note: 'All four scenarios run live inside the interactive Dashboard via Judge Demo Mode or the sample datasets in data/.',
      items: [
        {
          tag: 'Case 1',
          icon: Droplets,
          title: 'Microgravity Adaptation: SANS, Bone Loss & Renal Stones',
          question:
            'How does weightlessness affect astronaut vision, skeletal mass, and kidney stone risk at the same time?',
          body: 'Connects cephalad fluid shifts (SANS: ocular ONSD ultrasound, OCT, and Amsler screening) with bone calcium loss and renal supersaturation. Enforces safety locks (blocking LBNP if DVT or dehydration is suspected) across 0g, Moon, and Mars.',
          action: 'Try in Demo Mode',
        },
        {
          tag: 'Case 2',
          icon: Activity,
          title: 'Cabin Habitability & Cognitive Performance',
          question:
            'Is crew fatigue or anxiety normal mission stress, or a silent cabin air failure?',
          body: 'Cross-checks cabin respiratory conditions, ocular pressure, and psychomotor reaction speed (PVT-B) to rule out physical causes before mislabeling stress.',
          action: 'Try in Demo Mode',
        },
        {
          tag: 'Case 3',
          icon: Sun,
          title: 'Deep-Space Solar Storm Protection',
          question:
            'How much shielding does each vehicle actually provide during a solar particle event, and what follow-up is required?',
          body: 'Evaluates effective dose across mission shielding profiles (Station, Transit, Lunar Rover, Mars Base) and triggers early hematological tracking.',
          action: 'Try in Demo Mode',
        },
        {
          tag: 'Case 4',
          icon: ShieldAlert,
          title: 'Autonomous Emergencies Under Earth Delay',
          question:
            'How should the crew respond to acute events when Mission Control replies take 14 to 44 minutes?',
          body: 'Walks through 0g acute stabilization step by step, distinguishes moderate BP elevation from true hypertensive crises, and queues Store-and-Forward telemetry.',
          action: 'Try in Demo Mode',
        },
      ],
    },
    conclusion: {
      pill: 'Conclusion',
      titleStart: 'Prototype Scope & ',
      titleAccent: 'Earth Impact',
      cards: [
        {
          title: 'What the prototype delivers today',
          bullets: [
            'Prevents unsafe procedures (LBNP safety locks for DVT/hypovolemia and clinically stratified blood pressure alerts).',
            'Runs the complete deterministic engine natively inside the browser with zero server dependency.',
            'Bundles browser-ready clinical tests (PVT-B, Web Audio audiometry, Amsler grid, and 0.1 Hz vagal pacing).',
          ],
        },
        {
          title: 'Earth impact & next steps',
          bullets: [
            'Transparent offline decision support for rural clinics, maritime/polar expeditions, and remote sites with intermittent links.',
            'Next phase: live wearables/monitor streaming and formal validation with aerospace flight surgeons.',
          ],
        },
      ],
      closingHighlight: 'Open & verifiable prototype:',
      closingRest:
        ' built so judges, researchers, and engineers can inspect every clinical rule live.',
    },
    faq: {
      pill: 'Frequently asked questions',
      titleStart: 'Common questions ',
      titleAccent: 'answered',
      items: [
        {
          q: 'Does EIMO use generative AI to diagnose patients?',
          a: 'No. EIMO runs a 100% deterministic biophysical and clinical engine grounded in physics and aerospace standards for full auditability without hallucinations.',
        },
        {
          q: 'Does it require internet or a backend server?',
          a: 'No. Everything executes natively inside the browser with localStorage persistence, plus an optional local FastAPI + SQLite backend.',
        },
        {
          q: 'Where can I inspect the underlying physical equations?',
          a: 'Inside the Dashboard, click the "Physics" button (atom icon in the top bar) to view all 5 model derivations and parameters.',
        },
        {
          q: 'Which official standards back the thresholds?',
          a: 'All clinical limits map to NASA-STD-3001 Vol. 1 & 2, OCHMO-STD-100.1A, OCHMO Technical Briefs, NASA HRP PVT-B, and HHS REMM guidelines.',
        },
      ],
    },
    sources: {
      pill: 'Data sources & code',
      titleStart: 'Behind ',
      titleAccent: 'the Dashboard',
      cards: [
        {
          icon: BookOpen,
          title: 'NASA-STD-3001 & OCHMO Standards',
          desc: 'Official NASA guidance covering crew health, habitability, CO₂ ceilings, flammability, acoustics, and SANS.',
          links: [
            {
              label: 'NASA OCHMO Briefs',
              href: 'https://www.nasa.gov/ochmo/health-operations-and-oversight/hsa-standards/',
            },
            {
              label: 'NASA Standards',
              href: 'https://standards.nasa.gov',
            },
          ],
        },
        {
          icon: ShieldCheck,
          title: 'Radiation Biodosimetry (REMM / HHS)',
          desc: 'Clinical triage criteria for prodromal emesis and Andrews lymphocyte depletion kinetics following acute exposure.',
          links: [
            {
              label: 'View REMM Guidance',
              href: 'https://www.remm.nlm.gov/',
            },
          ],
        },
        {
          icon: FileCode2,
          title: 'Open Code, Datasets & Tests',
          desc: 'Full Python/React repository, CSV/JSON telemetry test sets in data/, and 14 automated pytest verification cases.',
          links: [
            {
              label: 'View on GitHub',
              href: 'https://github.com/josiasemm/preccesion-pulse',
            },
          ],
        },
      ],
    },
    bottomCta: {
      titleStart: 'Ready to explore ',
      titleAccent: 'EIMO in action?',
      subtitle: 'Multi-environment biophysical CDSS (ISS · Transit · Moon · Mars)',
      btn: 'Explore Dashboard',
    },
    footer: {
      teamLabel: 'Team Preccesion & Pulse',
      members: 'Josias Emmanuel González Moreno · Axel Adolfo Hinojosa Martinez',
      sub: 'EIMO | Astronaut Health CDSS — Engineering Physics (UAM-A) & Aerospace Medicine',
      repoLabel: 'GitHub Repository',
    },
  },
};

function EimoLogoMark({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <circle cx="25" cy="11" r="2.6" fill="currentColor" />
      <circle cx="39" cy="11" r="2.6" fill="currentColor" />
      <path
        d="M25 11 C20 12 20 28 32 28 C44 28 44 12 39 11"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M32 28 C32 33 36 36 42 40"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <ellipse
        cx="32"
        cy="43"
        rx="16"
        ry="7.5"
        transform="rotate(-35 32 43)"
        stroke="currentColor"
        strokeWidth="2.8"
      />
      <ellipse
        cx="32"
        cy="43"
        rx="16"
        ry="7.5"
        transform="rotate(35 32 43)"
        stroke="currentColor"
        strokeWidth="2.8"
      />
      <circle cx="32" cy="43" r="3.8" fill="currentColor" />
    </svg>
  );
}

function DashboardPreviewFrame({ isEn, onOpenDashboard }) {
  return (
    <div
      onClick={onOpenDashboard}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDashboard();
        }
      }}
      aria-label={isEn ? 'Open interactive EIMO dashboard' : 'Abrir dashboard interactivo de EIMO'}
      className="group relative max-w-5xl mx-auto mt-10 rounded-[24px] border-4 border-slate-800/90 bg-white shadow-2xl shadow-sky-900/10 overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1"
    >
      {/* Mini Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2 text-left">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#0b3d91] text-white flex items-center justify-center shrink-0">
            <EimoLogoMark className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900">
            EIMO <span className="font-normal text-slate-400">|</span> Astronaut Health CDSS
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            {isEn ? 'Real-time (~0.05 s)' : 'Tiempo real (~0.05 s)'}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-semibold">
          <span className="bg-[#0369a1] text-white px-2 py-0.5 rounded-md">ISS (0g)</span>
          <span className="text-slate-600 px-2 py-0.5">{isEn ? 'Transit' : 'Tránsito'}</span>
          <span className="text-slate-600 px-2 py-0.5">Rover (0.165g)</span>
          <span className="text-slate-600 px-2 py-0.5">{isEn ? 'Mars (0.38g)' : 'Marte (0.38g)'}</span>
        </div>

        <span className="text-[10px] font-bold bg-red-600 text-white px-2.5 py-1 rounded-lg">
          {isEn ? 'Acute Emergency' : 'Emergencia Aguda'}
        </span>
      </div>

      {/* Mini Body Preview */}
      <div className="grid grid-cols-1 md:grid-cols-12 bg-[#f8fafc] p-4 gap-4 text-left">
        {/* Left column mini */}
        <div className="hidden md:flex md:col-span-3 flex-col gap-2 bg-white border border-slate-200 rounded-xl p-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 border-b border-slate-100 pb-1.5">
            <span>{isEn ? 'Routine' : 'Rutina'}</span>
            <span className="text-sky-700">SWaP Kit</span>
          </div>
          {[
            isEn ? 'Passive Sensors (ARCHeR)' : 'Sensores Pasivos (ARCHeR)',
            isEn ? 'Hydration ≥ 2.5 L' : 'Hidratación ≥ 2.5 L',
            isEn ? 'Resistive Exercise (ARED)' : 'Ejercicio Resistivo (ARED)',
            isEn ? '0.1 Hz Resonance Breathing' : 'Respiración Vagal 0.1 Hz',
            'PVT-B Psychomotor (30 s)',
          ].map((item) => (
            <div
              key={item}
              className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[10px] font-medium text-slate-700 truncate"
            >
              {item}
            </div>
          ))}
        </div>

        {/* Center mini body + vitals */}
        <div className="md:col-span-6 bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-5 gap-3 items-center">
          <div className="col-span-2 flex flex-col items-center justify-center py-2">
            <svg viewBox="0 0 120 220" className="w-24 h-40" aria-hidden="true">
              <ellipse cx="60" cy="110" rx="52" ry="102" fill="none" stroke="#cbd5e1" strokeDasharray="3 3" />
              <circle cx="60" cy="30" r="14" fill="#d1fae5" stroke="#059669" strokeWidth="1.5" />
              <rect x="44" y="48" width="32" height="44" rx="8" fill="#d1fae5" stroke="#059669" strokeWidth="1.5" />
              <rect x="45" y="96" width="30" height="34" rx="6" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
              <path d="M44 54 L26 98 M76 54 L94 98 M50 130 L45 196 M70 130 L75 196" stroke="#059669" strokeWidth="6" strokeLinecap="round" opacity="0.45" />
            </svg>
            <span className="text-[10px] font-semibold text-slate-500 mt-1">
              {isEn ? '4 Anatomical Zones' : '4 Zonas Anatómicas'}
            </span>
          </div>
          <div className="col-span-3 grid grid-cols-2 gap-2">
            {[
              { label: 'ppCO₂', val: '2.1', unit: 'mmHg', tone: 'border-emerald-200 bg-emerald-50/40' },
              { label: 'SpO₂', val: '98', unit: '%', tone: 'border-emerald-200 bg-emerald-50/40' },
              { label: isEn ? 'BP' : 'PA', val: '118/76', unit: 'mmHg', tone: 'border-emerald-200 bg-emerald-50/40' },
              { label: 'ONSD', val: '4.3', unit: 'mm', tone: 'border-emerald-200 bg-emerald-50/40' },
              { label: 'PVT-B', val: '248', unit: 'ms', tone: 'border-emerald-200 bg-emerald-50/40' },
              { label: 'BMD', val: '0.58', unit: '%/mo', tone: 'border-amber-200 bg-amber-50/50' },
            ].map((v) => (
              <div key={v.label} className={`rounded-lg border p-2 ${v.tone}`}>
                <div className="text-[9.5px] font-semibold text-slate-500">{v.label}</div>
                <div className="text-xs font-bold text-slate-900">
                  {v.val} <span className="font-normal text-[9.5px] text-slate-500">{v.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column mini */}
        <div className="hidden md:flex md:col-span-3 flex-col gap-2 bg-white border border-slate-200 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 uppercase">
              {isEn ? 'Priorities' : 'Prioridades'}
            </span>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-2.5 h-2.5" />
              NOMINAL
            </span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[10px] text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-800 block mb-1">
              1. {isEn ? 'Physiological Baseline' : 'Estado Nominal'}
            </span>
            {isEn
              ? 'Coupled telemetry within NASA-STD-3001 limits. Continue preventive countermeasures.'
              : 'Telemetría acoplada dentro de límites NASA-STD-3001. Mantener contramedidas preventivas.'}
          </div>
          <div className="mt-auto text-center text-[10.5px] font-bold text-sky-700 group-hover:underline">
            {isEn ? 'Click anywhere to enter simulator →' : 'Haz clic para entrar al simulador →'}
          </div>
        </div>
      </div>
    </div>
  );
}

function PillBadge({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-[11px] font-bold tracking-wider uppercase text-slate-700">
      <Icon className="w-3.5 h-3.5 text-[#0284c7]" />
      <span>{label}</span>
    </div>
  );
}

function PrimaryCtaButton({ label, onClick, size = 'md' }) {
  const pad = size === 'lg' ? 'pl-5 pr-2 py-2 text-sm' : 'pl-4 pr-1.5 py-1.5 text-xs';
  const iconBox = size === 'lg' ? 'w-7 h-7' : 'w-6 h-6';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 ${pad} rounded-full bg-gradient-to-r from-[#0369a1] to-[#0284c7] hover:from-[#075985] hover:to-[#0369a1] text-white font-semibold shadow-md shadow-sky-700/20 transition-all cursor-pointer whitespace-nowrap`}
    >
      <span>{label}</span>
      <span
        className={`${iconBox} rounded-full bg-white/15 flex items-center justify-center shrink-0`}
      >
        <ChevronRight className="w-4 h-4" />
      </span>
    </button>
  );
}

export default function LandingPage({
  lang = 'es',
  onChangeLang,
  onEnterDashboard,
  onEnterDemo,
}) {
  const isEn = lang === 'en';
  const c = CONTENT[lang] || CONTENT.es;
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Navbar fija sólida con blur (sin superposición sobre el contenido) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <a
            href="#hero"
            className="flex items-center gap-2.5 text-slate-900 hover:opacity-90 transition-opacity shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-[#0b3d91] text-white flex items-center justify-center shadow-xs">
              <EimoLogoMark className="w-5 h-5" />
            </div>
            <span className="text-sm font-extrabold tracking-tight">EIMO</span>
          </a>

          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-slate-600">
            <a href="#about" className="hover:text-[#0284c7] transition-colors">
              {c.nav.about}
            </a>
            <a href="#users" className="hover:text-[#0284c7] transition-colors">
              {c.nav.users}
            </a>
            <a href="#how" className="hover:text-[#0284c7] transition-colors">
              {c.nav.how}
            </a>
            <a href="#cases" className="hover:text-[#0284c7] transition-colors">
              {c.nav.cases}
            </a>
            <a href="#sources" className="hover:text-[#0284c7] transition-colors">
              {c.nav.sources}
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => onChangeLang?.('es')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  lang === 'es'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => onChangeLang?.('en')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>
            <PrimaryCtaButton label={c.nav.cta} onClick={onEnterDashboard} />
          </div>
        </div>
      </header>

      {/* Hero con brillo azul cielo clínico */}
      <section
        id="hero"
        className="relative bg-gradient-to-b from-sky-100/80 via-sky-50/40 to-white pt-14 pb-16 px-5 text-center"
      >
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-sky-200 text-sky-800 text-[11.5px] font-semibold shadow-2xs mb-6">
            <Atom className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>{c.hero.eyebrow}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[54px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            {c.hero.titleStart}
            <span className="text-[#0284c7]">{c.hero.titleAccent}</span>
          </h1>

          <p className="max-w-2xl mx-auto mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            {c.hero.subtitle}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <PrimaryCtaButton label={c.hero.primaryCta} onClick={onEnterDashboard} size="lg" />
            <button
              type="button"
              onClick={onEnterDemo}
              className="text-xs font-semibold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer"
            >
              {c.hero.demoCta} →
            </button>
          </div>
        </div>

        <div className="px-1">
          <DashboardPreviewFrame isEn={isEn} onOpenDashboard={onEnterDashboard} />
        </div>
      </section>

      {/* Por qué importa */}
      <section className="py-16 px-5 bg-[#f8fafc]/60">
        <div className="max-w-5xl mx-auto text-center">
          <PillBadge icon={AlertTriangle} label={c.why.pill} />
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {c.why.titleStart}
            <span className="text-[#0284c7]">{c.why.titleAccent}</span>
          </h2>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {c.why.cards.map((card) => {
              const CardIcon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#0284c7] flex items-center justify-center">
                    <CardIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{card.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sobre EIMO */}
      <section id="about" className="py-16 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <PillBadge icon={Sparkles} label={c.about.pill} />
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {c.about.titleStart}
              <span className="text-[#0284c7]">{c.about.titleAccent}</span>
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
              {c.about.pillars.map((p) => {
                const PIcon = p.icon;
                return (
                  <div key={p.title} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-[#0284c7] flex items-center justify-center shrink-0 mt-0.5">
                      <PIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed mt-1">{p.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6">
              <h3 className="text-xl font-bold text-slate-900">
                <span className="text-[#0284c7]">{c.about.valueTitleStart}</span>
                {c.about.valueTitleAccent}
              </h3>
              {c.about.values.map((v) => {
                const VIcon = v.icon;
                return (
                  <div key={v.title} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#0284c7] flex items-center justify-center shrink-0 mt-0.5">
                      <VIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{v.title}</h4>
                      <p className="text-sm text-slate-600 leading-relaxed mt-1">{v.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Usuarios */}
      <section id="users" className="py-16 px-5 bg-[#f8fafc]/70">
        <div className="max-w-5xl mx-auto text-center">
          <PillBadge icon={Users} label={c.users.pill} />
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {c.users.titleStart}
            <span className="text-[#0284c7]">{c.users.titleAccent}</span>
          </h2>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {c.users.cards.map((u) => (
              <div
                key={u.role}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-2.5"
              >
                <h3 className="text-base font-bold text-slate-900">{u.role}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{u.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona (3 tarjetas numeradas limpias, sin fórmulas) */}
      <section id="how" className="py-16 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <PillBadge icon={Compass} label={c.how.pill} />
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {c.how.titleStart}
              <span className="text-[#0284c7]">{c.how.titleAccent}</span>
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {c.how.steps.map((step) => (
              <div
                key={step.num}
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0369a1] to-[#0284c7] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1.5">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Casos de Uso (incluye Caso 1 SANS, Hueso y Litiasis Renal) */}
      <section id="cases" className="py-16 px-5 bg-[#f8fafc]/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <PillBadge icon={Database} label={c.cases.pill} />
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {c.cases.titleStart}
              <span className="text-[#0284c7]">{c.cases.titleAccent}</span>
            </h2>
            <p className="max-w-2xl mx-auto mt-3 text-sm text-slate-600">{c.cases.note}</p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {c.cases.items.map((item) => {
              const CaseIcon = item.icon;
              return (
                <div
                  key={item.tag}
                  className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7]">
                      {item.tag}
                    </span>
                    <CaseIcon className="w-4 h-4 text-[#0284c7]" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 leading-relaxed">
                    {item.question}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">{item.body}</p>
                  <button
                    type="button"
                    onClick={onEnterDemo}
                    className="self-start mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#0284c7] hover:text-sky-900 cursor-pointer"
                  >
                    <span>{item.action}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Conclusión e Impacto en Tierra */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <PillBadge icon={CheckCircle2} label={c.conclusion.pill} />
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {c.conclusion.titleStart}
              <span className="text-[#0284c7]">{c.conclusion.titleAccent}</span>
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {c.conclusion.cards.map((card) => (
              <div
                key={card.title}
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm"
              >
                <h3 className="text-base font-bold text-slate-900 mb-3">{card.title}</h3>
                <ul className="space-y-2.5 text-sm text-slate-600 leading-relaxed">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] mt-2 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="max-w-3xl mx-auto mt-8 text-center text-sm font-medium text-slate-700">
            <span className="font-bold text-[#0284c7]">{c.conclusion.closingHighlight}</span>
            {c.conclusion.closingRest}
          </p>
        </div>
      </section>

      {/* Preguntas Frecuentes */}
      <section className="py-16 px-5 bg-[#f8fafc]/70">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <PillBadge icon={HelpCircle} label={c.faq.pill} />
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {c.faq.titleStart}
              <span className="text-[#0284c7]">{c.faq.titleAccent}</span>
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {c.faq.items.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-50/70 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold text-slate-900">
                      {item.q}
                    </span>
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-[#0284c7] shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-[#0284c7] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-0 text-sm text-slate-600 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detrás del Dashboard (Enlaces directos a NASA, REMM y GitHub) */}
      <section id="sources" className="py-16 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <PillBadge icon={Database} label={c.sources.pill} />
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {c.sources.titleStart}
              <span className="text-[#0284c7]">{c.sources.titleAccent}</span>
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {c.sources.cards.map((card) => {
              const SIcon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-[#0284c7] flex items-center justify-center">
                    <SIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">{card.desc}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {card.links.map((lnk) => (
                      <a
                        key={lnk.href}
                        href={lnk.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-bold text-[#0369a1] transition-colors"
                      >
                        <span>{lnk.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Banner Final CTA */}
      <section className="py-16 px-5 bg-gradient-to-b from-white via-sky-50/70 to-sky-100/70 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {c.bottomCta.titleStart}
            <span className="text-[#0284c7]">{c.bottomCta.titleAccent}</span>
          </h2>
          <p className="mt-3 text-sm text-slate-600">{c.bottomCta.subtitle}</p>
          <div className="mt-7">
            <PrimaryCtaButton label={c.bottomCta.btn} onClick={onEnterDashboard} size="lg" />
          </div>
        </div>
      </section>

      {/* Footer con Equipo Preccesion & Pulse */}
      <footer className="bg-white border-t border-slate-200 py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-slate-900">
              <div className="w-8 h-8 rounded-full bg-[#0b3d91] text-white flex items-center justify-center">
                <EimoLogoMark className="w-4 h-4" />
              </div>
              <span className="font-extrabold tracking-tight text-base">EIMO</span>
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                {c.footer.teamLabel}
              </span>
            </div>
            <p className="mt-2.5 text-xs font-semibold text-slate-800">{c.footer.members}</p>
            <p className="mt-1 text-xs text-slate-500">{c.footer.sub}</p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-slate-600">
            <a href="#about" className="hover:text-[#0284c7] transition-colors">
              {c.nav.about}
            </a>
            <a href="#how" className="hover:text-[#0284c7] transition-colors">
              {c.nav.how}
            </a>
            <a href="#cases" className="hover:text-[#0284c7] transition-colors">
              {c.nav.cases}
            </a>
            <a href="#sources" className="hover:text-[#0284c7] transition-colors">
              {c.nav.sources}
            </a>
            <a
              href="https://github.com/josiasemm/preccesion-pulse"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#0284c7] hover:underline"
            >
              <span>{c.footer.repoLabel}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
