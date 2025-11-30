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
  
  // Update height to strictly fit content
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      // Reset height to auto to get correct scrollHeight for shrinkage
      el.style.height = 'auto';
      // Set height to exactly the content height
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [element.text, element.fontSize, element.width, element.lineHeight]);

  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRecordHistory();
    
    const startX = e.clientX;
    const startWidth = element.width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Allow resizing down to 20px for small adjustments
      const newWidth = Math.max(20, startWidth + (moveEvent.clientX - startX) / scale);
      onChange(element.id, { width: newWidth });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const isHandMode = activeTool === 'hand';

  // Container style: Absolute position, exact dimensions
  const containerStyle: React.CSSProperties = {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    position: 'absolute',
    cursor: isHandMode ? 'grab' : 'text',
    // Always allow pointer events to enable selecting/moving even in text tool mode
    pointerEvents: 'auto', 
    display: 'flex',
    flexDirection: 'column',
    zIndex: isSelected ? 50 : 10,
  };

  return (
    <div
      className="group"
      style={containerStyle}
      onClick={(e) => {
        e.stopPropagation();
        if (!isHandMode) {
           onSelect(element.id);
        }
      }}
      onMouseDown={(e) => {
        // If in hand mode, the whole box is a handle
        if (isHandMode) {
          onMouseDown(e, element.id);
        }
      }}
    >
      {/* Controls Overlay - Visible when selected and NOT printing */}
      {isSelected && !isHandMode && (
        <div 
            className="absolute -top-7 left-0 flex items-center gap-0.5 bg-white border border-gray-400 rounded shadow-md px-1 py-0.5 no-print z-[60] select-none h-6"
        >
           {/* Move Handle */}
           <div
            className="cursor-move p-0.5 hover:bg-gray-100 rounded text-gray-700 active:cursor-grabbing"
            onMouseDown={(e) => {
                e.stopPropagation(); // Prevent text creation on canvas
                onMouseDown(e, element.id); // Trigger drag
            }}
            title="Mover"
          >
            <GripVertical size={14} />
          </div>
          
          <div className="h-3 w-px bg-gray-300 mx-0.5"></div>
          
          {/* Duplicate */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(element.id);
            }}
            className="p-0.5 hover:bg-blue-50 text-blue-600 rounded"
            title="Duplicar"
          >
            <Copy size={14} />
          </button>

          <div className="h-3 w-px bg-gray-300 mx-0.5"></div>

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
            className="p-0.5 hover:bg-red-50 text-red-600 rounded"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Text Area Container */}
      <div className={`relative w-full
        ${isSelected ? 'ring-1 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300'}
        print:ring-0
      `}>
        <textarea
          ref={textareaRef}
          value={element.text}
          readOnly={isHandMode} 
          disabled={isHandMode}
          onChange={(e) => onChange(element.id, { text: e.target.value })}
          className={`w-full bg-transparent resize-none outline-none block overflow-hidden
             ${isHandMode ? 'cursor-grab pointer-events-none select-none' : 'cursor-text'}
          `}
          style={{
            fontSize: `${element.fontSize}px`,
            fontWeight: element.isBold ? 'bold' : 'normal',
            fontStyle: element.isItalic ? 'italic' : 'normal',
            // Tight line height to fit text exactly without extra space
            lineHeight: 1.0, 
            padding: 0, 
            margin: 0,
            border: 'none',
            fontFamily: 'Arial, sans-serif',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
          placeholder={isSelected ? "" : (element.placeholder || "")}
          spellCheck={false}
          onFocus={() => {
            if (!isHandMode) {
                onRecordHistory();
            }
          }}
        />
        
        {/* Resize Handle - Right Edge */}
        {isSelected && !isHandMode && (
          <div
            className="absolute -right-2 top-0 bottom-0 w-4 cursor-col-resize flex items-center justify-center group/handle no-print z-50"
            onMouseDown={handleResize}
            title="Ajustar ancho"
          >
            <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-sm group-hover/handle:h-full group-hover/handle:w-1 transition-all opacity-50 group-hover/handle:opacity-100" />
          </div>
        )}
      </div>
    </div>
  );
};