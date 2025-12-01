import React, { useRef, useState, useEffect } from 'react';
import { Upload, Printer, Download, FileJson, Bold, Italic, Trash2, RotateCcw, RotateCw, ZoomIn, ZoomOut, Minus, Plus, FilePlus, Hand, MousePointer2, Type as TypeIcon, CaseUpper, Settings, X, Eraser, PenLine, Eye, BookOpen, Indent, ChevronDown } from 'lucide-react';
import { TextElement, ToolType, DefaultSettings } from '../types';
import { TEMPLATES } from '../templates';

interface ToolbarProps {
  onUpload: (files: FileList) => void;
  onPrint: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClear: () => void;
  onLoadTemplate: (templateId: string) => void;
  selectedElements: TextElement[];
  onUpdateStyle: (style: Partial<TextElement>) => void;
  onDeleteSelected: () => void;
  onClearTextSelected: () => void;
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
  onGlobalIndentChange: (delta: number) => void;
  defaultSettings: DefaultSettings;
  onUpdateDefaultSettings: (settings: DefaultSettings) => void;
  isFillMode: boolean;
  onToggleFillMode: () => void;
  showSnippets: boolean;
  onToggleSnippets: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onUpload,
  onPrint,
  onExport,
  onImport,
  onClear,
  onLoadTemplate,
  selectedElements,
  onUpdateStyle,
  onDeleteSelected,
  onClearTextSelected,
  hasPages,
  zoom,
  onZoomChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  activeTool,
  onToolChange,
  onGlobalFontSizeChange,
  onGlobalIndentChange,
  defaultSettings,
  onUpdateDefaultSettings,
  isFillMode,
  onToggleFillMode,
  showSnippets,
  onToggleSnippets
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  
  // States for menus
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Determine values from selection
  const firstSelected = selectedElements[0];
  const isMultiple = selectedElements.length > 1;
  const currentFontSize = firstSelected ? firstSelected.fontSize : defaultSettings.fontSize;
  
  // Handlers for manual inputs
  const handleManualResize = (dim: 'width' | 'height', val: number) => {
      onUpdateStyle({ [dim]: val });
  };

  // Separador vertical
  const Divider = () => <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block"></div>;

  // Botón genérico de la barra
  const ToolButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    isActive = false, 
    title, 
    disabled = false,
    className = "",
    showLabel = true 
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-all
        ${isActive 
            ? 'bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-200' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <Icon size={18} />
      {showLabel && label && <span className="hidden xl:inline">{label}</span>}
    </button>
  );

  return (
    <div className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm px-3 py-2 flex flex-wrap items-center gap-y-2 sticky top-0 z-50 no-print transition-all justify-between">
      
      {/* ================= SECCIÓN IZQUIERDA: ARCHIVO Y GENERAL ================= */}
      <div className="flex items-center gap-1">
        
        {/* Logo & Templates Menu */}
        <div className="relative mr-2 pr-2 border-r border-slate-200" ref={templateMenuRef}>
             <button 
                onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                className="flex items-center gap-2 select-none hover:bg-slate-100 p-1 rounded-lg transition-colors"
                title="Menú de Plantillas"
             >
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-1.5 rounded-md shadow-sm">
                    <FilePlus size={18} />
                </div>
                <div className="flex flex-col items-start leading-none">
                    <span className="text-lg font-bold text-slate-800 tracking-tight hidden 2xl:inline">MediFill</span>
                    <span className="text-[9px] text-slate-400 font-semibold hidden 2xl:inline flex items-center gap-0.5">
                       PLANTILLAS <ChevronDown size={8}/>
                    </span>
                </div>
             </button>

             {isTemplateMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Disponibles</div>
                    {TEMPLATES.map(template => (
                    <button 
                        key={template.id}
                        onClick={() => {
                            onLoadTemplate(template.id);
                            setIsTemplateMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-slate-700 rounded-md transition-colors"
                    >
                        {template.name}
                    </button>
                    ))}
                </div>
            )}
        </div>

        {/* Modo Toggle */}
        <button 
             onClick={onToggleFillMode}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border mr-2 ${
                 isFillMode 
                 ? 'bg-green-100 text-green-700 border-green-300 ring-2 ring-green-100' 
                 : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
             }`}
             title={isFillMode ? "Volver a modo edición" : "Cambiar a modo solo rellenar"}
        >
            {isFillMode ? <PenLine size={14} /> : <Eye size={14} />}
            {isFillMode ? "MODO RELLENAR" : "MODO EDICIÓN"}
        </button>

        {/* Undo/Redo (Available in both modes) */}
        <div className="flex items-center gap-1 ml-0 mr-2 border-r border-slate-200 pr-2">
            <button onClick={onUndo} disabled={!canUndo} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30 transition-all" title="Deshacer (Ctrl+Z)">
                <RotateCcw size={18} />
            </button>
            <button onClick={onRedo} disabled={!canRedo} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30 transition-all" title="Rehacer (Ctrl+Y)">
                <RotateCw size={18} />
            </button>
        </div>

        {!isFillMode && (
          <>
            {/* --- GRUPO: ARCHIVO --- */}
            <div className="flex items-center gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                {/* Upload */}
                <input type="file" accept="image/png, image/jpeg" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <ToolButton 
                    icon={Upload} 
                    label="IMG" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="hover:text-blue-600"
                />

                {/* Import / Export */}
                <div className="w-px h-5 bg-slate-200 mx-1"></div>
                
                <input type="file" accept=".json" className="hidden" ref={jsonInputRef} onChange={handleImportChange} />
                <ToolButton icon={FileJson} label="Cargar" onClick={() => jsonInputRef.current?.click()} title="Importar archivo JSON" />
                <ToolButton icon={Download} label="Guardar" onClick={onExport} disabled={!hasPages} title="Guardar progreso como JSON" />
            </div>

            {hasPages && (
                <button
                    onClick={onClear}
                    className="ml-2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Borrar todas las páginas"
                >
                    <Trash2 size={18} />
                </button>
            )}

            <Divider />

            {/* --- GRUPO: HERRAMIENTAS DE EDICIÓN --- */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 border border-slate-200">
                <button 
                    onClick={() => onToolChange('select')} 
                    className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${activeTool === 'select' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Seleccionar"
                >
                    <MousePointer2 size={18} />
                </button>
                <button 
                    onClick={() => onToolChange('hand')} 
                    className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${activeTool === 'hand' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Mover lienzo"
                >
                    <Hand size={18} />
                </button>
                <button 
                    onClick={() => onToolChange('text')} 
                    className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${activeTool === 'text' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Texto (Crear cuadros)"
                >
                    <TypeIcon size={18} />
                    <span className="hidden lg:inline">Texto</span>
                </button>
            </div>
            
            {/* Divider for New Features */}
             <div className="w-px h-5 bg-slate-300 mx-2"></div>
          </>
        )}

        {/* Snippets Toggle (Ahora disponible siempre) */}
        <button
            onClick={onToggleSnippets}
            className={`p-1.5 rounded-md transition-all ml-1 ${showSnippets ? 'bg-purple-100 text-purple-600 ring-1 ring-purple-200' : 'text-slate-500 hover:bg-slate-100'}`}
            title="Frases Rápidas (Snippets)"
        >
            <BookOpen size={18} />
        </button>

      </div>

      {/* ================= SECCIÓN CENTRAL: CONTEXTUAL (SOLO SI HAY SELECCIÓN) ================= */}
      {!isFillMode && selectedElements.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 bg-white shadow-lg border border-slate-200 rounded-lg px-3 py-1.5 absolute left-1/2 -translate-x-1/2 top-14 md:top-auto md:relative md:left-auto md:translate-x-0 md:shadow-none md:border-none md:bg-transparent z-50">
             
              {/* Dimensions */}
              <div className="flex items-center gap-1 bg-slate-50 rounded-md px-2 py-1 border border-slate-200 text-xs text-slate-600">
                    <span className="font-bold mr-1">{isMultiple ? 'Multi' : 'Dim'}:</span>
                    <input 
                        type="number" 
                        value={isMultiple ? '' : Math.round(firstSelected?.width || 0)}
                        onChange={(e) => handleManualResize('width', parseInt(e.target.value))}
                        className="w-12 bg-white border border-slate-300 rounded px-1 py-0.5 text-center focus:border-blue-500 outline-none"
                        title="Ancho (px)"
                    />
                    <span className="text-slate-400">x</span>
                    <input 
                        type="number" 
                        value={isMultiple ? '' : Math.round(firstSelected?.height || 0)}
                        onChange={(e) => handleManualResize('height', parseInt(e.target.value))}
                        className="w-12 bg-white border border-slate-300 rounded px-1 py-0.5 text-center focus:border-blue-500 outline-none"
                        title="Alto (px)"
                    />
              </div>

              {/* Style Toggles */}
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                      onClick={() => onUpdateStyle({ isBold: !firstSelected?.isBold })}
                      className={`p-1.5 rounded transition-all ${firstSelected?.isBold ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}
                      title="Negrita"
                  >
                      <Bold size={16} />
                  </button>
                  <button
                      onClick={() => onUpdateStyle({ isItalic: !firstSelected?.isItalic })}
                      className={`p-1.5 rounded transition-all ${firstSelected?.isItalic ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}
                      title="Cursiva"
                  >
                      <Italic size={16} />
                  </button>
              </div>

              {/* Font Size */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1 border border-slate-200">
                  <TypeIcon size={14} className="text-slate-400" />
                  <input 
                      type="number" min="8" max="72" 
                      value={currentFontSize}
                      onChange={(e) => onUpdateStyle({ fontSize: parseInt(e.target.value) || 27 })}
                      className="w-10 bg-transparent text-center text-sm font-bold text-slate-700 outline-none"
                      title="Tamaño de letra"
                  />
              </div>

              {/* Actions */}
              <div className="w-px h-5 bg-slate-300 mx-1"></div>
              
              <button 
                onClick={onClearTextSelected} 
                className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors flex items-center gap-1"
                title="Borrar solo el texto"
              >
                  <Eraser size={16} />
              </button>

              <button onClick={onDeleteSelected} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors" title="Eliminar cuadro">
                  <Trash2 size={16} />
              </button>
          </div>
      )}

      {/* ================= SECCIÓN DERECHA: VISTA Y SALIDA ================= */}
      <div className="flex items-center gap-2 ml-auto">
        
        {/* Global Config (Settings & Font) */}
        {!isFillMode && (
          <div className="flex items-center gap-1 mr-2">
             {/* Default Settings */}
             <div className="relative" ref={settingsRef}>
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`p-2 rounded-md transition-all ${isSettingsOpen ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                    title="Configuración por defecto"
                >
                    <Settings size={18} />
                </button>
                {isSettingsOpen && (
                    <div className="absolute top-full right-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-700">Configuración por defecto</h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Valores para nuevos cuadros de texto:</p>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1">Ancho (px)</label>
                                    <input type="number" value={defaultSettings.width} onChange={(e) => onUpdateDefaultSettings({...defaultSettings, width: parseInt(e.target.value) || 100})} className="w-full border border-slate-300 rounded px-2 py-1 text-sm"/>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1">Alto (px)</label>
                                    <input type="number" value={defaultSettings.height} onChange={(e) => onUpdateDefaultSettings({...defaultSettings, height: parseInt(e.target.value) || 20})} className="w-full border border-slate-300 rounded px-2 py-1 text-sm"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Tamaño letra (px)</label>
                                <input type="number" value={defaultSettings.fontSize} onChange={(e) => onUpdateDefaultSettings({...defaultSettings, fontSize: parseInt(e.target.value) || 12})} className="w-full border border-slate-300 rounded px-2 py-1 text-sm"/>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Global Font Size & Indent Adjuster */}
            <div className="flex items-center gap-1 bg-yellow-50 rounded-lg px-1 py-0.5 border border-yellow-200">
                <div className="flex items-center gap-0.5 pr-2 border-r border-yellow-200" title="Cambiar tamaño de letra a TODO el documento">
                    <div className="text-yellow-600 p-1"><CaseUpper size={16} /></div>
                    <button onClick={() => onGlobalFontSizeChange(-2)} className="p-1 hover:bg-white hover:text-yellow-700 rounded text-yellow-600 transition-colors"><Minus size={12} /></button>
                    <button onClick={() => onGlobalFontSizeChange(2)} className="p-1 hover:bg-white hover:text-yellow-700 rounded text-yellow-600 transition-colors"><Plus size={12} /></button>
                </div>
                <div className="flex items-center gap-0.5 pl-1" title="Cambiar sangría a TODO el documento">
                    <div className="text-indigo-600 p-1"><Indent size={16} /></div>
                    <button onClick={() => onGlobalIndentChange(-5)} className="p-1 hover:bg-white hover:text-indigo-700 rounded text-indigo-600 transition-colors"><Minus size={12} /></button>
                    <button onClick={() => onGlobalIndentChange(5)} className="p-1 hover:bg-white hover:text-indigo-700 rounded text-indigo-600 transition-colors"><Plus size={12} /></button>
                </div>
            </div>
          </div>
        )}

        {/* Zoom */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 disabled:opacity-30" disabled={zoom <= 0.25} title="Reducir zoom">
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-bold w-10 text-center text-slate-600 select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 disabled:opacity-30" disabled={zoom >= 3.0} title="Aumentar zoom">
            <ZoomIn size={16} />
          </button>
        </div>

        {/* Print Buttons Group */}
        <div className="flex items-center gap-1 ml-2">
            {/* Blue: Browser Print */}
            <button
            onClick={onPrint}
            disabled={!hasPages}
            className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            title="Imprimir"
            >
                <Printer size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};