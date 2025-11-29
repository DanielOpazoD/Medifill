
import { TemplateConfig } from './types';

// Las coordenadas son estimadas.
// Las rutas apuntan a /templates/ filename, asumiendo que existen en public/templates/

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'hospitalizado',
    name: 'Indicaciones Hospitalizado',
    pages: [
      {
        filename: '/templates/p1.png',
        // Page 1: Limpia
        elements: []
      },
      {
        filename: '/templates/p2.png',
        // Page 2: Limpia
        elements: []
      }
    ]
  }
];
