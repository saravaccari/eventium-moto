
import React from 'react';
import type { Filtri, TipoEvento } from '../types';
import { province, regioni, tipiEvento } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onFilterChange: (filters: Filtri) => void;
  filters: Filtri;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, onFilterChange, filters }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    const handleClearFilters = () => {
        onFilterChange({});
    };

  return (
    <aside className={`fixed top-0 left-0 h-full bg-white shadow-lg z-30 transition-all duration-300 ease-in-out ${isOpen ? 'w-80' : 'w-20'} overflow-hidden`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 h-[89px] border-b">
           {isOpen && <span className="text-xl font-semibold">Filtri</span>}
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-gray-100">
            {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </button>
        </div>

        <div className={`p-4 space-y-4 flex-1 overflow-y-auto ${!isOpen && 'opacity-0'}`}>
            <FilterInput label="Data" name="data" type="date" value={filters.data || ''} onChange={handleChange} />
            <FilterInput label="Ora" name="ora" type="time" value={filters.ora || ''} onChange={handleChange} />
            <FilterInput label="Luogo" name="luogo" placeholder="Cerca città..." value={filters.luogo || ''} onChange={handleChange} />
            <FilterSelect label="Provincia" name="provincia" options={province} value={filters.provincia || ''} onChange={handleChange} />
            <FilterSelect label="Regione" name="regione" options={regioni} value={filters.regione || ''} onChange={handleChange} />
            <FilterSelect label="Tipo Evento" name="tipo_evento" options={tipiEvento} value={filters.tipo_evento || ''} onChange={handleChange} />
             <button onClick={handleClearFilters} className="w-full mt-4 text-sm text-[#C86A3F] hover:underline">
                Rimuovi filtri
            </button>
        </div>

        <div className={`p-4 border-t ${!isOpen && 'opacity-0'}`}>
          <a href="mailto:motoadvtn@gmail.com" className="block text-center w-full mb-2 bg-[#2D5742] text-white font-medium py-2 px-4 rounded-xl text-sm">
            Centro Assistenza
          </a>
          <button className="w-full bg-[#2D5742] text-white font-medium py-2 px-4 rounded-xl text-sm">
            L'App
          </button>
        </div>
      </div>
    </aside>
  );
};

interface FilterInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const FilterInput: React.FC<FilterInputProps> = ({ label, ...props}) => (
    <div>
        <label className="block text-sm font-medium text-[#6B6B6B] mb-1">{label}</label>
        <input {...props} className="w-full bg-[#FAF8F3] border border-gray-200 rounded-lg p-2 text-sm text-[#6B6B6B] focus:ring-1 focus:ring-[#C86A3F] focus:border-[#C86A3F] outline-none" />
    </div>
);

interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: string[];
}

const FilterSelect: React.FC<FilterSelectProps> = ({ label, options, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-[#6B6B6B] mb-1">{label}</label>
        <select {...props} className="w-full bg-[#FAF8F3] border border-gray-200 rounded-lg p-2 text-sm text-[#6B6B6B] focus:ring-1 focus:ring-[#C86A3F] focus:border-[#C86A3F] outline-none appearance-none">
            <option value="">Seleziona...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
)

const ChevronLeftIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);
const ChevronRightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);
