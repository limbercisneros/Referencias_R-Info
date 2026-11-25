/**
 * Módulo de gestión de tema (claro / oscuro) y paletas de colores curadas.
 */
import { seleccionar, seleccionarTodos, anunciar, escaparHTML } from "./dom.js";
import { iconoLuna, iconoSol, iconoVerificado } from "./iconos.js";

const CLAVE_ALMACENAMIENTO_TEMA = "preferencia_tema_rinfo";
const CLAVE_ALMACENAMIENTO_PALETA = "preferencia_paleta_rinfo";

export const PALETAS_DISPONIBLES = [
  {
    id: "cobalto",
    nombre: "Cobalto Nórdico",
    descripcion: "Porcelana / Obsidiana + Cian",
    coloresClaro: ["#2563eb", "#0ea5e9", "#f5f7fc"],
    coloresOscuro: ["#38bdf8", "#818cf8", "#060913"]
  },
  {
    id: "indigo",
    nombre: "Índigo & Cian",
    descripcion: "Estudio tech de alto contraste",
    coloresClaro: ["#4f46e5", "#06b6d4", "#f7f7fc"],
    coloresOscuro: ["#818cf8", "#22d3ee", "#080714"]
  },
  {
    id: "menta",
    nombre: "Menta Terminal",
    descripcion: "Esmeralda + consola limpia",
    coloresClaro: ["#059669", "#0d9488", "#f4faf7"],
    coloresOscuro: ["#34d399", "#2dd4bf", "#050d0a"]
  },
  {
    id: "coral",
    nombre: "Grafito & Coral",
    descripcion: "Carmesí estudio cálido",
    coloresClaro: ["#e11d48", "#f97316", "#faf8f6"],
    coloresOscuro: ["#fb7185", "#fb923c", "#0b090c"]
  }
];

export function obtenerTemaActual() {
  return document.documentElement.dataset.tema === "oscuro" ? "oscuro" : "claro";
}

export function obtenerPaletaActual() {
  const actual = document.documentElement.dataset.paleta;
  return PALETAS_DISPONIBLES.some(p => p.id === actual) ? actual : "cobalto";
}

function renderizarOpcionesPaleta() {
  const paletaActiva = obtenerPaletaActual();
  const esOscuro = obtenerTemaActual() === "oscuro";

  const popover = seleccionar("#popoverPaleta");
  if (popover) {
    popover.innerHTML = `
      <div class="titulo-popover-paleta">Elegir paleta</div>
      ${PALETAS_DISPONIBLES.map(p => {
        const activa = p.id === paletaActiva;
        const colores = esOscuro ? p.coloresOscuro : p.coloresClaro;
        return `
          <button type="button" class="opcion-paleta ${activa ? "activa" : ""}" data-seleccionar-paleta="${escaparHTML(p.id)}" aria-pressed="${activa}">
            <span class="info-opcion-paleta">
              <span class="circulos-paleta" aria-hidden="true">
                ${colores.map(c => `<span class="circulo-color" style="background:${c}"></span>`).join("")}
              </span>
              <span>
                <span class="nombre-opcion-paleta">${escaparHTML(p.nombre)}</span>
                <span class="desc-opcion-paleta">${escaparHTML(p.descripcion)}</span>
              </span>
            </span>
            ${activa ? iconoVerificado(15) : ""}
          </button>
        `;
      }).join("")}
    `;
  }

  const selectorMovil = seleccionar("#selectorPaletasMovil");
  if (selectorMovil) {
    selectorMovil.innerHTML = PALETAS_DISPONIBLES.map(p => {
      const activa = p.id === paletaActiva;
      const colores = esOscuro ? p.coloresOscuro : p.coloresClaro;
      return `
        <button type="button" class="boton-paleta-movil ${activa ? "activa" : ""}" data-seleccionar-paleta="${escaparHTML(p.id)}" aria-pressed="${activa}">
          <span class="circulos-paleta" aria-hidden="true">
            <span class="circulo-color" style="background:${colores[0]}"></span>
            <span class="circulo-color" style="background:${colores[1]}"></span>
          </span>
          <span>${escaparHTML(p.nombre.split(" ")[0])}</span>
        </button>
      `;
    }).join("");
  }
}

/**
 * Aplica una paleta de colores y actualiza la interfaz.
 * @param {string} idPaleta
 * @param {boolean} [debeAnunciar=false]
 */
export function aplicarPaleta(idPaleta, debeAnunciar = false) {
  const paleta = PALETAS_DISPONIBLES.find(p => p.id === idPaleta) ?? PALETAS_DISPONIBLES[0];
  document.documentElement.dataset.paleta = paleta.id;

  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO_PALETA, paleta.id);
  } catch {}

  renderizarOpcionesPaleta();

  if (debeAnunciar) {
    anunciar(`Paleta cambiada a ${paleta.nombre}`);
  }
}

/**
 * Aplica el tema claro u oscuro en el DOM y sincroniza botones.
 * @param {"claro"|"oscuro"} tema
 * @param {boolean} [debeAnunciar=false]
 */
export function aplicarTema(tema, debeAnunciar = false) {
  const esOscuro = tema === "oscuro";
  document.documentElement.dataset.tema = tema;
  document.documentElement.style.colorScheme = esOscuro ? "dark" : "light";

  const botonTema = seleccionar("#botonTema");
  const iconoTema = seleccionar("#iconoTema");
  const etiquetaTema = seleccionar("#etiquetaTema");
  const botonTemaMovil = seleccionar("#botonTemaMovil");
  const iconoTemaMovil = seleccionar("#iconoTemaMovil");
  const etiquetaTemaMovil = seleccionar("#etiquetaTemaMovil");

  const textoProximoTema = esOscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
  const iconoSvg = esOscuro ? iconoSol(18) : iconoLuna(18);

  if (botonTema) {
    botonTema.setAttribute("aria-label", textoProximoTema);
    botonTema.setAttribute("title", textoProximoTema);
  }
  if (iconoTema) iconoTema.innerHTML = iconoSvg;
  if (etiquetaTema) etiquetaTema.textContent = textoProximoTema;

  if (botonTemaMovil) botonTemaMovil.setAttribute("aria-label", textoProximoTema);
  if (iconoTemaMovil) iconoTemaMovil.innerHTML = iconoSvg;
  if (etiquetaTemaMovil) etiquetaTemaMovil.textContent = textoProximoTema;

  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO_TEMA, tema);
  } catch {}

  renderizarOpcionesPaleta();

  if (debeAnunciar) {
    anunciar(`Tema cambiado a ${esOscuro ? "oscuro" : "claro"}`);
  }
}

export function alternarTema() {
  aplicarTema(obtenerTemaActual() === "oscuro" ? "claro" : "oscuro", true);
}

function alternarPopoverPaleta(forzarCerrar = false) {
  const popover = seleccionar("#popoverPaleta");
  const boton = seleccionar("#botonPaleta");
  if (!popover || !boton) return;

  const abrir = forzarCerrar ? false : !popover.classList.contains("abierto");
  popover.classList.toggle("abierto", abrir);
  popover.setAttribute("aria-hidden", String(!abrir));
  boton.setAttribute("aria-expanded", String(abrir));
}

export function inicializarTema() {
  let temaGuardado = null;
  let paletaGuardada = null;

  try {
    temaGuardado = localStorage.getItem(CLAVE_ALMACENAMIENTO_TEMA);
    paletaGuardada = localStorage.getItem(CLAVE_ALMACENAMIENTO_PALETA);
  } catch {}

  if (temaGuardado !== "claro" && temaGuardado !== "oscuro") {
    temaGuardado = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
  }

  aplicarPaleta(paletaGuardada ?? "cobalto", false);
  aplicarTema(temaGuardado, false);

  seleccionar("#botonTema")?.addEventListener("click", alternarTema);
  seleccionar("#botonTemaMovil")?.addEventListener("click", alternarTema);

  seleccionar("#botonPaleta")?.addEventListener("click", e => {
    e.stopPropagation();
    alternarPopoverPaleta();
  });

  document.addEventListener("click", e => {
    const opcion = e.target.closest("[data-seleccionar-paleta]");
    if (opcion?.dataset.seleccionarPaleta) {
      aplicarPaleta(opcion.dataset.seleccionarPaleta, true);
      alternarPopoverPaleta(true);
      return;
    }

    const popover = seleccionar("#popoverPaleta");
    const botonPaleta = seleccionar("#botonPaleta");
    if (popover?.classList.contains("abierto") && !popover.contains(e.target) && !botonPaleta?.contains(e.target)) {
      alternarPopoverPaleta(true);
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      alternarPopoverPaleta(true);
    }
  });

  // Mantener sincronía si otros scripts consultan paletas
  seleccionarTodos("[data-seleccionar-paleta]");
}
