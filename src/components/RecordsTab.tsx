import React, { useState } from 'react';
import { Patient } from '../types';
import { PatientCard } from './PatientCard';
import { Search, SlidersHorizontal, UserCheck } from 'lucide-react';

interface RecordsTabProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
}

export const RecordsTab: React.FC<RecordsTabProps> = ({
  patients,
  onSelectPatient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('todos');

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'onicocriptose', label: 'Onicocriptose' },
    { id: 'calo', label: 'Calo Plantar' },
    { id: 'alta', label: 'Alta' },
    { id: 'diabetico', label: 'Pé Diabético' },
  ];

  const filteredPatients = patients.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.locationDetails.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (selectedFilter === 'todos') return true;
    if (selectedFilter === 'onicocriptose') return p.condition.toLowerCase().includes('onico');
    if (selectedFilter === 'calo') return p.condition.toLowerCase().includes('calo');
    if (selectedFilter === 'alta') return p.status === 'completed' || p.condition.toLowerCase().includes('alta');
    if (selectedFilter === 'diabetico') return p.condition.toLowerCase().includes('diab');
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-3 pb-28 no-scrollbar">
      <div className="mb-4">
        <h1 className="font-fraunces text-[22px] font-semibold text-[#24312E] mb-1">
          Arquivo de Fichas
        </h1>
        <p className="text-[13px] text-[#5B665F]">
          Total de <b className="text-[#0F766E] font-semibold">{patients.length} pacientes</b> cadastrados
        </p>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2.5 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[14px] px-3.5 py-2.5 mb-3 shadow-2xs">
        <Search size={17} className="text-[#5B665F] shrink-0" />
        <input
          type="text"
          placeholder="Buscar por nome, patologia ou membro..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none text-[13.5px] text-[#24312E] placeholder-[#9b9280] focus:outline-none"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-[11px] text-[#5B665F] bg-[#F3E6D2] px-1.5 py-0.5 rounded-full"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedFilter(cat.id)}
            className={`px-3 py-1 rounded-full text-[11.5px] font-medium whitespace-nowrap transition-colors ${
              selectedFilter === cat.id
                ? 'bg-[#0F766E] text-white shadow-2xs'
                : 'bg-[#FFFDF9] text-[#5B665F] border border-[#E4D8C4] hover:bg-[#F3E6D2]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-10 px-4 bg-[#FFFDF9] rounded-2xl border border-[#E4D8C4] mt-2">
          <p className="text-[13.5px] font-semibold text-[#24312E]">Nenhum paciente encontrado</p>
          <p className="text-[12px] text-[#5B665F] mt-1">Tente buscar por outro termo ou limpe os filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => onSelectPatient(patient)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
