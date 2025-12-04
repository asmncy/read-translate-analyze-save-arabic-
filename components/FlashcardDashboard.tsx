import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import { Button } from './Button';
import { 
  Trash2, 
  RotateCw, 
  Play, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  BrainCircuit,
  Layers,
  HelpCircle
} from 'lucide-react';

interface FlashcardDashboardProps {
  cards: Flashcard[];
  onDelete: (id: string) => void;
}

type StudyMode = 'GALLERY' | 'TRAINING' | 'TEST';

export const FlashcardDashboard: React.FC<FlashcardDashboardProps> = ({ cards, onDelete }) => {
  const [mode, setMode] = useState<StudyMode>('GALLERY');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [testScore, setTestScore] = useState({ correct: 0, total: 0 });
  const [testCompleted, setTestCompleted] = useState(false);

  // Reset state when changing modes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setTestScore({ correct: 0, total: 0 });
    setTestCompleted(false);
  }, [mode]);

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNextCard = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
      setTestCompleted(true);
    }
  };

  const handleTestAnswer = (correct: boolean) => {
    setTestScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));
    handleNextCard();
  };

  // --- RENDERERS ---

  // 1. Empty State
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <BrainCircuit className="w-12 h-12 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Votre collection est vide</h2>
        <p className="text-gray-500 max-w-md">
          Retournez au mode Lecture, sélectionnez du texte arabe et créez des flashcards pour commencer votre apprentissage.
        </p>
      </div>
    );
  }

  // 2. Study View (Training or Test)
  if (mode === 'TRAINING' || mode === 'TEST') {
    if (testCompleted) {
      return (
        <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Session Terminée !</h2>
            
            {mode === 'TEST' && (
              <div className="mb-6">
                <div className="text-5xl font-black text-indigo-600 mb-2">
                  {Math.round((testScore.correct / cards.length) * 100)}%
                </div>
                <p className="text-gray-500">
                  Score: {testScore.correct} / {cards.length}
                </p>
              </div>
            )}

            <div className="flex flex-col space-y-3">
              <Button onClick={() => {
                setTestCompleted(false);
                setTestScore({ correct: 0, total: 0 });
                setCurrentIndex(0);
              }}>
                <RotateCw className="w-4 h-4 mr-2" /> Recommencer
              </Button>
              <Button variant="outline" onClick={() => setMode('GALLERY')}>
                <Layers className="w-4 h-4 mr-2" /> Retour à la Galerie
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const currentCard = cards[currentIndex];

    return (
      <div className="flex flex-col items-center justify-center h-full p-4 relative">
        {/* Top Navigation */}
        <div className="absolute top-6 left-6">
          <Button variant="ghost" onClick={() => setMode('GALLERY')} icon={<ArrowLeft className="w-4 h-4" />}>
            Quitter
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xl mb-8">
          <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
            <span>{mode === 'TRAINING' ? 'Entraînement Libre' : 'Mode Test'}</span>
            <span>{currentIndex + 1} / {cards.length}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* The Card - Using robust custom CSS classes */}
        <div 
          className="relative w-full max-w-xl aspect-[3/2] flip-container cursor-pointer group"
          onClick={handleFlip}
        >
          <div className={`flip-inner shadow-2xl rounded-2xl ${isFlipped ? 'is-flipped' : ''}`}>
            
            {/* FRONT (French Question) */}
            <div className="flip-face bg-white rounded-2xl flex flex-col items-center justify-center p-8 border-2 border-gray-100">
               <div className="absolute top-6 left-6 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-widest">
                 Français
               </div>
               <p className="text-2xl text-center text-gray-800 font-medium leading-relaxed">
                 {currentCard.translatedText}
               </p>
               <div className="absolute bottom-6 text-gray-400 text-sm flex items-center animate-pulse">
                 <RotateCw className="w-4 h-4 mr-2" /> Cliquez pour retourner
               </div>
            </div>

            {/* BACK (Arabic Answer) */}
            <div className="flip-face flip-back bg-indigo-600 rounded-2xl flex flex-col items-center justify-center p-8 text-white shadow-inner">
              <div className="absolute top-6 left-6 px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full uppercase tracking-widest">
                 Arabe
               </div>
              <p className="text-4xl arabic-text font-bold leading-loose text-center" dir="rtl">
                {currentCard.vocalizedText || currentCard.originalText}
              </p>
              {/* Word Breakdown hint if available */}
              {currentCard.words && currentCard.words.length > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {currentCard.words.map((w, i) => (
                        <span key={i} className="text-xs bg-indigo-700/50 px-2 py-1 rounded text-indigo-100">
                            {w.arabic}
                        </span>
                    ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Controls */}
        <div className="mt-12 flex items-center gap-4">
          {mode === 'TRAINING' && (
            <>
              <Button variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
                Précédent
              </Button>
              <Button onClick={handleNextCard}>
                Suivant {currentIndex === cards.length - 1 ? '(Fin)' : ''}
              </Button>
            </>
          )}

          {mode === 'TEST' && (
            <>
              {!isFlipped ? (
                <div className="text-gray-500 text-sm italic">Retournez la carte pour valider</div>
              ) : (
                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleTestAnswer(false); }}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors text-red-600 border border-red-200">
                      <XCircle className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-bold text-red-600 uppercase">À revoir</span>
                  </button>

                  <button 
                    onClick={(e) => { e.stopPropagation(); handleTestAnswer(true); }}
                    className="flex flex-col items-center gap-2 group"
                  >
                     <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors text-green-600 border border-green-200">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-bold text-green-600 uppercase">Je sais</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    );
  }

  // 3. Gallery Mode (Overview)
  return (
    <div className="h-full overflow-y-auto p-8 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Mes Flashcards</h2>
          <p className="text-gray-500 mt-1">Collection de {cards.length} cartes</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            icon={<Play className="w-4 h-4" />}
            onClick={() => setMode('TRAINING')}
          >
            Entraînement
          </Button>
          <Button 
            variant="primary" 
            icon={<HelpCircle className="w-4 h-4" />}
            onClick={() => setMode('TEST')}
          >
            Lancer un Test
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {cards.map((card) => (
          <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-5 flex flex-col h-64 group relative">
            <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Français</span>
                <button 
                  onClick={() => onDelete(card.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <p className="text-gray-800 font-medium line-clamp-3 mb-4 flex-grow">
              {card.translatedText}
            </p>
            
            <div className="border-t border-gray-100 my-2"></div>
            
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Arabe</span>
            <p className="text-xl arabic-text text-indigo-600 text-right line-clamp-2 leading-relaxed" dir="rtl">
              {card.vocalizedText || card.originalText}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};