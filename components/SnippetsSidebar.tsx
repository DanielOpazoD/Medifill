import React, { useState } from 'react';
import { Snippet } from '../types';
import { Plus, X, MessageSquareText, GripHorizontal } from 'lucide-react';

interface SnippetsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSnippetToCanvas: (text: string) => void;
}

const DEFAULT_SNIPPETS: Snippet[] = [];

export const SnippetsSidebar: React.FC<SnippetsSidebarProps> = ({ isOpen, onClose, onAddSnippetToCanvas }) => {
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    const saved = localStorage.getItem('medifill_custom_snippets');
    return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : DEFAULT_SNIPPETS;
  });
  const [newSnippetText, setNewSnippetText] = useState('');

  const handleAddCustom = () => {
    if (!newSnippetText.trim()) return;
    const newSnippet: Snippet = {
      id: Date.now().toString(),
      text: newSnippetText,
      category: 'personal'
    };
    const updated = [newSnippet, ...snippets];
    setSnippets(updated);
    localStorage.setItem('medifill_custom_snippets', JSON.stringify(updated));
    setNewSnippetText('');
  };

  const handleDelete = (id: string) => {
    const updated = snippets.filter(s => s.id !== id);
    setSnippets(updated);
    localStorage.setItem('medifill_custom_snippets', JSON.stringify(updated));
  };

  const handleDragStart = (e: React.DragEvent, text: string) => {
      e.dataTransfer.setData('text/plain', text);
      e.dataTransfer.effectAllowed = 'copy';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-72 bg-white shadow-2xl border-l border-slate-200 z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between bg-purple-50">
        <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
            <MessageSquareText size={16}/>
            <h2>Frases Rápidas</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white rounded-full text-slate-500 hover:text-slate-800 transition-colors">
            <X size={16} />
        </button>
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
          {snippets.map(snippet => (
              <div 
                key={snippet.id}
                draggable
                onDragStart={(e) => handleDragStart(e, snippet.text)}
                onClick={() => onAddSnippetToCanvas(snippet.text)}
                className="group bg-white px-2 py-1.5 rounded border border-slate-200 shadow-sm hover:border-purple-400 cursor-pointer hover:bg-purple-50 transition-all relative flex items-center gap-2"
                title={snippet.text} // Tooltip para ver texto completo
              >
                  <GripHorizontal size={12} className="text-slate-300 flex-shrink-0 cursor-grab"/>
                  
                  {/* Truncate aplica '...' si es muy largo, whitespace-nowrap fuerza una sola línea */}
                  <p className="text-xs text-slate-700 truncate font-medium select-none flex-1">
                      {snippet.text}
                  </p>

                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(snippet.id); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-0.5"
                    title="Eliminar"
                  >
                      <X size={12} />
                  </button>
              </div>
          ))}
      </div>
    </div>
  );
};