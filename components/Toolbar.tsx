import React, { useRef } from 'react';
import { Upload, Printer, Download, FileJson, Type, Bold, Italic, Trash2, RotateCcw, ZoomIn, ZoomOut, LayoutTemplate } from 'lucide-react';
import { TextElement } from '../types';
import { TEMPLATES } from '../templates';

interface ToolbarProps {
  onUpload: (files: FileList) => void;
  onPrint: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClear: () => void;
  onLoadTemplate: (templateId: string) => void;
  selectedElement: TextElement | null;
  onUpdateStyle: (style: Partial<TextElement>) => void;
  onDeleteSelected: () => void;
  hasPages: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onUpload,
  onPrint,
  onExport,
  onImport,
  onClear,
  onLoadTemplate,
  selectedElement,
  onUpdateStyle,
  onDeleteSelected,
  hasPages,
  zoom,
  onZoomChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
    // Reset to allow re-uploading same file
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  const handleZoomIn = () => onZoomChange(Math.min(zoom + 0.1, 3.0));
  const handleZoomOut = () => onZoomChange(Math.max(zoom - 0.1, 0.25));

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 no-print">
      
      {/* Left Group: File Operations */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-gray-800 mr-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white p-1 rounded">MF</span> MediFill
        </h1>
        
        {/* Templates Dropdown */}
        <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded transition text-sm font-medium border border-indigo-200">
                <LayoutTemplate size={16} />
                <span className="hidden sm:inline">Plantillas</span>
            </button>
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block z-50">
                {TEMPLATES.map(template => (
                  <button 
                      key={template.id}
                      onClick={() => onLoadTemplate(template.id)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-100 last:border-0"
                  >
                      {template.name}
                  </button>
                ))}
            </div>
        </div>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <input
          type="file"
          accept="image/png, image/jpeg"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
          title="Cargar imágenes desde tu PC"
        >
          <Upload size={16} />
          <span className="hidden md:inline">{hasPages ? "Agregar" : "Subir Imágenes"}</span>
        </button>

        {hasPages && (
            <button
                onClick={onClear}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded transition text-sm font-medium border border-transparent hover:border-red-100"
                title="Borrar todas las páginas"
            >
                <RotateCcw size={16} />
            </button>
        )}

        <input
            type="file"
            accept=".json"
            className="hidden"
            ref={jsonInputRef}
            onChange={handleImportChange}
        />
        
        <div className="flex bg-gray-100 rounded p-1 gap-1 ml-2">
            <button
            onClick={() => jsonInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-white hover:shadow-sm rounded transition text-sm"
            title="Importar indicación guardada"
            >
            <FileJson size={16} />
            <span className="hidden sm:inline">Importar</span>
            </button>
            <button
            onClick={onExport}
            disabled={!hasPages}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-white hover:shadow-sm rounded transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Guardar indicación"
            >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar</span>
            </button>
        </div>
      </div>

      {/* Middle Group: Zoom & Style */}
      <div className="flex items-center gap-4">
        {/* Zoom Controls */}
        <div className="flex items-center bg-gray-100 rounded p-1 gap-1">
          <button 
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 disabled:opacity-30"
            disabled={zoom <= 0.25}
            title="Reducir Zoom"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-medium w-12 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 disabled:opacity-30"
            disabled={zoom >= 3.0}
            title="Aumentar Zoom"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        {/* Text Styling (only if selected) */}
        <div className={`flex items-center gap-3 transition-opacity duration-200 ${selectedElement ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
              <button
                  onClick={() => onUpdateStyle({ isBold: !selectedElement?.isBold })}
                  className={`p-1.5 rounded transition ${selectedElement?.isBold ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                  title="Negrita"
              >
                  <Bold size={16} />
              </button>
              <button
                  onClick={() => onUpdateStyle({ isItalic: !selectedElement?.isItalic })}
                  className={`p-1.5 rounded transition ${selectedElement?.isItalic ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                  title="Cursiva"
              >
                  <Italic size={16} />
              </button>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1">
              <Type size={16} className="text-gray-500" />
              <input 
                  type="number" 
                  min="8" 
                  max="72" 
                  value={selectedElement?.fontSize || 27}
                  onChange={(e) => onUpdateStyle({ fontSize: parseInt(e.target.value) || 27 })}
                  className="w-12 bg-transparent text-center text-sm outline-none"
                  title="Tamaño de fuente"
              />
              <span className="text-xs text-gray-500">px</span>
          </div>

          <button 
              onClick={onDeleteSelected}
              className="p-2 text-red-500 hover:bg-red-50 rounded transition"
              title="Eliminar texto seleccionado"
          >
              <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Right Group: Print */}
      <div className="flex items-center">
        <button
          onClick={onPrint}
          disabled={!hasPages}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer size={18} />
          Imprimir
        </button>
      </div>
    </div>
  );
};