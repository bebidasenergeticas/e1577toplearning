/* Registro de capítulos: id (de content/chapters.js) → módulo. */
import intro from './00-intro.js';
import url from './01-url.js';
import dosMundos from './02-dos-mundos.js';
import frontend from './03-frontend.js';
import codigo from './04-codigo.js';
import backend from './05-backend.js';
import datos from './06-datos.js';
import tipos from './07-tipos.js';
import error from './08-error.js';
import codeweb from './09-codeweb.js';
import agente from './10-agente.js';
import proyecto from './11-proyecto.js';
import responsive from './12-responsive.js';
import sistema from './13-sistema.js';
import ejemplo from './14-ejemplo.js';
import actividad from './actividad.js';
import profundidad from './15-profundidad.js';
import quiz from './quiz.js';
import cierre from './16-cierre.js';

export const registry = {
  intro, url, 'dos-mundos': dosMundos, frontend, codigo, backend, datos, tipos, error, codeweb,
  agente, proyecto, responsive, sistema, ejemplo, actividad, profundidad, quiz, cierre,
};
