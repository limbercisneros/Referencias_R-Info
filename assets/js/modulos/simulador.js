/**
 * Módulo del Simulador de Condiciones Lógicas en R-Info.
 *
 * Implementa un analizador léxico y sintáctico recursivo descendente seguro (sin eval).
 * Respeta la precedencia oficial de R-Info UNLP:
 *  1. Primarios: (...), literales, sensores
 *  2. Unarios: ~ (negación lógica) y - (negativo)
 *  3. Multiplicativos: *, / (división entera Math.trunc)
 *  4. Aditivos: +, -
 *  5. Relacionales: =, <>, <, <=, >, >= (sin encadenamiento implícito)
 *  6. Lógicos binarios: & y | comparten igual precedencia (evaluación izquierda a derecha)
 */
import { seleccionar, seleccionarTodos, escaparHTML } from "./dom.js";
import { iconoCirculoCorrecto, iconoCirculoError, iconoAdvertencia } from "./iconos.js";

const IDENTIFICADORES_CONOCIDOS = [
  "HayFlorEnLaEsquina",
  "HayPapelEnLaEsquina",
  "HayFlorEnLaBolsa",
  "HayPapelEnLaBolsa",
  "PosAv",
  "PosCa",
  "V",
  "F"
];

function obtenerEntorno() {
  const obtenerMarcado = id => Boolean(seleccionar(id)?.checked);
  const obtenerCoordenada = (id, predeterminado = 1) => {
    const valor = Number(seleccionar(id)?.value);
    if (!Number.isFinite(valor)) return predeterminado;
    return Math.min(100, Math.max(1, Math.trunc(valor)));
  };

  return {
    HayFlorEnLaEsquina: obtenerMarcado("#sensorFlorEsquina"),
    HayPapelEnLaEsquina: obtenerMarcado("#sensorPapelEsquina"),
    HayFlorEnLaBolsa: obtenerMarcado("#sensorFlorBolsa"),
    HayPapelEnLaBolsa: obtenerMarcado("#sensorPapelBolsa"),
    PosAv: obtenerCoordenada("#sensorAvenida", 1),
    PosCa: obtenerCoordenada("#sensorCalle", 1),
    V: true,
    F: false
  };
}

/**
 * Analizador léxico con detección educativa de errores frecuentes de otros lenguajes.
 * @param {string} entrada
 * @returns {{ tipo: string, valor: string|number|null }[]}
 */
export function tokenizar(entrada) {
  const unidadesLexicas = [];
  let i = 0;
  const n = entrada.length;

  while (i < n) {
    const caracter = entrada[i];

    if (/\s/.test(caracter)) {
      i++;
      continue;
    }

    if (caracter === "(" || caracter === ")") {
      unidadesLexicas.push({ tipo: caracter, valor: caracter });
      i++;
      continue;
    }

    const dosCaracteres = entrada.slice(i, i + 2);
    if (dosCaracteres === ":=") {
      throw new Error("':=' es asignación; para comparar igualdad en una condición usá '='.");
    }
    if (dosCaracteres === "==") {
      throw new Error("En R-Info la igualdad se escribe con un solo '=', no '=='.");
    }
    if (dosCaracteres === "!=") {
      throw new Error("En R-Info 'distinto' se escribe '<>', no '!='.");
    }
    if (dosCaracteres === "&&") {
      throw new Error("En R-Info la conjunción (Y) se escribe '&' simple, no '&&'.");
    }
    if (dosCaracteres === "||") {
      throw new Error("En R-Info la disyunción (O) se escribe '|' simple, no '||'.");
    }

    if (dosCaracteres === "<=" || dosCaracteres === ">=" || dosCaracteres === "<>") {
      unidadesLexicas.push({ tipo: "OPERADOR_RELACIONAL", valor: dosCaracteres });
      i += 2;
      continue;
    }

    if (caracter === "<" || caracter === ">" || caracter === "=") {
      unidadesLexicas.push({ tipo: "OPERADOR_RELACIONAL", valor: caracter });
      i++;
      continue;
    }

    if (caracter === "!") {
      throw new Error("En R-Info la negación lógica se escribe '~', no '!'.");
    }

    if (caracter === "~") {
      unidadesLexicas.push({ tipo: "OPERADOR_NEGACION", valor: "~" });
      i++;
      continue;
    }

    if (caracter === "&" || caracter === "|") {
      unidadesLexicas.push({ tipo: "OPERADOR_LOGICO_BINARIO", valor: caracter });
      i++;
      continue;
    }

    if (caracter === "+" || caracter === "-") {
      unidadesLexicas.push({ tipo: "OPERADOR_SUMAR", valor: caracter });
      i++;
      continue;
    }

    if (caracter === "*" || caracter === "/") {
      unidadesLexicas.push({ tipo: "OPERADOR_MULTIPLICAR", valor: caracter });
      i++;
      continue;
    }

    if (/\d/.test(caracter)) {
      let cadenaNumero = "";
      while (i < n && /\d/.test(entrada[i])) {
        cadenaNumero += entrada[i];
        i++;
      }
      unidadesLexicas.push({ tipo: "NUMERO", valor: Number.parseInt(cadenaNumero, 10) });
      continue;
    }

    if (/[a-zA-Z_]/.test(caracter)) {
      let identificador = "";
      while (i < n && /[a-zA-Z0-9_]/.test(entrada[i])) {
        identificador += entrada[i];
        i++;
      }
      unidadesLexicas.push({ tipo: "IDENTIFICADOR", valor: identificador });
      continue;
    }

    throw new Error(`Carácter no permitido: '${caracter}'. Usá solo operadores y sensores de R-Info.`);
  }

  unidadesLexicas.push({ tipo: "FIN_ENTRADA", valor: null });
  return unidadesLexicas;
}

/**
 * Evaluador recursivo descendente con registro de identificadores leídos
 * y detección de mezcla de '&' y '|' sin paréntesis.
 */
export class EvaluadorExpresion {
  constructor(unidadesLexicas, entorno) {
    this.unidadesLexicas = unidadesLexicas;
    this.entorno = entorno;
    this.posicion = 0;
    this.identificadoresUsados = new Map();
    this.mezclaSinParentesis = false;
  }

  actual() {
    return this.unidadesLexicas[this.posicion];
  }

  consumir(tipoEsperado = null) {
    const unidad = this.actual();
    if (tipoEsperado && unidad.tipo !== tipoEsperado) {
      if (tipoEsperado === ")") {
        throw new Error("Falta cerrar un paréntesis ')'.");
      }
      throw new Error(`Se esperaba '${tipoEsperado}' pero se encontró '${unidad.valor ?? unidad.tipo}'.`);
    }
    this.posicion++;
    return unidad;
  }

  evaluar() {
    if (this.actual().tipo === "FIN_ENTRADA") {
      throw new Error("La expresión no puede estar vacía.");
    }
    const resultado = this.analizarLogicoBinario();
    if (this.actual().tipo !== "FIN_ENTRADA") {
      throw new Error(`Símbolo inesperado cerca de '${this.actual().valor}'.`);
    }
    if (typeof resultado !== "boolean") {
      throw new Error("La condición final debe evaluar a booleano (V o F), no a un número.");
    }
    return {
      resultado,
      identificadoresUsados: [...this.identificadoresUsados.entries()],
      mezclaSinParentesis: this.mezclaSinParentesis
    };
  }

  // Nivel 6: & y | con misma precedencia (izquierda a derecha en R-Info)
  analizarLogicoBinario() {
    let izquierda = this.analizarRelacional();
    let operadorPrevio = null;

    while (this.actual().tipo === "OPERADOR_LOGICO_BINARIO") {
      const operador = this.consumir("OPERADOR_LOGICO_BINARIO").valor;
      if (operadorPrevio && operadorPrevio !== operador) {
        this.mezclaSinParentesis = true;
      }
      operadorPrevio = operador;

      const derecha = this.analizarRelacional();
      if (typeof izquierda !== "boolean" || typeof derecha !== "boolean") {
        throw new Error(`El operador '${operador}' solo puede unir condiciones booleanas (V o F).`);
      }
      izquierda = operador === "&" ? izquierda && derecha : izquierda || derecha;
    }

    return izquierda;
  }

  // Nivel 5: Relacionales (=, <>, <, <=, >, >=) sin encadenamiento implícito
  analizarRelacional() {
    const izquierda = this.analizarSumaResta();
    if (this.actual().tipo === "OPERADOR_RELACIONAL") {
      const operador = this.consumir("OPERADOR_RELACIONAL").valor;
      const derecha = this.analizarSumaResta();

      if (this.actual().tipo === "OPERADOR_RELACIONAL") {
        throw new Error("No encadenes comparaciones (ej. 1 < PosAv < 10); unilas con '&'.");
      }

      if (typeof izquierda !== typeof derecha) {
        throw new Error(`No podés comparar ${typeof izquierda === "boolean" ? "booleano" : "número"} con ${typeof derecha === "boolean" ? "booleano" : "número"}.`);
      }

      switch (operador) {
        case "=": return izquierda === derecha;
        case "<>": return izquierda !== derecha;
        case "<": return izquierda < derecha;
        case "<=": return izquierda <= derecha;
        case ">": return izquierda > derecha;
        case ">=": return izquierda >= derecha;
        default: throw new Error(`Operador relacional desconocido '${operador}'.`);
      }
    }
    return izquierda;
  }

  analizarSumaResta() {
    let izquierda = this.analizarMultiplicacionDivision();
    while (this.actual().tipo === "OPERADOR_SUMAR") {
      const operador = this.consumir("OPERADOR_SUMAR").valor;
      const derecha = this.analizarMultiplicacionDivision();
      if (typeof izquierda !== "number" || typeof derecha !== "number") {
        throw new Error(`El operador '${operador}' requiere valores numéricos.`);
      }
      izquierda = operador === "+" ? izquierda + derecha : izquierda - derecha;
    }
    return izquierda;
  }

  analizarMultiplicacionDivision() {
    let izquierda = this.analizarUnario();
    while (this.actual().tipo === "OPERADOR_MULTIPLICAR") {
      const operador = this.consumir("OPERADOR_MULTIPLICAR").valor;
      const derecha = this.analizarUnario();
      if (typeof izquierda !== "number" || typeof derecha !== "number") {
        throw new Error(`El operador '${operador}' requiere valores numéricos.`);
      }
      if (operador === "*") {
        izquierda *= derecha;
      } else {
        if (derecha === 0) throw new Error("División por cero no permitida.");
        izquierda = Math.trunc(izquierda / derecha);
      }
    }
    return izquierda;
  }

  analizarUnario() {
    if (this.actual().tipo === "OPERADOR_NEGACION") {
      this.consumir("OPERADOR_NEGACION");
      const valor = this.analizarUnario();
      if (typeof valor !== "boolean") {
        throw new Error("La negación '~' solo se aplica a expresiones booleanas.");
      }
      return !valor;
    }
    if (this.actual().tipo === "OPERADOR_SUMAR" && this.actual().valor === "-") {
      this.consumir("OPERADOR_SUMAR");
      const valor = this.analizarUnario();
      if (typeof valor !== "number") {
        throw new Error("El signo negativo '-' solo se aplica a valores numéricos.");
      }
      return -valor;
    }
    return this.analizarPrimario();
  }

  analizarPrimario() {
    const unidad = this.actual();

    if (unidad.tipo === "(") {
      this.consumir("(");
      const expresion = this.analizarLogicoBinario();
      this.consumir(")");
      return expresion;
    }

    if (unidad.tipo === "NUMERO") {
      this.consumir("NUMERO");
      return unidad.valor;
    }

    if (unidad.tipo === "IDENTIFICADOR") {
      const nombre = this.consumir("IDENTIFICADOR").valor;
      if (Object.hasOwn(this.entorno, nombre)) {
        const valor = this.entorno[nombre];
        this.identificadoresUsados.set(nombre, valor);
        return valor;
      }

      if (nombre === "true" || nombre === "false") {
        throw new Error(`En R-Info los booleanos son 'V' y 'F' en mayúscula (no '${nombre}').`);
      }

      const sugerencia = IDENTIFICADORES_CONOCIDOS.find(
        id => id.toLowerCase() === nombre.toLowerCase()
      );
      if (sugerencia) {
        throw new Error(`R-Info es sensible a mayúsculas: ¿quisiste escribir '${sugerencia}'?`);
      }

      throw new Error(`Identificador '${nombre}' no reconocido. Usá sensores o constantes de R-Info.`);
    }

    throw new Error(`Sintaxis inválida cerca de '${unidad.valor ?? unidad.tipo}'.`);
  }
}

function sincronizarEtiquetasSensores() {
  const pares = [
    ["#sensorFlorEsquina", "#valorFlorEsquina"],
    ["#sensorPapelEsquina", "#valorPapelEsquina"],
    ["#sensorFlorBolsa", "#valorFlorBolsa"],
    ["#sensorPapelBolsa", "#valorPapelBolsa"]
  ];

  pares.forEach(([idInput, idInsignia]) => {
    const input = seleccionar(idInput);
    const insignia = seleccionar(idInsignia);
    if (input && insignia) {
      insignia.textContent = input.checked ? "V" : "F";
    }
  });
}

export function evaluarExpresion() {
  sincronizarEtiquetasSensores();

  const entradaElemento = seleccionar("#entradaExpresion");
  const resultadoElemento = seleccionar("#resultadoExpresion");
  const desgloseElemento = seleccionar("#desgloseExpresion");
  if (!entradaElemento || !resultadoElemento) return;

  const textoPlano = entradaElemento.value.trim();

  if (!textoPlano) {
    resultadoElemento.className = "resultado-expresion error";
    resultadoElemento.innerHTML = `<span>${iconoAdvertencia(16)} Expresión vacía</span><small>Ingresá una proposición lógica de R-Info</small>`;
    if (desgloseElemento) desgloseElemento.hidden = true;
    return;
  }

  const entorno = obtenerEntorno();

  try {
    const unidadesLexicas = tokenizar(textoPlano);
    const evaluador = new EvaluadorExpresion(unidadesLexicas, entorno);
    const { resultado, identificadoresUsados, mezclaSinParentesis } = evaluador.evaluar();

    resultadoElemento.className = `resultado-expresion ${resultado ? "verdadero" : "falso"}`;
    resultadoElemento.innerHTML = `
      <span>${resultado ? iconoCirculoCorrecto(16) : iconoCirculoError(16)} Resultado: ${resultado ? "V (Verdadero)" : "F (Falso)"}</span>
      <small>Evaluación segura en vivo</small>
    `;

    if (desgloseElemento) {
      const tieneDatos = identificadoresUsados.length > 0 || mezclaSinParentesis;
      desgloseElemento.hidden = !tieneDatos;
      if (tieneDatos) {
        const chips = identificadoresUsados
          .map(([nombre, val]) => {
            const textoVal = typeof val === "boolean" ? (val ? "V" : "F") : String(val);
            return `<span class="chip-valor-desglose">${escaparHTML(nombre)} = <strong>${escaparHTML(textoVal)}</strong></span>`;
          })
          .join("");

        const avisoMezcla = mezclaSinParentesis
          ? `<div class="advertencia-precedencia">Consejo UNLP: combinaste <code>&amp;</code> y <code>|</code> sin paréntesis; en R-Info se evalúan de izquierda a derecha. Conviene agrupar con <code>(...)</code>.</div>`
          : "";

        desgloseElemento.innerHTML = `
          ${chips ? `<div class="etiqueta-seccion">Sensores y valores leídos</div><div class="lista-valores-desglose">${chips}</div>` : ""}
          ${avisoMezcla}
        `;
      }
    }
  } catch (error) {
    resultadoElemento.className = "resultado-expresion error";
    resultadoElemento.innerHTML = `
      <span>${iconoAdvertencia(16)} Sintaxis inválida</span>
      <small>${escaparHTML(error.message)}</small>
    `;
    if (desgloseElemento) desgloseElemento.hidden = true;
  }
}

export function establecerExpresion(expresion) {
  const entradaElemento = seleccionar("#entradaExpresion");
  if (entradaElemento) {
    entradaElemento.value = expresion;
    evaluarExpresion();
  }
}

function insertarTokenEnCursor(token) {
  const entrada = seleccionar("#entradaExpresion");
  if (!entrada) return;

  const inicio = entrada.selectionStart ?? entrada.value.length;
  const fin = entrada.selectionEnd ?? entrada.value.length;
  const antes = entrada.value.slice(0, inicio);
  const despues = entrada.value.slice(fin);

  entrada.value = antes + token + despues;
  const nuevaPos = token === "()" ? inicio + 1 : inicio + token.length;
  entrada.focus();
  entrada.setSelectionRange(nuevaPos, nuevaPos);
  evaluarExpresion();
}

export function inicializarSimulador() {
  const vistaSimulador = seleccionar("#vistaSimulador");
  if (!vistaSimulador) return;

  const selectoresControl = [
    "#sensorFlorEsquina",
    "#sensorPapelEsquina",
    "#sensorFlorBolsa",
    "#sensorPapelBolsa",
    "#sensorAvenida",
    "#sensorCalle",
    "#entradaExpresion"
  ];

  selectoresControl.forEach(selector => {
    const el = seleccionar(selector);
    el?.addEventListener("input", evaluarExpresion);
  });

  // Botones - / + para PosAv y PosCa con rango 1..100
  seleccionarTodos(".boton-paso-coord", vistaSimulador).forEach(boton => {
    boton.addEventListener("click", () => {
      const idInput = boton.dataset.coord;
      const delta = Number(boton.dataset.delta);
      const input = idInput ? seleccionar(`#${idInput}`) : null;
      if (!input || !Number.isFinite(delta)) return;

      const actual = Number(input.value) || 1;
      const siguiente = Math.min(100, Math.max(1, actual + delta));
      input.value = String(siguiente);
      evaluarExpresion();
    });
  });

  // Paleta rápida de tokens
  seleccionar("#paletaTokensSimulador")?.addEventListener("click", e => {
    const boton = e.target.closest("button[data-token]");
    if (boton?.dataset.token !== undefined) {
      insertarTokenEnCursor(boton.dataset.token);
    }
  });

  // Predefinidos
  seleccionar(".botones-predefinidos", vistaSimulador)?.addEventListener("click", e => {
    const boton = e.target.closest('button[data-accion="establecer-predefinida"]');
    if (boton?.dataset.expresion) {
      establecerExpresion(boton.dataset.expresion);
    }
  });

  evaluarExpresion();
}
