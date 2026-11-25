/**
 * Módulo de copiado al portapapeles con gestión segura de temporizadores
 * y delegación global para bloques de código.
 */
import { anunciar, escaparHTML } from "./dom.js";
import { iconoVerificado, iconoAdvertencia } from "./iconos.js";

const htmlOriginalBotones = new WeakMap();
const temporizadoresBotones = new WeakMap();

/**
 * Copia texto al portapapeles usando navigator.clipboard como método primario
 * y un textarea temporal como respaldo para contextos sin HTTPS (ej. file://).
 * @param {string} texto
 * @returns {Promise<boolean>}
 */
export async function copiarAlPortapapeles(texto) {
  if (!texto) return false;

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // Continuar al respaldo en contextos restringidos
    }
  }

  try {
    const areaTexto = document.createElement("textarea");
    areaTexto.value = texto;
    areaTexto.setAttribute("readonly", "");
    areaTexto.style.cssText = "position:fixed;inset-block-start:-9999px;inset-inline-start:-9999px;opacity:0;";
    document.body.append(areaTexto);
    areaTexto.select();
    areaTexto.setSelectionRange(0, areaTexto.value.length);
    const exitoso = document.execCommand("copy");
    areaTexto.remove();
    return exitoso;
  } catch {
    return false;
  }
}

/**
 * Copia texto y muestra confirmación visual/accesible en el botón disparador.
 * Maneja múltiples clics rápidos cancelando temporizadores previos.
 * @param {string} texto
 * @param {HTMLButtonElement|null} [elementoBoton]
 * @param {string} [etiquetaConfirmacion="Copiado"]
 */
export async function copiarConConfirmacion(texto, elementoBoton = null, etiquetaConfirmacion = "Copiado") {
  const exito = await copiarAlPortapapeles(texto);
  if (!elementoBoton) return;

  if (!htmlOriginalBotones.has(elementoBoton)) {
    htmlOriginalBotones.set(elementoBoton, elementoBoton.innerHTML);
  }

  const temporizadorPrevio = temporizadoresBotones.get(elementoBoton);
  if (temporizadorPrevio) {
    clearTimeout(temporizadorPrevio);
  }

  if (exito) {
    elementoBoton.innerHTML = `${iconoVerificado(14)} <span>${escaparHTML(etiquetaConfirmacion)}</span>`;
    anunciar(`Texto copiado al portapapeles: ${texto.length > 40 ? `${texto.slice(0, 37)}...` : texto}`);
  } else {
    elementoBoton.innerHTML = `${iconoAdvertencia(14)} <span>Error al copiar</span>`;
    anunciar("No se pudo copiar el texto al portapapeles.");
  }

  const nuevoTemporizador = setTimeout(() => {
    const htmlOriginal = htmlOriginalBotones.get(elementoBoton);
    if (htmlOriginal !== undefined) {
      elementoBoton.innerHTML = htmlOriginal;
    }
    temporizadoresBotones.delete(elementoBoton);
  }, 1400);

  temporizadoresBotones.set(elementoBoton, nuevoTemporizador);
}

/**
 * Inicializa la delegación de clics para botones de copiado en bloques de código.
 */
export function inicializarCopiaBloques() {
  document.addEventListener("click", e => {
    const boton = e.target.closest('button[data-accion="copiar-bloque"]');
    if (!boton) return;

    const contenedor = boton.closest(".contenedor-codigo");
    const pre = contenedor?.querySelector("pre[data-codigo-plano]");
    const codigo = pre?.dataset.codigoPlano ?? pre?.textContent ?? "";
    if (codigo) {
      copiarConConfirmacion(codigo, boton, "Copiado");
    }
  });
}
