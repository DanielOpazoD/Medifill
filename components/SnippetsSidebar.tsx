import React, { useState, useRef } from 'react';
import { Snippet } from '../types';
import { Plus, X, MessageSquareText, GripHorizontal, ChevronRight, Trash2, Download, Upload } from 'lucide-react';

interface SnippetsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSnippetToCanvas: (text: string) => void;
}

const DEFAULT_SNIPPETS: Snippet[] = [];

export const SnippetsSidebar: React.FC<SnippetsSidebarProps> = ({ isOpen, onClose, onAddSnippetToCanvas }) => {
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    const saved = localStorage.getItem('medifill_custom_snippets');
    try {
      return saved ? JSON.parse(saved) : DEFAULT_SNIPPETS;
    } catch (e) {
      return DEFAULT_SNIPPETS;
    }
  });
  const [newSnippetText, setNewSnippetText] = useState('');
  
  // Estados para variantes
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newVariantTexts, setNewVariantTexts] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveSnippets = (updated: Snippet[]) => {
      setSnippets(updated);
      localStorage.setItem('medifill_custom_snippets', JSON.stringify(updated));
  };

  const handleAddCustom = () => {
    if (!newSnippetText.trim()) return;
    const newSnippet: Snippet = {
      id: Date.now().toString(),
      text: newSnippetText,
      category: 'personal',
      variants: []
    };
    const updated = [newSnippet, ...snippets];
    saveSnippets(updated);
    setNewSnippetText('');
  };

  const handleDelete = (id: string) => {
    const updated = snippets.filter(s => s.id !== id);
    saveSnippets(updated);
  };

  const toggleExpand = (id: string) => {
      const newSet = new Set(expandedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setExpandedIds(newSet);
  };

  const handleAddVariant = (snippetId: string) => {
      const text = newVariantTexts[snippetId];
      if (!text?.trim()) return;

      const updated = snippets.map(s => {
          if (s.id === snippetId) {
              return { ...s, variants: [...(s.variants || []), text] };
          }
          return s;
      });
      saveSnippets(updated);
      setNewVariantTexts(prev => ({ ...prev, [snippetId]: '' }));
  };

  const handleDeleteVariant = (snippetId: string, index: number) => {
      const updated = snippets.map(s => {
          if (s.id === snippetId) {
              const newVariants = [...(s.variants || [])];
              newVariants.splice(index, 1);
              return { ...s, variants: newVariants };
          }
          return s;
      });
      saveSnippets(updated);
  };

  const handleDragStart = (e: React.DragEvent, text: string) => {
      e.dataTransfer.setData('text/plain', text);
      e.dataTransfer.effectAllowed = 'copy';
      e.stopPropagation();
  };

  // --- Export / Import Logic ---
  const handleExportSnippets = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snippets));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "medifill_frases.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const result = event.target?.result;
              if (typeof result === 'string') {
                  const imported = JSON.parse(result);
                  if (Array.isArray(imported)) {
                      if (window.confirm(`Se importarán ${imported.length} frases. ¿Deseas reemplazar las actuales (OK) o fusionarlas (Cancelar)?`)) {
                          // Replace
                          saveSnippets(imported);
                      } else {
                          // Merge (simple id check)
                          const currentIds = new Set(snippets.map(s => s.id));
                          const merged = [...snippets];
                          imported.forEach((s: Snippet) => {
                              if (!currentIds.has(s.id)) {
                                  merged.push(s);
                              } else {
                                  // If conflict, regenerate ID
                                  merged.push({ ...s, id: Date.now().toString() + Math.random() });
                              }
                          });
                          saveSnippets(merged);
                      }
                  } else {
                      alert("El archivo no tiene el formato correcto.");
                  }
              }
          } catch (err) {
              alert("Error al leer el archivo JSON.");
          }
          // Reset input
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-[58px] h-[calc(100vh-58px)] w-72 bg-white shadow-2xl border-l border-slate-200 z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between bg-purple-50">
        <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
            <MessageSquareText size={16}/>
            <h2>Frases Rápidas</h2>
        </div>
        
        <div className="flex items-center gap-1">
             <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImportFile}/>
             <button onClick={handleImportClick} className="p-1 hover:bg-white rounded text-purple-700 transition-colors" title="Importar frases">
                 <Upload size={14} />
             </button>
             <button onClick={handleExportSnippets} className="p-1 hover:bg-white rounded text-purple-700 transition-colors" title="Exportar frases">
                 <Download size={14} />
             </button>
             <div className="h-4 w-px bg-purple-200 mx-1"></div>
             <button onClick={onClose} className="p-1 hover:bg-white rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                <X size={16} />
             </button>
        </div>
      </div>

      <div className="p-2 border-b border-slate-100 bg-white">
          <div className="flex gap-1">
              <input 
                type="text" 
                value={newSnippetText}
                onChange={(e) => setNewSnippetText(e.target.value)}
                placeholder="Nueva frase..."
                className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 focus:border-purple-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
              />
              <button 
                onClick={handleAddCustom}
                disabled={!newSnippetText.trim()}
                className="bg-purple-600 text-white p-1 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                  <Plus size={16}/>
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50">
          {snippets.length === 0 && (
             <div className="text-center mt-10 text-slate-400 text-xs px-4">
                 <p>No hay frases guardadas.</p>
                 <p>Escribe arriba para agregar.</p>
             </div>
          )}
          {snippets.map(snippet => {
              const isExpanded = expandedIds.has(snippet.id);
              
              return (
                  <div key={snippet.id} className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden transition-all">
                      {/* Fila Principal del Snippet */}
                      <div 
                        className={`flex items-center gap-1 px-2 py-1.5 hover:bg-purple-50 cursor-pointer group ${isExpanded ? 'bg-purple-50/50' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, snippet.text)}
                        onClick={() => onAddSnippetToCanvas(snippet.text)}
                      >
                          {/* Botón Expansión */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleExpand(snippet.id); }}
                            className={`p-0.5 rounded text-slate-400 hover:text-purple-600 hover:bg-purple-100 transition-colors ${isExpanded ? 'rotate-90' : ''}`}
                            title="Ver variantes"
                          >
                              <ChevronRight size={14} />
                          </button>

                          <GripHorizontal size={12} className="text-slate-300 flex-shrink-0 cursor-grab"/>
                          
                          <p className="text-xs text-slate-700 truncate font-medium select-none flex-1" title={snippet.text}>
                              {snippet.text}
                          </p>

                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(snippet.id); }}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-0.5 transition-opacity"
                            title="Eliminar frase"
                          >
                              <X size={12} />
                          </button>
                      </div>

                      {/* Sección de Variantes */}
                      {isExpanded && (
                          <div className="bg-slate-50 border-t border-slate-100 pl-8 pr-2 py-2 space-y-2 animate-in slide-in-from-top-1 duration-200">
                              {/* Lista de Variantes */}
                              {snippet.variants?.map((variant, idx) => (
                                  <div 
                                      key={idx} 
                                      className="flex items-center gap-2 group/variant cursor-pointer"
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, variant)}
                                      onClick={() => onAddSnippetToCanvas(variant)}
                                  >
                                      <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
                                      <span className="text-xs text-slate-600 hover:text-purple-700 truncate flex-1" title={variant}>
                                          {variant}
                                      </span>
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); handleDeleteVariant(snippet.id, idx); }}
                                          className="opacity-0 group-hover/variant:opacity-100 text-slate-300 hover:text-red-500"
                                          title="Eliminar variante"
                                      >
                                          <Trash2 size={10} />
                                      </button>
                                  </div>
                              ))}

                              {/* Input para Nueva Variante */}
                              <div className="flex gap-1 items-center pt-1 border-t border-slate-100/50 mt-1">
                                  <input 
                                      type="text" 
                                      value={newVariantTexts[snippet.id] || ''}
                                      onChange={(e) => setNewVariantTexts(prev => ({...prev, [snippet.id]: e.target.value}))}
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddVariant(snippet.id)}
                                      placeholder="Agregar variante..."
                                      className="flex-1 text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:border-purple-400"
                                  />
                                  <button 
                                      onClick={() => handleAddVariant(snippet.id)}
                                      className="text-purple-600 hover:bg-purple-100 p-0.5 rounded"
                                      disabled={!newVariantTexts[snippet.id]?.trim()}
                                  >
                                      <Plus size={12} />
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              );
          })}
      </div>
    </div>
  );
};