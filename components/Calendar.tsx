
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns';
import it from 'date-fns/locale/it';
import type { Evento } from '../types';

interface CalendarProps {
  currentDate: Date;
  events: Evento[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onDayClick: (day: Date) => void;
  isLoading: boolean;
}

interface TooltipData {
  events: Evento[];
  x: number;
  y: number;
}

export const Calendar: React.FC<CalendarProps> = ({ currentDate, events, onPrevMonth, onNextMonth, onToday, onDayClick, isLoading }) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startingDayIndex = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const eventsByDate = events.reduce((acc, event) => {
    const start = new Date(event.dataInizio);
    const end = event.dataFine ? new Date(event.dataFine) : start;
    
    try {
        const daysInEvent = eachDayOfInterval({ start, end });
        daysInEvent.forEach(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(event);
        });
    } catch (error) { // Handles invalid date range from date-fns
        const dateKey = format(start, 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
    }
    return acc;
  }, {} as Record<string, Evento[]>);

  const handleMouseEnter = (e: React.MouseEvent, dayEvents: Evento[]) => {
    if (dayEvents.length > 0) {
      setTooltip({
        events: dayEvents,
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip) {
      setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: it })}
        </h2>
        <div className="flex items-center space-x-2">
          <button onClick={onPrevMonth} className="p-2 rounded-md hover:bg-gray-100">&lt;</button>
          <button onClick={onToday} className="text-sm font-medium px-3 py-1.5 border rounded-lg hover:bg-gray-100">Oggi</button>
          <button onClick={onNextMonth} className="p-2 rounded-md hover:bg-gray-100">&gt;</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-[#6B6B6B]">
        {daysOfWeek.map(day => <div key={day} className="py-2">{day}</div>)}
      </div>

      <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1">
        {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
        
        {isLoading ? (
            Array.from({ length: 35 - startingDayIndex }).map((_, i) => <SkeletonDay key={i}/>)
        ) : (
            daysInMonth.map(day => {
                const dayEvents = eventsByDate[format(day, 'yyyy-MM-dd')] || [];
                const isOccupied = dayEvents.length > 0;
                return (
                    <div
                        key={day.toString()}
                        onClick={() => onDayClick(day)}
                        onMouseEnter={(e) => handleMouseEnter(e, dayEvents)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className={`relative p-2 rounded-lg cursor-pointer transition-all duration-200 h-24 sm:h-28 flex flex-col ${isOccupied ? 'bg-[#2D5742] text-white' : 'bg-[#FAF8F3] hover:scale-105 hover:shadow-md'}`}
                    >
                        <time dateTime={format(day, 'yyyy-MM-dd')} className={`font-semibold ${isToday(day) ? 'bg-[#C86A3F] text-white rounded-full h-6 w-6 flex items-center justify-center' : ''}`}>
                            {format(day, 'd')}
                        </time>
                        {isOccupied && (
                           <div className="mt-1 -mx-1 text-left">
                                <span className="liquid-glass text-xs font-medium px-2 py-0.5 rounded-lg text-white/90">
                                   {dayEvents.length} {dayEvents.length > 1 ? 'eventi' : 'evento'}
                                </span>
                           </div>
                        )}
                    </div>
                );
            })
        )}
      </div>

      {tooltip && (
        <div 
          className="fixed z-50 pointer-events-none bg-white border border-gray-200 shadow-xl rounded-xl p-3 max-w-xs animate-fade-in"
          style={{ 
            left: `${tooltip.x + 15}px`, 
            top: `${tooltip.y + 15}px`,
            transform: tooltip.x + 250 > window.innerWidth ? 'translateX(-100%)' : 'none'
          }}
        >
          {tooltip.events.map((event, idx) => (
            <div key={event.id} className={idx > 0 ? 'mt-3 pt-3 border-t border-gray-100' : ''}>
              <p className="text-[#C86A3F] text-[10px] font-bold uppercase tracking-wider mb-0.5">{event.tipo_evento}</p>
              <h4 className="font-bold text-[#1A1A1A] text-sm leading-tight">{event.nome_evento}</h4>
              <p className="text-[#6B6B6B] text-xs mt-1 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {event.motoclub.nome}
              </p>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 150ms ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const SkeletonDay: React.FC = () => (
    <div className="bg-gray-200 rounded-lg animate-pulse h-24 sm:h-28 p-2"></div>
);
