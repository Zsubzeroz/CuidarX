import React from 'react';

export const BrandLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 32 : 26;
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-[19px]';

  return (
    <div className="flex items-center gap-[9px] select-none">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: iconSize, height: iconSize }}
        className="shrink-0"
      >
        <rect x="9.5" y="3" width="5" height="18" rx="1.2" fill="#0F766E" />
        <rect x="3" y="9.5" width="18" height="5" rx="1.2" fill="#0F766E" />
      </svg>
      <span className={`font-fraunces font-semibold ${textSize} tracking-[0.01em] text-[#0B5D56] flex items-baseline gap-[1px]`}>
        Cuidar
        <span className="relative inline-block w-[13px] h-[13px] ml-[1px] shrink-0 self-center">
          <span className="absolute left-1/2 top-0 bottom-0 w-[3.5px] -translate-x-1/2 bg-[#B5542B] rounded-[1.5px]" />
          <span className="absolute top-1/2 left-0 right-0 h-[3.5px] -translate-y-1/2 bg-[#B5542B] rounded-[1.5px]" />
        </span>
      </span>
    </div>
  );
};
