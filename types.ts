

export interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  placeholder?: string; // Optional text to show when empty
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  width: number; // width in pixels
  height: number; // height in pixels
  lineHeight?: number; // Line height multiplier (default 0.9)
}

export interface Page {
  id: string;
  imageUrl: string;
  elements: TextElement[];
}

export interface FormState {
  pages: Page[];
}

export interface TemplatePageConfig {
  filename: string;
  elements?: Partial<TextElement>[]; // Predefined elements (x, y, text, width, etc.)
}

export interface TemplateConfig {
  id: string;
  name: string;
  pages: TemplatePageConfig[];
}

export interface DefaultSettings {
  width: number;
  height: number;
  fontSize: number;
}

export interface Snippet {
  id: string;
  text: string;
  category: 'general' | 'medicamentos' | 'indicaciones' | 'personal';
  variants?: string[];
}

export type ToolType = 'select' | 'hand' | 'text';