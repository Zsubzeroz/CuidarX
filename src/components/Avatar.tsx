import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'full' | 'xl' | 'lg';
  className?: string;
  ring?: string;
  borderColor?: string;
  bgColor?: string;
  textColor?: string;
  showOnlineDot?: boolean;
  dotColor?: string;
}

const SIZE_MAP = {
  xs: { container: 'w-7 h-7', text: 'text-xs' },
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-12 h-12', text: 'text-sm' },
  xl: { container: 'w-14 h-14', text: 'text-base' },
};

const ROUNDED_MAP = {
  full: 'rounded-full',
  xl: 'rounded-2xl',
  lg: 'rounded-xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'sm',
  rounded = 'full',
  className = '',
  ring,
  borderColor,
  bgColor = '#E3EEEC',
  textColor = '#0F766E',
  showOnlineDot = false,
  dotColor = '#4ADE80',
}) => {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const s = SIZE_MAP[size];
  const r = ROUNDED_MAP[rounded];
  const hasSrc = !!src && !imgError;

  return (
    <div className={`relative shrink-0 ${className}`}>
      {hasSrc ? (
        <img
          src={src}
          alt=""
          className={`${s.container} ${r} object-cover ${ring || ''} ${borderColor ? `border-2 ${borderColor}` : ''}`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`${s.container} ${r} ${s.text} flex items-center justify-center font-bold shrink-0`}
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {initials || '??'}
        </div>
      )}
      {showOnlineDot && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
          style={{ backgroundColor: dotColor }}
        />
      )}
    </div>
  );
};
