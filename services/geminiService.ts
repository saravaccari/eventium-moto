
import { GoogleGenAI, Type } from "@google/genai";
import { format, isSameDay, parseISO, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { Evento, Filtri, ConflictCheckResult, OTPResult, TipoEvento } from '../types';

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'YOUR_API_KEY_HERE' });
const model = 'gemini-3-flash-preview';

let fallbackEvents: Evento[] = [
    { id: '1', nome_evento: 'Motoraduno dei Castelli', tipo_evento: 'Raduno', dataInizio: new Date(new Date().setDate(5)), ora_inizio: '09:00', luogo: 'Piazza del Castello, Sirmione', provincia: 'Brescia', regione: 'Lombardia', motoclub: { id: 'mc1', nome: 'MC Sirmione', email: 'info@mcsirmione.it', provincia: 'Brescia', regione: 'Lombardia', presidente: 'Gianni Brera', telefono: '030123456' }, confermatoMaltempo: true },
    { id: '2', nome_evento: 'Festa Biker del Lago', tipo_evento: 'Festa', dataInizio: new Date(new Date().setDate(12)), dataFine: new Date(new Date().setDate(14)), ora_inizio: '18:00', luogo: 'Lungolago, Desenzano', provincia: 'Brescia', regione: 'Lombardia', motoclub: { id: 'mc2', nome: 'MC Desenzano', email: 'segreteria@mcdesenzano.it', provincia: 'Brescia', regione: 'Lombardia', presidente: 'Luigi Riva', telefono: '030987654' }, rimandatoMaltempo: true },
    { id: '3', nome_evento: 'Gita sui Colli Euganei', tipo_evento: 'Gita', dataInizio: new Date(new Date().setDate(20)), ora_inizio: '10:00', luogo: 'Abano Terme', provincia: 'Padova', regione: 'Veneto', motoclub: { id: 'mc3', nome: 'MC Padova', email: 'presidente@mcpadova.it', provincia: 'Padova', regione: 'Veneto', presidente: 'Marco Polo', telefono: '049112233' }, annullatoMaltempo: true },
];

// Simulatore di database OTP
const activeOTPs = new Map<string, string>();

export async function fetchEvents(startDate: Date, endDate: Date, filters: Filtri): Promise<Evento[]> {
    if (!apiKey) {
        return fallbackEvents.filter(event => {
            const eventDate = new Date(event.dataInizio);
            if (filters.data) {
                const filterDate = parseISO(filters.data);
                // Check if the filtered date is within the event's date range
                const eventEndDate = event.dataFine ? new Date(event.dataFine) : eventDate;
                if (!isWithinInterval(filterDate, { start: startOfDay(eventDate), end: endOfDay(eventEndDate) })) return false;
            } else {
                 if (eventDate < startDate || eventDate > endDate) return false;
            }
            if (filters.regione && event.regione !== filters.regione) return false;
            if (filters.provincia && event.provincia !== filters.provincia) return false;
            if (filters.tipo_evento && event.tipo_evento !== filters.tipo_evento) return false;
            if (filters.luogo && !event.luogo.toLowerCase().includes(filters.luogo.toLowerCase())) return false;
            return true;
        }).map(e => ({ ...e, dataInizio: new Date(e.dataInizio), dataFine: e.dataFine ? new Date(e.dataFine) : undefined }));
    }

    let prompt = `Genera un elenco JSON di eventi motoclub in Italia. Includi eventi di uno o più giorni.`;
    if (filters.data) {
        prompt += ` Per la data specifica: ${filters.data}.`;
    } else {
        prompt += ` Per il periodo dal ${format(startDate, 'yyyy-MM-dd')} al ${format(endDate, 'yyyy-MM-dd')}.`;
    }

    const filterDescriptions = Object.entries(filters)
      .filter(([key, value]) => value && key !== 'data')
      .map(([key, value]) => `${key}: ${value}`);
    
    if (filterDescriptions.length > 0) {
      prompt += ` Filtra i risultati per: ${filterDescriptions.join(', ')}.`;
    }

    prompt += ` Rispondi solo con l'array JSON. Ogni evento deve avere: id, nome_evento, tipo_evento, dataInizio ('yyyy-MM-dd'), dataFine ('yyyy-MM-dd', opzionale), ora_inizio, luogo, provincia, regione, motoclub con nome e email, e flag booleani opzionali per maltempo (annullatoMaltempo, rimandatoMaltempo, confermatoMaltempo).`;

    try {
        // Omitting full response schema for brevity, assuming Gemini can follow prompt instructions
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const jsonString = response.text.trim();
        const parsedEvents = JSON.parse(jsonString);
        return parsedEvents.map((e: any) => ({
            ...e,
            dataInizio: new Date(e.dataInizio + 'T00:00:00'),
            dataFine: e.dataFine ? new Date(e.dataFine + 'T00:00:00') : undefined
        }));
    } catch (error) {
        return fallbackEvents.map(e => ({ ...e, dataInizio: new Date(e.dataInizio), dataFine: e.dataFine ? new Date(e.dataFine) : undefined }));
    }
}

export async function checkConflict(dataInizio: Date, dataFine: Date, provincia: string, eventIdToExclude?: string): Promise<ConflictCheckResult> {
    const conflictingEvent = fallbackEvents.find(e => {
        if (e.id === eventIdToExclude) return false;
        const eventStart = startOfDay(e.dataInizio);
        const eventEnd = endOfDay(e.dataFine || e.dataInizio);
        return e.provincia === provincia &&
               (startOfDay(dataInizio) <= eventEnd) && 
               (endOfDay(dataFine) >= eventStart);
    });

    if (conflictingEvent) {
        const suggestionBaseDate = addDays(conflictingEvent.dataFine || conflictingEvent.dataInizio, 1);
        return { 
            isConflict: true, 
            conflictingClub: conflictingEvent.motoclub.nome,
            suggestedDates: [
                format(suggestionBaseDate, 'yyyy-MM-dd'),
                format(addDays(suggestionBaseDate, 7), 'yyyy-MM-dd'),
                format(addDays(suggestionBaseDate, 8), 'yyyy-MM-dd')
            ]
        };
    }
    return { isConflict: false };
}

export async function createEvent(eventData: Omit<Evento, 'id'>): Promise<Evento> {
    console.log(`[PUSH] Email inviata a tutta la rete per l'evento: ${eventData.nome_evento}`);
    const newEvent: Evento = { ...eventData, id: Math.random().toString(36).substr(2, 9) };
    fallbackEvents.push(newEvent);
    return newEvent;
}

export async function requestDeletionOTP(email: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    activeOTPs.set(email, otp);
    console.log(`[GOOGLE AUTH SIMULATION] Invio codice OTP ${otp} all'email: ${email}`);
    
    if (apiKey) {
        await ai.models.generateContent({
            model: model,
            contents: `Simula l'invio di un codice di sicurezza OTP per la cancellazione di un evento motoclub. 
            Il destinatario è: ${email}. Il codice generato è: ${otp}. Scrivi un breve log di conferma.`
        });
    }
}

export async function verifyDeletionOTP(email: string, code: string): Promise<OTPResult> {
    const validCode = activeOTPs.get(email);
    if (validCode === code) {
        activeOTPs.delete(email);
        return { success: true, message: "Codice verificato. Evento rimosso." };
    }
    return { success: false, message: "Il codice OTP inserito non è corretto." };
}

export async function deleteEvent(eventId: string): Promise<void> {
    fallbackEvents = fallbackEvents.filter(e => e.id !== eventId);
    console.log(`[DATABASE] Evento ${eventId} rimosso correttamente.`);
}
