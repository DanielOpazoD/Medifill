import React, { useRef, useEffect } from 'react';
import { TextElement, ToolType } from '../types';
import { GripVertical, Trash2, Copy, MoveDiagonal, Ruler } from 'lucide-react';

interface DraggableInputProps {
  element: TextElement;
  isSelected: boolean;
  scale: number;
  activeTool: ToolType;
  onSelect: (id: string) => void;
  onChange: (id: string, updates: Partial<TextElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onRecordHistory: () => void;
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
  onRecordHistory
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isHandMode = activeTool === 'hand';

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

      const newWidth = Math.max(20, startWidth + deltaX);
      const newHeight = Math.max(element.fontSize, startHeight + deltaY);

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
  
  // The outer container determines position and size.
  // It uses Flexbox to vertically CENTER the text content.
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
    cursor: isHandMode ? 'grab' : 'text',
    pointerEvents: 'auto',
  };

  return (
    <div
      className={`group absolute 
        ${isSelected ? 'border-2 border-blue-600 z-50' : 'border-2 border-dashed border-blue-300/70 hover:border-blue-400 z-10'}
        print:border-none transition-colors
      `}
      style={containerStyle}
      onClick={(e) => {
        e.stopPropagation();
        if (!isHandMode) onSelect(element.id);
      }}
      onMouseDown={(e) => {
        // If in hand mode, or clicking the border (not text), we drag
        if (isHandMode) {
           onMouseDown(e, element.id);
        }
      }}
    >
      {/* --- Action Toolbar (Move, Copy, Delete, Dimensions) --- */}
      {/* Visible only when selected and NOT printing */}
      {isSelected && !isHandMode && (
        <div className="absolute -top-9 left-0 flex items-center gap-1 bg-white border border-slate-300 rounded shadow-lg px-2 py-1 no-print z-[60]">
           {/* Move Handle */}
           <div
            className="cursor-move p-1 hover:bg-slate-100 rounded text-slate-600 active:text-blue-600"
            onMouseDown={(e) => {
                e.stopPropagation(); 
                onMouseDown(e, element.id);
            }}
            title="Mover"
          >
            <GripVertical size={16} />
          </div>
          
          <div className="h-4 w-px bg-slate-200"></div>
          
          {/* Dimensions Badge */}
          <div className="flex items-center gap-1 px-1 text-[10px] font-mono text-slate-500 select-none cursor-default" title="Dimensiones actuales">
            <span className="font-bold">{Math.round(element.width)}</span>
            <span className="text-slate-300">x</span>
            <span className="font-bold">{Math.round(element.height)}</span>
          </div>

          <div className="h-4 w-px bg-slate-200"></div>
          
          {/* Duplicate */}
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(element.id); }}
            className="p-1 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded"
            title="Duplicar"
          >
            <Copy size={16} />
          </button>
          
          <div className="h-4 w-px bg-slate-200"></div>
          
          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
            className="p-1 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* --- The Text Input --- */}
      <textarea
        ref={textareaRef}
        value={element.text}
        disabled={isHandMode}
        onChange={(e) => onChange(element.id, { text: e.target.value })}
        className={`w-full bg-transparent outline-none resize-none overflow-hidden
          ${isHandMode ? 'cursor-grab select-none pointer-events-none' : 'cursor-text'}
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
          margin: 0,
          border: 'none',
          // Crucial for vertical centering in flex container:
          height: 'auto', 
          maxHeight: '100%'
        }}
        placeholder={isSelected ? "" : (element.placeholder || "")}
        spellCheck={false}
        onFocus={() => !isHandMode && onRecordHistory()}
      />

      {/* --- Resize Handle (Bottom Right Corner) --- */}
      {isSelected && !isHandMode && (
        <div
          className="absolute -bottom-2 -right-2 w-6 h-6 bg-white border border-blue-500 rounded-full shadow cursor-nwse-resize flex items-center justify-center z-50 no-print hover:bg-blue-50"
          onMouseDown={handleResize}
          title="Redimensionar (Ancho y Alto)"
        >
          <MoveDiagonal size={14} className="text-blue-600" />
        </div>
      )}
    </div>
  );
};