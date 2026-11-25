/**
 * Módulo de la vista Diccionario: búsqueda tolerante a tildes, resaltado,
 * filtros responsivos (chips en escritorio, lista desplegable en móvil),
 * ordenamiento, chips de filtros activos y enlace con el modal.
 */
import { DATOS_DICCIONARIO } from "../datos/diccionario.js";
import { seleccionar, seleccionarTodos, escaparHTML, normalizarTexto } from "./dom.js";
import { abrirModal } from "./modal.js";
import { copiarConConfirmacion } from "./portapapeles.js";
import { iconoCopiar } from "./iconos.js";
import { resaltarCodigoRInfo } from "./resaltador.js";

const CATEGORIAS = ["Todas", ...new Set(DATOS_DICCIONARIO.map(d => d.categoria))];

const ETIQUETAS_ALCANCE = {
  todos: "Todo R-Info",
  basico: "Solo Ingreso (PDF)",
  extendido: "Extendido / Concurrente"
};

const estado = {
  busqueda: "",
  categoria: "Todas",
  alcance: "todos",
  orden: "logico",
  menuMovilAbierto: false
};

/* ======================================================================
   Utilidades internas
   ====================================================================== */

/**
 * Resalta coincidencias de búsqueda de forma segura (sin tildes, sin XSS).
 */
function resaltarCoincidencia(texto, consultaNormalizada) {
  if (!consultaNormalizada) return escaparHTML(texto);

  const caracteres = [...texto];
  let textoNorm = "";
  const mapaIndices = [];

  caracteres.forEach((char, i) => {
    const limpio = normalizarTexto(char);
    for (let k = 0; k < limpio.length; k++) {
      textoNorm += limpio[k];
      mapaIndices.push(i);
    }
  });

  const idxInicioNorm = textoNorm.indexOf(consultaNormalizada);
  if (idxInicioNorm === -1) return escaparHTML(texto);

  const idxFinNorm = idxInicioNorm + consultaNormalizada.length - 1;
  const inicioOrig = mapaIndices[idxInicioNorm];
  const finOrig = mapaIndices[idxFinNorm] + 1;

  return (
    escaparHTML(caracteres.slice(0, inicioOrig).join("")) +
    `<mark class="resaltado-busqueda">${escaparHTML(caracteres.slice(inicioOrig, finOrig).join(""))}</mark>` +
    escaparHTML(caracteres.slice(finOrig).join(""))
  );
}

/**
 * Filtra por texto de búsqueda + alcance (sin aplicar categoría).
 */
function obtenerCoincidenciasTextoYAlcance() {
  const q = normalizarTexto(estado.busqueda.trim());

  return DATOS_DICCIONARIO.filter(elemento => {
    const coincideAlcance = estado.alcance === "todos" || elemento.alcance === estado.alcance;
    const coincideTexto = !q ||
      normalizarTexto(elemento.palabraClave).includes(q) ||
      normalizarTexto(elemento.descripcion).includes(q) ||
      normalizarTexto(elemento.categoria).includes(q) ||
      normalizarTexto(elemento.sintaxis).includes(q) ||
      normalizarTexto(elemento.nota).includes(q);
    return coincideAlcance && coincideTexto;
  });
}

/**
 * Calcula los conteos por categoría a partir de la base filtrada.
 */
function calcularConteos(base) {
  const conteo = new Map();
  base.forEach(item => {
    conteo.set(item.categoria, (conteo.get(item.categoria) ?? 0) + 1);
  });
  return conteo;
}

/**
 * Aplica el orden seleccionado a la lista filtrada.
 */
function ordenarResultados(lista) {
  if (estado.orden === "az") {
    return [...lista].sort((a, b) => a.palabraClave.localeCompare(b.palabraClave, "es"));
  }
  if (estado.orden === "za") {
    return [...lista].sort((a, b) => b.palabraClave.localeCompare(a.palabraClave, "es"));
  }
  // "logico" = orden original del array de datos
  return lista;
}

/**
 * ¿Hay algún filtro activo (distinto del estado por defecto)?
 */
function hayFiltrosActivos() {
  return (
    Boolean(estado.busqueda.trim()) ||
    estado.categoria !== "Todas" ||
    estado.alcance !== "todos"
  );
}

/* ======================================================================
   Chips de categoría (escritorio)
   ====================================================================== */

export function representarCategorias() {
  const contenedorCategorias = seleccionar("#filtrosCategoria");
  if (!contenedorCategorias) return;

  const base = obtenerCoincidenciasTextoYAlcance();
  const conteoPorCategoria = calcularConteos(base);

  contenedorCategorias.innerHTML = CATEGORIAS.map(categoria => {
    const estaActiva = estado.categoria === categoria;
    const cantidad = categoria === "Todas" ? base.length : (conteoPorCategoria.get(categoria) ?? 0);

    return `
      <button
        type="button"
        class="ficha ${estaActiva ? "activa" : ""}"
        data-accion="seleccionar-categoria"
        data-categoria="${escaparHTML(categoria)}"
        aria-pressed="${estaActiva}"
        ${cantidad === 0 && categoria !== "Todas" ? "disabled" : ""}
      >
        <span>${escaparHTML(categoria)}</span>
        <span class="contador-ficha">${cantidad}</span>
      </button>
    `;
  }).join("");

  // También actualizar el menú de categorías en móvil
  representarMenuMovilCategorias(base, conteoPorCategoria);
}

/* ======================================================================
   Menú desplegable de categorías (móvil)
   ====================================================================== */

function representarMenuMovilCategorias(base, conteoPorCategoria) {
  const menuMovil = seleccionar("#menuCategoriasMovil");
  const etiquetaActiva = seleccionar("#etiquetaCategoriaActiva");
  if (!menuMovil) return;

  menuMovil.innerHTML = CATEGORIAS.map(categoria => {
    const estaActiva = estado.categoria === categoria;
    const cantidad = categoria === "Todas" ? base.length : (conteoPorCategoria.get(categoria) ?? 0);
    const deshabilitada = cantidad === 0 && categoria !== "Todas";

    return `
      <button
        type="button"
        class="opcion-lista-filtro ${estaActiva ? "activa" : ""}"
        data-accion="seleccionar-categoria-movil"
        data-categoria="${escaparHTML(categoria)}"
        role="option"
        aria-selected="${estaActiva}"
        ${deshabilitada ? "disabled" : ""}
      >
        <span>${escaparHTML(categoria)}</span>
        <span class="meta-opcion-lista">
          <span class="conteo-opcion-lista">${cantidad}</span>
          ${estaActiva ? '<svg class="icono" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ""}
        </span>
      </button>
    `;
  }).join("");

  // Actualizar la etiqueta del botón desplegable
  if (etiquetaActiva) {
    const cantidadActiva = estado.categoria === "Todas"
      ? base.length
      : (conteoPorCategoria.get(estado.categoria) ?? 0);
    etiquetaActiva.textContent = `${estado.categoria} (${cantidadActiva})`;
  }
}

function toggleMenuMovil(forzarCerrar = false) {
  const boton = seleccionar("#botonMenuCategorias");
  const menu = seleccionar("#menuCategoriasMovil");
  if (!boton || !menu) return;

  const abierto = forzarCerrar ? false : !estado.menuMovilAbierto;
  estado.menuMovilAbierto = abierto;

  boton.setAttribute("aria-expanded", String(abierto));
  menu.hidden = !abierto;

  if (abierto) {
    // Enfocar la opción activa
    const activa = menu.querySelector(".opcion-lista-filtro.activa");
    activa?.focus();
  }
}

/* ======================================================================
   Chips de filtros activos
   ====================================================================== */

function representarFiltrosActivos() {
  const barra = seleccionar("#barraFiltrosActivos");
  const lista = seleccionar("#listaFiltrosActivos");
  const botonRestablecer = seleccionar("#botonRestablecerFiltros");
  if (!barra || !lista) return;

  const activos = hayFiltrosActivos();

  barra.hidden = !activos;
  barra.style.display = activos ? "" : "none";

  if (botonRestablecer) {
    botonRestablecer.hidden = !activos;
    botonRestablecer.style.display = activos ? "" : "none";
  }

  if (!activos) {
    lista.innerHTML = "";
    return;
  }

  const chips = [];

  if (estado.busqueda.trim()) {
    chips.push({
      tipo: "busqueda",
      texto: `Búsqueda: "${estado.busqueda.trim()}"`,
    });
  }

  if (estado.categoria !== "Todas") {
    chips.push({
      tipo: "categoria",
      texto: `Categoría: ${estado.categoria}`,
    });
  }

  if (estado.alcance !== "todos") {
    chips.push({
      tipo: "alcance",
      texto: ETIQUETAS_ALCANCE[estado.alcance] ?? estado.alcance,
    });
  }

  lista.innerHTML = chips.map(chip => `
    <button
      type="button"
      class="chip-filtro-activo"
      data-accion="quitar-filtro"
      data-tipo-filtro="${chip.tipo}"
      aria-label="Quitar filtro: ${escaparHTML(chip.texto)}"
    >
      <span>${escaparHTML(chip.texto)}</span>
      <svg class="icono" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `).join("");
}

/* ======================================================================
   Renderizar tarjetas de diccionario
   ====================================================================== */

export function representarDiccionario() {
  const cuadricula = seleccionar("#cuadriculaTarjetas");
  const etiquetaCantidad = seleccionar("#etiquetaCantidad");
  const botonLimpiar = seleccionar("#botonLimpiarBusqueda");
  if (!cuadricula || !etiquetaCantidad) return;

  const q = normalizarTexto(estado.busqueda.trim());
  const base = obtenerCoincidenciasTextoYAlcance();
  const filtradosSinOrden = base.filter(
    elemento => estado.categoria === "Todas" || elemento.categoria === estado.categoria
  );
  const filtrados = ordenarResultados(filtradosSinOrden);

  // Chips de filtros activos + botón restablecer
  representarFiltrosActivos();

  if (botonLimpiar) {
    const tieneTexto = estado.busqueda.length > 0;
    botonLimpiar.hidden = !tieneTexto;
    botonLimpiar.style.display = tieneTexto ? "" : "none";
  }

  etiquetaCantidad.textContent = `Mostrando ${filtrados.length} de ${DATOS_DICCIONARIO.length} elementos`;

  if (filtrados.length === 0) {
    cuadricula.innerHTML = `
      <div class="estado-vacio" role="status">
        <p>No se encontraron palabras clave con ese filtro.</p>
        <button type="button" class="boton principal" data-accion="restablecer-filtros">Restablecer todos los filtros</button>
      </div>
    `;
    return;
  }

  cuadricula.innerHTML = filtrados.map(elemento => {
    const claseDistintivo = elemento.alcance === "basico" ? "basico" : "extendido";
    const textoDistintivo = elemento.alcance === "basico" ? "Ingreso PDF" : "Extendido";

    return `
      <article
        class="tarjeta"
        data-accion="abrir-modal"
        data-palabra-clave="${escaparHTML(elemento.palabraClave)}"
        tabindex="0"
        role="button"
        aria-label="Ver detalles de ${escaparHTML(elemento.palabraClave)}"
      >
        <div class="cabecera-tarjeta">
          <span class="palabra-clave">${resaltarCoincidencia(elemento.palabraClave, q)}</span>
          <span class="distintivo ${claseDistintivo}">${textoDistintivo}</span>
        </div>
        <div class="etiqueta-categoria">${escaparHTML(elemento.categoria)}</div>
        <p class="descripcion">${resaltarCoincidencia(elemento.descripcion, q)}</p>
        <div class="vista-sintaxis">${resaltarCodigoRInfo(elemento.sintaxis)}</div>
        <div class="pie-tarjeta">
          <span>Clic para ver ejemplo y reglas</span>
          <button
            type="button"
            class="boton-copiar-pequeno"
            data-accion="copiar-palabra-clave"
            data-palabra-clave="${escaparHTML(elemento.palabraClave)}"
            aria-label="Copiar palabra clave ${escaparHTML(elemento.palabraClave)}"
          >${iconoCopiar(13)} <span>Copiar</span></button>
        </div>
      </article>
    `;
  }).join("");
}

/* ======================================================================
   Acciones públicas
   ====================================================================== */

export function buscarPalabraClave(palabraClave) {
  return DATOS_DICCIONARIO.find(d => d.palabraClave === palabraClave);
}

export function restablecerFiltros() {
  estado.busqueda = "";
  estado.categoria = "Todas";
  estado.alcance = "todos";
  estado.orden = "logico";

  const entradaBusqueda = seleccionar("#entradaBusqueda");
  if (entradaBusqueda) entradaBusqueda.value = "";

  const selectorOrden = seleccionar("#selectorOrden");
  if (selectorOrden) selectorOrden.value = "logico";

  seleccionarTodos(".boton-alcance").forEach(boton => {
    const sonTodos = boton.dataset.alcance === "todos";
    boton.classList.toggle("activa", sonTodos);
    boton.setAttribute("aria-pressed", String(sonTodos));
  });

  toggleMenuMovil(true); // cerrar el desplegable si estaba abierto

  representarCategorias();
  representarDiccionario();
}

/**
 * Quita un filtro específico por tipo.
 */
function quitarFiltro(tipo) {
  switch (tipo) {
    case "busqueda": {
      estado.busqueda = "";
      const entrada = seleccionar("#entradaBusqueda");
      if (entrada) entrada.value = "";
      break;
    }
    case "categoria":
      estado.categoria = "Todas";
      break;
    case "alcance": {
      estado.alcance = "todos";
      seleccionarTodos(".boton-alcance").forEach(boton => {
        const sonTodos = boton.dataset.alcance === "todos";
        boton.classList.toggle("activa", sonTodos);
        boton.setAttribute("aria-pressed", String(sonTodos));
      });
      break;
    }
  }
  representarCategorias();
  representarDiccionario();
}

/**
 * Abre directamente el modal sin alterar filtros.
 */
export function abrirPalabraClaveDirecta(palabraClave, elementoDisparador = null) {
  const elemento = buscarPalabraClave(palabraClave);
  if (!elemento) return;

  const tarjetaElemento = elementoDisparador ?? seleccionar(`.tarjeta[data-palabra-clave="${CSS.escape(palabraClave)}"]`);
  abrirModal(elemento, tarjetaElemento, DATOS_DICCIONARIO);
}

/**
 * Restablece filtros y abre una palabra clave desde otra vista (ej. Anatomía).
 */
export function filtrarYAbrirPalabraClave(palabraClave) {
  restablecerFiltros();
  abrirPalabraClaveDirecta(palabraClave);
}

/* ======================================================================
   Inicialización y Event Listeners
   ====================================================================== */

export function inicializarDiccionario() {
  const entradaBusqueda = seleccionar("#entradaBusqueda");
  const botonLimpiar = seleccionar("#botonLimpiarBusqueda");
  const botonIrResultados = seleccionar("#botonIrResultados");
  const botonRestablecer = seleccionar("#botonRestablecerFiltros");
  const contenedorCategorias = seleccionar("#filtrosCategoria");
  const selectorAlcance = seleccionar(".selector-alcance");
  const sugerenciasRapidas = seleccionar("#sugerenciasRapidas");
  const cuadricula = seleccionar("#cuadriculaTarjetas");
  const botonMenuCategorias = seleccionar("#botonMenuCategorias");
  const menuCategoriasMovil = seleccionar("#menuCategoriasMovil");
  const selectorOrden = seleccionar("#selectorOrden");
  const barraFiltrosActivos = seleccionar("#barraFiltrosActivos");

  /* --- Búsqueda --- */
  entradaBusqueda?.addEventListener("input", e => {
    estado.busqueda = e.target.value;
    representarCategorias();
    representarDiccionario();
  });

  entradaBusqueda?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      cuadricula?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (e.key === "Escape" && estado.busqueda) {
      e.stopPropagation();
      estado.busqueda = "";
      entradaBusqueda.value = "";
      representarCategorias();
      representarDiccionario();
    }
  });

  botonLimpiar?.addEventListener("click", () => {
    estado.busqueda = "";
    if (entradaBusqueda) {
      entradaBusqueda.value = "";
      entradaBusqueda.focus();
    }
    representarCategorias();
    representarDiccionario();
  });

  botonIrResultados?.addEventListener("click", () => {
    cuadricula?.scrollIntoView({ behavior: "smooth", block: "start" });
    entradaBusqueda?.focus();
  });

  /* --- Restablecer filtros --- */
  botonRestablecer?.addEventListener("click", () => {
    restablecerFiltros();
    entradaBusqueda?.focus();
  });

  /* --- Consultas rápidas (Frecuentes) --- */
  sugerenciasRapidas?.addEventListener("click", e => {
    const boton = e.target.closest("button[data-sugerencia]");
    const palabra = boton?.dataset.sugerencia;
    if (palabra) {
      abrirPalabraClaveDirecta(palabra, boton);
    }
  });

  /* --- Chips de categoría (escritorio) --- */
  contenedorCategorias?.addEventListener("click", e => {
    const boton = e.target.closest("button[data-categoria]");
    if (!boton || boton.disabled) return;
    estado.categoria = boton.dataset.categoria;
    representarCategorias();
    representarDiccionario();
  });

  /* --- Selector de alcance --- */
  selectorAlcance?.addEventListener("click", e => {
    const boton = e.target.closest("button[data-alcance]");
    if (!boton) return;

    seleccionarTodos(".boton-alcance", selectorAlcance).forEach(botonAlcance => {
      botonAlcance.classList.remove("activa");
      botonAlcance.setAttribute("aria-pressed", "false");
    });
    boton.classList.add("activa");
    boton.setAttribute("aria-pressed", "true");

    estado.alcance = boton.dataset.alcance;
    representarCategorias();
    representarDiccionario();
  });

  /* --- Menú desplegable de categorías (móvil) --- */
  botonMenuCategorias?.addEventListener("click", () => {
    toggleMenuMovil();
  });

  menuCategoriasMovil?.addEventListener("click", e => {
    const boton = e.target.closest("button[data-accion='seleccionar-categoria-movil']");
    if (!boton || boton.disabled) return;

    estado.categoria = boton.dataset.categoria;
    toggleMenuMovil(true);
    representarCategorias();
    representarDiccionario();
  });

  // Cerrar menú móvil al hacer clic afuera
  document.addEventListener("click", e => {
    if (!estado.menuMovilAbierto) return;
    const contenedor = seleccionar("#contenedorFiltroMovil");
    if (contenedor && !contenedor.contains(e.target)) {
      toggleMenuMovil(true);
    }
  });

  // Cerrar menú móvil con Escape
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && estado.menuMovilAbierto) {
      toggleMenuMovil(true);
      botonMenuCategorias?.focus();
    }
  });

  /* --- Selector de orden --- */
  selectorOrden?.addEventListener("change", e => {
    estado.orden = e.target.value;
    representarDiccionario();
  });

  /* --- Barra de filtros activos: quitar chips individuales --- */
  barraFiltrosActivos?.addEventListener("click", e => {
    const chip = e.target.closest("button[data-accion='quitar-filtro']");
    if (chip) {
      quitarFiltro(chip.dataset.tipoFiltro);
      return;
    }
    // El botón "Restablecer filtros" dentro de la barra
    const botonReset = e.target.closest("#botonRestablecerFiltros");
    if (botonReset) {
      restablecerFiltros();
      entradaBusqueda?.focus();
    }
  });

  /* --- Cuadrícula de tarjetas --- */
  if (cuadricula) {
    cuadricula.addEventListener("click", e => {
      const botonReset = e.target.closest('button[data-accion="restablecer-filtros"]');
      if (botonReset) {
        restablecerFiltros();
        entradaBusqueda?.focus();
        return;
      }

      const botonCopiar = e.target.closest('button[data-accion="copiar-palabra-clave"]');
      if (botonCopiar) {
        e.stopPropagation();
        const palabraClave = botonCopiar.dataset.palabraClave;
        if (palabraClave) copiarConConfirmacion(palabraClave, botonCopiar);
        return;
      }

      const tarjeta = e.target.closest('.tarjeta[data-accion="abrir-modal"]');
      if (tarjeta) {
        const palabraClave = tarjeta.dataset.palabraClave;
        const elemento = buscarPalabraClave(palabraClave);
        const filtrados = obtenerCoincidenciasTextoYAlcance().filter(
          item => estado.categoria === "Todas" || item.categoria === estado.categoria
        );
        if (elemento) abrirModal(elemento, tarjeta, filtrados);
      }
    });

    cuadricula.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        const botonCopiar = e.target.closest('button[data-accion="copiar-palabra-clave"]');
        if (botonCopiar) return;

        const tarjeta = e.target.closest('.tarjeta[data-accion="abrir-modal"]');
        if (tarjeta && e.target === tarjeta) {
          e.preventDefault();
          const palabraClave = tarjeta.dataset.palabraClave;
          const elemento = buscarPalabraClave(palabraClave);
          const filtrados = obtenerCoincidenciasTextoYAlcance().filter(
            item => estado.categoria === "Todas" || item.categoria === estado.categoria
          );
          if (elemento) abrirModal(elemento, tarjeta, filtrados);
        }
      }
    });
  }

  /* --- Inicialización --- */

  // Sincronizar con el valor inicial del campo de búsqueda (por ej. al recargar)
  if (entradaBusqueda && entradaBusqueda.value) {
    estado.busqueda = entradaBusqueda.value;
  }

  representarCategorias();
  representarDiccionario();

  // Garantiza coherencia si el navegador restaura estado desde BFCache
  window.addEventListener("pageshow", () => {
    estado.busqueda = entradaBusqueda?.value ?? "";
    representarCategorias();
    representarDiccionario();
  });
}
