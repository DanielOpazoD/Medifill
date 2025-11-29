
import React, { useRef, useEffect, useState } from 'react';
import { TextElement } from '../types';
import { GripVertical, Trash2 } from 'lucide-react';

interface DraggableInputProps {
  element: TextElement;
  isSelected: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onChange: (id: string, updates: Partial<TextElement>) => void;
  onDelete: (id: string) => void;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onRecordHistory: () => void;
}

export const DraggableInput: React.FC<DraggableInputProps> = ({
  element,
  isSelected,
  scale,
  onSelect,
  onChange,
  onDelete,
  onMouseDown,
  onRecordHistory
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Auto-resize height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [element.text, element.fontSize, element.width]);

  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Record history before resize starts
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

  // Determine if we should show the "empty field" visual cue
  const isPlaceholderMode = !element.text && !isSelected;

  return (
    <div
      className={`absolute group ${isSelected ? 'z-50' : 'z-10'}`}
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        transform: 'translate(0, 0)', // Fix for some rendering contexts
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element.id);
      }}
    >
      {/* Controls - Only visible when selected and NOT printing */}
      {isSelected && (
        <div className="absolute -top-8 left-0 flex items-center gap-1 bg-white border border-gray-300 rounded shadow-sm px-1 py-0.5 no-print z-50">
           {/* Drag Handle */}
           <div
            className="cursor-move p-1 hover:bg-gray-100 rounded text-gray-500"
            onMouseDown={(e) => onMouseDown(e, element.id)}
          >
            <GripVertical size={14} />
          </div>
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
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
      <div className={`relative transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1 rounded bg-blue-50/10' : ''}
        ${isPlaceholderMode ? 'border border-dashed border-gray-400 bg-yellow-50/20 hover:bg-yellow-100/40' : 'hover:ring-1 hover:ring-gray-300/50 hover:bg-gray-50/10'}
        print:border-none print:bg-transparent print:ring-0
      `}>
        <textarea
          ref={textareaRef}
          value={element.text}
          onChange={(e) => onChange(element.id, { text: e.target.value })}
          className="w-full bg-transparent resize-none outline-none overflow-hidden px-1 py-0.5 block placeholder:text-gray-400/70 print:placeholder:text-transparent"
          style={{
            fontSize: `${element.fontSize}px`,
            fontWeight: element.isBold ? 'bold' : 'normal',
            fontStyle: element.isItalic ? 'italic' : 'normal',
            lineHeight: '1.2', // Increased slightly for better breathing room
            minHeight: '1.2em',
            fontFamily: 'Arial, sans-serif' // Standard medical form font
          }}
          placeholder={element.placeholder || (isSelected ? "Escriba..." : "")}
          spellCheck={false}
          onFocus={() => {
            setIsEditing(true);
            // We record history on focus so if they change text, we have a save point.
            // If they don't change anything, undo/redo is harmlessly idempotent.
            onRecordHistory(); 
          }}
          onBlur={() => setIsEditing(false)}
        />
        
        {/* Resize Handle */}
        {isSelected && (
          <div
            className="absolute -right-1.5 bottom-1/2 translate-y-1/2 w-3 h-8 bg-blue-400 rounded-full cursor-e-resize flex items-center justify-center opacity-75 hover:opacity-100 no-print"
            onMouseDown={handleResize}
            title="Arrastrar para cambiar ancho"
          >
            <div className="w-0.5 h-4 bg-white rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
