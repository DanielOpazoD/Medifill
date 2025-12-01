import React, { useRef, useState } from 'react';
import { TextElement, ToolType } from '../types';
import { GripVertical, Trash2, Copy, MoveDiagonal, Info } from 'lucide-react';

interface DraggableInputProps {
  element: TextElement;
  isSelected: boolean;
  scale: number;
  activeTool: ToolType;
  onSelect: (id: string, multi: boolean) => void;
  onChange: (id: string, updates: Partial<TextElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onRecordHistory: () => void;
  isFillMode: boolean;
}

export const DraggableInput: React.FC<DraggableInputProps> = ({
  element,
  isSelected,
  scale,
  activeTool,
  onSelect,
  onChange,
  onDelete,
  onDuplicate,
  onMouseDown,
  onRecordHistory,
  isFillMode
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isHandMode = activeTool === 'hand';
  const [showInfo, setShowInfo] = useState(false);

  // --- Resizing Logic (Width & Height) ---
  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onRecordHistory();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;

      let newWidth = Math.max(20, startWidth + deltaX);
      let newHeight = Math.max(element.fontSize, startHeight + deltaY);

      onChange(element.id, { 
        width: Math.round(newWidth),
        height: Math.round(newHeight)
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // --- Style Definitions ---
  const containerStyle: React.CSSProperties = {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    position: 'absolute',
    display: 'flex',
    alignItems: 'center', // VERTICAL CENTERING
    justifyContent: 'flex-start',
    zIndex: isSelected ? 50 : 10,
    cursor: isFillMode ? 'text' : (isHandMode ? 'grab' : 'text'),
    pointerEvents: 'auto',
  };

  const showToolbar = isSelected && !isHandMode && !isFillMode;

  return (
    <div
      className={`group absolute 
        ${isSelected && !isFillMode ? 'border-2 border-blue-600 z-50' : ''}
        ${!isSelected && !isFillMode ? 'border border-dashed border-slate-300 hover:border-blue-300 z-10' : ''}
        ${isFillMode ? 'border-none z-10' : ''}
        print:border-none transition-colors
      `}
      style={containerStyle}
      onClick={(e) => {
        e.stopPropagation();
        if (!isHandMode) onSelect(element.id, e.shiftKey);
      }}
      onMouseDown={(e) => {
        if (!isFillMode) {
             // If clicking border or in hand mode
             onMouseDown(e, element.id);
        }
      }}
    >
      {/* --- Action Toolbar (Mini Right) --- */}
      {showToolbar && (
        <div className="absolute -top-7 right-0 flex items-center gap-0.5 bg-white border border-slate-300 rounded shadow-sm px-1 py-0.5 no-print z-[60]">
           {/* Move Handle */}
           <div
            className="cursor-move p-0.5 hover:bg-slate-100 rounded text-slate-500 active:text-blue-600"
            onMouseDown={(e) => {
                e.stopPropagation(); 
                onMouseDown(e, element.id);
            }}
            title="Mover"
          >
            <GripVertical size={12} />
          </div>
          
          <div className="h-3 w-px bg-slate-200 mx-0.5"></div>
          
          {/* Info / Dimensions Toggle */}
          <div className="relative">
              <button 
                className="p-0.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded flex items-center justify-center"
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                title="Ver dimensiones"
              >
                  <Info size={12} />
              </button>
              
              {/* Dimensions Badge (Shown on Hover/Click) */}
              {showInfo && (
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap z-[70] shadow-md pointer-events-none">
                     {Math.round(element.width)}x{Math.round(element.height)}
                  </div>
              )}
          </div>

          <div className="h-3 w-px bg-slate-200 mx-0.5"></div>
          
          {/* Duplicate */}
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(element.id); }}
            className="p-0.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded"
            title="Duplicar"
          >
            <Copy size={12} />
          </button>
          
          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
            className="p-0.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded"
            title="Eliminar"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {/* --- The Text Input --- */}
      <textarea
        ref={textareaRef}
        value={element.text}
        disabled={isHandMode}
        onChange={(e) => onChange(element.id, { text: e.target.value })}
        // IMPORTANTE: stopPropagation en onDrop para que el navegador maneje el drop dentro del textarea
        // en lugar de que lo maneje el contenedor padre (App.tsx) creando un nuevo elemento.
        onDrop={(e) => e.stopPropagation()}
        className={`w-full bg-transparent outline-none resize-none overflow-hidden
          ${isHandMode ? 'cursor-grab select-none pointer-events-none' : 'cursor-text'}
          ${isFillMode ? 'bg-transparent' : ''}
        `}
        style={{
          fontSize: `${element.fontSize}px`,
          lineHeight: element.lineHeight || 1.1,
          fontWeight: element.isBold ? 'bold' : 'normal',
          fontStyle: element.isItalic ? 'italic' : 'normal',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'left',
          color: '#000',
          padding: 0,
          paddingLeft: `${element.indent || 0}px`,
          margin: 0,
          border: 'none',
          height: 'auto', 
          maxHeight: '100%'
        }}
        placeholder={isSelected ? "" : (element.placeholder || "")}
        spellCheck={false}
        onFocus={() => !isHandMode && onRecordHistory()}
      />

      {/* --- Resize Handle (Bottom Right Corner) --- */}
      {showToolbar && (
        <div
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border border-blue-500 rounded-full shadow cursor-nwse-resize flex items-center justify-center z-50 no-print hover:bg-blue-50"
          onMouseDown={handleResize}
          title="Redimensionar"
        >
          <MoveDiagonal size={10} className="text-blue-600" />
        </div>
      )}
    </div>
  );
};