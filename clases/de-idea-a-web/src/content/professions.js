/* ════════════════════════════════════════════════════════════════
   ACTIVIDAD — profesión o negocio → flujo de 4 pasos.
   · flow: las 4 etiquetas del flujo (se alinean con la fila fija
     Entrada → Captura → Procesamiento → Seguimiento).
   · example: una frase que describe el flujo.
   · keywords: palabras que, si aparecen en el texto escrito por el
     alumno, seleccionan esta profesión (en minúsculas, sin acentos).
   · adapted: true = flujo propuesto como adaptación pedagógica
     (no venía en la especificación original de la clase).
   ════════════════════════════════════════════════════════════════ */

export const PROFESSIONS = [
  {
    id: 'finanzas', name: 'Finanzas',
    flow: ['Landing', 'Diagnóstico', 'Formulario', 'Lead'],
    example: 'Una landing ofrece un diagnóstico financiero; el formulario lo solicita y se registra como lead.',
    keywords: ['finanza', 'contador', 'contable', 'contabilidad', 'fiscal', 'impuesto', 'credito', 'inversion', 'seguro', 'banco'],
  },
  {
    id: 'administracion', name: 'Administración', adapted: true,
    flow: ['Portal', 'Solicitud', 'Aprobación', 'Registro'],
    example: 'Un portal interno recibe solicitudes; se aprueban y quedan registradas automáticamente.',
    keywords: ['administra', 'oficina', 'recursos humanos', 'rrhh', 'rh', 'compras', 'operaciones', 'gerencia', 'asistente'],
  },
  {
    id: 'derecho', name: 'Derecho',
    flow: ['Web', 'Intake', 'Clasificación', 'Seguimiento'],
    example: 'La web recibe el caso (intake), la IA lo clasifica por materia y se agenda el seguimiento.',
    keywords: ['derecho', 'abogad', 'legal', 'juridic', 'despacho', 'notari', 'litig'],
  },
  {
    id: 'inmobiliaria', name: 'Inmobiliaria',
    flow: ['Propiedad', 'Interesado', 'Formulario', 'CRM'],
    example: 'La ficha de una propiedad atrae a un interesado; su formulario llega directo al CRM.',
    keywords: ['inmobiliari', 'bienes raices', 'propiedad', 'casa', 'departamento', 'renta', 'broker', 'asesor inmobiliario'],
  },
  {
    id: 'ventas', name: 'Ventas',
    flow: ['Producto', 'Cotización', 'Lead', 'Seguimiento'],
    example: 'El cliente ve un producto, pide una cotización y el lead entra a seguimiento.',
    keywords: ['venta', 'vendedor', 'comercial', 'tienda', 'distribu', 'producto', 'ecommerce', 'mayoreo'],
  },
  {
    id: 'emprendimiento', name: 'Emprendimiento', adapted: true,
    flow: ['Idea', 'Landing', 'Lista de espera', 'Validación'],
    example: 'Una landing presenta la idea; quienes se registran en la lista de espera ayudan a validarla.',
    keywords: ['emprend', 'startup', 'negocio propio', 'pyme', 'marca', 'proyecto'],
  },
];

/* Plantilla para profesiones que no coinciden con ningún ejemplo.
   {nombre} se reemplaza por lo que escribió el alumno. */
export const GENERIC_PROFESSION = {
  flow: ['Tu web', 'Formulario', 'Clasificación', 'Seguimiento'],
  example: 'Para «{nombre}»: la web recibe la solicitud, la IA la clasifica y se da seguimiento automático.',
};
