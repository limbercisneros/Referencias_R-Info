/**
 * Catálogo de iconos SVG en código vectorial puro.
 */

/**
 * Genera el elemento SVG base con atributos accesibles y clases estándar.
 * @param {string} contenidoCamino
 * @param {string} [claseAdicional=""]
 * @param {number} [tamano=20]
 * @returns {string}
 */
function crearSvg(contenidoCamino, claseAdicional = "", tamano = 20) {
  const clases = claseAdicional ? `icono ${claseAdicional}` : "icono";
  return `<svg class="${clases}" viewBox="0 0 24 24" width="${tamano}" height="${tamano}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${contenidoCamino}</svg>`;
}

export function iconoRobot(tamano = 18) {
  return crearSvg(
    `<rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16.01"></line><line x1="16" y1="16" x2="16" y2="16.01"></line><path d="M9 19h6"></path>`,
    "icono-robot",
    tamano
  );
}

export function iconoMapa(tamano = 16) {
  return crearSvg(
    `<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line>`,
    "icono-mapa",
    tamano
  );
}

export function iconoLuna(tamano = 18) {
  return crearSvg(
    `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`,
    "icono-luna",
    tamano
  );
}

export function iconoSol(tamano = 18) {
  return crearSvg(
    `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`,
    "icono-sol",
    tamano
  );
}

export function iconoCopiar(tamano = 15) {
  return crearSvg(
    `<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>`,
    "icono-copiar",
    tamano
  );
}

export function iconoVerificado(tamano = 15) {
  return crearSvg(
    `<polyline points="20 6 9 17 4 12"></polyline>`,
    "icono-verificado",
    tamano
  );
}

export function iconoAdvertencia(tamano = 16) {
  return crearSvg(
    `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>`,
    "icono-advertencia",
    tamano
  );
}

export function iconoCirculoCorrecto(tamano = 16) {
  return crearSvg(
    `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>`,
    "icono-exito",
    tamano
  );
}

export function iconoCirculoError(tamano = 16) {
  return crearSvg(
    `<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>`,
    "icono-error",
    tamano
  );
}

const ICONOS_ANATOMIA = {
  bolsa: `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path>`,
  posicion: `<path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path><circle cx="12" cy="10" r="3"></circle>`,
  orientacion: `<circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>`,
  sensores: `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`,
  memoria: `<rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>`,
  concurrencia: `<path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle>`,
  ciudad: `<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line>`,
  "area-permisos": `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>`,
  "area-tipos": `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`
};

export function obtenerIconoParte(identificadorParte, tamano = 18) {
  const contenido = ICONOS_ANATOMIA[identificadorParte] ?? `<circle cx="12" cy="12" r="10"></circle>`;
  return crearSvg(contenido, `icono-${identificadorParte}`, tamano);
}
