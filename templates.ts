
import { TemplateConfig } from './types';

// Las coordenadas son estimadas basadas en diseños estándar. 
// Puedes ajustar 'x', 'y', 'width', y 'fontSize' para que coincidan con tus PNGs perfectamente.

// NOTA: En Netlify/Vite, los archivos en la carpeta 'public' se sirven desde la raíz automáticamente.
// Si tus imágenes están en 'public/', debes referenciarlas como '/filename.png'.

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'hospitalizado',
    name: 'Indicaciones Hospitalizado',
    pages: [
      {
        filename: '/p1.png',
        // Page 1: Limpia, sin elementos predefinidos
        elements: []
      },
      {
        filename: '/p2.png',
        // Page 2: Limpia, sin elementos predefinidos
        elements: []
      }
    ]
  }
];