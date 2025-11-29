
import { TemplateConfig } from './types';

// Coordinates are estimated based on standard layouts. 
// You can adjust 'x', 'y', 'width', and 'fontSize' to match your specific PNGs perfectly.

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'hospitalizado',
    name: 'Indicaciones Hospitalizado',
    pages: [
      {
        filename: 'p1.png',
        // Page 1: Planificación de cuidados (Tables)
        elements: [
           // Example: Date fields in the table header
           { x: 750, y: 45, width: 30, text: '', placeholder: 'DD', fontSize: 14 },
           { x: 800, y: 45, width: 30, text: '', placeholder: 'MM', fontSize: 14 },
           { x: 850, y: 45, width: 40, text: '', placeholder: 'AAAA', fontSize: 14 },
        ]
      },
      {
        filename: 'p2.png',
        // Page 2: Indicaciones Médicas (Header with patient info)
        elements: [
          // Row 1: Nombre and Edad
          { x: 120, y: 105, width: 500, text: '', placeholder: 'NOMBRE DEL PACIENTE', fontSize: 16, isBold: true },
          { x: 750, y: 105, width: 100, text: '', placeholder: 'Edad', fontSize: 16 }, // Edad

          // Row 2: RUT and Fecha Nacimiento
          { x: 120, y: 135, width: 200, text: '', placeholder: 'RUT', fontSize: 16 },
          { x: 550, y: 135, width: 200, text: '', placeholder: 'Fecha Nacimiento', fontSize: 16 }, // Fecha Nac

          // Row 3: Diagnostico
          { x: 120, y: 165, width: 600, text: '', placeholder: 'DIAGNÓSTICO', fontSize: 16 },
          
          // Row 4: Médico
          { x: 120, y: 195, width: 300, text: '', placeholder: 'Nombre Médico', fontSize: 16 },
          
          // Indicaciones (Body)
          { x: 40, y: 250, width: 800, text: '', placeholder: '1. Reposo...', fontSize: 18 },
        ]
      }
    ]
  }
];
