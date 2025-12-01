import React, { useState, useEffect, useRef } from 'react';
import { Toolbar } from './components/Toolbar';
import { DraggableInput } from './components/DraggableInput';
import { SnippetsSidebar } from './components/SnippetsSidebar';
import { TextElement, FormState, Page, ToolType, DefaultSettings } from './types';
import { Trash2, ChevronUp, ChevronDown, FilePlus, AlertCircle, RefreshCw } from 'lucide-react';
import { TEMPLATES } from './templates';

// Utility to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);
const AUTOSAVE_KEY = 'medifill_autosave_state';

const App: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({ pages: [] });
  
  // History State
  const [past, setPast] = useState<FormState[]>([]);
  const [future, setFuture] = useState<FormState[]>([]);

  // Selection State (Multi-select support)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [zoom, setZoom] = useState<number>(0.9);
  const [isLoading, setIsLoading] = useState(false);
  const [isFillMode, setIsFillMode] = useState(false);
  
  // New Feature States
  const [showSnippets, setShowSnippets] = useState(false);
  const [hasRestorableSession, setHasRestorableSession] = useState(false);
  
  // Tools
  const [activeTool, setActiveTool] = useState<ToolType>('select');

  // App Preferences
  const [lastLineHeight, setLastLineHeight] = useState<number>(1.1);
  
  // CONFIGURACIÓN POR DEFECTO ACTUALIZADA
  const [defaultSettings, setDefaultSettings] = useState<DefaultSettings>({
      width: 225,
      height: 17,
      fontSize: 15,
      indent: 0
  });
  
  // Dragging State (Elements)
  const [dragState, setDragState] = useState<{
    ids: string[];
    pageId: string;
    startX: number;
    startY: number;
    initialPositions: Record<string, {x: number, y: number}>;
  } | null>(null);

  // Selection Box State
  const [selectionBox, setSelectionBox] = useState<{startX: number, startY: number, currentX: number, currentY: number} | null>(null);

  // --- 1. PERSISTENCE (AUTO-SAVE) ---
  
  // Check for saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
        setHasRestorableSession(true);
    }
  }, []);

  const restoreSession = () => {
    try {
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && Array.isArray(parsed.pages)) {
                setFormState(parsed);
                setHasRestorableSession(false); // Hide banner
            }
        }
    } catch (e) {
        console.error("Failed to restore session", e);
        alert("No se pudo restaurar la sesión (datos corruptos).");
    }
  };

  const discardSession = () => {
      localStorage.removeItem(AUTOSAVE_KEY);
      setHasRestorableSession(false);
  };

  // Auto-save effect (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
        if (formState.pages.length > 0) {
            try {
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(formState));
            } catch (e) {
                // Ignore quota exceeded errors silently or warn once
                console.warn("Local storage full, cannot autosave images.");
            }
        }
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(timer);
  }, [formState]);


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
    setSelectedIds([]);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast(prev => [...prev, formState]);
    setFormState(next);
    setFuture(newFuture);
    setSelectedIds([]);
  };

  // --- Helpers to find elements ---
  const findElementAndPage = (elementId: string) => {
    for (const page of formState.pages) {
      const el = page.elements.find(e => e.id === elementId);
      if (el) return { page, element: el };
    }
    return null;
  };

  const getSelectedElements = () => {
    const elements: TextElement[] = [];
    formState.pages.forEach(p => {
        p.elements.forEach(el => {
            if (selectedIds.includes(el.id)) elements.push(el);
        });
    });
    return elements;
  };

  const handleElementDuplicate = (id: string) => {
    // If multiple selected, duplicate all
    const idsToDuplicate = selectedIds.includes(id) ? selectedIds : [id];
    
    recordHistory();
    setFormState(prev => {
        const newPages = prev.pages.map(page => {
            const newElements: TextElement[] = [];
            page.elements.forEach(el => {
                if (idsToDuplicate.includes(el.id)) {
                     newElements.push({
                        ...el,
                        id: generateId(),
                        x: el.x + 20,
                        y: el.y + 20,
                     });
                }
            });
            return { ...page, elements: [...page.elements, ...newElements] };
        });
        return { pages: newPages };
    });
  };

  const handleElementDelete = (id?: string) => {
    const idsToDelete = id ? [id] : selectedIds;
    if (idsToDelete.length === 0) return;

    recordHistory();
    setFormState(prev => ({
      pages: prev.pages.map(page => ({
        ...page,
        elements: page.elements.filter(el => !idsToDelete.includes(el.id))
      }))
    }));
    setSelectedIds([]);
  };

  const handleClearTextSelected = () => {
      if (selectedIds.length === 0) return;
      recordHistory();
      setFormState(prev => ({
          pages: prev.pages.map(page => ({
              ...page,
              elements: page.elements.map(el => 
                  selectedIds.includes(el.id) ? { ...el, text: '' } : el
              )
          }))
      }));
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (isFillMode) return; // Disable shortcuts in fill mode

        if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
        if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); }
        if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
            e.preventDefault();
            if (selectedIds.length > 0) handleElementDuplicate(selectedIds[0]);
        }
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
            if (document.activeElement?.tagName !== 'TEXTAREA') handleElementDelete();
        }
        if (e.key === 'Escape') {
            setSelectedIds([]);
            if (activeTool === 'text') setActiveTool('select');
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, formState, selectedIds, activeTool, isFillMode]);


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
                fontSize: el.fontSize || 15,
                isBold: !!el.isBold,
                isItalic: !!el.isItalic,
                width: el.width || 225, 
                height: el.height || 17,
                lineHeight: el.lineHeight || lastLineHeight,
                indent: el.indent || defaultSettings.indent || 0
            }));
            newPages.push({ id: generateId(), imageUrl: base64, elements: elements });
        }
        setFormState({ pages: newPages });
        setZoom(0.9);
        setSelectedIds([]);
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
        setSelectedIds([]);
        localStorage.removeItem(AUTOSAVE_KEY);
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
    setSelectedIds([]);
    setTimeout(() => window.print(), 100);
  };

  const handleGlobalFontSizeChange = (delta: number) => {
    recordHistory();
    setFormState(prev => ({
        pages: prev.pages.map(page => ({
            ...page,
            elements: page.elements.map(el => ({
                ...el,
                fontSize: Math.max(8, el.fontSize + delta)
            }))
        }))
    }));
  };

  const handleGlobalIndentChange = (delta: number) => {
    recordHistory();
    setFormState(prev => ({
        pages: prev.pages.map(page => ({
            ...page,
            elements: page.elements.map(el => ({
                ...el,
                indent: Math.max(0, (el.indent || 0) + delta)
            }))
        }))
    }));
    // Also update default settings
    setDefaultSettings(prev => ({
        ...prev,
        indent: Math.max(0, (prev.indent || 0) + delta)
    }));
  };

  // --- Handlers for Canvas Interaction ---
  
  const handleMouseDownOnCanvas = (e: React.MouseEvent, pageId: string) => {
    if (isFillMode) return;
    
    // Check if we clicked on an input or background
    // If it's activeTool === 'select' and clicking background, start selection box
    if (activeTool === 'select' && e.target === e.currentTarget) {
        // Deselect if not holding Shift
        if (!e.shiftKey) setSelectedIds([]);

        const rect = e.currentTarget.getBoundingClientRect();
        // Coordinates relative to viewport for the selection box overlay
        setSelectionBox({
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY
        });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent, pageId: string) => {
    if (isFillMode) return;

    // Only add element if in 'text' tool mode
    if (activeTool !== 'text') {
        return;
    }
    
    if (dragState) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let x = (e.clientX - rect.left) / zoom;
    let y = (e.clientY - rect.top) / zoom;
    
    const { width, height, fontSize, indent } = defaultSettings;
    let adjustedY = y - (height * 0.5);

    const newElement: TextElement = {
      id: generateId(),
      x, y: adjustedY,
      text: '', 
      fontSize: fontSize,
      isBold: false, isItalic: false,
      width: width, 
      height: height,
      lineHeight: lastLineHeight,
      indent: indent || 0
    };

    recordHistory();
    setFormState(prev => ({
      pages: prev.pages.map(p => {
        if (p.id === pageId) return { ...p, elements: [...p.elements, newElement] };
        return p;
      })
    }));
    setSelectedIds([newElement.id]);
  };

  // --- 3. SNIPPET HANDLING (CLICK & DROP) ---

  // LÓGICA ACTUALIZADA: Aplicar a la selección actual o crear nuevo
  const handleAddSnippetClick = (text: string) => {
    if (formState.pages.length === 0) return;
    
    recordHistory();

    // Caso 1: Hay cuadros seleccionados -> Reemplazar texto en ellos
    if (selectedIds.length > 0) {
        setFormState(prev => ({
            pages: prev.pages.map(page => ({
                ...page,
                elements: page.elements.map(el => 
                    selectedIds.includes(el.id) ? { ...el, text: text } : el
                )
            }))
        }));
    } 
    // Caso 2: No hay selección -> Crear uno nuevo (comportamiento anterior)
    else {
        const targetPageId = formState.pages[0].id;
        
        const newElement: TextElement = {
            id: generateId(),
            x: 100, y: 100,
            text: text, 
            fontSize: defaultSettings.fontSize,
            isBold: false, isItalic: false,
            width: defaultSettings.width, 
            height: defaultSettings.height,
            lineHeight: lastLineHeight,
            indent: defaultSettings.indent || 0
        };

        setFormState(prev => ({
            pages: prev.pages.map(p => {
                if (p.id === targetPageId) return { ...p, elements: [...p.elements, newElement] };
                return p;
            })
        }));
        setSelectedIds([newElement.id]);
    }
  };

  // Handle dropping a snippet onto a page
  const handleDropOnPage = (e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    if (!text) return;

    const rect = e.currentTarget.getBoundingClientRect();
    let x = (e.clientX - rect.left) / zoom;
    let y = (e.clientY - rect.top) / zoom;

    // Center the element on the mouse
    const height = defaultSettings.height;
    y = y - (height * 0.5);

    const newElement: TextElement = {
      id: generateId(),
      x, y,
      text: text, 
      fontSize: defaultSettings.fontSize,
      isBold: false, isItalic: false,
      width: defaultSettings.width, 
      height: height,
      lineHeight: lastLineHeight,
      indent: defaultSettings.indent || 0
    };

    recordHistory();
    setFormState(prev => ({
      pages: prev.pages.map(p => {
        if (p.id === pageId) return { ...p, elements: [...p.elements, newElement] };
        return p;
      })
    }));
    setSelectedIds([newElement.id]);
  };


  // Generic updater for one or multiple elements
  const handleElementChange = (id: string, updates: Partial<TextElement>) => {
    // If updating a property on one element that is part of a selection, apply to ALL selected
    const isPartOfSelection = selectedIds.includes(id);
    const targetIds = isPartOfSelection ? selectedIds : [id];

    // Special case: text content is usually individual, but style is batch
    // If updates contains 'text', we probably only want to update the specific ID unless it's a "clear"
    const isTextUpdate = 'text' in updates && Object.keys(updates).length === 1;

    setFormState(prev => ({
      pages: prev.pages.map(page => ({
        ...page,
        elements: page.elements.map(el => {
            if (isTextUpdate) {
                return el.id === id ? { ...el, ...updates } : el;
            } else {
                return targetIds.includes(el.id) ? { ...el, ...updates } : el;
            }
        })
      }))
    }));
  };

  const handleStyleUpdate = (style: Partial<TextElement>) => {
    if (style.lineHeight !== undefined) setLastLineHeight(style.lineHeight);
    if (selectedIds.length > 0) {
      recordHistory();
      // Apply to all selected
      setFormState(prev => ({
        pages: prev.pages.map(page => ({
            ...page,
            elements: page.elements.map(el => selectedIds.includes(el.id) ? { ...el, ...style } : el)
        }))
      }));
    }
  };

  const handleSelectElement = (id: string, multi: boolean) => {
      // In Fill Mode, we still allow selection for targetting snippets, but visual cues are hidden by CSS.
      if (multi) {
          setSelectedIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
      } else {
          // If simply clicking, and it's already selected, don't clear others immediately (allows dragging)
          // But if it's NOT selected, select ONLY it
          if (!selectedIds.includes(id)) {
              setSelectedIds([id]);
          }
      }
  };

  const startDrag = (e: React.MouseEvent, id: string) => {
    if (isFillMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // If the item clicked isn't in the selection, select it (exclusive)
    if (!selectedIds.includes(id)) {
        setSelectedIds([id]);
        // Update local ref for the drag to work on this one
        const result = findElementAndPage(id);
        if (!result) return;
        const { element, page } = result;
        recordHistory();
        setDragState({
            ids: [id],
            pageId: page.id,
            startX: e.clientX,
            startY: e.clientY,
            initialPositions: { [id]: { x: element.x, y: element.y } }
        });
    } else {
        // Dragging the whole selection
        recordHistory();
        const initialPositions: Record<string, {x: number, y: number}> = {};
        const page = findElementAndPage(id)?.page;
        if (!page) return;

        // Find all selected elements on this page
        page.elements.forEach(el => {
            if (selectedIds.includes(el.id)) {
                initialPositions[el.id] = { x: el.x, y: el.y };
            }
        });

        setDragState({
            ids: Object.keys(initialPositions),
            pageId: page.id,
            startX: e.clientX,
            startY: e.clientY,
            initialPositions
        });
    }
  };

  // Global mouse handlers for Dragging and Selection Box
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Handle Element Dragging
      if (dragState) {
        const deltaX = (e.clientX - dragState.startX) / zoom;
        const deltaY = (e.clientY - dragState.startY) / zoom;
        
        setFormState(prev => ({
            pages: prev.pages.map(page => {
                if (page.id !== dragState.pageId) return page;
                return {
                    ...page,
                    elements: page.elements.map(el => {
                        if (dragState.ids.includes(el.id)) {
                            const init = dragState.initialPositions[el.id];
                            let newX = init.x + deltaX;
                            let newY = init.y + deltaY;
                            return { ...el, x: newX, y: newY };
                        }
                        return el;
                    })
                };
            })
        }));
      }

      // 2. Handle Selection Box
      if (selectionBox) {
          setSelectionBox(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
        // End Drag
        if (dragState) {
             setDragState(null);
        }

        // End Selection Box - Calculate intersection
        if (selectionBox) {
            
            // Define selection rect in Client coordinates
            const selLeft = Math.min(selectionBox.startX, selectionBox.currentX);
            const selTop = Math.min(selectionBox.startY, selectionBox.currentY);
            const selWidth = Math.abs(selectionBox.currentX - selectionBox.startX);
            const selHeight = Math.abs(selectionBox.currentY - selectionBox.startY);

            // Ignore tiny clicks
            if (selWidth > 5 && selHeight > 5) {
                const hitIds: string[] = [];
                
                // Loop through all pages to find their containers
                const pageContainers = document.querySelectorAll('.print-page-container');
                pageContainers.forEach((container, pageIdx) => {
                     const pageRect = container.getBoundingClientRect();
                     const pageData = formState.pages[pageIdx];
                     
                     // If the page intersects the selection box
                     if (selLeft < pageRect.right && selLeft + selWidth > pageRect.left &&
                         selTop < pageRect.bottom && selTop + selHeight > pageRect.top) {
                             
                             // Calculate selection rect relative to this page (unzoomed)
                             const relX = (selLeft - pageRect.left) / zoom;
                             const relY = (selTop - pageRect.top) / zoom;
                             const relW = selWidth / zoom;
                             const relH = selHeight / zoom;
                             
                             // Check elements inside this page
                             pageData.elements.forEach(el => {
                                 if (relX < el.x + el.width && relX + relW > el.x &&
                                     relY < el.y + el.height && relY + relH > el.y) {
                                         hitIds.push(el.id);
                                     }
                             });
                         }
                });

                if (hitIds.length > 0) {
                    // If Shift held, toggle. Else replace.
                    if (e.shiftKey) {
                        setSelectedIds(prev => [...prev, ...hitIds.filter(id => !prev.includes(id))]);
                    } else {
                        setSelectedIds(hitIds);
                    }
                }
            }

            setSelectionBox(null);
        }
    };

    if (dragState || selectionBox) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, zoom, selectionBox, formState]);


  return (
    <div className={`flex flex-col h-screen w-full bg-slate-200/80 overflow-hidden print:h-auto print:overflow-visible font-sans ${activeTool === 'text' && !isFillMode ? 'cursor-text' : ''}`}>
      
      {/* --- RESTORE SESSION BANNER --- */}
      {hasRestorableSession && (
          <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between shadow-md z-[100] animate-in slide-in-from-top duration-300 relative">
              <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-blue-200"/>
                  <span className="font-medium text-sm">Se encontró una sesión anterior sin guardar. ¿Deseas recuperarla?</span>
              </div>
              <div className="flex gap-2">
                  <button onClick={discardSession} className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-xs font-semibold">Descartar</button>
                  <button onClick={restoreSession} className="px-3 py-1 bg-white text-blue-700 hover:bg-blue-50 rounded text-xs font-bold flex items-center gap-1">
                      <RefreshCw size={12}/> Restaurar
                  </button>
              </div>
          </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border border-slate-100">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Preparando documento...</p>
            </div>
        </div>
      )}

      {/* Selection Box Overlay */}
      {selectionBox && (
          <div 
            className="fixed border border-blue-500 bg-blue-500/10 pointer-events-none z-[9999]"
            style={{
                left: Math.min(selectionBox.startX, selectionBox.currentX),
                top: Math.min(selectionBox.startY, selectionBox.currentY),
                width: Math.abs(selectionBox.currentX - selectionBox.startX),
                height: Math.abs(selectionBox.currentY - selectionBox.startY)
            }}
          />
      )}

      <Toolbar 
        onUpload={handleUpload} onPrint={handlePrint} onExport={handleExport}
        onImport={handleImport} onClear={handleClearAll} onLoadTemplate={handleLoadTemplate}
        selectedElements={getSelectedElements()} onUpdateStyle={handleStyleUpdate}
        onDeleteSelected={() => handleElementDelete()}
        onClearTextSelected={handleClearTextSelected}
        hasPages={formState.pages.length > 0} zoom={zoom} onZoomChange={setZoom}
        onUndo={undo} onRedo={redo} canUndo={past.length > 0} canRedo={future.length > 0}
        activeTool={activeTool} onToolChange={setActiveTool}
        onGlobalFontSizeChange={handleGlobalFontSizeChange}
        onGlobalIndentChange={handleGlobalIndentChange}
        defaultSettings={defaultSettings} onUpdateDefaultSettings={setDefaultSettings}
        isFillMode={isFillMode} onToggleFillMode={() => {
            setIsFillMode(!isFillMode);
            setSelectedIds([]); // Clear selection when switching modes
            setActiveTool('select');
        }}
        showSnippets={showSnippets} onToggleSnippets={() => setShowSnippets(!showSnippets)}
      />

      <SnippetsSidebar 
        isOpen={showSnippets} 
        onClose={() => setShowSnippets(false)} 
        onAddSnippetToCanvas={handleAddSnippetClick}
      />

      {/* Main Workspace */}
      <div 
        className="flex-1 overflow-auto p-4 md:p-12 flex flex-col items-center gap-8 bg-slate-200/50 print:bg-white print:p-0 print:gap-0 print:block print:overflow-visible"
        onClick={() => {
            if (!isFillMode && activeTool === 'select' && !selectionBox) {
                // Background click handled in mouseDown, but fallback here if needed
            }
        }}
      >
        
        {formState.pages.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full opacity-60">
                <div className="bg-white p-12 rounded-3xl border-4 border-dashed border-slate-300 flex flex-col items-center max-w-lg text-center shadow-sm">
                    <div className="bg-blue-50 p-4 rounded-full mb-6 text-blue-500">
                        <FilePlus size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-700 mb-2">Comienza tu formulario</h2>
                    <p className="text-slate-500 mb-8">Sube imágenes PNG de tus recetas o selecciona una plantilla predefinida.</p>
                </div>
           </div>
        ) : (
           formState.pages.map((page, index) => (
               <div 
                 key={page.id} 
                 className="relative group/page block print:w-full"
                 // Important for Zoom: Explicitly set size based on zoom to prevent overlap
                 style={{
                     width: `${210 * zoom}mm`,
                     height: `${297 * zoom}mm`,
                     marginBottom: '2rem' // Gap between pages
                 }}
               >
                   {/* 
                      Page Container (Scaled Inner)
                   */}
                   <div
                     onMouseDown={(e) => handleMouseDownOnCanvas(e, page.id)}
                     onClick={(e) => { e.stopPropagation(); handleCanvasClick(e, page.id); }}
                     onDragOver={(e) => {
                         e.preventDefault(); // Allow drop
                         e.dataTransfer.dropEffect = 'copy';
                     }}
                     onDrop={(e) => handleDropOnPage(e, page.id)}
                     className={`print-page-container origin-top-left bg-white shadow-2xl relative
                        ${!isFillMode && activeTool === 'text' ? 'cursor-text' : !isFillMode && activeTool === 'hand' ? 'cursor-grab' : 'cursor-default'}
                     `}
                     style={{
                        transform: `scale(${zoom})`,
                        width: '210mm',
                        height: '297mm',
                     }}
                   >
                       <img src={page.imageUrl} alt={`Página ${index + 1}`} className="w-full h-full select-none pointer-events-none block object-contain" />
                       
                       {page.elements.map(el => (
                           <DraggableInput
                               key={el.id} element={el} isSelected={selectedIds.includes(el.id)} scale={zoom}
                               activeTool={activeTool}
                               onSelect={handleSelectElement} onChange={handleElementChange} onDelete={handleElementDelete}
                               onDuplicate={handleElementDuplicate} onMouseDown={startDrag} onRecordHistory={recordHistory}
                               isFillMode={isFillMode}
                           />
                       ))}
                   </div>

                   {/* Sidebar Controls (Number & Tools) - Outside Scaled Area */}
                   {!isFillMode && (
                       <div className="absolute top-0 -right-16 h-full py-4 hidden xl:flex flex-col gap-2 no-print">
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
                   )}
               </div>
           ))
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-white border-t border-slate-200 p-2 text-center text-xs text-slate-400 no-print font-medium flex justify-between px-4">
        <span>MediFill &copy; {new Date().getFullYear()}</span>
        <span>
            {isFillMode 
                ? 'Modo Rellenar (Solo escritura)' 
                : activeTool === 'select' 
                    ? 'Modo Selección (Arrastra para seleccionar)' 
                    : activeTool === 'hand' 
                        ? 'Modo Mano' 
                        : 'Modo Texto'
            }
        </span>
        <span>{formState.pages.length > 0 ? `Zoom: ${Math.round(zoom * 100)}%` : "Listo"}</span>
      </div>
    </div>
  );
};

export default App;