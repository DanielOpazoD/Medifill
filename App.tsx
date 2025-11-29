import React, { useState, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { DraggableInput } from './components/DraggableInput';
import { TextElement, FormState, Page } from './types';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { TEMPLATES } from './templates';

// Utility to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    pages: []
  });
  
  // History State
  const [past, setPast] = useState<FormState[]>([]);
  const [future, setFuture] = useState<FormState[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
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
        x: element.x + 20, // Offset slightly
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
        // Undo / Redo
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        }

        // Duplicate
        if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
            e.preventDefault();
            if (selectedId) {
                handleElementDuplicate(selectedId);
            }
        }
        
        // Delete / Backspace
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
            // Only delete if not typing in a textarea
            if (document.activeElement?.tagName !== 'TEXTAREA') {
                handleElementDelete(selectedId);
            }
        }

        // Escape
        if (e.key === 'Escape') {
            setSelectedId(null);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, formState, selectedId]);


  // --- Handlers for Toolbar ---

  const handleUpload = (files: FileList) => {
    recordHistory();
    // Process multiple files
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFormState(prev => ({
            pages: [
              ...prev.pages,
              {
                id: generateId(),
                imageUrl: e.target?.result as string,
                elements: []
              }
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
        if (!window.confirm("Cargar la plantilla reemplazará las páginas actuales. ¿Deseas continuar?")) {
            return;
        }
    }

    recordHistory();
    setIsLoading(true);
    try {
        const newPages: Page[] = [];

        for (const pageConfig of selectedTemplate.pages) {
            // Fetch the file from the public/root directory
            const response = await fetch(pageConfig.filename);
            if (!response.ok) throw new Error(`No se encontró el archivo ${pageConfig.filename}`);
            const blob = await response.blob();
            
            // Convert to Base64 to ensure portability
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            // Map predefined elements if any
            const elements: TextElement[] = (pageConfig.elements || []).map(el => ({
                id: generateId(),
                x: el.x || 50,
                y: el.y || 50,
                text: el.text || '',
                placeholder: el.placeholder, // Ensure placeholder is copied
                fontSize: el.fontSize || 27,
                isBold: !!el.isBold,
                isItalic: !!el.isItalic,
                width: el.width || 200,
                height: el.height || 30, // Approx height
                lineHeight: el.lineHeight || lastLineHeight
            }));

            newPages.push({
                id: generateId(),
                imageUrl: base64,
                elements: elements
            });
        }

        setFormState({ pages: newPages });
        setZoom(1); // Reset zoom
        setSelectedId(null);

    } catch (error) {
        alert("Error al cargar la plantilla. Asegúrate de que los archivos existan en la carpeta principal del proyecto.");
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
        setFormState(prev => ({
            pages: prev.pages.filter(p => p.id !== pageId)
        }));
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
          // Migration logic for old single-image format
          if (parsed.elements && parsed.backgroundImage) {
            setFormState({
                pages: [{
                    id: generateId(),
                    imageUrl: parsed.backgroundImage,
                    elements: parsed.elements
                }]
            });
          }
          // New multi-page format
          else if (parsed.pages && Array.isArray(parsed.pages)) {
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
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // --- Handlers for Canvas Interaction ---

  const handleCanvasClick = (e: React.MouseEvent, pageId: string) => {
    if (dragState) return;
    
    // Ensure we clicked the page container itself (currentTarget)
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Adjust coordinates based on zoom level
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const defaultFontSize = 27;
    // Align click with baseline approx (move box up by ~75% of font size)
    const adjustedY = y - (defaultFontSize * 0.75);

    const newElement: TextElement = {
      id: generateId(),
      x,
      y: adjustedY,
      text: '',
      fontSize: defaultFontSize,
      isBold: false,
      isItalic: false,
      width: 200,
      height: defaultFontSize,
      lineHeight: lastLineHeight // Use stored preference
    };

    recordHistory();
    setFormState(prev => ({
      pages: prev.pages.map(p => {
        if (p.id === pageId) {
          return { ...p, elements: [...p.elements, newElement] };
        }
        return p;
      })
    }));
    setSelectedId(newElement.id);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // If clicking directly on the main container (gray bg), deselect
    if (e.target === e.currentTarget) {
        setSelectedId(null);
    }
  };

  // --- Handlers for Elements ---

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
    // If lineHeight is updated, save it as preference for new boxes
    if (style.lineHeight !== undefined) {
        setLastLineHeight(style.lineHeight);
    }

    if (selectedId) {
      recordHistory();
      handleElementChange(selectedId, style);
    }
  };

  // --- Drag Logic ---

  const startDrag = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    recordHistory(); // Record state before dragging starts

    const result = findElementAndPage(id);
    if (!result) return;
    const { element, page } = result;

    setDragState({
      id,
      pageId: page.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.x,
      initialY: element.y
    });
    setSelectedId(id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      // Adjust delta based on zoom
      const deltaX = (e.clientX - dragState.startX) / zoom;
      const deltaY = (e.clientY - dragState.startY) / zoom;

      const newX = dragState.initialX + deltaX;
      const newY = dragState.initialY + deltaY;

      handleElementChange(dragState.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

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
    <div className="flex flex-col h-screen w-full bg-gray-50 overflow-hidden">
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow-lg text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Cargando plantilla...</p>
            </div>
        </div>
      )}

      <Toolbar 
        onUpload={handleUpload}
        onPrint={handlePrint}
        onExport={handleExport}
        onImport={handleImport}
        onClear={handleClearAll}
        onLoadTemplate={handleLoadTemplate}
        selectedElement={getSelectedElement()}
        onUpdateStyle={handleStyleUpdate}
        onDeleteSelected={() => selectedId && handleElementDelete(selectedId)}
        hasPages={formState.pages.length > 0}
        zoom={zoom}
        onZoomChange={setZoom}
        onUndo={undo}
        onRedo={redo}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
      />

      {/* Main Workspace - Added click handler for background deselection */}
      <div 
        className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center gap-12 bg-gray-100 print:bg-white print:p-0 print:gap-0 print:block print:overflow-visible"
        onClick={handleBackgroundClick}
      >
        
        {formState.pages.length === 0 ? (
           // Empty State
           <div className="w-[210mm] h-[297mm] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-white shadow-lg opacity-50 pointer-events-none">
                <div className="text-center text-gray-400 select-none">
                    <p className="text-4xl mb-4">📄</p>
                    <p className="text-lg font-medium">No hay páginas</p>
                    <p className="text-sm mt-2">Sube imágenes PNG o selecciona una plantilla</p>
                </div>
           </div>
        ) : (
           // Render Pages
           formState.pages.map((page, index) => (
               <div 
                 key={page.id} 
                 className="relative group/page transition-all duration-200 ease-in-out block"
               >
                   {/* Page Container with Zoom - Fixed to A4 Width */}
                   <div
                     onClick={(e) => {
                         e.stopPropagation(); // Stop propagation to avoid immediate deselect from background click
                         handleCanvasClick(e, page.id);
                     }}
                     className="relative bg-white shadow-lg a4-page print-page-reset origin-top"
                     style={{
                        // Scale for screen, Reset for print via class
                        transform: `scale(${zoom})`,
                        marginBottom: `${(zoom - 1) * 100}px`,
                        cursor: 'crosshair'
                     }}
                   >
                       <img 
                           src={page.imageUrl} 
                           alt={`Página ${index + 1}`} 
                           className="w-full h-auto select-none pointer-events-none block"
                       />
                       
                       {/* Elements for this page */}
                       {page.elements.map(el => (
                           <DraggableInput
                               key={el.id}
                               element={el}
                               isSelected={selectedId === el.id}
                               scale={zoom}
                               onSelect={setSelectedId}
                               onChange={handleElementChange}
                               onDelete={handleElementDelete}
                               onDuplicate={handleElementDuplicate}
                               onMouseDown={startDrag}
                               onRecordHistory={recordHistory}
                           />
                       ))}
                   </div>

                   {/* Sidebar Controls (Outside container, visible on hover) */}
                   <div className="absolute top-0 -right-14 h-full py-2 hidden md:flex flex-col gap-2 no-print">
                        <div className="bg-gray-800 text-white text-xs font-bold rounded p-1.5 w-8 h-8 flex items-center justify-center shadow-md">
                            {index + 1}
                        </div>
                        
                        <div className="flex flex-col gap-1 mt-2 opacity-0 group-hover/page:opacity-100 transition-opacity">
                            <button 
                                onClick={() => movePage(index, 'up')}
                                disabled={index === 0}
                                className="bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded p-1.5 w-8 h-8 flex items-center justify-center shadow-md border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Subir página"
                            >
                                <ChevronUp size={16} />
                            </button>
                            <button 
                                onClick={() => movePage(index, 'down')}
                                disabled={index === formState.pages.length - 1}
                                className="bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded p-1.5 w-8 h-8 flex items-center justify-center shadow-md border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Bajar página"
                            >
                                <ChevronDown size={16} />
                            </button>
                            <div className="h-px bg-gray-300 w-4 mx-auto my-1"></div>
                            <button 
                                onClick={() => handleRemovePage(page.id)}
                                className="bg-white text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1.5 w-8 h-8 flex items-center justify-center shadow-md border border-gray-200"
                                title="Eliminar página"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                   </div>
                   
                   {/* Mobile Controls */}
                   <div className="md:hidden flex justify-between items-center bg-gray-200 p-2 text-xs text-gray-600 no-print mt-2 rounded">
                      <span>Página {index + 1}</span>
                      <div className="flex gap-2">
                        <button onClick={() => movePage(index, 'up')} disabled={index === 0} className="p-1 disabled:opacity-30"><ChevronUp size={14}/></button>
                        <button onClick={() => movePage(index, 'down')} disabled={index === formState.pages.length - 1} className="p-1 disabled:opacity-30"><ChevronDown size={14}/></button>
                        <button onClick={() => handleRemovePage(page.id)} className="text-red-500 font-bold ml-2">Eliminar</button>
                      </div>
                   </div>
               </div>
           ))
        )}
      </div>
      
      {/* Footer / Instructions */}
      <div className="bg-white border-t border-gray-200 p-2 text-center text-xs text-gray-500 no-print">
        {formState.pages.length > 0 
            ? `Zoom: ${Math.round(zoom * 100)}% | Haga clic sobre una página para escribir. Arrastre los campos para moverlos. Ctrl+Z para deshacer.` 
            : "Selecciona una plantilla o sube imágenes PNG para comenzar."}
      </div>
    </div>
  );
};

export default App;