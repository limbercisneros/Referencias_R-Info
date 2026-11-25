/**
 * Módulo de diálogo modal nativo (<dialog>) con navegación Anterior/Siguiente
 * y enlace directo al Simulador Lógico cuando aplica.
 */
import { seleccionar, escaparHTML } from "./dom.js";
import { copiarConConfirmacion } from "./portapapeles.js";
import { resaltarCodigoRInfo, crearBloqueCodigoHTML } from "./resaltador.js";
import { cambiarVista } from "./navegacion.js";

let elementoActual = null;
let listaActual = [];
let indiceActual = -1;
let ultimoElementoEnfocado = null;

const CATEGORIAS_SIMULADOR = new Set(["Sensores y Estado", "Operadores"]);
const EXPRESIONES_SUGERIDAS = {
  PosAv: "PosAv < 100",
  PosCa: "PosCa < 100",
  HayFlorEnLaEsquina: "HayFlorEnLaEsquina & ~HayPapelEnLaEsquina",
  HayPapelEnLaEsquina: "HayPapelEnLaEsquina | HayFlorEnLaEsquina",
  HayFlorEnLaBolsa: "HayFlorEnLaBolsa & ~HayFlorEnLaEsquina",
  HayPapelEnLaBolsa: "HayPapelEnLaBolsa",
  "&": "HayFlorEnLaEsquina & HayFlorEnLaBolsa",
  "|": "HayFlorEnLaEsquina | HayPapelEnLaEsquina",
  "~": "~(HayFlorEnLaEsquina | HayPapelEnLaEsquina)",
  "=  <>  <  >  <=  >=": "PosAv <> PosCa"
};

function actualizarContenidoDialogo() {
  const elemento = elementoActual;
  if (!elemento) return;

  const elementoTitulo = seleccionar("#tituloModal");
  const elementoAlcance = seleccionar("#alcanceModal");
  const elementoCategoria = seleccionar("#categoriaModal");
  const elementoDescripcion = seleccionar("#descripcionModal");
  const elementoSintaxis = seleccionar("#sintaxisModal");
  const contenedorEjemplo = seleccionar("#ejemploModalContenedor");
  const elementoNota = seleccionar("#notaModal");
  const cuerpoModal = seleccionar("#modalCuerpo");
  const contadorModal = seleccionar("#contadorModal");
  const botonAnterior = seleccionar("#botonAnteriorModal");
  const botonSiguiente = seleccionar("#botonSiguienteModal");
  const botonProbar = seleccionar("#botonProbarSimulador");

  if (elementoTitulo) elementoTitulo.textContent = elemento.palabraClave;
  if (elementoAlcance) {
    const esBasico = elemento.alcance === "basico";
    elementoAlcance.className = `distintivo ${esBasico ? "basico" : "extendido"}`;
    elementoAlcance.textContent = esBasico ? "Ingreso PDF" : "Extendido";
  }
  if (elementoCategoria) {
    elementoCategoria.textContent = `Categoría: ${elemento.categoria}`;
  }
  if (elementoDescripcion) elementoDescripcion.textContent = elemento.descripcion;
  if (elementoSintaxis) elementoSintaxis.innerHTML = resaltarCodigoRInfo(elemento.sintaxis);
  if (contenedorEjemplo) {
    contenedorEjemplo.innerHTML = crearBloqueCodigoHTML(elemento.ejemplo, { etiqueta: "Ejemplo R-Info" });
  }
  if (elementoNota) {
    elementoNota.innerHTML = `<strong>Dato clave:</strong> ${escaparHTML(elemento.nota)}`;
  }
  if (cuerpoModal) {
    cuerpoModal.scrollTop = 0;
  }
  // También resetear scroll del diálogo (el contenedor scrollable real)
  const dialogo = seleccionar("#modalDetalle");
  if (dialogo) dialogo.scrollTop = 0;
  if (contadorModal) {
    contadorModal.textContent = listaActual.length > 1 ? `${indiceActual + 1} / ${listaActual.length}` : "";
  }

  if (botonAnterior) {
    botonAnterior.disabled = listaActual.length <= 1 || indiceActual <= 0;
  }
  if (botonSiguiente) {
    botonSiguiente.disabled = listaActual.length <= 1 || indiceActual >= listaActual.length - 1;
  }

  if (botonProbar) {
    const esProbable = CATEGORIAS_SIMULADOR.has(elemento.categoria) && Boolean(EXPRESIONES_SUGERIDAS[elemento.palabraClave]);
    botonProbar.hidden = !esProbable;
  }
}

/**
 * Abre el diálogo nativo con la información de una palabra clave.
 * @param {object} elemento
 * @param {HTMLElement|null} [elementoDisparador]
 * @param {object[]} [listaNavegacion]
 */
export function abrirModal(elemento, elementoDisparador = null, listaNavegacion = []) {
  const dialogo = seleccionar("#modalDetalle");
  if (!dialogo || !elemento) return;

  elementoActual = elemento;
  listaActual = Array.isArray(listaNavegacion) && listaNavegacion.length > 0 ? listaNavegacion : [elemento];
  indiceActual = listaActual.findIndex(item => item.palabraClave === elemento.palabraClave);
  ultimoElementoEnfocado = elementoDisparador ?? document.activeElement;

  actualizarContenidoDialogo();

  if (!dialogo.open) {
    dialogo.showModal();
  }
}

export function cerrarModal() {
  const dialogo = seleccionar("#modalDetalle");
  if (dialogo?.open) {
    dialogo.close();
  }
}

function navegarModal(desplazamiento) {
  const nuevoIndice = indiceActual + desplazamiento;
  if (nuevoIndice < 0 || nuevoIndice >= listaActual.length) return;
  indiceActual = nuevoIndice;
  elementoActual = listaActual[indiceActual];
  actualizarContenidoDialogo();
}

export function inicializarModal() {
  const dialogo = seleccionar("#modalDetalle");
  const botonCerrar = seleccionar("#botonCerrarModal");
  const botonCopiar = seleccionar("#botonCopiarModal");
  const botonAnterior = seleccionar("#botonAnteriorModal");
  const botonSiguiente = seleccionar("#botonSiguienteModal");
  const botonProbar = seleccionar("#botonProbarSimulador");

  if (!dialogo) return;

  botonCerrar?.addEventListener("click", cerrarModal);

  botonCopiar?.addEventListener("click", () => {
    if (elementoActual?.palabraClave) {
      copiarConConfirmacion(elementoActual.palabraClave, botonCopiar, "Palabra copiada");
    }
  });

  botonAnterior?.addEventListener("click", () => navegarModal(-1));
  botonSiguiente?.addEventListener("click", () => navegarModal(1));

  botonProbar?.addEventListener("click", () => {
    const expresion = EXPRESIONES_SUGERIDAS[elementoActual?.palabraClave];
    cerrarModal();
    if (expresion) {
      const entrada = seleccionar("#entradaExpresion");
      if (entrada) {
        entrada.value = expresion;
        entrada.dispatchEvent(new Event("input", { bubbles: true }));
      }
      cambiarVista("vistaSimulador");
    }
  });

  // Cerrar al hacer clic sobre el telón (::backdrop)
  dialogo.addEventListener("click", e => {
    if (e.target === dialogo) {
      cerrarModal();
    }
  });

  dialogo.addEventListener("close", () => {
    if (ultimoElementoEnfocado && typeof ultimoElementoEnfocado.focus === "function") {
      ultimoElementoEnfocado.focus();
    }
    ultimoElementoEnfocado = null;
    elementoActual = null;
  });

  dialogo.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") {
      navegarModal(-1);
    } else if (e.key === "ArrowRight") {
      navegarModal(1);
    }
  });
}
