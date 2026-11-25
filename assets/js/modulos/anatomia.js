/**
 * Módulo de la vista Anatomía: partes de Robot y Área, ciclo de vida interactivo
 * con esquema visual SVG de la ciudad 100×100 y navegación cruzada al diccionario.
 */
import { PARTES_ANATOMIA } from "../datos/anatomia.js";
import { CICLO_VIDA } from "../datos/ciclo-vida.js";
import { seleccionar, escaparHTML } from "./dom.js";
import { cambiarVista } from "./navegacion.js";
import { filtrarYAbrirPalabraClave } from "./diccionario.js";
import { obtenerIconoParte, iconoRobot, iconoMapa } from "./iconos.js";
import { crearBloqueCodigoHTML } from "./resaltador.js";

let identificadorParteActiva = PARTES_ANATOMIA[0].identificador;
let indiceEtapaActiva = 0;

const ESTADOS_ESQUEMA = [
  { area: "ciudad (1..100)", molde: "Sin definir", instancia: "Ninguna", permiso: "—", pos: "Sin iniciar" },
  { area: "ciudad (1..100)", molde: "robot1", instancia: "Ninguna todavía", permiso: "—", pos: "Sin iniciar" },
  { area: "ciudad (1..100)", molde: "robot1", instancia: "Rinfo (bolsa: 0, 0)", permiso: "Sin asignar", pos: "Fuera del mapa" },
  { area: "ciudad (1..100)", molde: "robot1", instancia: "Rinfo (bolsa: 0, 0)", permiso: "ciudad ✓", pos: "Fuera del mapa" },
  { area: "ciudad (1..100)", molde: "robot1", instancia: "Rinfo (Rojo)", permiso: "ciudad ✓", pos: "(1, 1) ↑ Norte" }
];

function construirSvgEsquema(paso) {
  const tieneArea = paso >= 0;
  const tieneInstancia = paso >= 2;
  const tienePermiso = paso >= 3;
  const estaIniciado = paso >= 4;

  return `
    <svg class="esquema-mapa-svg" viewBox="0 0 220 180" aria-label="Esquema visual del mapa 100x100 y robot en el paso ${paso + 1}">
      <defs>
        <pattern id="grillaCiudad" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="currentColor" stroke-opacity="0.14" stroke-width="1" />
        </pattern>
      </defs>

      <!-- Grilla ciudad 100x100 -->
      <rect x="26" y="18" width="168" height="128" rx="10" fill="url(#grillaCiudad)" stroke="var(--borde)" stroke-width="1.5" />

      <!-- Área ciudad resaltada -->
      ${tieneArea ? `
        <rect x="30" y="22" width="160" height="120" rx="8"
          fill="var(--acento)" fill-opacity="${tienePermiso ? "0.14" : "0.07"}"
          stroke="var(--acento)" stroke-width="${tienePermiso ? "2" : "1.2"}" stroke-dasharray="${tienePermiso ? "none" : "4 3"}" />
        <text x="110" y="36" text-anchor="middle" fill="var(--texto-acento)" font-size="9.5" font-weight="700" font-family="var(--fuente-monoespaciada)">
          AreaC(1,1,100,100)
        </text>
      ` : ""}

      <!-- Etiquetas de coordenadas -->
      <text x="26" y="160" fill="var(--texto-suave)" font-size="8.5" font-family="var(--fuente-monoespaciada)">(1,1)</text>
      <text x="155" y="160" fill="var(--texto-suave)" font-size="8.5" font-family="var(--fuente-monoespaciada)">(100,100)</text>

      <!-- Robot fuera del mapa (pasos 3 y 4) vs dentro en (1,1) (paso 5) -->
      ${tieneInstancia && !estaIniciado ? `
        <g transform="translate(86, 86)">
          <rect x="0" y="0" width="48" height="24" rx="12" fill="var(--superficie)" stroke="var(--acento)" stroke-width="1.5" stroke-dasharray="3 2" />
          <circle cx="13" cy="12" r="5" fill="#ef4444" />
          <text x="22" y="15" fill="var(--texto)" font-size="8.5" font-weight="700" font-family="var(--fuente-monoespaciada)">Rinfo</text>
        </g>
        <text x="110" y="124" text-anchor="middle" fill="var(--texto-suave)" font-size="8" font-family="var(--fuente-sin-serifa)">
          ${tienePermiso ? "Con permiso, esperando Iniciar" : "En memoria (sin área aún)"}
        </text>
      ` : ""}

      ${estaIniciado ? `
        <g transform="translate(46, 114)">
          <circle cx="0" cy="0" r="14" fill="#ef4444" fill-opacity="0.18" stroke="#ef4444" stroke-width="1.5" />
          <polygon points="0,-10 7,7 0,3 -7,7" fill="#ef4444" />
          <text x="18" y="4" fill="var(--texto)" font-size="9.5" font-weight="700" font-family="var(--fuente-monoespaciada)">Rinfo (1,1) ↑N</text>
        </g>
      ` : ""}
    </svg>
  `;
}

export function representarMenuAnatomia() {
  const menu = seleccionar("#menuPartes");
  if (!menu) return;

  const grupos = [...new Set(PARTES_ANATOMIA.map(p => p.grupo))];

  menu.innerHTML = grupos.map(nombreGrupo => {
    const esGrupoRobot = nombreGrupo.toLowerCase().includes("robot");
    const iconoGrupo = esGrupoRobot ? iconoRobot(15) : iconoMapa(15);

    return `
      <div class="titulo-grupo-partes">${iconoGrupo} <span>${escaparHTML(nombreGrupo)}</span></div>
      ${PARTES_ANATOMIA.filter(p => p.grupo === nombreGrupo).map(p => {
        const estaActiva = p.identificador === identificadorParteActiva;
        return `
          <button
            type="button"
            class="boton-parte ${estaActiva ? "activa" : ""}"
            data-accion="seleccionar-parte"
            data-identificador-parte="${escaparHTML(p.identificador)}"
            aria-pressed="${estaActiva}"
          >
            <span class="titulo-con-icono">${obtenerIconoParte(p.identificador, 16)} <span>${escaparHTML(p.titulo)}</span></span>
            <small>${escaparHTML(p.resumen)}</small>
          </button>
        `;
      }).join("")}
    `;
  }).join("");
}

export function representarDetalleAnatomia() {
  const caja = seleccionar("#detalleParte");
  if (!caja) return;

  const parte = PARTES_ANATOMIA.find(p => p.identificador === identificadorParteActiva) ?? PARTES_ANATOMIA[0];

  caja.innerHTML = `
    <div class="cabecera-detalle">
      <div>
        <h3 class="titulo-detalle titulo-con-icono">${obtenerIconoParte(parte.identificador, 22)} <span>${escaparHTML(parte.titulo)}</span></h3>
        <span class="etiqueta-grupo-detalle">${escaparHTML(parte.grupo)}</span>
      </div>
      <span class="pildora-predeterminada">Por defecto: ${escaparHTML(parte.estadoInicial)}</span>
    </div>
    <p class="descripcion-parte">${escaparHTML(parte.descripcion)}</p>
    <div class="cuadricula-datos">
      ${parte.detalles.map(d => `
        <div class="dato-par">
          <strong>${escaparHTML(d.etiqueta)}</strong>
          <span>${escaparHTML(d.valor)}</span>
        </div>
      `).join("")}
    </div>
    <div class="seccion-codigo-parte">
      <div class="etiqueta-seccion">Ejemplo en R-Info</div>
      ${crearBloqueCodigoHTML(parte.codigo, { etiqueta: "Ejemplo R-Info" })}
    </div>
    <div class="palabras-clave-vinculadas">
      <span class="etiqueta-palabras-clave-vinculadas">Palabras clave relacionadas:</span>
      ${parte.palabrasClave.map(palabraClave => `
        <button
          type="button"
          class="ficha"
          data-accion="ir-palabra-clave"
          data-palabra-clave="${escaparHTML(palabraClave)}"
          aria-label="Ver definición de ${escaparHTML(palabraClave)} en diccionario"
        >${escaparHTML(palabraClave)}</button>
      `).join("")}
    </div>
  `;
}

export function seleccionarParte(identificador) {
  identificadorParteActiva = identificador;
  representarMenuAnatomia();
  representarDetalleAnatomia();
}

export function representarCicloVida() {
  const contenedorEtapas = seleccionar("#etapasCicloVida");
  const contenedorSalida = seleccionar("#salidaCicloVida");
  const contenedorEsquema = seleccionar("#esquemaCicloVida");
  const botonAnterior = seleccionar("#botonPasoAnterior");
  const botonSiguiente = seleccionar("#botonPasoSiguiente");
  if (!contenedorEtapas || !contenedorSalida) return;

  contenedorEtapas.innerHTML = CICLO_VIDA.map((s, i) => {
    const estaActiva = i === indiceEtapaActiva;
    return `
      <button
        type="button"
        class="boton-etapa ${estaActiva ? "activa" : ""}"
        data-accion="seleccionar-etapa"
        data-indice-etapa="${i}"
        aria-pressed="${estaActiva}"
      >
        <div class="numero-etapa">${escaparHTML(s.numero)}</div>
        <div class="titulo-etapa">${escaparHTML(s.titulo)}</div>
      </button>
    `;
  }).join("");

  const actual = CICLO_VIDA[indiceEtapaActiva];
  contenedorSalida.innerHTML = `
    ${crearBloqueCodigoHTML(actual.codigo, { etiqueta: `${actual.numero} · ${actual.titulo}` })}
    <div class="caja-estado">
      <strong>¿Qué ocurre en este paso?</strong>
      <p class="explicacion-paso">${escaparHTML(actual.explicacion)}</p>
      <div class="lineas-estado">
        ${actual.estado.map(linea => `<div>• ${escaparHTML(linea)}</div>`).join("")}
      </div>
    </div>
  `;

  if (contenedorEsquema) {
    const meta = ESTADOS_ESQUEMA[indiceEtapaActiva] ?? ESTADOS_ESQUEMA[0];
    contenedorEsquema.innerHTML = `
      ${construirSvgEsquema(indiceEtapaActiva)}
      <div class="resumen-visual-ciclo">
        <div class="tarjeta-metrica-visual ${indiceEtapaActiva === 0 ? "activo" : ""}">
          <span class="etiqueta">Área definida</span>
          <span class="valor">${escaparHTML(meta.area)}</span>
        </div>
        <div class="tarjeta-metrica-visual ${indiceEtapaActiva === 1 ? "activo" : ""}">
          <span class="etiqueta">Molde (Tipo)</span>
          <span class="valor">${escaparHTML(meta.molde)}</span>
        </div>
        <div class="tarjeta-metrica-visual ${indiceEtapaActiva === 2 ? "activo" : ""}">
          <span class="etiqueta">Instancia en memoria</span>
          <span class="valor">${escaparHTML(meta.instancia)}</span>
        </div>
        <div class="tarjeta-metrica-visual ${indiceEtapaActiva >= 3 ? "activo" : ""}">
          <span class="etiqueta">Permiso AsignarArea</span>
          <span class="valor">${escaparHTML(meta.permiso)}</span>
        </div>
        <div class="tarjeta-metrica-visual ${indiceEtapaActiva === 4 ? "activo" : ""}">
          <span class="etiqueta">Posición y Brújula</span>
          <span class="valor">${escaparHTML(meta.pos)}</span>
        </div>
      </div>
    `;
  }

  if (botonAnterior) botonAnterior.disabled = indiceEtapaActiva <= 0;
  if (botonSiguiente) botonSiguiente.disabled = indiceEtapaActiva >= CICLO_VIDA.length - 1;
}

export function seleccionarEtapa(indice) {
  if (indice < 0 || indice >= CICLO_VIDA.length) return;
  indiceEtapaActiva = indice;
  representarCicloVida();
}

export function inicializarAnatomia() {
  const menuPartes = seleccionar("#menuPartes");
  const detalleParte = seleccionar("#detalleParte");
  const etapasCicloVida = seleccionar("#etapasCicloVida");
  const botonAnterior = seleccionar("#botonPasoAnterior");
  const botonSiguiente = seleccionar("#botonPasoSiguiente");

  menuPartes?.addEventListener("click", e => {
    const boton = e.target.closest('button[data-accion="seleccionar-parte"]');
    if (boton?.dataset.identificadorParte) {
      seleccionarParte(boton.dataset.identificadorParte);
    }
  });

  detalleParte?.addEventListener("click", e => {
    const botonSalto = e.target.closest('button[data-accion="ir-palabra-clave"]');
    if (botonSalto?.dataset.palabraClave) {
      cambiarVista("vistaDiccionario");
      filtrarYAbrirPalabraClave(botonSalto.dataset.palabraClave);
    }
  });

  etapasCicloVida?.addEventListener("click", e => {
    const boton = e.target.closest('button[data-accion="seleccionar-etapa"]');
    if (boton?.dataset.indiceEtapa !== undefined) {
      seleccionarEtapa(Number(boton.dataset.indiceEtapa));
    }
  });

  botonAnterior?.addEventListener("click", () => seleccionarEtapa(indiceEtapaActiva - 1));
  botonSiguiente?.addEventListener("click", () => seleccionarEtapa(indiceEtapaActiva + 1));

  representarMenuAnatomia();
  representarDetalleAnatomia();
  representarCicloVida();
}
