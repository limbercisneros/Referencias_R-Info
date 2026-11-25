/**
 * Utilidades DOM seguras, normalización Unicode, accesibilidad y ayudas de selección.
 */

const ENTIDADES_HTML = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

/**
 * Escapa caracteres especiales de HTML para evitar inyección XSS.
 * @param {string|number|null|undefined} valor
 * @returns {string}
 */
export function escaparHTML(valor) {
  if (valor === null || valor === undefined) return "";
  return String(valor).replace(/[&<>"']/g, caracter => ENTIDADES_HTML[caracter] ?? caracter);
}

/**
 * Normaliza texto eliminando diacríticos/tildes y convirtiendo a minúsculas.
 * Útil para búsquedas tolerantes en español.
 * @param {string} texto
 * @returns {string}
 */
export function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Atajo para seleccionar un elemento.
 * @param {string} selector
 * @param {ParentNode} [alcance=document]
 * @returns {Element|null}
 */
export function seleccionar(selector, alcance = document) {
  return alcance.querySelector(selector);
}

/**
 * Atajo para seleccionar varios elementos y devolver un arreglo nativo.
 * @param {string} selector
 * @param {ParentNode} [alcance=document]
 * @returns {Element[]}
 */
export function seleccionarTodos(selector, alcance = document) {
  return [...alcance.querySelectorAll(selector)];
}

/**
 * Anuncia un mensaje a tecnologías de asistencia mediante la región aria-live.
 * @param {string} mensaje
 */
export function anunciar(mensaje) {
  const regionAnuncios = seleccionar("#regionAnuncios");
  if (!regionAnuncios) return;
  regionAnuncios.textContent = "";
  setTimeout(() => {
    regionAnuncios.textContent = mensaje;
  }, 50);
}
