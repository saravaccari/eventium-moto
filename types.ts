
export interface Motoclub {
  id: string;
  nome: string;
  email: string;
  provincia: string;
  regione: string;
  presidente: string;
  telefono: string;
}

export type TipoEvento = 'Raduno' | 'Festa' | 'Epoca' | 'Gita' | 'Gara/Gimcana';

export interface Evento {
  id: string;
  motoclub: Motoclub;
  nome_evento: string;
  tipo_evento: TipoEvento;
  dataInizio: Date;
  dataFine?: Date;
  ora_inizio: string;
  luogo: string;
  provincia: string;
  regione: string;
  descrizione?: string;
  // Weather contingency flags
  annullatoMaltempo?: boolean;
  rimandatoMaltempo?: boolean;
  confermatoMaltempo?: boolean;
}

export interface Filtri {
    data?: string;
    ora?: string;
    luogo?: string;
    provincia?: string;
    regione?: string;
    tipo_evento?: TipoEvento;
}

export interface ConflictCheckResult {
    isConflict: boolean;
    conflictingClub?: string;
    suggestedDates?: string[];
}

export interface SaveEventResult {
    status: 'SUCCESS' | 'CONFLICT' | 'ERROR';
    message: string;
    suggestions?: string[];
}

export interface OTPResult {
    success: boolean;
    message: string;
}
