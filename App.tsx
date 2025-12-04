import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, MousePointer2, Crop, Library, BookOpen, ChevronLeft, ChevronRight, GraduationCap, FileText, Layers, X, Check, Undo2 } from 'lucide-react';
import { AppMode, AppView, Flashcard, SelectionResult, BoundingBox } from './types';
import { analyzeSelection } from './services/geminiService';
import { Button } from './components/Button';
import { ResultModal } from './components/ResultModal';
import { FlashcardDashboard } from './components/FlashcardDashboard';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
const pdfjs: any = pdfjsLib;
const lib = pdfjs.default || pdfjs;

if (lib.GlobalWorkerOptions) {
  lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

const getDocument = lib.getDocument;

const App: React.FC = () => {
  // View State
  const [currentView, setCurrentView] = useState<AppView>(AppView.READER);

  // Reader State
  const [mode, setMode] = useState<AppMode>(AppMode.VIEW);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Data State
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  
  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Selection State
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [tempSelection, setTempSelection] = useState<BoundingBox | null>(null);
  const [selections, setSelections] = useState<BoundingBox[]>([]);

  // Analysis State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SelectionResult | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Flashcards on Mount
  useEffect(() => {
    const saved = localStorage.getItem('qiraa-flashcards');
    if (saved) {
      try {
        setFlashcards(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse flashcards", e);
      }
    }
  }, []);

  // Save Flashcards on Change
  useEffect(() => {
    localStorage.setItem('qiraa-flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  // Reset selections when changing page or file
  useEffect(() => {
    setSelections([]);
    setTempSelection(null);
  }, [imageSrc, currentPage]);

  // PDF Rendering Helper
  const renderPdfPageToDataUrl = async (doc: any, pageNum: number): Promise<string> => {
    const page = await doc.getPage(pageNum);
    const scale = 2.0; // Higher scale for better OCR quality
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (!context) throw new Error("Failed to create canvas context for PDF render");

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/jpeg');
  };

  // Handle File Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsPdfLoading(true);
    setImageSrc(null);
    setPdfDoc(null);
    setNumPages(0);
    setCurrentPage(1);
    setSelections([]);
    setCurrentView(AppView.READER); // Auto switch to reader

    try {
      if (file.type === 'application/pdf') {
        const fileReader = new FileReader();
        fileReader.onload = async function() {
            const typedarray = new Uint8Array(this.result as ArrayBuffer);
            try {
                const loadingTask = getDocument(typedarray);
                const doc = await loadingTask.promise;
                setPdfDoc(doc);
                setNumPages(doc.numPages);
                setCurrentPage(1);
                
                const dataUrl = await renderPdfPageToDataUrl(doc, 1);
                setImageSrc(dataUrl);
            } catch (error) {
                console.error("Error loading PDF structure", error);
                alert("Impossible d'ouvrir ce PDF.");
            } finally {
                setIsPdfLoading(false);
            }
        };
        fileReader.readAsArrayBuffer(file);
      } else {
        // Image handling
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageSrc(e.target?.result as string);
          setIsPdfLoading(false);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error(err);
      setIsPdfLoading(false);
    }
  };

  // Change Page
  const changePage = async (delta: number) => {
    if (!pdfDoc) return;
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= numPages) {
        setIsPdfLoading(true);
        try {
            const dataUrl = await renderPdfPageToDataUrl(pdfDoc, newPage);
            setImageSrc(dataUrl);
            setCurrentPage(newPage);
        } catch (error) {
            console.error("Error changing page", error);
        } finally {
            setIsPdfLoading(false);
        }
    }
  };

  // Canvas Rendering
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Helper to draw a box
      const drawBox = (box: BoundingBox, isTemp: boolean = false) => {
        ctx.fillStyle = isTemp ? 'rgba(79, 70, 229, 0.1)' : 'rgba(79, 70, 229, 0.2)'; 
        ctx.fillRect(box.x, box.y, box.width, box.height);
        
        ctx.strokeStyle = '#4f46e5'; // Indigo-600
        ctx.lineWidth = 2;
        ctx.setLineDash(isTemp ? [4, 4] : []);
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        if (!isTemp) {
            // Draw small index number
            const index = selections.indexOf(box) + 1;
            ctx.fillStyle = '#4f46e5';
            ctx.fillRect(box.x, box.y - 20, 24, 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Inter';
            ctx.fillText(index.toString(), box.x + 8, box.y - 6);
        }
      };

      // Draw Committed Selections
      selections.forEach(box => drawBox(box));

      // Draw Temp Selection
      if (tempSelection) {
        drawBox(tempSelection, true);
      }
    };
  }, [imageSrc, selections, tempSelection]);

  useEffect(() => {
    if (currentView === AppView.READER) {
        drawCanvas();
    }
  }, [drawCanvas, currentView]);

  // Canvas Initialization on Image Load
  useEffect(() => {
    if (currentView === AppView.READER && imageSrc && canvasRef.current && containerRef.current) {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            if (canvasRef.current && containerRef.current) {
                // Fit canvas to container width while maintaining aspect ratio
                const containerWidth = containerRef.current.clientWidth - 64; // Subtract padding
                const scaleFactor = containerWidth / img.width;
                
                canvasRef.current.width = containerWidth;
                canvasRef.current.height = img.height * scaleFactor;
                drawCanvas();
            }
        }
    }
  }, [imageSrc, drawCanvas, currentView]);

  // Mouse Events for Selection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== AppMode.SELECT_REGION || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setSelectionStart({ x, y });
    setTempSelection({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !selectionStart || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = currentX - selectionStart.x;
    const height = currentY - selectionStart.y;

    setTempSelection({
      x: width > 0 ? selectionStart.x : currentX,
      y: height > 0 ? selectionStart.y : currentY,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = async () => {
    if (!isDrawing || !tempSelection || !canvasRef.current) return;
    
    setIsDrawing(false);

    // If selection is too small, ignore it (prevent accidental clicks)
    if (tempSelection.width < 10 || tempSelection.height < 10) {
        setTempSelection(null);
        return;
    }

    // Add to selections
    setSelections(prev => [...prev, tempSelection]);
    setTempSelection(null);
  };

  // Undo last selection
  const handleUndoSelection = () => {
    setSelections(prev => prev.slice(0, -1));
  };

  // Clear all selections
  const handleClearSelections = () => {
    setSelections([]);
  };

  const handleAnalyzeSelections = async () => {
    if (selections.length === 0 || !canvasRef.current) return;

    setIsModalOpen(true);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
        // 1. Sort selections by Y coordinate to ensure natural reading order (Top to Bottom)
        const sortedSelections = [...selections].sort((a, b) => a.y - b.y);

        // 2. Calculate dimensions for the stitched canvas
        const totalHeight = sortedSelections.reduce((sum, box) => sum + box.height, 0);
        const maxWidth = Math.max(...sortedSelections.map(box => box.width));
        
        // 3. Create temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = maxWidth;
        tempCanvas.height = totalHeight + (sortedSelections.length - 1) * 10; // Add padding between lines
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) throw new Error("Could not create temp context");

        // Fill white background
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 4. Draw each selection onto the new canvas
        let currentY = 0;
        sortedSelections.forEach((box) => {
            tempCtx.drawImage(
                canvasRef.current!,
                box.x, box.y, box.width, box.height, // Source
                0, currentY, box.width, box.height   // Dest (aligned left, stacked)
            );
            currentY += box.height + 10; // Move down + padding
        });

        const base64Image = tempCanvas.toDataURL('image/png');

        // 5. Send to Gemini
        const result = await analyzeSelection(base64Image);
        setAnalysisResult(result);
        
        // Optional: Clear selections after successful analysis? 
        // Let's keep them for now in case user wants to retry or adjust, but user can clear manually.

    } catch (error) {
        console.error("Error processing selection", error);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSaveFlashcard = (result: SelectionResult) => {
    const newCard: Flashcard = {
        id: Date.now().toString(),
        originalText: result.originalText,
        vocalizedText: result.vocalizedText,
        translatedText: result.translatedText,
        words: result.words,
        createdAt: Date.now(),
    };
    setFlashcards(prev => [newCard, ...prev]);
  };

  const handleDeleteFlashcard = (id: string) => {
    setFlashcards(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 text-gray-900 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 shadow-xl z-20 shrink-0">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-200">
            <BookOpen size={24} />
        </div>

        <nav className="flex-1 flex flex-col w-full space-y-4 px-2">
            <button 
                onClick={() => setCurrentView(AppView.READER)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group ${currentView === AppView.READER ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                title="Lecture"
            >
                <FileText className={`w-6 h-6 mb-1 ${currentView === AppView.READER ? 'stroke-2' : 'stroke-1.5'}`} />
                <span className="text-[10px] font-medium">Lecture</span>
            </button>

            <button 
                onClick={() => setCurrentView(AppView.FLASHCARDS)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group relative ${currentView === AppView.FLASHCARDS ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                title="Flashcards"
            >
                {flashcards.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
                <Library className={`w-6 h-6 mb-1 ${currentView === AppView.FLASHCARDS ? 'stroke-2' : 'stroke-1.5'}`} />
                <span className="text-[10px] font-medium">Cards</span>
            </button>
        </nav>

        <div className="mt-auto">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">AI</div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* ---------------- READER VIEW ---------------- */}
        {currentView === AppView.READER && (
            <>
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
                    <div className="flex items-center space-x-4">
                        <input 
                            type="file" 
                            accept="image/*,.pdf"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            icon={<Upload className="w-4 h-4" />}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isPdfLoading}
                        >
                            {isPdfLoading ? 'Chargement...' : 'Ouvrir Fichier'}
                        </Button>

                        {pdfDoc && (
                            <div className="flex items-center bg-gray-100 rounded-lg p-1 space-x-2">
                                <button 
                                    onClick={() => changePage(-1)} 
                                    disabled={currentPage <= 1 || isPdfLoading}
                                    className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-30"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-xs font-medium min-w-[60px] text-center">
                                    Page {currentPage} / {numPages}
                                </span>
                                <button 
                                    onClick={() => changePage(1)} 
                                    disabled={currentPage >= numPages || isPdfLoading}
                                    className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-30"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setMode(AppMode.VIEW)}
                            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                mode === AppMode.VIEW 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <MousePointer2 className="w-4 h-4 mr-2" />
                            Naviguer
                        </button>
                        <button
                            onClick={() => setMode(AppMode.SELECT_REGION)}
                            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                mode === AppMode.SELECT_REGION 
                                ? 'bg-white text-indigo-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Crop className="w-4 h-4 mr-2" />
                            Sélection
                        </button>
                    </div>
                </header>

                <div 
                    ref={containerRef}
                    className={`flex-1 overflow-auto bg-gray-100 relative flex justify-center p-8 ${mode === AppMode.SELECT_REGION ? 'cursor-crosshair' : 'cursor-grab'}`}
                >
                    {isPdfLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-gray-500">Rendu du PDF en cours...</p>
                        </div>
                    ) : imageSrc ? (
                        <div className="relative shadow-2xl mb-20"> 
                            <canvas 
                                ref={canvasRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                className="bg-white block"
                            />
                            {mode === AppMode.SELECT_REGION && selections.length === 0 && !isDrawing && (
                                <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none transition-opacity">
                                    Mode Capture: Dessinez plusieurs boîtes si nécessaire
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600">Aucun document ouvert</h3>
                            <p className="text-sm max-w-md text-center">
                                Ouvrez un PDF ou une image pour commencer à lire et traduire.
                            </p>
                            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                                Ouvrir un fichier
                            </Button>
                        </div>
                    )}

                    {/* Floating Action Bar for Selections */}
                    {selections.length > 0 && (
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-xl border border-gray-200 px-4 py-2 flex items-center space-x-2 animate-in slide-in-from-bottom-4 z-30">
                            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md mr-2">
                                {selections.length} zone{selections.length > 1 ? 's' : ''}
                            </div>
                            
                            <button 
                                onClick={handleUndoSelection}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                title="Annuler la dernière sélection"
                            >
                                <Undo2 size={18} />
                            </button>
                            
                            <div className="w-px h-4 bg-gray-300 mx-1"></div>

                            <button 
                                onClick={handleClearSelections}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                                title="Tout effacer"
                            >
                                <X size={18} />
                            </button>

                            <Button 
                                onClick={handleAnalyzeSelections}
                                size="sm"
                                icon={<Check size={16} />}
                                className="ml-2"
                            >
                                Analyser
                            </Button>
                        </div>
                    )}

                </div>
            </>
        )}

        {/* ---------------- FLASHCARDS VIEW ---------------- */}
        {currentView === AppView.FLASHCARDS && (
            <div className="flex-1 h-full bg-gray-50">
                <FlashcardDashboard cards={flashcards} onDelete={handleDeleteFlashcard} />
            </div>
        )}

        {/* Result Modal (Always available via portal usually, but here conditioned) */}
        <ResultModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            isLoading={isAnalyzing}
            result={analysisResult}
            onSave={handleSaveFlashcard}
        />

      </main>
    </div>
  );
};

export default App;