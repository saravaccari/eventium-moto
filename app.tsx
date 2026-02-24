
import React, { useState, useEffect, useCallback } from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth, parseISO, format, isValid, isSameDay } from 'date-fns';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Calendar } from './components/Calendar';
import { EventModal } from './components/EventModal';
import { DayDetailModal } from './components/DayDetailModal';
import { DeleteVerificationModal } from './components/DeleteVerificationModal';
import { fetchEvents, createEvent, checkConflict, requestDeletionOTP, verifyDeletionOTP, deleteEvent } from './services/geminiService';
import type { Evento, Filtri, Motoclub, SaveEventResult } from './types';

const mockCurrentUser: Motoclub = {
  id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  nome: 'Motoclub Roma Est',
  email: 'presidente@mcromaest.it',
  provincia: 'Roma',
  regione: 'Lazio',
  presidente: 'Mario Rossi',
  telefono: '3331234567'
};

type EventFormData = Omit<Evento, 'id' | 'motoclub' | 'dataInizio' | 'dataFine'> & {
    dataInizio: string;
    dataFine: string;
    email_organizzatore: string;
};

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteVerifyOpen, setIsDeleteVerifyOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Evento[]>([]);
  const [eventToDelete, setEventToDelete] = useState<Evento | null>(null);

  const [filters, setFilters] = useState<Filtri>({});
  
  const handleFetchEvents = useCallback(async () => {
    setIsLoading(true);
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    try {
      const fetchedEvents = await fetchEvents(start, end, filters);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, filters]);

  useEffect(() => {
    handleFetchEvents();
  }, [handleFetchEvents]);

  const handleDayClick = (day: Date) => {
    const dayEvents = events.filter(e => isSameDay(new Date(e.dataInizio), day));
    setSelectedDate(day);
    if (dayEvents.length > 0) {
      setSelectedEvents(dayEvents);
      setIsDetailModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };
  
  const handleSaveEvent = async (formData: EventFormData): Promise<SaveEventResult> => {
    const dataInizio = new Date(formData.dataInizio);
    const dataFine = formData.dataFine ? new Date(formData.dataFine) : dataInizio;

    const conflict = await checkConflict(dataInizio, dataFine, formData.provincia);
    if (conflict.isConflict) {
      return {
        status: 'CONFLICT',
        message: "Attenzione: c'è già un evento nel giorno che hai selezionato. Non è possibile proseguire.",
        suggestions: conflict.suggestedDates
      };
    }
    
    const { email_organizzatore, ...restEventData } = formData;
    
    const newEventData: Omit<Evento, 'id'> = {
      ...restEventData,
      dataInizio,
      dataFine,
      motoclub: { ...mockCurrentUser, email: email_organizzatore }
    };
    
    try {
      const createdEvent = await createEvent(newEventData);
      setEvents(prevEvents => [...prevEvents, createdEvent]);
      return { status: 'SUCCESS', message: 'Evento creato con successo!' };
    } catch (error) {
      return { status: 'ERROR', message: "Errore durante la creazione dell'evento." };
    }
  };

  const handleInitiateDelete = async (event: Evento) => {
    setEventToDelete(event);
    await requestDeletionOTP(event.motoclub.email);
    setIsDetailModalOpen(false);
    setIsDeleteVerifyOpen(true);
  };
  
  const handleVerifyDelete = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!eventToDelete) return { success: false, message: "Errore: nessun evento selezionato." };
    
    const result = await verifyDeletionOTP(eventToDelete.motoclub.email, code);
    if (result.success) {
      await deleteEvent(eventToDelete.id);
      handleFetchEvents();
      setEventToDelete(null);
    }
    return result;
  };

  return (
    <div className="flex h-screen bg-[#FAF8F3] text-[#1A1A1A] font-sans overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        onFilterChange={(f) => {
          setFilters(f);
          if (f.data) {
            const d = parseISO(f.data);
            if (isValid(d)) setCurrentDate(d);
          }
        }}
        filters={filters}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-20'}`}>
        <Header 
          onCreaEvento={() => { setSelectedDate(null); setIsModalOpen(true); }}
          onRegionSelect={(r) => setFilters(prev => ({...prev, regione: r}))}
          currentRegion={filters.regione}
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Calendar
            currentDate={currentDate}
            events={events}
            onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
            onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
            onToday={() => { setCurrentDate(new Date()); setFilters({}); }}
            onDayClick={handleDayClick}
            isLoading={isLoading}
          />
        </main>
      </div>

      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEvent}
          selectedDate={selectedDate}
          currentUser={mockCurrentUser}
        />
      )}

      {isDetailModalOpen && (
        <DayDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          events={selectedEvents}
          selectedDate={selectedDate}
          onDeleteInitiate={handleInitiateDelete}
        />
      )}

      {isDeleteVerifyOpen && (
        <DeleteVerificationModal
          isOpen={isDeleteVerifyOpen}
          onClose={() => setIsDeleteVerifyOpen(false)}
          onVerify={handleVerifyDelete}
          email={eventToDelete?.motoclub.email || ''}
          eventName={eventToDelete?.nome_evento || ''}
        />
      )}
    </div>
  );
};

export default App;
