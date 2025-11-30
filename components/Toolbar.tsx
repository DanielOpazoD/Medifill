
import React, { useRef } from 'react';
import { Upload, Printer, Download, FileJson, Type, Bold, Italic, Trash2, RotateCcw, RotateCw, ZoomIn, ZoomOut, LayoutTemplate, Minus, Plus, FilePlus, Hand, MousePointer2, Type as TypeIcon, CaseUpper } from 'lucide-react';
import { TextElement, ToolType } from '../types';
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
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onGlobalFontSizeChange: (delta: number) => void;
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
  onZoomChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  activeTool,
  onToolChange,
  onGlobalFontSizeChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
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

  const changeLineHeight = (delta: number) => {
    if (!selectedElement) return;
    const current = selectedElement.lineHeight || 1.0;
    const newValue = Math.max(0.5, Math.min(2.0, current + delta));
    onUpdateStyle({ lineHeight: Math.round(newValue * 10) / 10 });
  };

  const currentLineHeight = selectedElement?.lineHeight || 1.0;

  // Componente de separador vertical
  const Divider = () => <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>;

  return (
    <div className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm px-2 py-2 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50 no-print transition-all">
      
      {/* Brand & File Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-2 select-none">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-1.5 rounded-md shadow-sm">
            <FilePlus size={18} />
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight hidden 2xl:inline">MediFill</span>
        </div>
        
        {/* Templates */}
        <div className="relative group">
            <button className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-blue-600 rounded-md transition-all text-sm font-medium border border-slate-200 hover:border-blue-200 shadow-sm">
                <LayoutTemplate size={16} />
                <span className="hidden xl:inline">Plantillas</span>
            </button>
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl hidden group-hover:block z-50 p-1">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Disponibles</div>
                {TEMPLATES.map(template => (
                  <button 
                      key={template.id}
                      onClick={() => onLoadTemplate(template.id)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-slate-700 rounded-md transition-colors"
                  >
                      {template.name}
                  </button>
                ))}
            </div>
        </div>

        {/* Upload */}
        <input type="file" accept="image/png, image/jpeg" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-blue-600 rounded-md transition-all text-sm font-medium border border-slate-200 hover:border-blue-200 shadow-sm"
          title="Subir imágenes PNG"
        >
          <Upload size={16} />
          <span className="hidden xl:inline">{hasPages ? "Pág" : "Subir IMG"}</span>
        </button>

        {hasPages && (
            <button
                onClick={onClear}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Limpiar todo"
            >
                <Trash2 size={16} />
            </button>
        )}

        <Divider />

        {/* Tools */}
         <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 border border-slate-200">
          <button 
            onClick={() => onToolChange('select')} 
            className={`p-1.5 rounded-md transition-all flex items-center gap-1 ${activeTool === 'select' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="Herramienta Selección"
          >
            <MousePointer2 size={16} />
          </button>
          <button 
            onClick={() => onToolChange('hand')} 
            className={`p-1.5 rounded-md transition-all flex items-center gap-1 ${activeTool === 'hand' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="Herramienta Mano (Mover cuadros)"
          >
            <Hand size={16} />
          </button>
          <button 
            onClick={() => onToolChange('text')} 
            className={`p-1.5 rounded-md transition-all flex items-center gap-1 ${activeTool === 'text' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="Herramienta Texto (Crear)"
          >
            <TypeIcon size={16} />
            <span className="text-xs font-bold hidden sm:inline">Texto</span>
          </button>
        </div>

        <Divider />

        {/* Undo/Redo */}
        <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
          <button onClick={onUndo} disabled={!canUndo} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 disabled:opacity-30 transition-all">
            <RotateCcw size={16} />
          </button>
          <button onClick={onRedo} disabled={!canRedo} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 disabled:opacity-30 transition-all">
            <RotateCw size={16} />
          </button>
        </div>
        
        {/* Global Font Size */}
        <div className="flex items-center gap-1 bg-yellow-50 rounded-lg px-1 py-0.5 border border-yellow-200 ml-1" title="Cambiar tamaño de letra a TODO el documento">
            <div className="text-yellow-600 p-1"><CaseUpper size={14} /></div>
             <button onClick={() => onGlobalFontSizeChange(-2)} className="p-1 hover:bg-white hover:text-yellow-700 rounded text-yellow-600 transition-colors">
                 <Minus size={12} />
             </button>
             <span className="text-[10px] font-bold text-yellow-700 uppercase leading-none px-1">Global</span>
             <button onClick={() => onGlobalFontSizeChange(2)} className="p-1 hover:bg-white hover:text-yellow-700 rounded text-yellow-600 transition-colors">
                 <Plus size={12} />
             </button>
        </div>

        <Divider />
        
        {/* Import/Export */}
        <div className="flex gap-1">
            <input type="file" accept=".json" className="hidden" ref={jsonInputRef} onChange={handleImportChange} />
            <button onClick={() => jsonInputRef.current?.click()} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors" title="Importar JSON">
                <FileJson size={18} />
            </button>
            <button onClick={onExport} disabled={!hasPages} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-30" title="Guardar JSON">
                <Download size={18} />
            </button>
        </div>
      </div>

      {/* Center: Style Controls */}
      <div className={`flex items-center gap-2 transition-all duration-300 ${selectedElement ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-1 pointer-events-none grayscale'}`}>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                  onClick={() => onUpdateStyle({ isBold: !selectedElement?.isBold })}
                  className={`p-1.5 rounded-md transition-all ${selectedElement?.isBold ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Bold size={16} />
              </button>
              <button
                  onClick={() => onUpdateStyle({ isItalic: !selectedElement?.isItalic })}
                  className={`p-1.5 rounded-md transition-all ${selectedElement?.isItalic ? 'bg-white shadow text-blue-600 italic' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Italic size={16} />
              </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1 border border-slate-200">
              <Type size={16} className="text-slate-400" />
              <input 
                  type="number" min="8" max="72" 
                  value={selectedElement?.fontSize || 27}
                  onChange={(e) => onUpdateStyle({ fontSize: parseInt(e.target.value) || 27 })}
                  className="w-8 bg-transparent text-center text-sm font-medium text-slate-700 outline-none"
              />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-1 py-1 border border-slate-200" title="Altura de línea">
             <button onClick={() => changeLineHeight(-0.1)} className="p-1 hover:bg-white hover:text-blue-600 rounded text-slate-500 transition-colors" disabled={currentLineHeight <= 0.5}>
                 <Minus size={14} />
             </button>
             <span className="text-xs font-semibold w-8 text-center text-slate-700">
                {Math.round(currentLineHeight * 100)}%
             </span>
             <button onClick={() => changeLineHeight(0.1)} className="p-1 hover:bg-white hover:text-blue-600 rounded text-slate-500 transition-colors" disabled={currentLineHeight >= 2.0}>
                 <Plus size={14} />
             </button>
          </div>

          <button onClick={onDeleteSelected} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
              <Trash2 size={16} />
          </button>
      </div>

      {/* Right: Print & Zoom */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 disabled:opacity-30" disabled={zoom <= 0.25}>
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-semibold w-10 text-center text-slate-600 select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 disabled:opacity-30" disabled={zoom >= 3.0}>
            <ZoomIn size={16} />
          </button>
        </div>

        <button
          onClick={onPrint}
          disabled={!hasPages}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <Printer size={18} />
          <span className="hidden sm:inline">Imprimir</span>
        </button>
      </div>
    </div>
  );
};
