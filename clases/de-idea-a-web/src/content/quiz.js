/* ════════════════════════════════════════════════════════════════
   QUIZ — 5 preguntas con retroalimentación inmediata.
   · correct: índice (0–3) de la opción correcta.
   · review: id del capítulo que se sugiere repasar si se falla.
   No se guarda ninguna respuesta.
   ════════════════════════════════════════════════════════════════ */

export const QUIZ = [
  {
    q: '¿Qué define principalmente HTML?',
    options: ['Los colores y las tipografías', 'La estructura: qué existe en la página', 'Las animaciones del servidor', 'Dónde se guardan los datos'],
    correct: 1,
    why: 'HTML define qué existe: títulos, textos, botones, imágenes. Es el esqueleto.',
    review: 'frontend',
  },
  {
    q: '¿Qué controla principalmente CSS?',
    options: ['Qué pasa al hacer clic', 'La dirección de la página', 'La apariencia: colores, tamaños y espacios', 'La base de datos'],
    correct: 2,
    why: 'CSS controla cómo se ve: colores, tipografía, tamaños y espacios.',
    review: 'frontend',
  },
  {
    q: '¿Qué es el frontend?',
    options: ['Lo que el usuario ve y con lo que interactúa', 'El servidor donde vive la web', 'El almacén de información', 'El proveedor de Internet'],
    correct: 0,
    why: 'El frontend es todo lo que el usuario ve y toca en su navegador.',
    review: 'dos-mundos',
  },
  {
    q: '¿Qué puede hacer el backend?',
    options: ['Solo cambiar los colores de la página', 'Mostrar la página sin navegador', 'Reemplazar al usuario', 'Procesar datos y conectarse con otros sistemas'],
    correct: 3,
    why: 'El backend recibe la información y decide qué hacer: guardar, avisar, registrar, automatizar o analizar.',
    review: 'backend',
  },
  {
    q: '¿Qué arquitectura tiene sentido para atender solicitudes automáticamente?',
    options: ['CSS → base de datos → HTML', 'Formulario → webhook → n8n → IA', 'IA → formulario → CSS → webhook', 'Webhook → mouse → navegador'],
    correct: 1,
    why: 'El formulario captura, el webhook avisa, n8n orquesta y la IA analiza.',
    review: 'sistema',
  },
];
