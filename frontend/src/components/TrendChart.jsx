import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function TrendChart({ history = [], lang = 'es' }) {
  const isEn = lang === 'en';
  // Orden cronológico (del más antiguo al más reciente)
  const points = [...history].reverse().slice(-15);

  const width = 680;
  const height = 210;
  const padL = 44;
  const padR = 18;
  const padT = 18;
  const padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const co2Vals = points.map((p) => Number(p.telemetry?.cabin_ppco2_mmhg ?? 2.1));
  const maxCo2 = Math.max(6.0, Math.ceil((Math.max(...co2Vals, 0) + 0.5) * 2) / 2);
  const limitY = padT + plotH - (3.0 / maxCo2) * plotH;

  const toXY = (val, idx, total) => {
    const x = total <= 1 ? padL + plotW / 2 : padL + (idx / (total - 1)) * plotW;
    const y = padT + plotH - (val / maxCo2) * plotH;
    return { x, y };
  };

  const coords = points.map((p, i) => {
    const val = Number(p.telemetry?.cabin_ppco2_mmhg ?? 2.1);
    return {
      ...toXY(val, i, points.length),
      val,
      item: p,
    };
  });

  const polyPoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPoints =
    coords.length > 1
      ? `${coords[0].x},${padT + plotH} ${polyPoints} ${coords[coords.length - 1].x},${padT + plotH}`
      : '';

  const latestVal = coords.length > 0 ? coords[coords.length - 1].val : null;
  const latestOver = latestVal !== null && latestVal > 3.0;

  const yTicks = [0, 1.5, 3.0, 4.5, maxCo2].filter(
    (v, i, arr) => v <= maxCo2 && arr.indexOf(v) === i
  );

  const formatTime = (iso) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const xLabelIndices =
    coords.length <= 1
      ? [0]
      : coords.length === 2
      ? [0, 1]
      : [0, Math.floor((coords.length - 1) / 2), coords.length - 1];

  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2.5 shrink-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-600" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-800">
            {isEn ? 'Cabin ppCO₂ Trend (Local SQLite)' : 'Tendencia de ppCO₂ en Cabina (SQLite Local)'}
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          {latestVal !== null && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                latestOver ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-800'
              }`}
            >
              {isEn ? 'Latest' : 'Último'}: {latestVal.toFixed(1)} mmHg
            </span>
          )}
          <span className="text-[11px] font-semibold text-rose-600">
            {isEn ? 'NASA-STD-3001 Limit: 3.0 mmHg' : 'Límite NASA-STD-3001: 3.0 mmHg'}
          </span>
        </div>
      </div>

      {points.length === 0 ? (
        <p className="text-xs text-slate-500 py-8 text-center">
          {isEn
            ? 'No evaluations recorded in local SQLite yet.'
            : 'Aún no hay suficientes registros en la bitácora local para graficar tendencia.'}
        </p>
      ) : (
        <div className="w-full">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block">
            <defs>
              <linearGradient id="co2AreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Rejilla horizontal y etiquetas eje Y */}
            {yTicks.map((tick) => {
              const y = padT + plotH - (tick / maxCo2) * plotH;
              const isLimit = Math.abs(tick - 3.0) < 0.01;
              return (
                <g key={tick}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={padL + plotW}
                    y2={y}
                    stroke={isLimit ? '#e11d48' : '#e2e8f0'}
                    strokeWidth={isLimit ? '1.5' : '1'}
                    strokeDasharray={isLimit ? '6 4' : undefined}
                  />
                  <text
                    x={padL - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="10.5"
                    fontWeight={isLimit ? '700' : '500'}
                    fill={isLimit ? '#e11d48' : '#64748b'}
                  >
                    {tick.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Eje Y vertical */}
            <line x1={padL} y1={padT} x2={padL} y2={padYBottom(padT, plotH)} stroke="#cbd5e1" strokeWidth="1" />

            {/* Etiqueta línea límite */}
            <text x={padL + 6} y={limitY - 6} fontSize="10.5" fontWeight="700" fill="#e11d48">
              3.0 mmHg (NASA-STD-3001)
            </text>

            {/* Área bajo la curva */}
            {coords.length > 1 && <polygon points={areaPoints} fill="url(#co2AreaGrad)" />}

            {/* Curva de ppCO2 */}
            {coords.length > 1 && (
              <polyline
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polyPoints}
              />
            )}

            {/* Puntos */}
            {coords.map((c, i) => {
              const over = c.val > 3.0;
              return (
                <g key={c.item.id || i}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="5"
                    fill={over ? '#e11d48' : '#0284c7'}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <title>{`#${c.item.id}: ${c.val} mmHg (${c.item.environment_id})`}</title>
                </g>
              );
            })}

            {/* Etiquetas de hora en eje X */}
            {xLabelIndices.map((idx) => {
              const c = coords[idx];
              if (!c) return null;
              const anchor = idx === 0 ? 'start' : idx === coords.length - 1 ? 'end' : 'middle';
              return (
                <text
                  key={idx}
                  x={c.x}
                  y={height - 7}
                  textAnchor={anchor}
                  fontSize="10.5"
                  fill="#64748b"
                >
                  {formatTime(c.item.created_at)}
                </text>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

function padYBottom(padT, plotH) {
  return padT + plotH;
}
