
import React, { useState, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { DraggableInput } from './components/DraggableInput';
import { TextElement, FormState, Page } from './types';
import { Trash2, ChevronUp, ChevronDown, FilePlus } from 'lucide-react';
import { TEMPLATES } from './templates';

// Utility to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({ pages: [] });
  
  // History State
  const [past, setPast] = useState<FormState[]>([]);
  const [future, setFuture] = useState<FormState[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.9); // Zoom inicial un poco más pequeño para ver la hoja mejor
  const [isLoading, setIsLoading] = useState(false);
  
  // App Preferences
  const [lastLineHeight, setLastLineHeight] = useState<number>(0.9);
  
  // Dragging State
  const [dragState, setDragState] = useState<{
    id: string;
    pageId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // --- History Helpers ---
  const recordHistory = () => {
    setPast(prev => [...prev, formState]);
    setFuture([]);
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture(prev => [formState, ...prev]);
    setFormState(previous);
    setPast(newPast);
    setSelectedId(null);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast(prev => [...prev, formState]);
    setFormState(next);
    setFuture(newFuture);
    setSelectedId(null);
  };

  // --- Helpers to find elements ---
  const findElementAndPage = (elementId: string) => {
    for (const page of formState.pages) {
      const el = page.elements.find(e => e.id === elementId);
      if (el) return { page, element: el };
    }
    return null;
  };

  const getSelectedElement = () => {
    if (!selectedId) return null;
    const result = findElementAndPage(selectedId);
    return result ? result.element : null;
  };

  const handleElementDuplicate = (id: string) => {
    const result = findElementAndPage(id);
    if (!result) return;
    const { element, page } = result;

    recordHistory();
    const newElement: TextElement = {
        ...element,
        id: generateId(),
        x: element.x + 20,
        y: element.y + 20,
    };

    setFormState(prev => ({
        pages: prev.pages.map(p => {
            if (p.id === page.id) {
                return { ...p, elements: [...p.elements, newElement] };
            }
            return p;
        })
    }));
    setSelectedId(newElement.id);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
        if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); }
        if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
            e.preventDefault();
            if (selectedId) handleElementDuplicate(selectedId);
        }
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
            if (document.activeElement?.tagName !== 'TEXTAREA') handleElementDelete(selectedId);
        }
        if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, formState, selectedId]);


  // --- Handlers for Toolbar ---

  const handleUpload = (files: FileList) => {
    recordHistory();
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFormState(prev => ({
            pages: [
              ...prev.pages,
              { id: generateId(), imageUrl: e.target?.result as string, elements: [] }
            ]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLoadTemplate = async (templateId: string) => {
    const selectedTemplate = TEMPLATES.find(t => t.id === templateId);
    if (!selectedTemplate) return;

    if (formState.pages.length > 0) {
        if (!window.confirm("Cargar la plantilla reemplazará las páginas actuales. ¿Deseas continuar?")) return;
    }

    recordHistory();
    setIsLoading(true);
    try {
        const newPages: Page[] = [];
        for (const pageConfig of selectedTemplate.pages) {
            const response = await fetch(pageConfig.filename);
            if (!response.ok) throw new Error(`No se encontró el archivo ${pageConfig.filename}`);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
            const elements: TextElement[] = (pageConfig.elements || []).map(el => ({
                id: generateId(),
                x: el.x || 50,
                y: el.y || 50,
                text: el.text || '',
                placeholder: el.placeholder,
                fontSize: el.fontSize || 27,
                isBold: !!el.isBold,
                isItalic: !!el.isItalic,
                width: el.width || 200,
                height: el.height || 30,
                lineHeight: el.lineHeight || lastLineHeight
            }));
            newPages.push({ id: generateId(), imageUrl: base64, elements: elements });
        }
        setFormState({ pages: newPages });
        setZoom(0.9);
        setSelectedId(null);
    } catch (error) {
        alert("Error al cargar la plantilla.");
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("¿Estás seguro de que quieres borrar todo?")) {
        recordHistory();
        setFormState({ pages: [] });
        setSelectedId(null);
    }
  };

  const handleRemovePage = (pageId: string) => {
    if (window.confirm("¿Eliminar esta página?")) {
        recordHistory();
        setFormState(prev => ({ pages: prev.pages.filter(p => p.id !== pageId) }));
    }
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
    recordHistory();
    setFormState(prev => {
      const newPages = [...prev.pages];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < newPages.length) {
        [newPages[index], newPages[targetIndex]] = [newPages[targetIndex], newPages[index]];
      }
      return { ...prev, pages: newPages };
    });
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formState));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "indicaciones_medicas.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (typeof e.target?.result === 'string') {
          const parsed = JSON.parse(e.target.result);
          recordHistory();
          if (parsed.elements && parsed.backgroundImage) {
            setFormState({
                pages: [{ id: generateId(), imageUrl: parsed.backgroundImage, elements: parsed.elements }]
            });
          } else if (parsed.pages && Array.isArray(parsed.pages)) {
            setFormState(parsed);
          } else {
            alert("Formato de archivo inválido.");
          }
        }
      } catch (err) {
        alert("Error al leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    setSelectedId(null);
    setTimeout(() => window.print(), 100);
  };

  // --- Handlers for Canvas Interaction ---
  const handleCanvasClick = (e: React.MouseEvent, pageId: string) => {
    if (dragState) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const defaultFontSize = 27;
    const adjustedY = y - (defaultFontSize * 0.75);

    const newElement: TextElement = {
      id: generateId(),
      x, y: adjustedY,
      text: '', fontSize: defaultFontSize,
      isBold: false, isItalic: false,
      width: 200, height: defaultFontSize,
      lineHeight: lastLineHeight
    };

    recordHistory();
    setFormState(prev => ({
      pages: prev.pages.map(p => {
        if (p.id === pageId) return { ...p, elements: [...p.elements, newElement] };
        return p;
      })
    }));
    setSelectedId(newElement.id);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setSelectedId(null);
  };

  const handleElementChange = (id: string, updates: Partial<TextElement>) => {
    setFormState(prev => ({
      pages: prev.pages.map(page => ({
        ...page,
        elements: page.elements.map(el => el.id === id ? { ...el, ...updates } : el)
      }))
    }));
  };

  const handleElementDelete = (id: string) => {
    recordHistory();
    setFormState(prev => ({
      pages: prev.pages.map(page => ({
        ...page,
        elements: page.elements.filter(el => el.id !== id)
      }))
    }));
    if (selectedId === id) setSelectedId(null);
  };

  const handleStyleUpdate = (style: Partial<TextElement>) => {
    if (style.lineHeight !== undefined) setLastLineHeight(style.lineHeight);
    if (selectedId) {
      recordHistory();
      handleElementChange(selectedId, style);
    }
  };

  const startDrag = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    recordHistory();
    const result = findElementAndPage(id);
    if (!result) return;
    const { element, page } = result;
    setDragState({
      id, pageId: page.id,
      startX: e.clientX, startY: e.clientY,
      initialX: element.x, initialY: element.y
    });
    setSelectedId(id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;
      const deltaX = (e.clientX - dragState.startX) / zoom;
      const deltaY = (e.clientY - dragState.startY) / zoom;
      handleElementChange(dragState.id, { x: dragState.initialX + deltaX, y: dragState.initialY + deltaY });
    };
    const handleMouseUp = () => setDragState(null);
    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, zoom]);


  return (
    <div className="flex flex-col h-screen w-full bg-slate-200/80 overflow-hidden font-sans">
      
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border border-slate-100">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Preparando documento...</p>
            </div>
        </div>
      )}

      <Toolbar 
        onUpload={handleUpload} onPrint={handlePrint} onExport={handleExport}
        onImport={handleImport} onClear={handleClearAll} onLoadTemplate={handleLoadTemplate}
        selectedElement={getSelectedElement()} onUpdateStyle={handleStyleUpdate}
        onDeleteSelected={() => selectedId && handleElementDelete(selectedId)}
        hasPages={formState.pages.length > 0} zoom={zoom} onZoomChange={setZoom}
        onUndo={undo} onRedo={redo} canUndo={past.length > 0} canRedo={future.length > 0}
      />

      {/* Main Workspace */}
      <div 
        className="flex-1 overflow-auto p-4 md:p-12 flex flex-col items-center gap-12 bg-slate-200/50 print:bg-white print:p-0 print:gap-0 print:block print:overflow-visible"
        onClick={handleBackgroundClick}
      >
        
        {formState.pages.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full opacity-60">
                <div className="bg-white p-12 rounded-3xl border-4 border-dashed border-slate-300 flex flex-col items-center max-w-lg text-center shadow-sm">
                    <div className="bg-blue-50 p-4 rounded-full mb-6 text-blue-500">
                        <FilePlus size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-700 mb-2">Comienza tu formulario</h2>
                    <p className="text-slate-500 mb-8">Sube imágenes PNG de tus recetas o selecciona una plantilla predefinida para empezar a editar.</p>
                </div>
           </div>
        ) : (
           formState.pages.map((page, index) => (
               <div 
                 key={page.id} 
                 className="relative group/page transition-all duration-200 ease-in-out block print:w-full"
               >
                   {/* 
                      Page Container 
                      En Pantalla: Sombra profunda, bordes, zoom.
                      En Impresión: Clase 'print-page-container' fuerza el salto de página y resetea estilos.
                   */}
                   <div
                     onClick={(e) => { e.stopPropagation(); handleCanvasClick(e, page.id); }}
                     className="relative bg-white shadow-2xl print-page-container origin-top a4-page ring-1 ring-black/5"
                     style={{
                        transform: `scale(${zoom})`,
                        marginBottom: `${(zoom - 1) * 100}px`,
                        cursor: 'text'
                     }}
                   >
                       <img src={page.imageUrl} alt={`Página ${index + 1}`} className="w-full h-auto select-none pointer-events-none block" />
                       
                       {page.elements.map(el => (
                           <DraggableInput
                               key={el.id} element={el} isSelected={selectedId === el.id} scale={zoom}
                               onSelect={setSelectedId} onChange={handleElementChange} onDelete={handleElementDelete}
                               onDuplicate={handleElementDuplicate} onMouseDown={startDrag} onRecordHistory={recordHistory}
                           />
                       ))}
                   </div>

                   {/* Sidebar Controls (Number & Tools) */}
                   <div className="absolute top-0 -right-16 h-full py-4 hidden xl:flex flex-col gap-2 no-print" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                        <div className="bg-slate-700 text-white font-bold rounded-lg w-10 h-10 flex items-center justify-center shadow-lg text-lg">
                            {index + 1}
                        </div>
                        
                        <div className="flex flex-col gap-2 mt-2 opacity-0 group-hover/page:opacity-100 transition-all duration-300 translate-x-2 group-hover/page:translate-x-0">
                            <button onClick={() => movePage(index, 'up')} disabled={index === 0} className="bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg p-2 shadow-md border border-slate-200 disabled:opacity-50" title="Subir página">
                                <ChevronUp size={20} />
                            </button>
                            <button onClick={() => movePage(index, 'down')} disabled={index === formState.pages.length - 1} className="bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg p-2 shadow-md border border-slate-200 disabled:opacity-50" title="Bajar página">
                                <ChevronDown size={20} />
                            </button>
                            <div className="h-px bg-slate-300 w-6 mx-auto my-1"></div>
                            <button onClick={() => handleRemovePage(page.id)} className="bg-white text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 shadow-md border border-slate-200 transition-colors" title="Eliminar página">
                                <Trash2 size={20} />
                            </button>
                        </div>
                   </div>
                   
                   {/* Mobile Label */}
                   <div className="xl:hidden flex justify-between items-center bg-white border border-slate-200 shadow-sm p-3 text-sm text-slate-600 no-print mt-2 rounded-lg mx-auto w-[210mm] max-w-full">
                      <span className="font-bold">Página {index + 1}</span>
                      <div className="flex gap-3">
                        <button onClick={() => movePage(index, 'up')} disabled={index === 0}><ChevronUp size={18}/></button>
                        <button onClick={() => movePage(index, 'down')} disabled={index === formState.pages.length - 1}><ChevronDown size={18}/></button>
                        <button onClick={() => handleRemovePage(page.id)} className="text-red-500 font-medium ml-2">Eliminar</button>
                      </div>
                   </div>
               </div>
           ))
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-white border-t border-slate-200 p-2 text-center text-xs text-slate-400 no-print font-medium">
        MediFill &copy; {new Date().getFullYear()} - {formState.pages.length > 0 ? `Zoom: ${Math.round(zoom * 100)}%` : "Listo"}
      </div>
    </div>
  );
};

export default App;
