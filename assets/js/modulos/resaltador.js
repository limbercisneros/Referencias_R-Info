/**
 * Resaltador léxico seguro para código en lenguaje R-Info (UNLP)
 * y constructor de contenedores de código con botón de copiado.
 */
import { escaparHTML } from "./dom.js";
import { iconoCopiar } from "./iconos.js";

const PALABRAS_ESTRUCTURA = new Set([
  "programa", "procesos", "proceso", "areas", "robots", "robot",
  "variables", "comenzar", "fin"
]);

const PALABRAS_CONTROL = new Set([
  "si", "sino", "repetir", "mientras"
]);

const PALABRAS_PRIMITIVA = new Set([
  "mover", "derecha", "tomarFlor", "tomarPapel", "depositarFlor", "depositarPapel",
  "Pos", "Informar", "AsignarArea", "Iniciar", "Random",
  "BloquearEsquina", "LiberarEsquina", "EnviarMensaje", "RecibirMensaje"
]);

const PALABRAS_SENSOR = new Set([
  "HayFlorEnLaEsquina", "HayPapelEnLaEsquina", "HayFlorEnLaBolsa", "HayPapelEnLaBolsa",
  "PosAv", "PosCa", "AreaC", "AreaP", "AreaPC", "numero", "boolean", "V", "F", "E", "ES"
]);

const PATRON_TOKEN_RINFO = /(\{[^}]*\})|('[^']*')|(:=|<>|<=|>=|[&|~+\-*/=<>])|\b(\d+)\b|\b([A-Za-z_][A-Za-z0-9_]*)\b/g;

/**
 * Resalta una línea o bloque completo de código R-Info de forma segura (sin XSS).
 * @param {string} codigo
 * @returns {string} HTML con spans de resaltado
 */
export function resaltarCodigoRInfo(codigo) {
  if (!codigo) return "";

  let resultado = "";
  let ultimoIndice = 0;

  for (const coincidencia of codigo.matchAll(PATRON_TOKEN_RINFO)) {
    const inicio = coincidencia.index ?? 0;
    if (inicio > ultimoIndice) {
      resultado += escaparHTML(codigo.slice(ultimoIndice, inicio));
    }

    const [texto, comentario, cadena, operador, numero, identificador] = coincidencia;
    const textoSeguro = escaparHTML(texto);

    if (comentario) {
      resultado += `<span class="tok-comentario">${textoSeguro}</span>`;
    } else if (cadena) {
      resultado += `<span class="tok-cadena">${textoSeguro}</span>`;
    } else if (operador) {
      resultado += `<span class="tok-operador">${textoSeguro}</span>`;
    } else if (numero) {
      resultado += `<span class="tok-numero">${textoSeguro}</span>`;
    } else if (identificador) {
      if (PALABRAS_ESTRUCTURA.has(identificador)) {
        resultado += `<span class="tok-estructura">${textoSeguro}</span>`;
      } else if (PALABRAS_CONTROL.has(identificador)) {
        resultado += `<span class="tok-control">${textoSeguro}</span>`;
      } else if (PALABRAS_PRIMITIVA.has(identificador)) {
        resultado += `<span class="tok-primitiva">${textoSeguro}</span>`;
      } else if (PALABRAS_SENSOR.has(identificador)) {
        resultado += `<span class="tok-sensor">${textoSeguro}</span>`;
      } else {
        resultado += textoSeguro;
      }
    } else {
      resultado += textoSeguro;
    }

    ultimoIndice = inicio + texto.length;
  }

  if (ultimoIndice < codigo.length) {
    resultado += escaparHTML(codigo.slice(ultimoIndice));
  }

  return resultado;
}

/**
 * Construye un bloque de código R-Info enriquecido con barra superior,
 * resaltado sintáctico, numeración de líneas opcional y botón de copiado.
 * @param {string} codigo
 * @param {{ etiqueta?: string, conLineas?: boolean, idPre?: string }} [opciones]
 * @returns {string} HTML listo para insertar en el DOM
 */
export function crearBloqueCodigoHTML(codigo, { etiqueta = "R-Info", conLineas = false, idPre = "" } = {}) {
  const atributoId = idPre ? ` id="${escaparHTML(idPre)}"` : "";
  const codigoResaltado = conLineas
    ? codigo
        .split("\n")
        .map((linea, idx) => `<span class="linea-codigo"><span class="numero-linea">${idx + 1}</span><span>${resaltarCodigoRInfo(linea) || " "}</span></span>`)
        .join("\n")
    : resaltarCodigoRInfo(codigo);

  return `
    <div class="contenedor-codigo">
      <div class="barra-codigo">
        <span class="etiqueta-lenguaje">${escaparHTML(etiqueta)}</span>
        <button type="button" class="boton-copiar-codigo" data-accion="copiar-bloque" aria-label="Copiar código de ejemplo">
          ${iconoCopiar(13)} <span>Copiar</span>
        </button>
      </div>
      <pre class="bloque-codigo${conLineas ? " con-lineas" : ""}"${atributoId} data-codigo-plano="${escaparHTML(codigo)}">${codigoResaltado}</pre>
    </div>
  `;
}
