
import React, { useRef } from 'react';
import { TextElement, ToolType } from '../types';
import { GripVertical, Trash2, Copy, MoveDiagonal } from 'lucide-react';

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
      {/* --- Action Toolbar (Small Version) --- */}
      {showToolbar && (
        <div className="absolute -top-7 left-0 flex items-center gap-0.5 bg-white border border-slate-300 rounded shadow-sm px-1 py-0.5 no-print z-[60]">
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
          
          {/* Dimensions Badge (Tiny) */}
          <div className="flex items-center gap-0.5 px-0.5 text-[9px] font-mono text-slate-500 select-none cursor-default">
            <span className="font-bold">{Math.round(element.width)}</span>
            <span className="text-slate-300">x</span>
            <span className="font-bold">{Math.round(element.height)}</span>
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
