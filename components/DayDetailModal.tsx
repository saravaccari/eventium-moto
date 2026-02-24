
import React, { useState } from 'react';
import { format, differenceInCalendarDays, isSameDay } from 'date-fns';
import it from 'date-fns/locale/it';
import type { Evento } from '../types';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Evento[];
  selectedDate: Date | null;
  onDeleteInitiate: (event: Evento) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ isOpen, onClose, events, selectedDate, onDeleteInitiate }) => {
  const [shareFeedback, setShareFeedback] = useState(false);
  
  if (!isOpen) return null;

  const dateStr = selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: it }) : '';

  const checkCanDelete = (eventDate: Date) => {
    return differenceInCalendarDays(new Date(eventDate), new Date()) >= 3;
  };

  const handleShare = () => {
    if (!selectedDate) return;
    const link = `${window.location.origin}/events?date=${format(selectedDate, 'yyyy-MM-dd')}`;
    navigator.clipboard.writeText(link).then(() => {
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
    }).catch(err => {
        console.error('Impossibile copiare il link: ', err);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FAF8F3]">
          <div>
            <h3 className="text-xl font-bold text-[#1A1A1A] capitalize">{dateStr}</h3>
            <p className="text-sm text-[#6B6B6B]">{events.length} {events.length > 1 ? 'eventi programmati' : 'evento programmato'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <CloseIcon />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
          {events.map(event => {
            const canDelete = checkCanDelete(event.dataInizio);
            const isMultiDay = event.dataFine && !isSameDay(event.dataInizio, event.dataFine);
            return (
              <div key={event.id} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex justify-between items-start group">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F3] px-2 py-0.5 rounded text-[#C86A3F]">
                      {event.tipo_evento}
                    </span>
                    <span className="text-xs text-gray-400">{event.ora_inizio}</span>
                  </div>
                  <h4 className="font-bold text-[#1A1A1A] leading-tight mb-1">{event.nome_evento}</h4>
                  {isMultiDay && (
                      <p className="text-xs text-blue-600 font-semibold mb-1 bg-blue-50 px-2 py-0.5 rounded inline-block">
                          {`Dal ${format(event.dataInizio, 'd MMM')} al ${format(event.dataFine!, 'd MMM')}`}
                      </p>
                  )}
                  <p className="text-xs text-[#6B6B6B] mb-2">{event.motoclub.nome}</p>
                  <p className="text-xs text-gray-500 italic flex items-center">
                    <MapPinIcon /> {event.luogo}, {event.provincia}
                  </p>
                </div>
                
                <div className="ml-4 flex flex-col items-end">
                  <div className="flex items-center space-x-1">
                      <button
                        disabled={!canDelete}
                        onClick={() => onDeleteInitiate(event)}
                        className={`p-2 rounded-lg transition-all ${canDelete ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-200 cursor-not-allowed'}`}
                        title={canDelete ? "Elimina evento" : "Cancellabile solo fino a 3 giorni prima"}
                      >
                        <TrashIcon />
                      </button>
                  </div>
                  {!canDelete && (
                    <span className="text-[9px] text-red-400 font-medium mt-1 w-20 text-right leading-tight">
                        Non più cancellabile
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="p-6 bg-[#FAF8F3] border-t border-gray-100 flex space-x-3">
          <button 
            onClick={handleShare} 
            className={`flex-1 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center space-x-2 ${shareFeedback ? 'bg-green-500' : 'bg-[#C86A3F] hover:bg-[#a65632]'}`}
          >
            {shareFeedback ? <CheckIcon /> : <ShareIcon />}
            <span>{shareFeedback ? 'Link Copiato!' : 'Condividi Link'}</span>
          </button>
          <button onClick={onClose} className="flex-1 bg-white border border-gray-200 text-[#6B6B6B] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors">
            Chiudi
          </button>
        </div>
      </div>
      <style>{`
        @keyframes scale-up { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-up { animation: scale-up 0.2s ease-out; }
      `}</style>
    </div>
  );
};

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const MapPinIcon = () => (
  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const ShareIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-8.316l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
);
const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
);
