export interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  width: number; // width in pixels
  height: number; // height in pixels
}

export interface Page {
  id: string;
  imageUrl: string;
  elements: TextElement[];
}

export interface FormState {
  pages: Page[];
}