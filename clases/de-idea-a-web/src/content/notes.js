/* ════════════════════════════════════════════════════════════════
   NOTAS DEL PROFESOR
   ────────────────────────────────────────────────────────────────
   Solo aparecen en la ventana de notas (botón «Notas» o tecla N) o
   en el panel de respaldo (Shift+N). Nunca se muestran por defecto.

   Campos por capítulo:
   · tiempo     minutos sugeridos (recomendación, no regla)
   · idea       lo que el grupo debe entender
   · pregunta   pregunta para lanzar al grupo
   · analogia   analogía de apoyo
   · manejo     cómo conducir el momento (pausas, cuándo avanzar)
   · transicion frase para pasar al siguiente capítulo
   · pasos      (opcional) pista por paso, en el mismo orden que la animación

   Nota: estas notas son una ADAPTACIÓN PEDAGÓGICA propuesta, no
   contenido oficial de Top Learning. Edítalas libremente.
   ════════════════════════════════════════════════════════════════ */

export const NOTES = {
  intro: {
    tiempo: 2,
    idea: 'Usamos la web todos los días sin saber qué pasa detrás. Hoy la vamos a desarmar para entenderla y poder pedírsela bien a una IA.',
    pregunta: '¿Dónde está la página antes de que la abras?',
    analogia: 'Abrir una web es como pedir comida a domicilio: tú ves el plato, pero hubo una cocina, un pedido y un traslado.',
    manejo: 'Deja la pregunta en el aire. No la contestes todavía: el capítulo 01 la responde.',
    transicion: 'Sigamos el viaje de esa dirección que acabamos de escribir.',
    pasos: ['Lee la pregunta en voz alta y espera.', 'La laptop: “algo que hacen todos los días”.', 'Se escribe la URL y se presiona Enter. Avanza para seguir el pulso.'],
  },
  url: {
    tiempo: 5,
    idea: 'La página no está en tu computadora: vive en un servidor. El navegador la pide, recibe archivos y la construye.',
    pregunta: 'Si se cae el servidor, ¿qué ven en su navegador?',
    analogia: 'El navegador es un mesero que va a la cocina (servidor) por los ingredientes (archivos) y te arma el plato (página).',
    manejo: 'Avanza paso a paso. En “Servidor”, aclara que es una computadora normal, solo que siempre encendida y conectada. Si alguien pregunta por el DNS: es como la agenda de contactos que traduce el nombre (ejemplo.com) a una dirección numérica. No profundices.',
    transicion: 'Ya vimos el viaje. Ahora veamos que una web tiene dos mundos.',
    pasos: ['Usuario y navegador: tú escribes la dirección.', 'La petición (azul) sale por Internet.', 'El servidor la recibe.', 'Responde con archivos: HTML, CSS, JS, imágenes.', 'La respuesta (verde) regresa.', 'El navegador construye la página. Lee el titular completo.'],
  },
  'dos-mundos': {
    tiempo: 5,
    idea: 'Frontend = lo que el usuario ve y toca. Backend = lo que procesa detrás. Database = dónde se guarda. API = cómo se comunican.',
    pregunta: 'En el restaurante, ¿qué parte ven ustedes como clientes y qué parte nunca ven?',
    analogia: 'Restaurante: salón (frontend), cocina (backend), almacén (database) y la comanda con formato fijo (API).',
    manejo: 'Aquí el mesero está del lado del frontend porque es quien interactúa contigo. En otra versión clásica de esta analogía el mesero ES la API: si alguien la conoce, valídala; las dos formas sirven. Lo importante es que la API es el formato acordado (la comanda).',
    transicion: 'Entremos al frontend: ¿de qué está hecho lo que vemos?',
    pasos: ['Pregunta qué ven en un restaurante.', 'Frontend: mesa, menú, decoración, mesero.', 'Backend: cocina, pedidos, procesos, inventario.', 'Database: el almacén.', 'API: la comanda cruza la ventanilla y regresa el plato.', 'Separados, pero conectados.'],
  },
  frontend: {
    tiempo: 6,
    idea: 'HTML define qué existe, CSS cómo se ve y JavaScript qué sucede.',
    pregunta: 'Si quito el CSS, ¿desaparece el botón?',
    analogia: 'Una casa: HTML son las paredes y cuartos, CSS la pintura y los muebles, JavaScript la instalación eléctrica (presionas un interruptor y pasa algo).',
    manejo: 'Respuesta a la pregunta: no, el botón sigue existiendo (HTML), solo pierde su apariencia. No expliques sintaxis: los fragmentos son solo para reconocer cada pieza.',
    transicion: 'Veamos cómo el navegador convierte ese código en una página.',
    pasos: ['La página completa.', 'Se separan las capas.', 'HTML: qué existe. Esqueleto.', 'CSS: cómo se ve. Apariencia.', 'JavaScript: qué sucede. Comportamiento.', 'Se juntan otra vez.'],
  },
  codigo: {
    tiempo: 5,
    idea: 'El código es texto con instrucciones. El navegador lo lee e interpreta para construir la página.',
    pregunta: '¿Qué creen que hace el navegador con estas líneas?',
    analogia: 'Una partitura no es música: el músico (navegador) la interpreta y suena.',
    manejo: 'En el paso de HTML, señala lo “feo” del resultado: así se ve la estructura sin diseño. En el paso de JavaScript, haz clic en el botón de la vista previa para demostrar que funciona de verdad.',
    transicion: 'Ese botón “envía”… pero ¿a dónde? Vamos al backend.',
    pasos: ['Editor vacío y navegador en blanco.', 'Entra el HTML: estructura sin diseño.', 'Entra el CSS: cambia la apariencia.', 'Entra el JavaScript: haz clic en el botón.', 'Frase de cierre.'],
  },
  backend: {
    tiempo: 6,
    idea: 'El frontend recoge la información; el backend decide qué hacer con ella (guardar, avisar, registrar, automatizar, analizar).',
    pregunta: 'Cuando presiono enviar en un formulario, ¿a dónde creen que se va la información?',
    analogia: 'Echar una carta al buzón: el buzón (formulario) solo recibe; el correo (backend) decide a dónde va.',
    manejo: 'ESPERA RESPUESTAS antes de avanzar del primer paso. Anota 2 o 3 respuestas del grupo y vuelve a ellas cuando aparezcan las ramas. Aclara que n8n e IA son opciones, no obligatorias.',
    transicion: 'Aparecieron palabras como database, API y webhook. Pongámosles nombre.',
    pasos: ['PREGUNTA y pausa larga. Espera respuestas.', 'El formulario se empaqueta.', 'Viaja como request.', 'El backend recibe y decide.', 'Las cinco ramas: menciona las respuestas del grupo.', 'Lee la frase completa.'],
  },
  datos: {
    tiempo: 5,
    idea: 'Database guarda. API: un sistema pregunta y otro responde con un formato acordado. Webhook: un sistema avisa automáticamente cuando pasa algo.',
    pregunta: '¿Qué es mejor: llamar cada 5 minutos a la pizzería para preguntar si ya salió tu pedido, o que te avisen cuando sale?',
    analogia: 'API = tú llamas a preguntar. Webhook = la pizzería te manda la notificación cuando sale el repartidor.',
    manejo: 'No entres en implementación (endpoints, métodos HTTP). Solo la idea. Ya usaron webhooks en n8n: conéctalo con esa experiencia.',
    transicion: 'Con estas piezas se construyen distintos tipos de web.',
    pasos: ['Presenta las tres palabras.', 'Database: los registros entran al cilindro.', 'API: pregunta y respuesta por el puente.', 'Webhook: el evento dispara el aviso solo.', 'Comparación: tú preguntas / te avisan.'],
  },
  tipos: {
    tiempo: 4,
    idea: 'Landing = un objetivo. Sitio web = varias páginas de información. Web app = interfaz + lógica + usuarios + datos.',
    pregunta: '¿Cuál necesita su negocio hoy?',
    analogia: 'Landing = un volante; sitio web = un folleto con varias páginas; web app = una sucursal que atiende sola.',
    manejo: 'Pide 2 o 3 ejemplos del grupo y clasifícalos en voz alta. Aclara que no es mejor ni peor: depende del objetivo.',
    transicion: 'Antes de pedirle cualquiera de estas a una IA, hay un error muy común.',
  },
  error: {
    tiempo: 4,
    idea: 'Un prompt vago produce un resultado genérico. El problema suele ser la especificación, no la IA.',
    pregunta: '¿Qué le faltó a “Hazme una página web”?',
    analogia: 'Decirle a un arquitecto “hazme una casa” sin decirle cuántas personas viven, el presupuesto o el terreno.',
    manejo: 'Deja que el grupo proponga lo que falta antes de mostrar las 7 piezas. Luego compara con lo que dijeron.',
    transicion: 'Para no olvidar estas piezas, usemos un marco: CODEWEB.',
    pasos: ['Lee el prompt malo.', 'El resultado genérico + la frase.', 'Primeras 4 piezas.', 'Últimas 3 piezas.', 'La especificación completa.'],
  },
  codeweb: {
    tiempo: 6,
    idea: 'CODEWEB es una lista de 7 decisiones para especificar una web antes de pedírsela a un agente.',
    pregunta: '¿Cuál de estas 7 letras olvidan con más frecuencia?',
    analogia: 'Es el checklist del piloto antes de despegar.',
    manejo: 'En la tarjeta final, pide que tomen captura. El botón “Copiar plantilla” copia el texto a tu portapapeles para pegarlo en el chat de Meet.',
    transicion: 'Con una buena especificación, veamos qué hace un agente con ella.',
    pasos: ['Presenta CODEWEB.', 'C · Contexto.', 'O · Objetivo.', 'D · Diseño.', 'E · Estructura.', 'W · Workflow.', 'E · Experiencia.', 'B · Boundaries (límites).', 'Tarjeta: pide captura de pantalla.'],
  },
  agente: {
    tiempo: 5,
    idea: 'Un agente trabaja en ciclo: planea, actúa, prueba, observa y corrige hasta que funciona.',
    pregunta: '¿En qué se diferencia esto de pedirle código a un chat?',
    analogia: 'Un chat te da la receta; un agente entra a la cocina, cocina, prueba el sabor y corrige la sal.',
    manejo: 'Conecta con la clase anterior: el loop del agente, Plan mode (nada se modifica sin tu aprobación) y CLAUDE.md como contexto. La terminal es una simulación ilustrativa, no un registro real.',
    transicion: 'Pero ¿qué archivos crea exactamente el agente?',
    pasos: ['La cadena lineal.', 'Se vuelve un ciclo.', 'La terminal muestra cada vuelta.', 'Error → observar → corregir.', 'Done.', 'Frase + puente con la clase anterior.'],
  },
  proyecto: {
    tiempo: 3,
    idea: 'Una web sencilla es una carpeta con archivos: cada uno tiene un rol claro.',
    pregunta: 'Si quiero cambiar el color del botón, ¿qué archivo tocaría el agente?',
    analogia: 'Una carpeta de proyecto es como el expediente de un cliente: cada documento tiene su función.',
    manejo: 'Respuesta: styles.css. Puedes hacer clic en cada archivo para resaltarlo.',
    transicion: 'Esa web tiene que funcionar en cualquier pantalla.',
  },
  responsive: {
    tiempo: 3,
    idea: 'Responsive: la misma web se reorganiza según el tamaño de la pantalla.',
    pregunta: '¿Desde qué dispositivo creen que sus clientes visitarían su web?',
    analogia: 'Como el agua: toma la forma del recipiente.',
    manejo: 'Señala cómo el menú se compacta y las columnas se apilan en tiempo real. Al pedir una web a la IA, mencionar “desktop + móvil” es parte de la E de Experiencia.',
    transicion: 'Hasta aquí, una página. Ahora veamos cómo se vuelve un sistema.',
  },
  sistema: {
    tiempo: 4,
    idea: 'Una página puede ser la puerta de entrada de una automatización completa: formulario → webhook → n8n → IA → CRM / mensajes / base de datos.',
    pregunta: '¿Qué tarea repetitiva de su trabajo podría empezar con un formulario?',
    analogia: 'La web es la recepción; detrás hay todo un equipo que trabaja solo.',
    manejo: 'Pausa en el plano final. Conecta con lo que ya hicieron en n8n.',
    transicion: 'Veámoslo con datos concretos.',
  },
  ejemplo: {
    tiempo: 5,
    idea: 'Los datos del formulario se convierten en JSON (etiqueta + valor), viajan por un webhook a n8n, la IA los clasifica y el CRM los registra.',
    pregunta: '¿Qué otra clasificación le pedirían a la IA con este mensaje?',
    analogia: 'El JSON es un formulario en papel con casillas etiquetadas: cualquier sistema sabe dónde buscar cada dato.',
    manejo: 'Señala que el JSON contiene EXACTAMENTE lo que escribió el usuario. Conecta con el caso Carlos (clasificación + extracción → JSON). Datos ficticios.',
    transicion: 'Esta misma estructura sirve para su profesión. Probémoslo.',
    pasos: ['El formulario lleno.', 'Se convierte en JSON.', 'Webhook → n8n.', 'La IA clasifica.', 'El CRM registra.', 'Resumen del flujo.'],
  },
  actividad: {
    tiempo: 5,
    idea: 'La arquitectura es reutilizable: cambian las etiquetas, no la estructura.',
    pregunta: 'Díganme su profesión o negocio y lo probamos en vivo.',
    analogia: 'Es una receta base: cambias los ingredientes, no el método.',
    manejo: 'Pide 2 o 3 profesiones en el chat y escríbelas en el campo. Si no coincide con un ejemplo, aparece una plantilla genérica con su nombre. Nada se guarda.',
    transicion: 'Ya vieron cuánto pueden hacer. Veamos qué hay más abajo.',
  },
  profundidad: {
    tiempo: 3,
    idea: 'Crear una página es el inicio; convertirla en un sistema productivo requiere más capas (producción, sistemas, escala).',
    pregunta: '¿Qué nivel les da más curiosidad?',
    analogia: 'Un iceberg: lo que se ve es la punta.',
    manejo: 'Tono de curiosidad, no de venta. Reconoce lo que ya pueden hacer hoy antes de bajar.',
    transicion: 'Comprobemos lo aprendido.',
  },
  quiz: {
    tiempo: 5,
    idea: 'Autoevaluación rápida de los conceptos clave.',
    pregunta: 'Lee cada pregunta y pide que respondan en el chat antes de hacer clic.',
    analogia: '—',
    manejo: 'Responde con las teclas 1–4 o con clic. La retroalimentación es inmediata. No se guarda nada.',
    transicion: 'Cerremos volviendo al inicio.',
  },
  cierre: {
    tiempo: 2,
    idea: 'De “hazme una página web” a pensar en sistema: problema, usuario, objetivo, arquitectura, frontend, backend, datos, automatización, resultado.',
    pregunta: '¿Qué van a especificar distinto la próxima vez que le pidan una web a la IA?',
    analogia: 'Antes pedían un plato; ahora saben diseñar la cocina.',
    manejo: 'Lee la frase final despacio. Deja la última pantalla mientras resuelves dudas.',
    transicion: 'Fin de la presentación.',
  },
};
