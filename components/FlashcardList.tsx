import React, { useState } from 'react';
import { Flashcard } from '../types';
import { Trash2, RefreshCw, BookOpenCheck } from 'lucide-react';

interface FlashcardListProps {
  cards: Flashcard[];
  onDelete: (id: string) => void;
}

export const FlashcardList: React.FC<FlashcardListProps> = ({ cards, onDelete }) => {
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const handleFlip = (id: string) => {
    setFlippedId(flippedId === id ? null : id);
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-4">
        <div className="mb-3 p-3 bg-gray-100 rounded-full">
            <BookOpenCheck className="w-6 h-6 text-indigo-300" />
        </div>
        <p className="text-sm text-center font-medium text-gray-500">Votre collection est vide.</p>
        <p className="text-xs text-center text-gray-400 mt-1">Sélectionnez du texte dans un document pour créer des cartes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2 pb-20">
      {cards.map((card) => (
        <div 
          key={card.id} 
          className="group relative w-full h-40 flip-container cursor-pointer"
          onClick={() => handleFlip(card.id)}
        >
          <div className={`flip-inner shadow-sm hover:shadow-md rounded-xl border border-gray-200 ${flippedId === card.id ? 'is-flipped' : ''}`}>
            
            {/* Front (French) */}
            <div className="flip-face bg-white rounded-xl flex flex-col items-center justify-center p-4 text-center">
                <div className="absolute top-3 left-3 text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">FR</div>
                <p className="text-gray-800 font-medium line-clamp-4 leading-relaxed">{card.translatedText}</p>
                <span className="absolute bottom-3 right-3 text-xs text-indigo-400 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <RefreshCw className="w-3 h-3 mr-1" /> Retourner
                </span>
            </div>

            {/* Back (Arabic) */}
            <div className="flip-face flip-back bg-indigo-600 rounded-xl flex flex-col items-center justify-center p-4 text-center text-white">
                <div className="absolute top-3 left-3 text-[10px] font-bold text-white/80 uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">AR</div>
                
                {/* Display Vocalized if available, else original */}
                <p className="text-xl arabic-text font-medium leading-loose" dir="rtl" lang="ar">
                    {card.vocalizedText || card.originalText}
                </p>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                  className="absolute bottom-3 right-3 p-1.5 text-white/60 hover:text-red-200 hover:bg-white/10 rounded-full transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};