/**
 * Punto de entrada principal de la aplicación R-Info (UNLP).
 * Orquesta los módulos ES independientes y la vista de Plantillas.
 */
import { PLANTILLAS_RINFO, REGLAS_SINTAXIS } from "./datos/plantillas.js";
import { seleccionar, escaparHTML } from "./modulos/dom.js";
import { inicializarTema } from "./modulos/tema.js";
import { inicializarNavegacion, alCambiarVista } from "./modulos/navegacion.js";
import { inicializarModal } from "./modulos/modal.js";
import { inicializarDiccionario } from "./modulos/diccionario.js";
import { inicializarAnatomia } from "./modulos/anatomia.js";
import { inicializarSimulador, evaluarExpresion } from "./modulos/simulador.js";
import { copiarConConfirmacion, inicializarCopiaBloques } from "./modulos/portapapeles.js";
import { crearBloqueCodigoHTML } from "./modulos/resaltador.js";

let plantillaActivaId = PLANTILLAS_RINFO[0].identificador;

function renderizarPlantillas() {
  const selector = seleccionar("#selectorPlantillas");
  const contenedorCodigo = seleccionar("#contenedorCodigoPlantilla");
  const contenedorReglas = seleccionar("#reglasSintaxisPlantilla");
  const plantillaActual = PLANTILLAS_RINFO.find(p => p.identificador === plantillaActivaId) ?? PLANTILLAS_RINFO[0];

  if (selector) {
    selector.innerHTML = PLANTILLAS_RINFO.map(p => {
      const activa = p.identificador === plantillaActual.identificador;
      return `
        <button
          type="button"
          class="ficha ${activa ? "activa" : ""}"
          data-plantilla="${escaparHTML(p.identificador)}"
          aria-pressed="${activa}"
        >${escaparHTML(p.titulo)}</button>
      `;
    }).join("");
  }

  if (contenedorCodigo) {
    contenedorCodigo.innerHTML = `
      <p class="descripcion-plantilla">${escaparHTML(plantillaActual.descripcion)}</p>
      ${crearBloqueCodigoHTML(plantillaActual.codigo, {
        etiqueta: `${plantillaActual.titulo} · R-Info`,
        conLineas: true,
        idPre: "codigoPlantilla"
      })}
    `;
  }

  if (contenedorReglas && contenedorReglas.childElementCount === 0) {
    contenedorReglas.innerHTML = REGLAS_SINTAXIS.map(regla => `
      <div class="regla-sintaxis-card">
        <strong>${escaparHTML(regla.titulo)}</strong>
        <p>${escaparHTML(regla.detalle)}</p>
      </div>
    `).join("");
  }
}

function inicializarPlantillas() {
  const selector = seleccionar("#selectorPlantillas");
  const botonCopiar = seleccionar('#vistaPlantilla button[data-accion="copiar-plantilla"]');

  selector?.addEventListener("click", e => {
    const boton = e.target.closest("button[data-plantilla]");
    if (boton?.dataset.plantilla) {
      plantillaActivaId = boton.dataset.plantilla;
      renderizarPlantillas();
    }
  });

  botonCopiar?.addEventListener("click", () => {
    const plantillaActual = PLANTILLAS_RINFO.find(p => p.identificador === plantillaActivaId) ?? PLANTILLAS_RINFO[0];
    copiarConConfirmacion(plantillaActual.codigo, botonCopiar, "Plantilla copiada");
  });

  renderizarPlantillas();
}

function inicializarAplicacion() {
  inicializarTema();
  inicializarNavegacion();
  alCambiarVista(identificadorVista => {
    if (identificadorVista === "vistaSimulador") {
      evaluarExpresion();
    }
  });

  inicializarModal();
  inicializarDiccionario();
  inicializarAnatomia();
  inicializarSimulador();
  inicializarPlantillas();
  inicializarCopiaBloques();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarAplicacion);
} else {
  inicializarAplicacion();
}
