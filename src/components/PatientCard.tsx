import React from 'react';
import { Patient } from '../types';

interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
  isSelected?: boolean;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick, isSelected }) => {
  const getTagClasses = () => {
    switch (patient.tagColor) {
      case 'clay':
        return {
          border: 'border-l-[#B5542B]',
          avatarBg: 'bg-[#F6E4DA]',
          avatarIcon: 'text-[#B5542B]',
        };
      case 'sage':
        return {
          border: 'border-l-[#5B7A63]',
          avatarBg: 'bg-[#E7EFE6]',
          avatarIcon: 'text-[#5B7A63]',
        };
      case 'teal':
      default:
        return {
          border: 'border-l-[#0F766E]',
          avatarBg: 'bg-[#E3EEEC]',
          avatarIcon: 'text-[#0B5D56]',
        };
    }
  };

  const styleConfig = getTagClasses();

  return (
    <div
      id={`patient-card-${patient.id}`}
      onClick={onClick}
      className={`group flex items-center gap-[13px] bg-[#FFFDF9] border border-[#E4D8C4] border-l-[4px] ${styleConfig.border} rounded-r-[14px] rounded-l-[4px] p-[14px] mb-[10px] cursor-pointer transition-all duration-150 hover:shadow-sm active:scale-[0.99] select-none ${
        isSelected ? 'ring-2 ring-[#0F766E] shadow-sm bg-[#FFFDF9]' : ''
      }`}
    >
      <div
        className={`w-[42px] h-[42px] rounded-[11px] ${styleConfig.avatarBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`w-5 h-5 ${styleConfig.avatarIcon}`}
        >
          <path d="M9.5 4.5c1 0 1.7.9 1.7 2s-.7 2-1.7 2-1.7-.9-1.7-2 .7-2 1.7-2Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12.3 5.2c.8 0 1.4.8 1.4 1.7 0 1-.6 1.7-1.4 1.7-.8 0-1.4-.8-1.4-1.7 0-1 .6-1.7 1.4-1.7Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M14.6 6.6c.7 0 1.2.7 1.2 1.5 0 .8-.5 1.5-1.2 1.5-.7 0-1.2-.7-1.2-1.5 0-.8.5-1.5 1.2-1.5Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.3 6.4c.8 0 1.4.8 1.4 1.8s-.6 1.8-1.4 1.8-1.4-.8-1.4-1.8.6-1.8 1.4-1.8Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 11c-2 1-3.3 3-3.3 5.4 0 2.7 2 4.1 4.4 4.1 1.6 0 2.5-.6 3.7-.6 1 0 1.7.6 3 .6 2.4 0 3.9-1.8 3.9-4 0-3.6-2.6-5.6-4.6-7.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-[2px]">
          <span className="text-[15px] font-semibold text-[#24312E] truncate">
            {patient.name}
          </span>
          {patient.isDiabetic && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-[#F6E4DA] text-[#B5542B] shrink-0">
              Diabético
            </span>
          )}
        </div>
        <div className="text-[12.5px] text-[#5B665F] flex items-center gap-[6px] truncate">
          <span>{patient.condition}</span>
          <span className="w-[3px] h-[3px] rounded-full bg-[#c9c0ab] shrink-0" />
          <span className="text-[#86918a]">{patient.timeAgo}</span>
          {patient.footMarkers && patient.footMarkers.length > 0 && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-[#c9c0ab] shrink-0" />
              <span className="text-[11px] text-[#0F766E] font-medium">
                {patient.footMarkers.length} {patient.footMarkers.length === 1 ? 'ponto' : 'pontos'}
              </span>
            </>
          )}
        </div>
      </div>

      <svg
        className="text-[#c7bda4] shrink-0 group-hover:text-[#0F766E] transition-colors"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
