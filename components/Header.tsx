
import React, { useState, useRef, useEffect } from 'react';
import { regioni } from '../constants';

interface HeaderProps {
  onCreaEvento: () => void;
  onRegionSelect: (regione: string) => void;
  currentRegion?: string;
}

export const Header: React.FC<HeaderProps> = ({ onCreaEvento, onRegionSelect, currentRegion }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex-shrink-0 bg-[#FAF8F3] p-4 sm:p-6 flex justify-between items-center border-b border-gray-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">EVENTIUM MOTO</h1>
        <p className="text-sm text-[#6B6B6B]">Il calendario nazionale dei Motoclub</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="liquid-glass text-[#C86A3F] font-medium py-2 px-4 rounded-xl flex items-center space-x-2 transition-transform duration-200 hover:scale-105"
          >
            <span>{currentRegion || 'Esplora Regioni'}</span>
            <ChevronDownIcon />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#FAF8F3] rounded-xl shadow-lg z-50 overflow-hidden">
              <ul className="max-h-60 overflow-y-auto">
                {regioni.map(regione => (
                  <li key={regione}>
                    <button
                      onClick={() => {
                        onRegionSelect(regione);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#6B6B6B] hover:bg-white"
                    >
                      {regione}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          onClick={onCreaEvento}
          className="hidden lg:block bg-[#C86A3F] text-white font-medium py-2 px-6 rounded-xl transition-transform duration-200 hover:scale-105 shadow-sm"
        >
          + Crea Evento
        </button>
      </div>
    </header>
  );
};

const ChevronDownIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);
