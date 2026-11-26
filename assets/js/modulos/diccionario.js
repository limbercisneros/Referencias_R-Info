/**
 * Módulo de la vista Diccionario: barra de comando unificada,
 * búsqueda tolerante a tildes, filtros responsivos (chips en escritorio, lista en móvil),
 * índice interactivo y panel inspector en vivo (maestro-detalle).
 */
import { DATOS_DICCIONARIO } from "../datos/diccionario.js";
import { seleccionar, seleccionarTodos, escaparHTML, normalizarTexto } from "./dom.js";
import { abrirModal, obtenerExpresionSugerida, abrirEnSimulador } from "./modal.js";
import { copiarConConfirmacion } from "./portapapeles.js";
import { iconoCopiar } from "./iconos.js";
import { resaltarCodigoRInfo, crearBloqueCodigoHTML } from "./resaltador.js";

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
  menuMovilAbierto: false,
  seleccionada: DATOS_DICCIONARIO[0]?.palabraClave ?? null
};

function esVistaEscritorio() {
  return Boolean(window.matchMedia?.("(min-width: 961px)").matches);
}

/* ======================================================================
   Utilidades internas
   ====================================================================== */

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

function calcularConteos(base) {
  const conteo = new Map();
  base.forEach(item => {
    conteo.set(item.categoria, (conteo.get(item.categoria) ?? 0) + 1);
  });
  return conteo;
}

function ordenarResultados(lista) {
  if (estado.orden === "az") {
    return [...lista].sort((a, b) => a.palabraClave.localeCompare(b.palabraClave, "es"));
  }
  if (estado.orden === "za") {
    return [...lista].sort((a, b) => b.palabraClave.localeCompare(a.palabraClave, "es"));
  }
  return lista;
}

function obtenerListaFiltradaOrdenada() {
  const base = obtenerCoincidenciasTextoYAlcance();
  const filtrados = base.filter(
    elemento => estado.categoria === "Todas" || elemento.categoria === estado.categoria
  );
  return ordenarResultados(filtrados);
}

function hayFiltrosActivos() {
  return (
    Boolean(estado.busqueda.trim()) ||
    estado.categoria !== "Todas" ||
    estado.alcance !== "todos"
  );
}

/* ======================================================================
   Chips de categoría (escritorio) + menú móvil
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

  representarMenuMovilCategorias(base, conteoPorCategoria);
}

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
    const activa = menu.querySelector?.(".opcion-lista-filtro.activa");
    activa?.focus?.();
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
      texto: `Búsqueda: "${estado.busqueda.trim()}"`
    });
  }

  if (estado.categoria !== "Todas") {
    chips.push({
      tipo: "categoria",
      texto: `Categoría: ${estado.categoria}`
    });
  }

  if (estado.alcance !== "todos") {
    chips.push({
      tipo: "alcance",
      texto: ETIQUETAS_ALCANCE[estado.alcance] ?? estado.alcance
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
   Inspector lateral en vivo (Escritorio)
   ====================================================================== */

function representarInspector(filtrados) {
  const inspector = seleccionar("#inspectorDiccionario");
  if (!inspector) return;

  let elemento = buscarPalabraClave(estado.seleccionada);
  const indiceEnFiltrados = filtrados.findIndex(item => item.palabraClave === estado.seleccionada);

  if (!elemento && filtrados.length > 0) {
    elemento = filtrados[0];
    estado.seleccionada = elemento.palabraClave;
  }

  if (!elemento) {
    inspector.innerHTML = `
      <div class="inspector-vacio">
        <p>Elegí una palabra clave o restablecé los filtros para ver su sintaxis y ejemplo.</p>
      </div>
    `;
    return;
  }

  const esBasico = elemento.alcance === "basico";
  const claseDistintivo = esBasico ? "basico" : "extendido";
  const textoDistintivo = esBasico ? "Ingreso PDF" : "Extendido";
  const expresionSimulador = obtenerExpresionSugerida(elemento);
  const listaNav = indiceEnFiltrados >= 0 ? filtrados : DATOS_DICCIONARIO;
  const indiceNav = listaNav.findIndex(item => item.palabraClave === elemento.palabraClave);

  inspector.scrollTop = 0;
  inspector.innerHTML = `
    <div class="cabecera-inspector">
      <div class="inspector-titulo-fila">
        <span class="palabra-clave">${escaparHTML(elemento.palabraClave)}</span>
        <span class="distintivo ${claseDistintivo}">${textoDistintivo}</span>
      </div>

      <div class="acciones-inspector">
        ${expresionSimulador ? `
          <button type="button" class="boton sutil" data-accion="probar-simulador-inspector" data-palabra-clave="${escaparHTML(elemento.palabraClave)}">
            Probar
          </button>
        ` : ""}
        <button
          type="button"
          class="boton principal"
          data-accion="copiar-inspector"
          data-palabra-clave="${escaparHTML(elemento.palabraClave)}"
        >
          ${iconoCopiar(14)}
          <span>Copiar</span>
        </button>
      </div>
    </div>

    <div class="inspector-cuerpo">
      <div class="etiqueta-categoria">Categoría: ${escaparHTML(elemento.categoria)}</div>

      <p class="descripcion-modal">${escaparHTML(elemento.descripcion)}</p>

      <div class="bloque-sintaxis-modal">
        <div class="etiqueta-seccion">Sintaxis oficial</div>
        <div class="vista-sintaxis">${resaltarCodigoRInfo(elemento.sintaxis)}</div>
      </div>

      <div class="bloque-ejemplo-modal">
        <div class="etiqueta-seccion">Ejemplo en R-Info</div>
        ${crearBloqueCodigoHTML(elemento.ejemplo, { etiqueta: "Ejemplo R-Info" })}
      </div>

      <div class="caja-nota">
        <strong>Dato clave:</strong> ${escaparHTML(elemento.nota)}
      </div>
    </div>

    <div class="pie-inspector">
      <div class="navegacion-modal">
        <button
          type="button"
          class="boton sutil"
          data-accion="inspector-anterior"
          ${indiceNav <= 0 ? "disabled" : ""}
        >← Anterior</button>
        <span class="contador-modal">${indiceNav + 1} / ${listaNav.length}</span>
        <button
          type="button"
          class="boton sutil"
          data-accion="inspector-siguiente"
          ${indiceNav >= listaNav.length - 1 ? "disabled" : ""}
        >Siguiente →</button>
      </div>

      <button
        type="button"
        class="boton sutil"
        data-accion="ampliar-modal-inspector"
        data-palabra-clave="${escaparHTML(elemento.palabraClave)}"
        title="Abrir en vista ampliada"
      >Vista ampliada</button>
    </div>
  `;
}

/* ======================================================================
   Renderizar índice de palabras clave + inspector
   ====================================================================== */

export function representarDiccionario() {
  const listaContenedor = seleccionar("#cuadriculaTarjetas");
  const etiquetaCantidad = seleccionar("#etiquetaCantidad");
  const botonLimpiar = seleccionar("#botonLimpiarBusqueda");
  if (!listaContenedor || !etiquetaCantidad) return;

  const q = normalizarTexto(estado.busqueda.trim());
  const filtrados = obtenerListaFiltradaOrdenada();

  // Mantener selección coherente cuando el filtro actual excluye el elemento activo
  if (filtrados.length > 0 && !filtrados.some(item => item.palabraClave === estado.seleccionada)) {
    estado.seleccionada = filtrados[0].palabraClave;
  }

  representarFiltrosActivos();

  if (botonLimpiar) {
    const tieneTexto = estado.busqueda.length > 0;
    botonLimpiar.hidden = !tieneTexto;
    botonLimpiar.style.display = tieneTexto ? "" : "none";
  }

  etiquetaCantidad.textContent = `Mostrando ${filtrados.length} de ${DATOS_DICCIONARIO.length} elementos`;

  if (filtrados.length === 0) {
    listaContenedor.innerHTML = `
      <div class="estado-vacio" role="status">
        <p>No se encontraron palabras clave con ese filtro.</p>
        <button type="button" class="boton principal" data-accion="restablecer-filtros">Restablecer todos los filtros</button>
      </div>
    `;
    representarInspector(filtrados);
    return;
  }

  listaContenedor.innerHTML = filtrados.map(elemento => {
    const esBasico = elemento.alcance === "basico";
    const claseDistintivo = esBasico ? "basico" : "extendido";
    const textoDistintivo = esBasico ? "Ingreso" : "Extendido";
    const estaActiva = elemento.palabraClave === estado.seleccionada;

    return `
      <article
        class="fila-diccionario ${estaActiva ? "activa" : ""}"
        data-accion="abrir-modal"
        data-palabra-clave="${escaparHTML(elemento.palabraClave)}"
        tabindex="0"
        role="button"
        aria-pressed="${estaActiva}"
        aria-label="Ver detalles de ${escaparHTML(elemento.palabraClave)}"
      >
        <div class="fila-principal">
          <div class="fila-cabecera-movil">
            <span class="palabra-clave">${resaltarCoincidencia(elemento.palabraClave, q)}</span>
            <span class="distintivo ${claseDistintivo} solo-movil-distintivo">${textoDistintivo}</span>
          </div>
          <div class="fila-texto">
            <p class="fila-descripcion">${resaltarCoincidencia(elemento.descripcion, q)}</p>
            <span class="fila-categoria">${escaparHTML(elemento.categoria)}</span>
          </div>
        </div>
        <div class="fila-acciones">
          <span class="distintivo ${claseDistintivo} solo-escritorio-distintivo">${textoDistintivo}</span>
          <button
            type="button"
            class="boton-copiar-pequeno"
            data-accion="copiar-palabra-clave"
            data-palabra-clave="${escaparHTML(elemento.palabraClave)}"
            aria-label="Copiar palabra clave ${escaparHTML(elemento.palabraClave)}"
            title="Copiar palabra clave"
          >${iconoCopiar(13)} <span class="texto-copiar-fila">Copiar</span></button>
        </div>
      </article>
    `;
  }).join("");

  representarInspector(filtrados);
}

/* ======================================================================
   Acciones públicas
   ====================================================================== */

export function buscarPalabraClave(palabraClave) {
  return DATOS_DICCIONARIO.find(d => d.palabraClave === palabraClave);
}

function seleccionarEnInspector(palabraClave) {
  const elemento = buscarPalabraClave(palabraClave);
  if (!elemento) return;
  estado.seleccionada = elemento.palabraClave;
  representarDiccionario();
}

export function restablecerFiltros() {
  estado.busqueda = "";
  estado.categoria = "Todas";
  estado.alcance = "todos";
  estado.orden = "logico";
  estado.seleccionada = DATOS_DICCIONARIO[0]?.palabraClave ?? null;

  const entradaBusqueda = seleccionar("#entradaBusqueda");
  if (entradaBusqueda) entradaBusqueda.value = "";

  const selectorOrden = seleccionar("#selectorOrden");
  if (selectorOrden) selectorOrden.value = "logico";

  seleccionarTodos(".boton-alcance").forEach(boton => {
    const sonTodos = boton.dataset.alcance === "todos";
    boton.classList.toggle("activa", sonTodos);
    boton.setAttribute("aria-pressed", String(sonTodos));
  });

  toggleMenuMovil(true);

  representarCategorias();
  representarDiccionario();
}

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
 * Abre directamente el modal de una palabra clave sin alterar ni ensuciar
 * los filtros actuales del diccionario.
 */
export function abrirPalabraClaveDirecta(palabraClave, elementoDisparador = null) {
  const elemento = buscarPalabraClave(palabraClave);
  if (!elemento) return;

  estado.seleccionada = elemento.palabraClave;
  const tarjetaElemento = elementoDisparador ?? seleccionar(`.fila-diccionario[data-palabra-clave="${CSS.escape(palabraClave)}"]`);
  abrirModal(elemento, tarjetaElemento, DATOS_DICCIONARIO);
}

/**
 * Restablece filtros y selecciona o abre una palabra clave desde otra vista (ej. Anatomía).
 */
export function filtrarYAbrirPalabraClave(palabraClave) {
  restablecerFiltros();
  if (esVistaEscritorio()) {
    seleccionarEnInspector(palabraClave);
  } else {
    abrirPalabraClaveDirecta(palabraClave);
  }
}

/* ======================================================================
   Inicialización y Event Listeners
   ====================================================================== */

export function inicializarDiccionario() {
  const entradaBusqueda = seleccionar("#entradaBusqueda");
  const botonLimpiar = seleccionar("#botonLimpiarBusqueda");
  const botonRestablecer = seleccionar("#botonRestablecerFiltros");
  const contenedorCategorias = seleccionar("#filtrosCategoria");
  const selectorAlcance = seleccionar(".selector-alcance");
  const sugerenciasRapidas = seleccionar("#sugerenciasRapidas");
  const listaContenedor = seleccionar("#cuadriculaTarjetas");
  const inspector = seleccionar("#inspectorDiccionario");
  const botonMenuCategorias = seleccionar("#botonMenuCategorias");
  const menuCategoriasMovil = seleccionar("#menuCategoriasMovil");
  const selectorOrden = seleccionar("#selectorOrden");
  const barraFiltrosActivos = seleccionar("#barraFiltrosActivos");
  const resumenHero = seleccionar("#resumenEstadisticasHero");

  if (resumenHero) {
    resumenHero.textContent = `${DATOS_DICCIONARIO.length} palabras · ${CATEGORIAS.length - 1} categorías`;
  }

  /* --- Búsqueda --- */
  entradaBusqueda?.addEventListener("input", e => {
    estado.busqueda = e.target.value;
    representarCategorias();
    representarDiccionario();
  });

  entradaBusqueda?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const primeraFila = listaContenedor?.querySelector?.(".fila-diccionario");
      if (primeraFila) {
        estado.seleccionada = primeraFila.dataset.palabraClave;
        representarDiccionario();
        primeraFila.focus?.();
      }
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

  /* --- Restablecer filtros --- */
  botonRestablecer?.addEventListener("click", () => {
    restablecerFiltros();
    entradaBusqueda?.focus();
  });

  /* --- Consultas rápidas (Frecuentes) --- */
  sugerenciasRapidas?.addEventListener("click", e => {
    const boton = e.target.closest("button[data-sugerencia]");
    const palabra = boton?.dataset.sugerencia;
    if (!palabra) return;

    if (esVistaEscritorio()) {
      seleccionarEnInspector(palabra);
    } else {
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

  document.addEventListener("click", e => {
    if (!estado.menuMovilAbierto) return;
    const contenedor = seleccionar("#contenedorFiltroMovil");
    if (contenedor && !contenedor.contains(e.target)) {
      toggleMenuMovil(true);
    }
  });

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
    const botonReset = e.target.closest("#botonRestablecerFiltros");
    if (botonReset) {
      restablecerFiltros();
      entradaBusqueda?.focus();
    }
  });

  /* --- Índice de palabras clave (clics y teclado ↑/↓) --- */
  if (listaContenedor) {
    const activarFila = fila => {
      const palabraClave = fila.dataset.palabraClave;
      const elemento = buscarPalabraClave(palabraClave);
      if (!elemento) return;

      if (esVistaEscritorio()) {
        estado.seleccionada = palabraClave;
        representarDiccionario();
        // Mantener foco en la fila seleccionada tras re-render
        const filaNueva = listaContenedor.querySelector(`.fila-diccionario[data-palabra-clave="${CSS.escape(palabraClave)}"]`);
        filaNueva?.focus?.({ preventScroll: true });
      } else {
        abrirModal(elemento, fila, obtenerListaFiltradaOrdenada());
      }
    };

    listaContenedor.addEventListener("click", e => {
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

      const fila = e.target.closest('.fila-diccionario[data-accion="abrir-modal"]');
      if (fila) activarFila(fila);
    });

    listaContenedor.addEventListener("keydown", e => {
      const fila = e.target.closest('.fila-diccionario[data-accion="abrir-modal"]');
      if (!fila || e.target !== fila) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activarFila(fila);
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const filtrados = obtenerListaFiltradaOrdenada();
        const idx = filtrados.findIndex(item => item.palabraClave === fila.dataset.palabraClave);
        if (idx === -1) return;
        const siguienteIdx = e.key === "ArrowDown"
          ? Math.min(filtrados.length - 1, idx + 1)
          : Math.max(0, idx - 1);
        const siguientePalabra = filtrados[siguienteIdx]?.palabraClave;
        if (siguientePalabra) {
          estado.seleccionada = siguientePalabra;
          representarDiccionario();
          const filaNueva = listaContenedor.querySelector(`.fila-diccionario[data-palabra-clave="${CSS.escape(siguientePalabra)}"]`);
          filaNueva?.focus?.();
        }
      }
    });
  }

  /* --- Eventos del Inspector lateral --- */
  inspector?.addEventListener("click", e => {
    const botonCopiar = e.target.closest('button[data-accion="copiar-inspector"]');
    if (botonCopiar) {
      const palabra = botonCopiar.dataset.palabraClave;
      if (palabra) copiarConConfirmacion(palabra, botonCopiar, "Palabra copiada");
      return;
    }

    const botonProbar = e.target.closest('button[data-accion="probar-simulador-inspector"]');
    if (botonProbar) {
      const palabra = botonProbar.dataset.palabraClave;
      if (palabra) abrirEnSimulador(palabra);
      return;
    }

    const botonAmpliar = e.target.closest('button[data-accion="ampliar-modal-inspector"]');
    if (botonAmpliar) {
      const palabra = botonAmpliar.dataset.palabraClave;
      const elemento = buscarPalabraClave(palabra);
      const filtrados = obtenerListaFiltradaOrdenada();
      const listaNav = filtrados.some(i => i.palabraClave === palabra) ? filtrados : DATOS_DICCIONARIO;
      if (elemento) abrirModal(elemento, botonAmpliar, listaNav);
      return;
    }

    const botonAnterior = e.target.closest('button[data-accion="inspector-anterior"]');
    const botonSiguiente = e.target.closest('button[data-accion="inspector-siguiente"]');
    if (botonAnterior || botonSiguiente) {
      const filtrados = obtenerListaFiltradaOrdenada();
      const listaNav = filtrados.some(i => i.palabraClave === estado.seleccionada) ? filtrados : DATOS_DICCIONARIO;
      const idx = listaNav.findIndex(i => i.palabraClave === estado.seleccionada);
      const nuevoIdx = botonAnterior ? idx - 1 : idx + 1;
      if (nuevoIdx >= 0 && nuevoIdx < listaNav.length) {
        estado.seleccionada = listaNav[nuevoIdx].palabraClave;
        representarDiccionario();
      }
    }
  });

  if (entradaBusqueda && entradaBusqueda.value) {
    estado.busqueda = entradaBusqueda.value;
  }

  representarCategorias();
  representarDiccionario();

  window.addEventListener("pageshow", () => {
    estado.busqueda = entradaBusqueda?.value ?? "";
    representarCategorias();
    representarDiccionario();
  });
}
