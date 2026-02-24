
import React, { useState, useRef, useEffect } from 'react';

interface DeleteVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<{ success: boolean; message: string }>;
  email: string;
  eventName: string;
}

export const DeleteVerificationModal: React.FC<DeleteVerificationModalProps> = ({ isOpen, onClose, onVerify, email, eventName }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      setError("Inserisci il codice completo a 6 cifre.");
      return;
    }

    setIsVerifying(true);
    setError('');
    const result = await onVerify(fullCode);
    setIsVerifying(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.message);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2D5742]/40 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-bounce-in">
        <div className="mb-6 inline-flex p-4 bg-orange-50 rounded-full text-[#C86A3F]">
          <SecurityIcon />
        </div>
        
        <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">Verifica Richiesta</h3>
        <p className="text-sm text-[#6B6B6B] mb-6">
          Abbiamo inviato un codice OTP a 6 cifre all'indirizzo <span className="font-bold text-[#1A1A1A]">{email}</span> per confermare la cancellazione dell'evento <span className="italic">"{eventName}"</span>.
        </p>

        <div className="flex justify-between gap-2 mb-8">
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={el => inputRefs.current[idx] = el}
              type="text"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-100 bg-[#FAF8F3] rounded-xl focus:border-[#C86A3F] focus:ring-0 outline-none transition-all"
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-xs font-bold mb-4 animate-shake">{error}</p>}

        <div className="space-y-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${isVerifying ? 'bg-gray-400' : 'bg-[#C86A3F] hover:bg-[#a65632] hover:scale-[1.02]'}`}
          >
            {isVerifying ? 'Verifica in corso...' : 'Conferma Cancellazione'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-bold text-[#6B6B6B] hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
        </div>

        <p className="mt-8 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
          Powered by Google Auth Simulation
        </p>
      </div>
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.9); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-bounce-in { animation: bounce-in 0.3s ease-out; }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

const SecurityIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
