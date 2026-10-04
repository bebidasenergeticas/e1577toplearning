/* ════════════════════════════════════════════════════════════════
   CONTENIDO DE LA PRESENTACIÓN
   ────────────────────────────────────────────────────────────────
   · CHAPTERS define el ORDEN, el número visible, el título del
     índice y el tema (dark = oscuro, light = claro, split = dividido).
   · TEXT contiene todos los textos que aparecen en pantalla,
     agrupados por id de capítulo.
   Para cambiar un texto: edita el string y guarda. No cambies los
   nombres de las claves (las usan los archivos de src/chapters/).
   Para mover un capítulo: cambia su posición en CHAPTERS.
   ════════════════════════════════════════════════════════════════ */

export const COURSE = {
  code: 'E1577',
  program: 'Inteligencia Artificial y Automatización',
  title: 'De una idea a una página web funcional con Inteligencia Artificial',
  short: 'De una idea a una web',
  org: 'Top Learning',
  /* Enlace a la clase anterior (mismo sitio de GitHub Pages) */
  previous: { title: 'Clase anterior: LLMs y Prompting Efectivo II', href: '../' },
};

export const CHAPTERS = [
  { id: 'intro', num: '00', nav: 'Intro', theme: 'dark' },
  { id: 'url', num: '01', nav: 'El viaje de una URL', theme: 'dark' },
  { id: 'dos-mundos', num: '02', nav: 'Dos mundos', theme: 'split' },
  { id: 'frontend', num: '03', nav: 'Frontend: 3 piezas', theme: 'light' },
  { id: 'codigo', num: '04', nav: 'De código a interfaz', theme: 'light' },
  { id: 'backend', num: '05', nav: '¿Qué es el backend?', theme: 'dark' },
  { id: 'datos', num: '06', nav: 'Database · API · Webhook', theme: 'dark' },
  { id: 'tipos', num: '07', nav: 'Tipos de web', theme: 'light' },
  { id: 'error', num: '08', nav: 'El error más común', theme: 'light' },
  { id: 'codeweb', num: '09', nav: 'Framework CODEWEB', theme: 'light' },
  { id: 'agente', num: '10', nav: 'De la idea al agente', theme: 'dark' },
  { id: 'proyecto', num: '11', nav: 'El proyecto por dentro', theme: 'dark' },
  { id: 'responsive', num: '12', nav: 'Responsive', theme: 'light' },
  { id: 'sistema', num: '13', nav: 'De página a sistema', theme: 'dark' },
  { id: 'ejemplo', num: '14', nav: 'Ejemplo con datos', theme: 'dark' },
  { id: 'actividad', num: 'A', nav: 'Actividad: tu profesión', theme: 'light' },
  { id: 'profundidad', num: '15', nav: 'Pirámide de profundidad', theme: 'dark' },
  { id: 'quiz', num: 'Q', nav: 'Quiz', theme: 'light' },
  { id: 'cierre', num: '16', nav: 'Cierre', theme: 'dark' },
];

export const TEXT = {
  /* ───────────── 00 · INTRO ───────────── */
  intro: {
    eyebrow: 'Clase · De una idea a una página web funcional con IA',
    title: ['¿Qué pasa realmente', 'cuando abres una página web?'],
    sub: 'Hoy vamos a abrir la caja negra.',
    url: 'www.ejemplo.com',
    caps: [
      'Todo empieza con algo que haces todos los días.',
      'Escribes una dirección… y presionas Enter.',
    ],
    scroll: 'Desplázate o usa las flechas',
  },

  /* ───────────── 01 · URL ───────────── */
  url: {
    title: 'Una web no vive dentro de tu navegador.',
    lead: 'El navegador solicita recursos, recibe información y construye la experiencia que ves.',
    nodes: {
      user: ['Usuario', 'tú'],
      browser: ['Navegador', 'Chrome, Safari, Edge…'],
      internet: ['Internet', 'la red de redes'],
      server: ['Servidor', 'donde vive la web'],
      files: ['Archivos y datos', 'HTML · CSS · JS · imágenes'],
      page: ['Página', 'lo que ves'],
    },
    caps: [
      'Escribes www.ejemplo.com y presionas Enter.',
      'Tu navegador envía una petición que viaja por Internet.',
      'Llega a un servidor: una computadora siempre encendida que guarda la web.',
      'El servidor responde con archivos y datos.',
      'La respuesta regresa por Internet hasta tu navegador.',
      'El navegador solicita recursos, recibe información y construye la experiencia que ves.',
    ],
    legend: [['Petición', 'signal'], ['Respuesta', 'ok']],
  },

  /* ───────────── 02 · DOS MUNDOS ───────────── */
  'dos-mundos': {
    title: 'Una web tiene dos mundos.',
    front: {
      name: 'Frontend',
      desc: 'Lo que el usuario ve y toca.',
      items: [['Mesa', 'la pantalla'], ['Menú', 'las opciones'], ['Decoración', 'el diseño'], ['Mesero', 'la interfaz que toma tu pedido']],
    },
    back: {
      name: 'Backend',
      desc: 'Lo que ocurre detrás.',
      items: [['Cocina', 'la lógica'], ['Pedidos', 'las solicitudes'], ['Procesos', 'las reglas del negocio'], ['Inventario', 'los datos']],
    },
    db: ['Database', 'el almacén: donde se guarda la información'],
    api: ['API', 'la comanda: un formato acordado para pedir y responder entre sistemas'],
    caps: [
      'Piensa en un restaurante.',
      'Frontend: todo lo que el cliente ve y usa.',
      'Backend: lo que pasa en la cocina, donde el cliente no entra.',
      'Database: el almacén donde se guarda todo.',
      'API: la comanda. Un formato que ambos lados entienden.',
      'Separados, pero conectados.',
    ],
  },

  /* ───────────── 03 · FRONTEND ───────────── */
  frontend: {
    title: 'Toda página que ves está hecha de 3 piezas.',
    page: {
      brand: 'Nova',
      links: ['Servicios', 'Proceso', 'Contacto'],
      eyebrow: 'Consultoría para PyMEs',
      h1: 'Nova',
      p: 'Ordenamos tus procesos y los conectamos con IA.',
      button: 'Solicitar información',
      sent: 'Enviado ✓',
      cards: ['Diagnóstico', 'Automatización', 'Seguimiento'],
    },
    layers: [
      { key: 'html', name: 'HTML', what: 'Qué existe.', desc: 'La estructura: títulos, textos, botones, imágenes.', analogy: 'Esqueleto', code: '<h1>Nova</h1>\n<button>Solicitar información</button>' },
      { key: 'css', name: 'CSS', what: 'Cómo se ve.', desc: 'Colores, tipografía, tamaños y espacios.', analogy: 'Apariencia', code: 'button {\n  border-radius: 12px;\n}' },
      { key: 'js', name: 'JavaScript', what: 'Qué sucede.', desc: 'Lo que pasa cuando el usuario interactúa.', analogy: 'Comportamiento', code: 'button.addEventListener("click", enviar);' },
    ],
    caps: [
      'Esto es lo que ves en el navegador.',
      'Ahora separemos sus capas.',
      '', '', '',
      '',
    ],
    formula: ['HTML', 'CSS', 'JavaScript', 'Interfaz'],
    note: 'No vamos a aprender sintaxis: solo a reconocer qué hace cada pieza.',
  },

  /* ───────────── 04 · CÓDIGO → INTERFAZ ───────────── */
  codigo: {
    title: 'El código no es la página.',
    lead: 'El navegador interpreta el código y construye la página.',
    tabs: ['index.html', 'styles.css', 'script.js'],
    html: '<main>\n  <p>Consultoría para PyMEs</p>\n  <h1>Nova</h1>\n  <button>Solicitar información</button>\n</main>',
    css: 'body   { font-family: Geist;\n         background: #F3F0E9; }\nh1     { font-size: 72px; }\nbutton { background: #161616;\n         color: white;\n         border-radius: 12px; }',
    js: 'const boton = document.querySelector("button");\n\nboton.addEventListener("click", () => {\n  boton.textContent = "¡Enviado!";\n});',
    preview: { url: 'nova.ejemplo', eyebrow: 'Consultoría para PyMEs', h1: 'Nova', button: 'Solicitar información', sent: '¡Enviado!' },
    caps: [
      'Izquierda: el código. Derecha: lo que construye el navegador.',
      'Solo HTML: la estructura existe, pero sin diseño.',
      'Con CSS: la misma estructura, ahora con apariencia.',
      'Con JavaScript: la página reacciona. (Puedes hacer clic.)',
      '',
    ],
    interprets: 'el navegador interpreta',
  },

  /* ───────────── 05 · BACKEND ───────────── */
  backend: {
    question: '¿Qué ocurre después de presionar ENVIAR?',
    form: { fields: ['Nombre', 'Empresa', 'Correo', 'Mensaje'], button: 'Enviar' },
    request: 'Request',
    hub: ['Backend', 'recibe y decide'],
    branches: [
      ['Database', 'guardar'],
      ['Email', 'avisar'],
      ['CRM', 'registrar al cliente'],
      ['n8n', 'automatizar'],
      ['IA', 'clasificar o responder'],
    ],
    caps: [
      '',
      'El formulario empaqueta lo que escribiste…',
      '…y lo envía como una petición (request) al backend.',
      'El backend recibe la petición y decide qué hacer con ella.',
      'Puede guardar, avisar, registrar, automatizar o analizar. Una opción, varias o todas.',
      '',
    ],
    statement: ['El frontend recoge la información.', 'El backend decide qué hacer con ella.'],
  },

  /* ───────────── 06 · DATABASE · API · WEBHOOK ───────────── */
  datos: {
    title: 'Tres palabras que vas a escuchar siempre.',
    db: { name: 'Database', es: 'Base de datos', def: 'Donde almacenamos información.', cols: ['Nombre', 'Correo', 'Fecha'], rows: [['Ana R.', 'ana@ejemplo.com', '12 may'], ['Luis M.', 'luis@ejemplo.com', '14 may'], ['Sofía T.', 'sofia@ejemplo.com', '15 may']], tag: 'datos ficticios' },
    api: { name: 'API', es: 'Interfaz de programación', def: 'Una forma estructurada para que dos sistemas se comuniquen.', a: 'Tienda', b: 'Paquetería', req: '¿Estatus del pedido 1042?', res: 'En camino' },
    hook: { name: 'Webhook', es: 'Aviso automático', def: 'Un aviso automático cuando ocurre un evento.', event: 'Evento: nuevo formulario', target: 'n8n recibe el aviso' },
    compare: [['API', 'Tú preguntas.'], ['Webhook', 'Te avisan.']],
    caps: ['', '', '', '', 'Sin implementación todavía: solo la idea.'],
  },

  /* ───────────── 07 · TIPOS DE WEB ───────────── */
  tipos: {
    title: 'No todas las webs son iguales.',
    types: [
      { name: 'Landing page', def: 'Un objetivo principal.', ex: 'Ej.: conseguir una cotización.' },
      { name: 'Sitio web', def: 'Información distribuida en varias páginas.', ex: 'Inicio · Servicios · Nosotros · Blog · Contacto' },
      { name: 'Web app', def: 'Interfaz + lógica + usuarios + datos.', ex: 'Ej.: correo, CRM, banca, editor colaborativo.' },
    ],
    pages: ['Inicio', 'Servicios', 'Nosotros', 'Blog', 'Contacto'],
    cta: 'Cotizar',
    axis: 'Más complejidad',
    question: '¿Cuál necesita tu proyecto hoy?',
  },

  /* ───────────── 08 · EL ERROR MÁS COMÚN ───────────── */
  error: {
    label: 'El error más común',
    bad: 'Hazme una página web.',
    generic: 'Resultado: genérico',
    statement: ['No falla necesariamente la IA.', 'Falla la especificación.'],
    pieces: [
      ['Problema', 'Los clientes no entienden qué servicios ofrezco.'],
      ['Usuario', 'Dueños de PyMEs, con poco tiempo.'],
      ['Objetivo', 'Que soliciten una llamada.'],
      ['Estilo', 'Corporativo, sobrio, confiable.'],
      ['Estructura', 'Hero · servicios · proceso · formulario.'],
      ['Acciones', 'Enviar el formulario y agendar.'],
      ['Restricciones', 'No inventar datos ni testimonios.'],
    ],
    specTitle: 'Especificación',
    result: 'Resultado: específico',
    final: 'Especificación sólida → resultado específico.',
  },

  /* ───────────── 09 · CODEWEB ───────────── */
  codeweb: {
    title: '7 decisiones antes de pedir una web.',
    name: 'CODEWEB',
    items: [
      { l: 'C', name: 'Contexto', q: '¿Quién eres y en qué situación estás?', ex: 'Consultoría para PyMEs.' },
      { l: 'O', name: 'Objetivo', q: '¿Qué debe lograr la página?', ex: 'Generar solicitudes.' },
      { l: 'D', name: 'Diseño', q: '¿Cómo debe verse y sentirse?', ex: 'Corporativo y premium.' },
      { l: 'E', name: 'Estructura', q: '¿Qué secciones y en qué orden?', ex: 'Hero + servicios + proceso + formulario.' },
      { l: 'W', name: 'Workflow', q: '¿Qué pasa con la información?', ex: 'Capturar el lead.' },
      { l: 'E', name: 'Experiencia', q: '¿Dónde y cómo se usará?', ex: 'Desktop + móvil.' },
      { l: 'B', name: 'Boundaries', q: '¿Qué NO debe hacer? (límites)', ex: 'No inventar testimonios ni certificaciones.' },
    ],
    cardTitle: 'CODEWEB · Ejemplo: consultoría para PyMEs',
    shot: 'Captura esta pantalla',
    copy: 'Copiar plantilla',
    copied: 'Plantilla copiada al portapapeles',
    template:
      'CODEWEB — Especificación para una página web\n\n' +
      'C · Contexto: [quién eres, tu negocio y tu situación]\n' +
      'O · Objetivo: [qué debe lograr la página]\n' +
      'D · Diseño: [estilo, tono, colores, referencias]\n' +
      'E · Estructura: [secciones y su orden]\n' +
      'W · Workflow: [qué pasa con la información que se envía]\n' +
      'E · Experiencia: [dispositivos, accesibilidad, velocidad]\n' +
      'B · Boundaries: [qué NO debe hacer o inventar]\n',
  },

  /* ───────────── 10 · AGENTE ───────────── */
  agente: {
    title: 'De la idea al agente.',
    chain: [['Idea', 'idea'], ['Spec', 'especificación'], ['Plan', 'plan'], ['Files', 'archivos'], ['Build', 'construir'], ['Test', 'probar'], ['Observe', 'observar'], ['Fix', 'corregir'], ['Result', 'resultado']],
    loop: [['Plan', 'planear'], ['Act', 'actuar'], ['Test', 'probar'], ['Observe', 'observar'], ['Fix', 'corregir']],
    done: 'Done',
    termTitle: 'Agente de codificación · simulación ilustrativa',
    term: [
      ['›', 'Lee la especificación CODEWEB'],
      ['›', 'Revisa los archivos del proyecto'],
      ['›', 'Plan: 1) estructura  2) estilos  3) formulario'],
      ['›', 'Crea index.html, styles.css y script.js'],
      ['›', 'Prueba la página en el navegador…'],
      ['✕', 'El botón Enviar no responde'],
      ['›', 'Corrige script.js'],
      ['›', 'Prueba de nuevo…'],
      ['✓', 'Formulario funcionando'],
    ],
    statement: 'Un agente no solamente genera código. Puede inspeccionar archivos, planear, modificar, probar, detectar errores y corregir.',
    bridge: ['Clase anterior: el loop del agente, Plan mode y CLAUDE.md.', 'Hoy: los usamos para construir una web.'],
    caps: [
      'Una idea no se convierte en web de un solo golpe.',
      'Un agente trabaja en ciclo.',
      'Mira lo que hace en cada vuelta.',
      'Si una prueba falla, observa el error y corrige.',
      'Cuando todo funciona, termina.',
      '',
    ],
  },

  /* ───────────── 11 · PROYECTO ───────────── */
  proyecto: {
    title: 'Una web, por dentro, es una carpeta.',
    folder: 'nova-professional/',
    files: [
      { name: 'index.html', role: 'Estructura', desc: 'Qué existe en la página.' },
      { name: 'styles.css', role: 'Apariencia', desc: 'Cómo se ve.' },
      { name: 'script.js', role: 'Comportamiento', desc: 'Qué sucede al interactuar.' },
      { name: 'README.md', role: 'Instrucciones', desc: 'Qué es el proyecto y cómo usarlo.' },
    ],
    caps: ['Un proyecto web sencillo.', 'Adentro: cuatro archivos.', '', '', '', '', ''],
    agent: 'Un agente puede crear y modificar estos archivos.',
    diff: ['+3', '−1'],
    hint: 'Haz clic en un archivo',
  },

  /* ───────────── 12 · RESPONSIVE ───────────── */
  responsive: {
    title: 'Una web no termina cuando se ve bien en tu computadora.',
    title2: 'Debe funcionar donde está el usuario.',
    def: 'Responsive: la misma web se reorganiza según el tamaño de la pantalla.',
    devices: ['Desktop', 'Tablet', 'Smartphone'],
    concepts: [['Legibilidad', 'se lee sin hacer zoom'], ['Botones', 'del tamaño de un dedo'], ['Navegación', 'el menú se adapta'], ['Formularios', 'cómodos de llenar']],
    mini: { brand: 'Nova', links: ['Servicios', 'Proceso', 'Contacto'], h1: 'Ordenamos tus procesos.', p: 'Consultoría para PyMEs.', button: 'Solicitar información', cards: ['Diagnóstico', 'Automatización', 'Seguimiento'], form: ['Nombre', 'Correo'] },
    caps: ['', 'Tablet: menos ancho, el contenido se reacomoda.', 'Smartphone: una sola columna y un menú compacto.', '', ''],
  },

  /* ───────────── 13 · SISTEMA ───────────── */
  sistema: {
    nodes: {
      web: ['Web', 'lo que ve el usuario'],
      form: ['Formulario', 'captura los datos'],
      hook: ['Webhook', 'avisa: hay datos nuevos'],
      n8n: ['n8n', 'orquesta el flujo'],
      ai: ['IA', 'clasifica y redacta'],
      crm: ['CRM', 'registra al cliente'],
      msg: ['Email / WhatsApp', 'responde al cliente'],
      db: ['Database', 'guarda el historial'],
    },
    caps: [
      'Empecemos con una página web.',
      'El formulario captura datos y un webhook avisa que llegaron.',
      'n8n recibe el aviso y orquesta; la IA analiza el mensaje.',
      'El resultado llega al CRM, al cliente y a la base de datos.',
      '',
    ],
    statement: 'Una página puede convertirse en la puerta de entrada de una automatización completa.',
  },

  /* ───────────── 14 · EJEMPLO ───────────── */
  ejemplo: {
    tag: 'Datos ficticios',
    fields: [
      ['Nombre', 'name', 'Juan Pérez'],
      ['Empresa', 'company', 'JP Consultores'],
      ['Correo', 'email', 'juan@email.com'],
      ['Mensaje', 'message', 'Necesito automatizar el seguimiento de mis clientes.'],
    ],
    button: 'Enviar',
    route: ['Webhook', 'n8n', 'IA', 'CRM'],
    ai: [['Intención', 'Ventas'], ['Necesidad', 'Automatización']],
    crmCols: ['Nombre', 'Empresa', 'Intención', 'Necesidad', 'Estado'],
    crmRow: ['Juan Pérez', 'JP Consultores', 'Ventas', 'Automatización', 'Nuevo'],
    caps: [
      'Un cliente llena el formulario de tu web.',
      'Al enviar, los datos viajan como JSON: etiqueta + valor.',
      'El webhook recibe el JSON y despierta al flujo de n8n.',
      'La IA lee el mensaje y lo clasifica.',
      'El CRM registra al nuevo cliente, listo para seguimiento.',
      '',
    ],
    summary: ['Formulario', 'JSON', 'Webhook', 'n8n', 'IA', 'CRM'],
    bridge: 'Como con Carlos en la clase anterior: texto → clasificación → JSON.',
  },

  /* ───────────── ACTIVIDAD ───────────── */
  actividad: {
    title: 'Escribe tu profesión o negocio.',
    placeholder: 'Ej.: despacho contable, clínica, agencia…',
    inputLabel: 'Tu profesión o negocio',
    go: 'Ver flujo',
    pick: 'O elige un ejemplo:',
    generic: ['Entrada', 'Captura', 'Procesamiento', 'Seguimiento'],
    genericLabel: 'La estructura no cambia',
    yourLabel: 'Tu flujo',
    note: 'La arquitectura se reutiliza: cambian las etiquetas, no la estructura.',
    privacy: 'Nada de lo que escribas se guarda ni se envía.',
  },

  /* ───────────── 15 · PROFUNDIDAD ───────────── */
  profundidad: {
    levels: [
      { name: 'Lo que ya puedes hacer', items: ['Definir una página', 'Generar el frontend', 'Estructurar HTML, CSS y JS', 'Crear formularios', 'Hacerla responsive', 'Iterar con IA', 'Detectar errores básicos'], done: true },
      { name: 'Producción', items: ['Dominio', 'Hosting', 'Backend', 'Base de datos'] },
      { name: 'Sistemas', items: ['Usuarios', 'Login', 'APIs', 'Webhooks', 'n8n', 'CRM', 'IA'] },
      { name: 'Escala', items: ['Analytics', 'SEO', 'Seguridad', 'Pagos', 'Arquitectura', 'Mantenimiento'] },
    ],
    statement: ['Crear una página es el comienzo.', 'Convertirla en un sistema productivo requiere arquitectura.'],
  },

  /* ───────────── QUIZ ───────────── */
  quiz: {
    title: 'Comprobación rápida',
    sub: '5 preguntas · respuesta inmediata · no se guarda nada',
    start: 'Empezar',
    next: 'Siguiente',
    finish: 'Ver resultado',
    restart: 'Repetir',
    review: 'Repasar',
    keys: 'Teclas 1–4 para responder · Enter para continuar',
  },

  /* ───────────── 16 · CIERRE ───────────── */
  cierre: {
    before: 'Antes',
    bad: 'Hazme una página web.',
    now: 'Ahora',
    chain: ['Problema', 'Usuario', 'Objetivo', 'Arquitectura', 'Frontend', 'Backend', 'Datos', 'Automatización', 'Resultado'],
    final: ['El valor no está solo en escribir código.', 'Está en saber qué sistema construir, cómo explicárselo a la IA y cómo comprobar que funciona.'],
    sign: 'E1577 · Inteligencia Artificial y Automatización',
    org: 'Top Learning',
  },
};
