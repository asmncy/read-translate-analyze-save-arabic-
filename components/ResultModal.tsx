import React from 'react';
import { SelectionResult, WordMapping } from '../types';
import { Button } from './Button';
import { BookmarkPlus, X, Languages, Sparkles } from 'lucide-react';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  result: SelectionResult | null;
  onSave: (result: SelectionResult) => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  result,
  onSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Analyse Linguistique</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Languages className="w-6 h-6 text-indigo-600 opacity-50" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">Analyse intelligente...</p>
                <p className="text-sm text-gray-500 mt-1">OCR, Vocalisation et Traduction contextuelle</p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-8">
              
              {/* Main Arabic Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Texte Vocalisé (Arabe)</label>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Détecté</span>
                </div>
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-right shadow-sm relative group" dir="rtl">
                  <p className="text-2xl md:text-3xl arabic-text text-gray-800 leading-loose font-medium">
                    {result.vocalizedText}
                  </p>
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400">
                      Tashkeel activé
                  </div>
                </div>
              </div>

              {/* Global Translation */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Traduction Globale (Français)</label>
                <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-100 text-gray-800 text-lg leading-relaxed">
                  {result.translatedText}
                </div>
              </div>

              {/* Word by Word Analysis */}
              {result.words && result.words.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                    <Languages className="w-3 h-3 mr-1" />
                    Traduction Mot à Mot
                  </label>
                  <div className="flex flex-wrap gap-2" dir="rtl">
                    {result.words.map((word: WordMapping, index: number) => (
                        <div key={index} className="flex flex-col items-center bg-white border border-gray-200 rounded-lg p-2 min-w-[80px] hover:border-indigo-300 hover:shadow-md transition-all cursor-default">
                            <span className="text-lg arabic-text font-medium text-gray-900 mb-1">{word.arabic}</span>
                            <div className="w-full border-t border-gray-100 my-1"></div>
                            <span className="text-xs text-gray-600 font-medium" dir="ltr">{word.french}</span>
                        </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
             <div className="text-center text-red-500 py-8 bg-red-50 rounded-xl border border-red-100">
                <p className="font-medium">Erreur lors de l'analyse.</p>
                <p className="text-sm mt-1">Impossible de lire le texte. Veuillez réessayer.</p>
             </div>
          )}
        </div>

        {/* Footer */}
        {result && !isLoading && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 shrink-0">
            <Button variant="ghost" onClick={onClose}>Fermer</Button>
            <Button 
              onClick={() => {
                onSave(result);
                onClose();
              }}
              icon={<BookmarkPlus className="w-4 h-4" />}
            >
              Sauvegarder la Flashcard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
