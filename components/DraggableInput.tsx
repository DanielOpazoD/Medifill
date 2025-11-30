import React, { useRef, useEffect, useState } from 'react';
import { TextElement, ToolType } from '../types';
import { GripVertical, Trash2, Copy } from 'lucide-react';

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
  const [isEditing, setIsEditing] = useState(false);

  // Auto-resize height based on content to ensure no white space
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Ajuste estricto: scrollHeight da la altura exacta del contenido
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [element.text, element.fontSize, element.width, element.lineHeight]);

  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRecordHistory();
    
    const startX = e.clientX;
    const startWidth = element.width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX) / scale);
      onChange(element.id, { width: newWidth });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const isPlaceholderMode = !element.text && !isSelected;
  const isHandMode = activeTool === 'hand';

  // Styles for the container
  const containerStyle: React.CSSProperties = {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    transform: 'translate(0, 0)', 
    cursor: isHandMode ? 'grab' : 'text',
    pointerEvents: activeTool === 'text' ? 'none' : 'auto', 
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start', // Align to top to avoid vertical drift
  };

  return (
    <div
      className={`absolute group flex flex-col ${isSelected ? 'z-50' : 'z-10'}`}
      style={containerStyle}
      onClick={(e) => {
        e.stopPropagation();
        if (!isHandMode) {
           onSelect(element.id);
        }
      }}
      onMouseDown={(e) => {
        if (isHandMode) {
          onMouseDown(e, element.id);
        }
      }}
    >
      {/* Controls - Only visible when selected and NOT printing */}
      {isSelected && !isHandMode && (
        <div 
            className="absolute -top-9 flex items-center gap-1 bg-white border border-gray-300 rounded shadow-sm px-1 py-0.5 no-print z-50 select-none"
            style={{ left: '0px' }}
        >
           {/* Drag Handle */}
           <div
            className="cursor-move p-1 hover:bg-gray-100 rounded text-gray-500"
            onMouseDown={(e) => onMouseDown(e, element.id)}
            title="Mover"
          >
            <GripVertical size={14} />
          </div>
          
          <div className="h-4 w-px bg-gray-300 mx-0.5"></div>
          
          {/* Duplicate Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(element.id);
            }}
            className="p-1 hover:bg-blue-50 text-blue-500 rounded"
            title="Duplicar (Ctrl+D)"
          >
            <Copy size={14} />
          </button>

          <div className="h-4 w-px bg-gray-300 mx-0.5"></div>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
            className="p-1 hover:bg-red-50 text-red-500 rounded"
            title="Eliminar campo"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* The Text Input Area */}
      <div className={`relative transition-all duration-200 w-full
        ${isSelected ? 'ring-1 ring-blue-400 bg-blue-50/5' : ''}
        ${isPlaceholderMode ? 'border border-dashed border-gray-400 bg-yellow-50/20' : isHandMode ? 'hover:bg-blue-100/10 hover:ring-1 hover:ring-blue-200/50' : 'hover:ring-1 hover:ring-gray-300/50 hover:bg-gray-50/10'}
        print:border-none print:bg-transparent print:ring-0
      `}>
        <textarea
          ref={textareaRef}
          value={element.text}
          readOnly={isHandMode} 
          disabled={isHandMode}
          onChange={(e) => onChange(element.id, { text: e.target.value })}
          className={`w-full bg-transparent resize-none outline-none overflow-hidden block placeholder:text-gray-400/70 print:placeholder:text-transparent
             ${isHandMode ? 'cursor-grab pointer-events-none select-none' : 'cursor-text'}
          `}
          style={{
            fontSize: `${element.fontSize}px`,
            fontWeight: element.isBold ? 'bold' : 'normal',
            fontStyle: element.isItalic ? 'italic' : 'normal',
            // Default line-height set to 1.1 for tight fit without cutting off descenders
            lineHeight: element.lineHeight || 1.1, 
            padding: 0, 
            margin: 0,
            border: 'none',
            fontFamily: 'Arial, sans-serif',
            textAlign: 'left',
            display: 'block',
            // Ensure no extra whitespace
            verticalAlign: 'top',
          }}
          placeholder={element.placeholder || (isSelected ? "..." : "")}
          spellCheck={false}
          onFocus={() => {
            if (!isHandMode) {
                setIsEditing(true);
                onRecordHistory();
            }
          }}
          onBlur={() => setIsEditing(false)}
        />
        
        {/* Resize Handle */}
        {isSelected && !isHandMode && (
          <div
            className="absolute -right-1.5 bottom-1/2 translate-y-1/2 w-3 h-6 bg-blue-400 rounded-full cursor-e-resize flex items-center justify-center opacity-75 hover:opacity-100 no-print shadow-sm z-50"
            onMouseDown={handleResize}
            title="Arrastrar para cambiar ancho"
          >
            <div className="w-0.5 h-3 bg-white rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};