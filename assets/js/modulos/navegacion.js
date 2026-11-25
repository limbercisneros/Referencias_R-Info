/**
 * Módulo de navegación entre vistas, sincronización de hash URL, menú móvil y atajos.
 */
import { seleccionar, seleccionarTodos } from "./dom.js";

const observadoresCambioVista = new Set();

const VISTAS_POR_HASH = {
  "#diccionario": "vistaDiccionario",
  "#anatomia": "vistaAnatomia",
  "#simulador": "vistaSimulador",
  "#plantillas": "vistaPlantilla",
  "#plantilla": "vistaPlantilla"
};

const HASH_POR_VISTA = {
  vistaDiccionario: "#diccionario",
  vistaAnatomia: "#anatomia",
  vistaSimulador: "#simulador",
  vistaPlantilla: "#plantillas"
};

export function alCambiarVista(observador) {
  observadoresCambioVista.add(observador);
}

export function abrirMenuMovil() {
  const encabezado = seleccionar("#encabezadoPrincipal");
  const menuMovil = seleccionar("#menuMovil");
  const botonHamburguesa = seleccionar("#botonMenuHamburguesa");
  const telon = seleccionar("#telonMenuMovil");

  if (!menuMovil || !botonHamburguesa) return;

  encabezado?.classList.add("menu-abierto");
  menuMovil.classList.add("abierto");
  botonHamburguesa.classList.add("abierto");
  botonHamburguesa.setAttribute("aria-expanded", "true");
  botonHamburguesa.setAttribute("aria-label", "Cerrar menú de navegación");
  menuMovil.setAttribute("aria-hidden", "false");
  telon?.classList.add("activo");
  document.body.classList.add("menu-bloqueado");
}

export function cerrarMenuMovil() {
  const encabezado = seleccionar("#encabezadoPrincipal");
  const menuMovil = seleccionar("#menuMovil");
  const botonHamburguesa = seleccionar("#botonMenuHamburguesa");
  const telon = seleccionar("#telonMenuMovil");

  if (!menuMovil || !botonHamburguesa) return;

  encabezado?.classList.remove("menu-abierto");
  menuMovil.classList.remove("abierto");
  botonHamburguesa.classList.remove("abierto");
  botonHamburguesa.setAttribute("aria-expanded", "false");
  botonHamburguesa.setAttribute("aria-label", "Abrir menú de navegación");
  menuMovil.setAttribute("aria-hidden", "true");
  telon?.classList.remove("activo");
  document.body.classList.remove("menu-bloqueado");
}

export function alternarMenuMovil() {
  const menuMovil = seleccionar("#menuMovil");
  if (!menuMovil) return;
  if (menuMovil.classList.contains("abierto")) {
    cerrarMenuMovil();
  } else {
    abrirMenuMovil();
  }
}

/**
 * Cambia la vista visible de la aplicación y sincroniza el hash URL.
 * @param {string} identificadorVista
 * @param {{ actualizarHash?: boolean, desplazar?: boolean }} [opciones]
 */
export function cambiarVista(identificadorVista, { actualizarHash = true, desplazar = true } = {}) {
  const seccionesVista = seleccionarTodos(".seccion-vista");
  if (!seccionesVista.some(s => s.id === identificadorVista)) return;

  const botonesNavegacion = seleccionarTodos(
    ".pestanas-navegacion .boton[data-vista], .boton-menu-movil[data-vista]"
  );

  seccionesVista.forEach(seccion => {
    const estaActiva = seccion.id === identificadorVista;
    seccion.classList.toggle("activa", estaActiva);
    seccion.setAttribute("aria-hidden", String(!estaActiva));
  });

  botonesNavegacion.forEach(boton => {
    const estaActiva = boton.dataset.vista === identificadorVista;
    boton.classList.toggle("pestana-activa", estaActiva);
    if (estaActiva) {
      boton.setAttribute("aria-current", "page");
    } else {
      boton.removeAttribute("aria-current");
    }
  });

  if (actualizarHash) {
    const nuevoHash = HASH_POR_VISTA[identificadorVista];
    if (nuevoHash && window.location.hash !== nuevoHash) {
      history.replaceState(null, "", nuevoHash);
    }
  }

  cerrarMenuMovil();

  if (desplazar) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  observadoresCambioVista.forEach(observador => {
    try {
      observador(identificadorVista);
    } catch (error) {
      console.error("Error en observador de cambio de vista:", error);
    }
  });
}

export function inicializarNavegacion() {
  const botonHamburguesa = seleccionar("#botonMenuHamburguesa");
  const telon = seleccionar("#telonMenuMovil");

  botonHamburguesa?.addEventListener("click", e => {
    e.stopPropagation();
    alternarMenuMovil();
  });

  telon?.addEventListener("click", cerrarMenuMovil);

  document.addEventListener("click", e => {
    const elementoVista = e.target.closest("[data-vista]");
    if (elementoVista?.dataset.vista) {
      cambiarVista(elementoVista.dataset.vista);
      return;
    }

    const menuMovil = seleccionar("#menuMovil");
    const encabezado = seleccionar("#encabezadoPrincipal");
    if (menuMovil?.classList.contains("abierto") && encabezado && !encabezado.contains(e.target)) {
      cerrarMenuMovil();
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      const menuMovil = seleccionar("#menuMovil");
      if (menuMovil?.classList.contains("abierto")) {
        cerrarMenuMovil();
        botonHamburguesa?.focus();
        return;
      }
    }

    const entradaBusqueda = seleccionar("#entradaBusqueda");
    const elementoActivo = document.activeElement;
    const estaEscribiendo = elementoActivo && (
      elementoActivo.tagName === "INPUT" ||
      elementoActivo.tagName === "TEXTAREA" ||
      elementoActivo.isContentEditable
    );

    if (e.key === "/" && !estaEscribiendo && entradaBusqueda) {
      e.preventDefault();
      cambiarVista("vistaDiccionario");
      entradaBusqueda.focus();
    }
  });

  // Coincide exactamente con el breakpoint CSS (@media max-width: 900px)
  const consultaEscritorio = window.matchMedia("(min-width: 901px)");
  consultaEscritorio.addEventListener("change", evento => {
    if (evento.matches) {
      cerrarMenuMovil();
    }
  });

  // Navegación por hash URL al cargar o usar botones Atrás/Adelante
  const vistaInicial = VISTAS_POR_HASH[window.location.hash];
  if (vistaInicial) {
    cambiarVista(vistaInicial, { actualizarHash: false, desplazar: false });
  }

  window.addEventListener("hashchange", () => {
    const vista = VISTAS_POR_HASH[window.location.hash];
    if (vista) {
      cambiarVista(vista, { actualizarHash: false, desplazar: true });
    }
  });
}
