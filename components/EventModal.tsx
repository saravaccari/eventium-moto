
import React, { useState, useEffect } from 'react';
import type { Evento, Motoclub, TipoEvento, SaveEventResult } from '../types';
import { tipiEvento, province, regioni } from '../constants';
import { format, parseISO, isSameDay } from 'date-fns';
import it from 'date-fns/locale/it';

type EventFormData = Omit<Evento, 'id' | 'motoclub' | 'dataInizio' | 'dataFine'> & {
    dataInizio: string;
    dataFine: string;
    email_organizzatore: string;
};

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: EventFormData) => Promise<SaveEventResult>;
  selectedDate: Date | null;
  currentUser: Motoclub;
}

const getInitialStateForCreate = (date: Date | null, user: Motoclub) => ({
  nome_evento: '',
  tipo_evento: '' as TipoEvento,
  dataInizio: date ? format(date, 'yyyy-MM-dd') : '',
  dataFine: date ? format(date, 'yyyy-MM-dd') : '',
  ora_inizio: '',
  luogo: '',
  provincia: user.provincia,
  regione: user.regione,
  descrizione: '',
  email_organizzatore: user.email || '',
  annullatoMaltempo: false,
  rimandatoMaltempo: false,
  confermatoMaltempo: true,
});

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, selectedDate, currentUser }) => {
  const [formData, setFormData] = useState<ReturnType<typeof getInitialStateForCreate>>(() => 
    getInitialStateForCreate(selectedDate, currentUser)
  );
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setFormData(getInitialStateForCreate(selectedDate, currentUser));
    }
  }, [isOpen, selectedDate, currentUser]);


  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); 
    if (suggestions.length > 0) setSuggestions([]);
  };
  
  const handleWeatherOptionChange = (option: 'annullatoMaltempo' | 'rimandatoMaltempo' | 'confermatoMaltempo') => {
      setFormData(prev => ({
          ...prev,
          annullatoMaltempo: option === 'annullatoMaltempo',
          rimandatoMaltempo: option === 'rimandatoMaltempo',
          confermatoMaltempo: option === 'confermatoMaltempo',
      }))
  }

  const handleSuggestionClick = (suggestedDate: string) => {
    setFormData(prev => ({ ...prev, dataInizio: suggestedDate, dataFine: suggestedDate }));
    setError('');
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuggestions([]);
    
    if (!formData.nome_evento || !formData.tipo_evento || !formData.dataInizio || !formData.ora_inizio || !formData.luogo || !formData.email_organizzatore) {
      setError('Tutti i campi con * sono obbligatori.');
      return;
    }

    if (new Date(formData.dataFine) < new Date(formData.dataInizio)) {
        setError("La data di fine non può precedere la data d'inizio.");
        return;
    }

    setIsSubmitting(true);
    const result = await onSave({ ...formData, dataFine: formData.dataFine || formData.dataInizio });
    setIsSubmitting(false);

    if (result.status === "SUCCESS") {
        setIsSuccess(true);
        setTimeout(() => { onClose(); setIsSuccess(false); }, 2000);
    } else {
      setError(result.message);
      if (result.suggestions) {
          setSuggestions(result.suggestions);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
        {isSuccess ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <SuccessIcon />
                <h2 className="text-2xl font-bold text-[#0F9D58] mt-4">Evento Creato!</h2>
            </div>
        ) : (
            <>
                <h2 className="text-2xl font-bold mb-1">Crea Nuovo Evento</h2>
                <p className="text-[#6B6B6B] mb-6">Compila i dettagli del tuo prossimo evento.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormInput label="Email Organizzatore" name="email_organizzatore" type="email" value={formData.email_organizzatore} onChange={handleChange} required />
                    <FormInput label="Nome Evento" name="nome_evento" value={formData.nome_evento} onChange={handleChange} required />
                    <FormSelect label="Tipo Evento" name="tipo_evento" value={formData.tipo_evento} onChange={handleChange} options={tipiEvento} required />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput label="Dal" name="dataInizio" type="date" value={formData.dataInizio} onChange={handleChange} required />
                        <FormInput label="Al" name="dataFine" type="date" value={formData.dataFine} onChange={handleChange} required />
                    </div>
                     <FormInput label="Ora Inizio" name="ora_inizio" type="time" value={formData.ora_inizio} onChange={handleChange} required />
                    <FormInput label="Luogo" name="luogo" placeholder="Es. Piazza del Popolo, Roma" value={formData.luogo} onChange={handleChange} required />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormSelect label="Provincia" name="provincia" value={formData.provincia} onChange={handleChange} options={province} required />
                        <FormSelect label="Regione" name="regione" value={formData.regione} onChange={handleChange} options={regioni} required />
                    </div>
                    
                    <fieldset className="pt-2">
                        <legend className="block text-sm font-medium text-[#1A1A1A] mb-2">In Caso di Maltempo</legend>
                        <div className="space-y-2">
                            <RadioOption name="maltempo" label="L'evento si terrà comunque" checked={formData.confermatoMaltempo} onChange={() => handleWeatherOptionChange('confermatoMaltempo')} />
                            <RadioOption name="maltempo" label="L'evento verrà rimandato" checked={formData.rimandatoMaltempo} onChange={() => handleWeatherOptionChange('rimandatoMaltempo')} />
                            <RadioOption name="maltempo" label="L'evento verrà annullato" checked={formData.annullatoMaltempo} onChange={() => handleWeatherOptionChange('annullatoMaltempo')} />
                        </div>
                    </fieldset>

                    <textarea name="descrizione" rows={3} placeholder="Descrizione aggiuntiva..." value={formData.descrizione} onChange={handleChange} className="w-full bg-[#FAF8F3] border border-gray-300 rounded-lg p-2 text-sm text-[#6B6B6B] focus:ring-1 focus:ring-[#C86A3F] focus:border-[#C86A3F] outline-none"></textarea>

                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
                            <p className="text-sm font-bold text-red-600 leading-tight mb-2">{error}</p>
                            {suggestions.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Date alternative suggerite:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestions.map(dateStr => (
                                            <button key={dateStr} type="button" onClick={() => handleSuggestionClick(dateStr)} className="bg-white border border-red-200 text-red-700 text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-red-100 transition-colors">
                                                {format(parseISO(dateStr), 'd MMMM', { locale: it })}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex justify-end items-center pt-4">
                        <button type="button" onClick={onClose} className="text-[#6B6B6B] font-medium py-2 px-6 rounded-xl mr-2 hover:bg-gray-100">Annulla</button>
                        <button type="submit" disabled={isSubmitting} className={`bg-[#C86A3F] text-white font-medium py-2 px-6 rounded-xl shadow-md transition-all active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#a65632]'}`}>
                            {isSubmitting ? 'Salvataggio...' : 'Crea Evento'}
                        </button>
                    </div>
                </form>
            </>
        )}
      </div>
      <style>{`
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 300ms ease-out forwards; }
      `}</style>
    </div>
  );
};

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props}) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-[#1A1A1A] mb-1">{label}{props.required && ' *'}</label>
        <input id={props.name} {...props} className="w-full bg-[#FAF8F3] border border-gray-300 rounded-lg p-2 text-sm text-[#6B6B6B] focus:ring-1 focus:ring-[#C86A3F] focus:border-[#C86A3F] outline-none" />
    </div>
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, options: string[] }> = ({ label, options, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-[#1A1A1A] mb-1">{label}{props.required && ' *'}</label>
        <select id={props.name} {...props} className="w-full bg-[#FAF8F3] border border-gray-300 rounded-lg p-2 text-sm text-[#6B6B6B] focus:ring-1 focus:ring-[#C86A3F] focus:border-[#C86A3F] outline-none appearance-none">
            <option value="">Seleziona...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);
const RadioOption: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <label className="flex items-center text-sm text-gray-700">
        <input type="radio" {...props} className="h-4 w-4 text-[#C86A3F] focus:ring-[#C86A3F] border-gray-300" />
        <span className="ml-2">{label}</span>
    </label>
);
const SuccessIcon: React.FC = () => (
    <svg className="w-16 h-16 text-[#0F9D58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);
