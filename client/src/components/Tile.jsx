import React from 'react';

/**
 * Authentic Metro OS Live Tile Component
 * Proporciones armónicas: escala perfectamente con CSS variables en escritorio (landscape)
 * y fluye verticalmente en formato 2 columnas en teléfonos/tablets en vertical (portrait).
 */
export function Tile({
  title,
  count,
  icon: Icon,
  subtitle,
  onClick,
  color = 'blue',
  size = 'standard', // 'small', 'standard', 'wide', 'large'
  badge,
  badgeColor = 'black',
  liveText,
  children,
  className = '',
}) {
  // Paleta de colores planos auténticos de alta fidelidad
  const colorClasses = {
    blue: 'bg-[#0078D7] text-white',
    cyan: 'bg-[#00A4EF] text-white',
    green: 'bg-[#107C41] text-white',
    lime: 'bg-[#748C00] text-white',
    red: 'bg-[#D13438] text-white',
    crimson: 'bg-[#A80000] text-white',
    purple: 'bg-[#744DA9] text-white',
    deepPurple: 'bg-[#5C2D91] text-white',
    orange: 'bg-[#D24726] text-white',
    steel: 'bg-[#2B3643] text-white',
    navy: 'bg-[#071629] text-white border border-[#10DDF2]/30',
    dark: 'bg-[#181B20] text-white border border-white/5',
  };

  const selectedColor = colorClasses[color] || colorClasses.blue;

  // Clases responsivas:
  // En portrait (móvil): sistema grid-cols-2 con aspect ratio
  // En landscape (PC/tablet): dimensiones precisas calculadas con var(--tile-unit)
  const sizeClasses = {
    small: 'w-full aspect-square landscape:w-[calc((var(--tile-unit)-10px)/2)] landscape:h-[calc((var(--tile-unit)-10px)/2)] p-2',
    standard: 'col-span-1 aspect-square w-full landscape:w-[var(--tile-unit)] landscape:h-[var(--tile-unit)] p-3 sm:p-3.5',
    wide: 'col-span-2 aspect-[2/1] w-full landscape:w-[calc(var(--tile-unit)*2+10px)] landscape:h-[var(--tile-unit)] landscape:col-span-2 p-3.5 sm:p-4',
    large: 'col-span-2 aspect-square w-full landscape:w-[calc(var(--tile-unit)*2+10px)] landscape:h-[calc(var(--tile-unit)*2+10px)] landscape:col-span-2 landscape:row-span-2 p-4 sm:p-5',
  };

  // Mini-mosaico (1x1 pequeño)
  if (size === 'small') {
    return (
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`metro-tile ${sizeClasses.small} ${selectedColor} flex flex-col items-center justify-center relative overflow-hidden select-none cursor-pointer ${className}`}
        title={title}
      >
        {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
        {title && (
          <span className="text-[9px] font-sans font-medium tracking-tight mt-1 truncate max-w-full px-1">
            {title}
          </span>
        )}
        {badge && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`metro-tile ${sizeClasses[size] || sizeClasses.standard} ${selectedColor} flex flex-col justify-between relative overflow-hidden select-none cursor-pointer shadow-sm transition-all duration-100 ${className}`}
    >
      {/* Esquina Superior: Icono y Badge de Estado */}
      <div className="flex items-start justify-between w-full">
        {Icon && (
          <div className="opacity-95 flex-shrink-0">
            <Icon className={size === 'large' ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-6 h-6 sm:w-7 sm:h-7'} />
          </div>
        )}

        {badge && (
          <span className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
            badgeColor === 'green' ? 'bg-[#107C41] text-white' :
            badgeColor === 'red' ? 'bg-[#D13438] text-white' :
            'bg-black/50 text-white'
          } border border-white/20`}>
            {badge}
          </span>
        )}
      </div>

      {/* Centro: Métrica en Vivo y Descripción */}
      <div className="flex-1 flex flex-col justify-center my-0.5 min-h-0">
        {count !== undefined && count !== null && (
          <div className="flex items-baseline space-x-1">
            <span className={`font-rajdhani font-bold leading-none tracking-tight ${
              size === 'large' ? 'text-4xl sm:text-5xl lg:text-6xl' :
              size === 'wide' ? 'text-2xl sm:text-3xl lg:text-4xl' :
              'text-xl sm:text-2xl lg:text-3xl'
            }`}>
              {count}
            </span>
          </div>
        )}

        {subtitle && (
          <p className={`text-[10px] sm:text-[11px] opacity-90 line-clamp-2 mt-1 leading-tight font-sans ${
            size === 'large' ? 'sm:text-xs' : ''
          }`}>
            {subtitle}
          </p>
        )}

        {liveText && (
          <div className="mt-1 text-[9px] sm:text-[10px] font-mono opacity-85 truncate">
            {liveText}
          </div>
        )}

        {children}
      </div>

      {/* Esquina Inferior Izquierda: Título de la Aplicación en minúsculas */}
      <div className="w-full pt-1">
        <h3 className={`font-sans font-normal lowercase tracking-tight leading-none truncate text-white/95 ${
          size === 'large' ? 'text-xs sm:text-sm font-semibold' : 'text-[10px] sm:text-[11px]'
        }`}>
          {title}
        </h3>
      </div>
    </div>
  );
}
