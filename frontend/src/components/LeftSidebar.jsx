import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronRight,
  Droplets,
  Dumbbell,
  Ear,
  Eye,
  FastForward,
  FlaskConical,
  HeartPulse,
  Pause,
  Play,
  Timer,
  Wind,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n';

const getRoutineItems = (t) => [
  {
    id: 'passive',
    group: 'daily',
    label: t.rPassive,
    freq: t.freqContinuous,
    freqColor: 'text-slate-500',
    icon: HeartPulse,
    iconColor: 'text-slate-500',
    actionLabel: null,
  },
  {
    id: 'hydration',
    group: 'daily',
    label: t.rHydration,
    freq: t.freqDaily,
    freqColor: 'text-sky-600',
    icon: Droplets,
    iconColor: 'text-sky-600',
    actionLabel: null,
  },
  {
    id: 'exercise',
    group: 'daily',
    label: t.rExercise,
    freq: t.freqDaily,
    freqColor: 'text-sky-600',
    icon: Dumbbell,
    iconColor: 'text-sky-600',
    actionLabel: null,
  },
  {
    id: 'breathing',
    group: 'daily',
    label: t.rBreathing,
    freq: t.freqPresleep,
    freqColor: 'text-emerald-700',
    icon: Wind,
    iconColor: 'text-emerald-600',
    actionLabel: t.actBreathing,
    modalKey: 'breathing',
  },
  {
    id: 'pvt',
    group: 'periodic',
    label: t.rPvt,
    freq: t.freqWeekly,
    freqColor: 'text-amber-700',
    icon: Timer,
    iconColor: 'text-amber-600',
    actionLabel: t.actPvt,
    modalKey: 'pvt',
  },
  {
    id: 'amsler',
    group: 'periodic',
    label: t.rAmsler,
    freq: t.freqWeekly,
    freqColor: 'text-amber-700',
    icon: Eye,
    iconColor: 'text-amber-600',
    actionLabel: t.actAmsler,
    modalKey: 'amsler',
  },
  {
    id: 'audiometry',
    group: 'periodic',
    label: t.rAudio,
    freq: t.freqMonthly,
    freqColor: 'text-purple-700',
    icon: Ear,
    iconColor: 'text-purple-600',
    actionLabel: t.actAudio,
    modalKey: 'audiometry',
  },
];

export default function LeftSidebar({
  demoMode,
  scenarios,
  activeScenarioId,
  onSelectScenario,
  activeEnv,
  telemetry = {},
  onApplyPatch,
  onStepFastForward,
  onOpenBaseline,
  onOpenToolModal,
  completedRoutine = {},
  onToggleRoutine,
  onMarkRoutine,
  onResetRoutine,
  lang = 'es',
}) {
  const [activeTab, setActiveTab] = useState('routine');
  const [exerciseSec, setExerciseSec] = useState(0);
  const [exerciseRunning, setExerciseRunning] = useState(false);
  const onMarkRoutineRef = useRef(onMarkRoutine);
  const onApplyPatchRef = useRef(onApplyPatch);

  useEffect(() => {
    onMarkRoutineRef.current = onMarkRoutine;
    onApplyPatchRef.current = onApplyPatch;
  }, [onMarkRoutine, onApplyPatch]);

  useEffect(() => {
    if (!exerciseRunning) return undefined;
    const id = setInterval(() => {
      setExerciseSec((prev) => (prev >= 9000 ? 9000 : prev + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [exerciseRunning]);

  useEffect(() => {
    if (exerciseRunning && exerciseSec >= 9000) {
      setExerciseRunning(false);
      onMarkRoutineRef.current?.('exercise', true);
      onApplyPatchRef.current?.({ exercise_adherence_ratio: 1.0 });
    }
  }, [exerciseSec, exerciseRunning]);

  const formatHMS = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentWaterLiters = Number(telemetry.water_intake_liters ?? 2.4);
  const filledPouches = Math.max(0, Math.min(10, Math.floor(currentWaterLiters / 0.25 + 1e-6)));
  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;
  const routineItems = getRoutineItems(t);
  const trackableItems = routineItems.filter((item) => item.id !== 'passive');
  const doneCount = trackableItems.filter((item) => Boolean(completedRoutine[item.id])).length;
  const hardwareList = activeEnv?.available_hardware || [];

  return (
    <aside className="w-full lg:w-[320px] shrink-0 lg:h-full border-r border-slate-200 bg-slate-50/50 flex flex-col min-h-0">
      {demoMode ? (
        /* Modo Simulador Demo para Jueces */
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-sky-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {t.demoTitle}
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              {t.demoSubtitle}
            </p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-200/70">
            {Object.entries(scenarios || {}).map(([id, sc]) => {
              const selected = activeScenarioId === id;
              const isEmergency = Boolean(sc.open_emergency_modal);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectScenario(id)}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer border-l-2 ${
                    selected
                      ? isEmergency
                        ? 'bg-rose-50/70 border-l-rose-600'
                        : 'bg-sky-50/70 border-l-sky-600'
                      : 'border-l-transparent hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 leading-tight">{sc.name}</span>
                    {isEmergency && (
                      <span className="text-[10px] font-bold uppercase text-rose-700 shrink-0">
                        {lang === 'en' ? 'Track 2' : 'Carril 2'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{sc.description}</p>
                </button>
              );
            })}
          </div>

          {/* Avance rápido en física continua + resumen SWaP visible en Demo */}
          <div className="px-4 py-3 border-t border-slate-200 bg-white space-y-2.5 shrink-0">
            {onStepFastForward && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <FastForward className="w-3 h-3 text-sky-600" />
                  {lang === 'en' ? 'Forward Physics Simulation' : 'Simulación Física Continua'}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onStepFastForward(60)}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-[11px] font-semibold text-slate-700 cursor-pointer transition-colors"
                  >
                    +1 h ({lang === 'en' ? 'Step' : 'Avanzar'})
                  </button>
                  <button
                    type="button"
                    onClick={() => onStepFastForward(360)}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-[11px] font-semibold text-slate-700 cursor-pointer transition-colors"
                  >
                    +6 h ({lang === 'en' ? 'Step' : 'Avanzar'})
                  </button>
                </div>
              </div>
            )}
            <div className="text-[10.5px] text-slate-600 leading-snug">
              <span className="font-semibold text-slate-700">SWaP ({activeEnv?.name}): </span>
              {hardwareList.join(' · ')}
            </div>
          </div>
        </div>
      ) : (
        /* Modo Astronauta: 2 Pestañas Minimalistas (Rutina | Botiquín SWaP) */
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="grid grid-cols-2 border-b border-slate-200 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('routine')}
              className={`py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'routine'
                  ? 'text-sky-700 border-sky-600'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              {t.tabRoutine}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('swap')}
              className={`py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'swap'
                  ? 'text-sky-700 border-sky-600'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              {t.tabSwap}
            </button>
          </div>

          {activeTab === 'routine' ? (
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-200/70">
              <div className="px-4 py-1.5 flex items-center justify-between text-[11px] bg-slate-50/80">
                <span className="font-medium text-slate-600">
                  {lang === 'es' ? 'Progreso del ciclo' : 'Cycle progress'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-700 tabular-nums">
                    {doneCount}/{trackableItems.length} {lang === 'es' ? 'hecho' : 'done'}
                  </span>
                  {doneCount > 0 && onResetRoutine && (
                    <button
                      type="button"
                      onClick={onResetRoutine}
                      className="text-[10.5px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      {lang === 'es' ? 'Reiniciar' : 'Reset'}
                    </button>
                  )}
                </div>
              </div>
              {['daily', 'periodic'].map((groupKey) => {
                const groupItems = routineItems.filter((item) => item.group === groupKey);
                const groupTitle =
                  groupKey === 'daily'
                    ? lang === 'es'
                      ? 'Diarias y continuas'
                      : 'Daily & Continuous'
                    : lang === 'es'
                    ? 'Periódicas (semanal / mensual)'
                    : 'Periodic (Weekly / Monthly)';

                return (
                  <React.Fragment key={groupKey}>
                    <div className="px-4 py-1.5 bg-slate-100/80 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {groupTitle}
                    </div>
                    {groupItems.map((item) => {
                      const Icon = item.icon;
                      const isPassive = item.id === 'passive';
                      const isDone = !isPassive && Boolean(completedRoutine[item.id]);
                      return (
                        <div
                          key={item.id}
                          className={`px-3.5 py-2 flex items-start gap-2.5 transition-colors ${
                            isDone ? 'bg-emerald-50/35' : item.actionLabel ? 'hover:bg-white' : ''
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              isDone ? 'text-emerald-600' : item.iconColor
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={`block text-xs font-medium leading-snug ${
                                  isDone ? 'text-slate-600 line-through' : 'text-slate-800'
                                }`}
                              >
                                {item.label}
                              </span>
                              {!isPassive && (
                                <button
                                  type="button"
                                  onClick={() => onToggleRoutine?.(item.id)}
                                  title={
                                    isDone
                                      ? lang === 'es'
                                        ? 'Desmarcar como completado'
                                        : 'Unmark completed'
                                      : lang === 'es'
                                      ? 'Marcar como completado'
                                      : 'Mark as completed'
                                  }
                                  aria-label={item.label}
                                  className="w-6 h-6 -m-1 flex items-center justify-center shrink-0 cursor-pointer group"
                                >
                                  <span
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                      isDone
                                        ? 'bg-emerald-700 border-emerald-700 text-white'
                                        : 'border-slate-300 bg-white group-hover:border-emerald-600'
                                    }`}
                                  >
                                    {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </span>
                                </button>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span
                                className={`text-[10px] font-semibold uppercase tracking-wider ${
                                  isDone ? 'text-emerald-700' : item.freqColor
                                }`}
                              >
                                {isDone ? (lang === 'es' ? '✓ Registrado' : '✓ Logged') : item.freq}
                              </span>
                              {item.id === 'hydration' ? (
                                <span className="text-[11px] font-semibold text-sky-700 tabular-nums shrink-0">
                                  {currentWaterLiters.toFixed(2)} / 2.50 L
                                </span>
                              ) : (
                                item.actionLabel && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenToolModal(item.modalKey)}
                                    className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer"
                                  >
                                    {item.actionLabel}
                                  </button>
                                )
                              )}
                            </div>

                            {/* Hidratación interactiva: 10 pouches espaciales (250 mL c/u = 2.50 L) */}
                            {item.id === 'hydration' && (
                              <div
                                className="mt-1.5 flex items-center justify-between gap-1"
                                title={lang === 'en' ? 'Click pouches (250 mL each)' : 'Toca las bolsas de agua (250 mL c/u)'}
                              >
                                {Array.from({ length: 10 }).map((_, idx) => {
                                  const pouchNum = idx + 1;
                                  const filled = pouchNum <= filledPouches;
                                  return (
                                    <button
                                      key={pouchNum}
                                      type="button"
                                      onClick={() => {
                                        const nextPouches = filled && pouchNum === filledPouches ? pouchNum - 1 : pouchNum;
                                        const nextLiters = Number((nextPouches * 0.25).toFixed(2));
                                        onApplyPatch?.({ water_intake_liters: nextLiters });
                                        onMarkRoutine?.('hydration', nextLiters >= 2.5);
                                      }}
                                      className="p-1 -m-0.5 min-w-[22px] min-h-[24px] flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                                      aria-label={`${pouchNum * 250} mL`}
                                    >
                                      <svg viewBox="0 0 16 20" className="w-3.5 h-4">
                                        <path
                                          d="M7 1 L9 1 L9 4 L12 5 C13 5.4 13.5 6.3 13.5 7.4 L13.5 16.5 C13.5 17.9 12.4 19 11 19 L5 19 C3.6 19 2.5 17.9 2.5 16.5 L2.5 7.4 C2.5 6.3 3 5.4 4 5 L7 4 Z"
                                          fill={filled ? '#0ea5e9' : '#f1f5f9'}
                                          stroke={filled ? '#0284c7' : '#cbd5e1'}
                                          strokeWidth="1.3"
                                        />
                                      </svg>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Ejercicio ARED/T2: Cronómetro interactivo (meta 02:30:00) */}
                            {item.id === 'exercise' && (
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (exerciseRunning) {
                                        const ratio = Number(Math.min(1, exerciseSec / 9000).toFixed(2));
                                        const currentRatio = Number(telemetry.exercise_adherence_ratio ?? 0.9);
                                        if (ratio > currentRatio) {
                                          onApplyPatch?.({ exercise_adherence_ratio: ratio });
                                        }
                                      }
                                      setExerciseRunning((r) => !r);
                                    }}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold cursor-pointer transition-colors ${
                                      exerciseRunning
                                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                        : 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                                    }`}
                                  >
                                    {exerciseRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                    <span>{exerciseRunning ? (lang === 'en' ? 'Pause' : 'Pausar') : (lang === 'en' ? 'Start' : 'Iniciar')}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextSec = Math.min(9000, exerciseSec + 900);
                                      setExerciseSec(nextSec);
                                      const ratio = Number(Math.min(1, nextSec / 9000).toFixed(2));
                                      const currentRatio = Number(telemetry.exercise_adherence_ratio ?? 0.9);
                                      if (ratio > currentRatio) {
                                        onApplyPatch?.({ exercise_adherence_ratio: ratio });
                                      }
                                      if (nextSec >= 9000) {
                                        setExerciseRunning(false);
                                        onMarkRoutine?.('exercise', true);
                                        onApplyPatch?.({ exercise_adherence_ratio: 1.0 });
                                      }
                                    }}
                                    title={lang === 'en' ? 'Add 15 min block' : 'Registrar bloque de +15 min'}
                                    className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10.5px] font-semibold text-slate-700 cursor-pointer"
                                  >
                                    +15m
                                  </button>
                                </div>
                                <span className="text-[11px] font-mono font-semibold text-slate-600 tabular-nums shrink-0">
                                  {formatHMS(exerciseSec)} / 02:30:00
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <p className="text-xs font-semibold text-slate-900">
                  {activeEnv?.name || (lang === 'en' ? 'Current vehicle' : 'Vehículo actual')}
                </p>
                <div className="mt-1.5 space-y-1 text-[11px] text-slate-600">
                  <p>
                    {t.habitableVol}:{' '}
                    <strong className="text-slate-800">{activeEnv?.cabin_volume_m3 ?? '—'} m³</strong>
                  </p>
                  <p>
                    {t.baseShielding}:{' '}
                    <strong className="text-slate-800">{activeEnv?.default_shielding_g_cm2 ?? '—'} g/cm²</strong>
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  {lang === 'en' ? 'Active Countermeasures (Live Engine)' : 'Contramedidas Activas (Motor)'}
                </p>
                <div className="divide-y divide-slate-200/70 text-xs">
                  {[
                    {
                      key: 'shelter',
                      label: lang === 'en' ? 'SPE Storm Shelter' : 'Refugio Tormenta SPE',
                      available: (activeEnv?.available_hardware || []).includes('Storm Shelter'),
                      active: telemetry.shielding_posture === 'storm_shelter',
                      onToggle: () =>
                        onApplyPatch?.({
                          shielding_posture:
                            telemetry.shielding_posture === 'storm_shelter' ? 'nominal' : 'storm_shelter',
                        }),
                    },
                    {
                      key: 'citrate',
                      label: lang === 'en' ? 'Potassium Citrate' : 'Citrato de Potasio',
                      available: true,
                      active: Boolean(telemetry.potassium_citrate_active),
                      onToggle: () =>
                        onApplyPatch?.({ potassium_citrate_active: !telemetry.potassium_citrate_active }),
                    },
                    {
                      key: 'alendronate',
                      label: lang === 'en' ? 'Alendronate 70mg' : 'Alendronato 70mg',
                      available: true,
                      active: Boolean(telemetry.alendronate_active),
                      onToggle: () =>
                        onApplyPatch?.({ alendronate_active: !telemetry.alendronate_active }),
                    },
                    {
                      key: 'presleep',
                      label: lang === 'en' ? 'Pre-Sleep Window' : 'Ventana Pre-Sueño',
                      available: true,
                      active: Boolean(telemetry.is_pre_sleep_window),
                      onToggle: () =>
                        onApplyPatch?.({ is_pre_sleep_window: !telemetry.is_pre_sleep_window }),
                    },
                    {
                      key: 'cdra',
                      label: lang === 'en' ? 'CDRA CO₂ Scrubber' : 'Scrubber CO₂ (CDRA)',
                      available: (activeEnv?.available_hardware || []).includes('CDRA'),
                      active: (telemetry.cdra_scrubber_efficiency ?? 0.95) >= 0.8,
                      onToggle: () =>
                        onApplyPatch?.({
                          cdra_scrubber_efficiency:
                            (telemetry.cdra_scrubber_efficiency ?? 0.95) >= 0.8 ? 0.2 : 0.95,
                        }),
                    },
                  ].map((cm) => (
                    <div key={cm.key} className="py-2 flex items-center justify-between gap-2">
                      <span className={`font-medium ${cm.available ? 'text-slate-700' : 'text-slate-600'}`}>
                        {cm.label}
                      </span>
                      <button
                        type="button"
                        disabled={!cm.available}
                        onClick={cm.onToggle}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          !cm.available
                            ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                            : cm.active
                            ? 'bg-emerald-100 text-emerald-800 cursor-pointer'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer'
                        }`}
                      >
                        {!cm.available ? 'N/A' : cm.active ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  {t.swapHardware}
                </p>
                <ul className="divide-y divide-slate-200/70 text-xs text-slate-700">
                  {hardwareList.map((device) => (
                    <li key={device} className="py-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{device}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acceso fijo abajo a Ficha de Identificación y Línea Base */}
      <button
        type="button"
        onClick={onOpenBaseline}
        className="shrink-0 border-t border-b border-slate-200 bg-white px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-600 hover:text-sky-700 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span>{t.editBaseline}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
      </button>
    </aside>
  );
}
