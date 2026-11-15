import React from 'react';

// Silueta anatómica humana frontal de proporciones reales (estilizada estilo Apple Health / BioRender)
const BODY_PATH =
  'M79 54.282H68.824c.038 4.586-1.385 8.232-6.538 11.407-7.58 4.67-9.766 1.589-16.504 5.364-7.18 4.022-9.839 16.322-12.894 25.27-2.701 7.914-3.117 16.702-4.642 24.654-.96 5.011-3.727 6.429-4.641 12.172-1.757 11.036-3.522 24.117-4.596 34.05-.276 2.561-2.591 3.421-3.874 4.538-1.219 1.06-2.22 1.889-3.999 3.642-.543.535-.672 1.678-1.192 2.751-.444.915-1.52 1.539-1.807 2.352-.817 2.305-3.163 3.662-2.55 4.548.571.823 2.963-.165 4.11-.981.735-.523 1.362-1.352 1.457-2.282.916-.331 2.108-2.771 2.696-2.658.255.049.358 4.46-.575 7.508-.363 1.188-.67 1.746-.674 2.528-.006 1.006-.16 3.338-.28 4.41-.178 1.575.308 3.032 1.256 3.104.221.017 1.34-.282 1.348-2.017.003-.633.08-1.127.196-1.94.2-1.41 1.494-4.138 1.725-5.36.073-.386.352-1.376.62-1.344.082.01-.405 2.901-.686 4.113-.311 1.344.145 2.27-.003 5.033-.129 2.425.035 3.81 1.266 3.857.389.015 1.558.013 1.588-3.536.01-1.045.366-2.909.633-4.717.196-1.328.213-2.719 1.035-4.298-.045 1.672-.144 1.89-.228 3.518-.052 1-.405 6.609-.105 4.25.126-.994-1.25 4.052.94 4.15.731.033 1.703-.889 2.127-7.134.124-1.828.436-4.288.92-5.66.278 1.198.342 1.72.34 2.309 0 .417.182 1.77-.008 3.119-.275 1.938-.424 3.24.59 3.353.563.063 1.243-.686 1.658-2.026.144-.468.1-1.138.254-1.678.516-1.826.189-3.734.364-4.958.24-1.666.536-2.492.768-3.213.238-.741.558-2.94.586-5.338.029-2.398-.968-2.465-.583-8.918.384-6.453 8.154-18.314 9.738-27.921.473-2.867 1.92-5.448 2.661-8.237 1.276-4.802 1.526-9.863 3.064-14.587 1.138-3.498 4.521-10.065 4.521-10.065s3.182 11.689 3.818 15.85c1.985 12.977-3.566 24.173-6.04 38.02-1.97 11.022-4.033 18.866-3.904 33.362.153 17.179 3.793 32.78 4.084 42.012.037 1.167-1.263 5.772-1.05 10.691.214 4.919-.912 11.933-.846 18.338.154 15.018 4.941 26.356 6.856 33.113.94 3.315 2.014 8.499 2.072 11.147.078 3.488-1.054 3.863-1.29 5.849-.171 1.447 1.404 3.98 1.432 4.53 0 0-1.043 1.238-1.213 2-.24 1.068.41 2.044-.065 2.763-.95 1.44-.887.8-1.376 1.576-.506.802-3.655 4.06-4.223 5.238-.448.93-.328 1.605-.152 2.641.244 1.439.81 2.807 2.358 2.398.478.321 1.065 1.026 1.485.333.117.795 1.684.863 2.444.514 1.09.992 3.102.854 4.167-.008 1.423 1.224 5.613.643 5.96-1.689 1.357-.592 1.717-1.758 1.496-3.055-.37-2.172-.335-4.06-.712-6.231-.295-1.69-.157-4.057.783-5.499 1.485-2.278.777-6.197.323-6.985-.453-.787-.22-15.214.078-23.764.276-7.938 2.694-15.697 3.063-23.632.157-3.378-.512-6.76-.365-10.138.199-4.552 1.255-9.03 1.678-13.566.389-4.172.263-8.388.79-12.545 1.88-14.845 6.893-16.859 8.44-44.09m0 0c1.548 27.231 6.56 29.245 8.441 44.09.527 4.157.401 8.374.79 12.545.423 4.537 1.48 9.014 1.678 13.566.147 3.379-.522 6.76-.365 10.138.37 7.935 2.787 15.693 3.063 23.632.298 8.551.531 22.976.078 23.764-.454.788-1.162 4.707.323 6.985.94 1.442 1.078 3.808.783 5.499-.377 2.17-.343 4.059-.712 6.23-.22 1.298.139 2.464 1.496 3.056.347 2.332 4.537 2.913 5.96 1.689 1.065.862 3.078 1 4.167.008.76.349 2.327.28 2.444-.514.42.693 1.007-.012 1.485-.333 1.548.409 2.114-.96 2.358-2.398.176-1.036.296-1.712-.152-2.64-.568-1.18-3.717-4.437-4.223-5.239-.489-.776-.426-.136-1.376-1.576-.475-.72.174-1.695-.065-2.763-.17-.762-1.213-2-1.213-2 .028-.55 1.603-3.083 1.432-4.53-.236-1.986-1.368-2.36-1.29-5.849.058-2.648 1.132-7.832 2.072-11.147 1.915-6.758 6.702-18.096 6.856-33.113.066-6.406-1.06-13.419-.847-18.338s-1.086-9.524-1.05-10.691c.292-9.231 3.932-24.833 4.085-42.012.13-14.497-1.933-22.34-3.903-33.362-2.475-13.847-8.026-25.043-6.041-38.02.636-4.161 3.818-15.85 3.818-15.85s3.383 6.567 4.521 10.065c1.538 4.725 1.788 9.786 3.064 14.587.74 2.789 2.188 5.37 2.66 8.237 1.585 9.607 9.355 21.468 9.74 27.921s-.613 6.52-.584 8.918c.028 2.397.348 4.597.586 5.338.232.721.529 1.547.768 3.213.176 1.224-.152 3.132.365 4.958.152.54.109 1.21.254 1.678.414 1.34 1.094 2.089 1.657 2.026 1.014-.114.865-1.415.59-3.353-.19-1.348-.008-2.702-.009-3.119-.002-.59.063-1.111.341-2.31.484 1.373.796 3.833.92 5.661.424 6.245 1.396 7.167 2.128 7.134 2.189-.098.813-5.144.94-4.15.299 2.359-.054-3.25-.106-4.25-.084-1.628-.183-1.846-.228-3.518.822 1.58.839 2.97 1.035 4.298.267 1.808.624 3.672.633 4.717.03 3.549 1.2 3.551 1.588 3.536 1.23-.047 1.395-1.432 1.266-3.857-.148-2.764.308-3.689-.003-5.033-.281-1.212-.768-4.103-.685-4.113.267-.032.546.958.619 1.344.231 1.222 1.524 3.95 1.726 5.36.116.813.192 1.307.195 1.94.008 1.735 1.127 2.034 1.348 2.017.948-.072 1.434-1.53 1.257-3.104-.12-1.072-.275-3.404-.28-4.41-.006-.782-.312-1.34-.675-2.528-.933-3.047-.83-7.46-.575-7.508.588-.113 1.78 2.327 2.696 2.658.095.93.722 1.759 1.457 2.282 1.147.816 3.539 1.804 4.11.98.613-.885-1.733-2.242-2.55-4.547-.287-.813-1.363-1.437-1.807-2.352-.52-1.073-.649-2.216-1.192-2.751-1.78-1.753-2.78-2.582-3.999-3.642-1.283-1.117-3.598-1.977-3.874-4.537-1.074-9.934-2.839-23.014-4.596-34.051-.914-5.743-3.68-7.16-4.641-12.172-1.525-7.951-1.94-16.74-4.642-24.653-3.055-8.95-5.714-21.25-12.894-25.271-6.738-3.775-8.923-.693-16.504-5.364-5.153-3.175-6.576-6.821-6.538-11.407H78.998';

const HEAD_PATH =
  'M79 59.397c-3.914 0-7.324-2.644-10.175-5.115-.86-.746-1.197-4.034-1.914-4.866-.748.224-2.416-.196-2.946-1.32-.736-1.56-2.257-4.293-2.194-7.266.03-1.354.961-3.111 2.909-3.104-.284-9.913 5.816-16.699 14.317-16.7 8.5 0 14.6 6.786 14.319 16.7 1.947-.009 2.88 1.748 2.909 3.103.063 2.973-1.457 5.705-2.193 7.266-.53 1.124-2.199 1.544-2.946 1.32-.717.833-1.053 4.12-1.914 4.866-2.85 2.472-6.26 5.116-10.173 5.117-3.914 0-7.323-2.645-10.173-5.117-.86-.746-1.197-4.033-1.914-4.866-.747.224-2.415-.196-2.946-1.32-.735-1.56-2.256-4.293-2.192-7.266.029-1.355.96-3.112 2.908-3.104-.282-9.913 5.819-16.699 14.32-16.699 8.5.001 14.6 6.787 14.316 16.7 1.948-.007 2.88 1.75 2.909 3.104.063 2.973-1.458 5.705-2.194 7.266-.53 1.125-2.198 1.544-2.946 1.32-.717.832-1.053 4.12-1.914 4.866-2.85 2.47-6.26 5.115-10.174 5.115';

export default function AnatomySvg({
  headCol,
  thoraxCol,
  boneCol,
  sysCol,
  activeZoneKey,
  onSelectZone,
  onHoverZone,
  lang = 'es',
  className = 'w-full h-full select-none',
}) {
  const isEn = lang === 'en';
  const handleKey = (zoneKey) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectZone(zoneKey);
    }
  };

  return (
    <svg
      viewBox="-18 -14 184 358"
      className={className}
      role="img"
      aria-label={isEn ? '4-zone anatomical status map' : 'Mapa anatómico de 4 zonas'}
    >
      <defs>
        <clipPath id="eimo-clip-thorax">
          <rect x="-10" y="30" width="170" height="84" />
        </clipPath>
        <clipPath id="eimo-clip-lower">
          <rect x="-10" y="114" width="170" height="260" />
        </clipPath>
      </defs>
      <style>{`
        .eimo-zone-btn:focus { outline: none; }
        .eimo-zone-btn:focus-visible { outline: 2.5px solid #0369a1; outline-offset: 3px; }
      `}</style>

      {/* Halo Sistémico / Radiación e Inmune: fondo interactivo envolvente */}
      <g
        tabIndex={0}
        role="button"
        aria-label={isEn ? 'Systemic field: Radiation & Immune' : 'Campo Sistémico: Radiación e Inmune'}
        className="cursor-pointer eimo-zone-btn"
        onMouseEnter={() => onHoverZone?.('systemic_radiation_immune')}
        onMouseLeave={() => onHoverZone?.(null)}
        onFocus={() => onHoverZone?.('systemic_radiation_immune')}
        onBlur={() => onHoverZone?.(null)}
        onClick={() => onSelectZone('systemic_radiation_immune')}
        onKeyDown={handleKey('systemic_radiation_immune')}
      >
        <ellipse
          cx="74"
          cy="164"
          rx="74"
          ry="168"
          fill={sysCol.fill}
          fillOpacity={activeZoneKey === 'systemic_radiation_immune' ? 0.24 : 0.12}
          stroke={sysCol.stroke}
          strokeWidth={activeZoneKey === 'systemic_radiation_immune' ? 1.5 : 0.9}
          strokeDasharray="3.5 3.5"
          strokeOpacity={activeZoneKey === 'systemic_radiation_immune' ? 0.78 : 0.42}
        />
      </g>

      {/* 1. Cabeza (Neuro-Ocular / SANS / PVT) — orden DOM superior -> medio -> inferior */}
      <g
        transform="translate(-5, -20.526)"
        tabIndex={0}
        role="button"
        aria-label={isEn ? 'Head: Neuro-Ocular & SANS' : 'Cabeza: Neuro-Ocular y SANS'}
        className="cursor-pointer transition-opacity hover:opacity-95 eimo-zone-btn"
        onMouseEnter={() => onHoverZone?.('head_neuro_ocular')}
        onMouseLeave={() => onHoverZone?.(null)}
        onFocus={() => onHoverZone?.('head_neuro_ocular')}
        onBlur={() => onHoverZone?.(null)}
        onClick={() => onSelectZone('head_neuro_ocular')}
        onKeyDown={handleKey('head_neuro_ocular')}
      >
        <path
          d={HEAD_PATH}
          fill={headCol.fill}
          fillOpacity={activeZoneKey === 'head_neuro_ocular' ? 0.65 : 0.4}
          stroke={headCol.stroke}
          strokeWidth={activeZoneKey === 'head_neuro_ocular' ? 1.55 : 0.95}
          strokeLinejoin="round"
        />
      </g>

      {/* 2. Tórax + Brazos (CO2 / Cardio / LBNP) */}
      <g
        transform="translate(-5, -20.526)"
        clipPath="url(#eimo-clip-thorax)"
        tabIndex={0}
        role="button"
        aria-label={isEn ? 'Thorax: Cardio-Respiratory & CO2' : 'Tórax: Cardio-Respiratorio y CO2'}
        className="cursor-pointer transition-opacity hover:opacity-95 eimo-zone-btn"
        onMouseEnter={() => onHoverZone?.('thorax_cardio_resp')}
        onMouseLeave={() => onHoverZone?.(null)}
        onFocus={() => onHoverZone?.('thorax_cardio_resp')}
        onBlur={() => onHoverZone?.(null)}
        onClick={() => onSelectZone('thorax_cardio_resp')}
        onKeyDown={handleKey('thorax_cardio_resp')}
      >
        <path
          d={BODY_PATH}
          fill={thoraxCol.fill}
          fillOpacity={activeZoneKey === 'thorax_cardio_resp' ? 0.55 : 0.34}
          stroke={thoraxCol.stroke}
          strokeWidth={activeZoneKey === 'thorax_cardio_resp' ? 1.55 : 0.95}
          strokeLinejoin="round"
        />
      </g>

      {/* 3. Abdomen Renal + Pelvis + Piernas (Hueso DMO / Riñón / Litiasis) */}
      <g
        transform="translate(-5, -20.526)"
        clipPath="url(#eimo-clip-lower)"
        tabIndex={0}
        role="button"
        aria-label={isEn ? 'Abdomen & Legs: Bone & Renal' : 'Abdomen y Piernas: Hueso y Riñón'}
        className="cursor-pointer transition-opacity hover:opacity-95 eimo-zone-btn"
        onMouseEnter={() => onHoverZone?.('musculoskeletal_renal')}
        onMouseLeave={() => onHoverZone?.(null)}
        onFocus={() => onHoverZone?.('musculoskeletal_renal')}
        onBlur={() => onHoverZone?.(null)}
        onClick={() => onSelectZone('musculoskeletal_renal')}
        onKeyDown={handleKey('musculoskeletal_renal')}
      >
        <path
          d={BODY_PATH}
          fill={boneCol.fill}
          fillOpacity={activeZoneKey === 'musculoskeletal_renal' ? 0.55 : 0.34}
          stroke={boneCol.stroke}
          strokeWidth={activeZoneKey === 'musculoskeletal_renal' ? 1.55 : 0.95}
          strokeLinejoin="round"
        />
      </g>

      {/* Línea divisoria anatómica sutil (diafragma) */}
      <line
        x1="50"
        y1="93.5"
        x2="98"
        y2="93.5"
        stroke="#64748b"
        strokeWidth="0.8"
        strokeDasharray="2.5 2.5"
        strokeOpacity="0.45"
        className="pointer-events-none"
      />

      {/* Clavículas anatómicas estilizadas */}
      <path
        d="M 55 44 Q 65 46 72 42 M 93 44 Q 83 46 76 42"
        fill="none"
        stroke={thoraxCol.stroke}
        strokeWidth="0.7"
        strokeOpacity="0.3"
        strokeLinecap="round"
        className="pointer-events-none"
      />

      {/* Órgano 1: Cerebro duotone suave */}
      <g transform="translate(74, 14)" className="pointer-events-none">
        <path
          d="M -0.7 -7 C -4.6 -7 -7.2 -4.2 -7.2 -0.6 C -7.2 2.4 -4.8 4.9 -1.8 4.9 C -0.9 4.9 -0.7 4.2 -0.7 3.5 Z"
          fill={headCol.stroke}
          fillOpacity="0.32"
        />
        <path
          d="M 0.7 -7 C 4.6 -7 7.2 -4.2 7.2 -0.6 C 7.2 2.4 4.8 4.9 1.8 4.9 C 0.9 4.9 0.7 4.2 0.7 3.5 Z"
          fill={headCol.stroke}
          fillOpacity="0.32"
        />
      </g>

      {/* Órgano 2: Pulmones duotone + tráquea + corazón anatómico */}
      <g className="pointer-events-none">
        <path
          d="M 74 44 L 74 56"
          fill="none"
          stroke={thoraxCol.stroke}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeOpacity="0.35"
        />
        <path
          d="M 71.4 52.5 C 68 50.8 62.8 52.8 59.8 57.8 C 56.6 63.2 55.2 71.8 55.6 79.4 C 55.8 83.2 57.5 85.4 60.5 85.5 C 63.8 85.6 67.8 83.2 70.8 82.5 Z"
          fill={thoraxCol.stroke}
          fillOpacity="0.25"
        />
        <path
          d="M 76.6 52.5 C 80 50.8 85.2 52.8 88.2 57.8 C 91.4 63.2 92.8 71.8 92.4 79.4 C 92.2 83.2 90.5 85.4 87.5 85.5 C 85 85.6 83 84.4 81.8 83 C 83.2 78.5 81.5 72.5 77 70.5 Z"
          fill={thoraxCol.stroke}
          fillOpacity="0.25"
        />
        <path
          d="M 73.5 64.5 C 73.5 61.5 76.2 60.5 77.6 62.6 C 79.4 61 82.8 63 82.8 67.2 C 82.8 72.5 79.5 77.8 77.8 79.2 C 76.2 80.5 73.8 79.2 72.4 75.8 C 71.1 72.6 71.6 67.2 73.5 64.5 Z"
          fill={thoraxCol.stroke}
          fillOpacity="0.58"
        />
      </g>

      {/* Órgano 3: Riñones duotone + uréteres curvos */}
      <g className="pointer-events-none">
        <path
          d="M 67.2 103 C 63 102.2 60 105.5 60 110.2 C 60 115 62.8 118.2 66.8 117.6 C 68.8 117.3 69.5 115.2 68.5 113.2 C 67.6 111.5 67.6 109.2 68.6 107.6 C 69.6 105.8 69.2 103.4 67.2 103 Z"
          fill={boneCol.stroke}
          fillOpacity="0.32"
        />
        <path
          d="M 80.8 101.8 C 85 101 88 104.3 88 109 C 88 113.8 85.2 117 81.2 116.4 C 79.2 116.1 78.5 114 79.5 112 C 80.4 110.3 80.4 108 79.4 106.4 C 78.4 104.6 78.8 102.2 80.8 101.8 Z"
          fill={boneCol.stroke}
          fillOpacity="0.32"
        />
        <path
          d="M 68.3 110.5 Q 71.2 111.2 71.5 116.5 L 72 126 M 79.7 109.3 Q 76.8 110 76.5 115.3 L 76 126"
          fill="none"
          stroke={boneCol.stroke}
          strokeWidth="0.95"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
      </g>
    </svg>
  );
}
