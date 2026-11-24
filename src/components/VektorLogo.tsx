/**
 * Vektor — Isotipo geométrico.
 *
 * Una "V" afilada formada por dos trazos biselados, atravesada por un eje de
 * simetría vertical central (la línea de telemetría). Minimalismo técnico,
 * alto contraste, pensado para verse nítido desde 16px (favicon) hasta splash.
 *
 * Reutilizable: acepta tamaño, color de acento y si se muestra el aro exterior.
 */

export interface VektorLogoProps {
  size?: number;
  /** Color de los trazos de la V. Por defecto texto principal. */
  stroke?: string;
  /** Color del eje de simetría central (acento Volt). */
  axis?: string;
  /** Muestra el aro contenedor (para iconos de app). */
  ring?: boolean;
  className?: string;
  title?: string;
}

export function VektorLogo({
  size = 40,
  stroke = "#FAFAFA",
  axis = "#00E5FF",
  ring = false,
  className,
  title = "Vektor",
}: VektorLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>

      {ring && (
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="14"
          fill="#09090B"
          stroke="#27272A"
          strokeWidth="2"
        />
      )}

      {/* Trazo izquierdo de la V */}
      <path
        d="M14 16 L32 46"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Trazo derecho de la V */}
      <path
        d="M50 16 L32 46"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Eje de simetría central (telemetría) */}
      <line
        x1="32"
        y1="10"
        x2="32"
        y2="54"
        stroke={axis}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Nodos del eje: vértice y extremos */}
      <circle cx="32" cy="46" r="3.2" fill={axis} />
      <circle cx="32" cy="12" r="2" fill={axis} />
    </svg>
  );
}

export default VektorLogo;
