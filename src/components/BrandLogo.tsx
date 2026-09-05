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
        <path d="M9.5 4.5c1 0 1.7.9 1.7 2s-.7 2-1.7 2-1.7-.9-1.7-2 .7-2 1.7-2Z" stroke="#0F766E" strokeWidth="1.4" />
        <path d="M12.3 5.2c.8 0 1.4.8 1.4 1.7 0 1-.6 1.7-1.4 1.7-.8 0-1.4-.8-1.4-1.7 0-1 .6-1.7 1.4-1.7Z" stroke="#0F766E" strokeWidth="1.4" />
        <path d="M14.6 6.6c.7 0 1.2.7 1.2 1.5 0 .8-.5 1.5-1.2 1.5-.7 0-1.2-.7-1.2-1.5 0-.8.5-1.5 1.2-1.5Z" stroke="#0F766E" strokeWidth="1.4" />
        <path d="M7.3 6.4c.8 0 1.4.8 1.4 1.8s-.6 1.8-1.4 1.8-1.4-.8-1.4-1.8.6-1.8 1.4-1.8Z" stroke="#0F766E" strokeWidth="1.4" />
        <path d="M8 11c-2 1-3.3 3-3.3 5.4 0 2.7 2 4.1 4.4 4.1 1.6 0 2.5-.6 3.7-.6 1 0 1.7.6 3 .6 2.4 0 3.9-1.8 3.9-4 0-3.6-2.6-5.6-4.6-7.6" stroke="#0F766E" strokeWidth="1.4" strokeLinecap="round" />
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
