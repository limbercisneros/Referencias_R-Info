/**
 * Plantillas oficiales de R-Info (UNLP) y reglas clave de sintaxis.
 */
export const PLANTILLAS_RINFO = [
  {
    identificador: "base",
    titulo: "Programa Base (Ingreso PDF)",
    alcance: "basico",
    descripcion: "Estructura estándar de un programa secuencial con un proceso, un área ciudad (1..100) y un único robot.",
    codigo: `programa MiPrograma
procesos
  proceso JuntarFlores
  comenzar
    mientras (HayFlorEnLaEsquina)
      tomarFlor
  fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
  variables
    cant: numero
  comenzar
    cant := 0
    JuntarFlores
    Informar(PosAv, PosCa)
  fin
variables
  Rinfo: robot1
comenzar
  AsignarArea(Rinfo, ciudad)
  Iniciar(Rinfo, 1, 1)
fin`
  },
  {
    identificador: "parametros",
    titulo: "Procesos con Parámetros (E / ES)",
    alcance: "extendido",
    descripcion: "Muestra el pasaje por valor (E) para entradas y por referencia (ES) para devolver resultados acumulados.",
    codigo: `programa ProcesosConParametros
procesos
  proceso GirarIzquierda
  comenzar
    repetir 3
      derecha
  fin
  proceso RecorrerYContar(E cuadras: numero; ES flores: numero)
  comenzar
    repetir cuadras
      mientras (HayFlorEnLaEsquina)
        tomarFlor
        flores := flores + 1
      mover
  fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot recolector
  variables
    total: numero
  comenzar
    total := 0
    RecorrerYContar(10, total)
    GirarIzquierda
    Informar('Total', total)
  fin
variables
  r1: recolector
comenzar
  AsignarArea(r1, ciudad)
  Iniciar(r1, 1, 1)
fin`
  },
  {
    identificador: "concurrente",
    titulo: "Multi-Robot Concurrente",
    alcance: "extendido",
    descripcion: "Ejemplo de áreas privadas (AreaP), depósito compartido (AreaPC), exclusión mutua y envío de mensajes.",
    codigo: `programa ConcurrenciaEjemplo
areas
  zona1: AreaP(1,1,10,10)
  zonaJefe: AreaP(20,1,20,1)
  deposito: AreaPC(50,50,50,50)
robots
  robot trabajador
  variables
    avIni, caIni, flores: numero
  comenzar
    avIni := PosAv
    caIni := PosCa
    flores := 0
    si (HayFlorEnLaEsquina)
      tomarFlor
      flores := flores + 1
    BloquearEsquina(50, 50)
    Pos(50, 50)
    si (HayFlorEnLaBolsa)
      depositarFlor
    Pos(avIni, caIni)
    LiberarEsquina(50, 50)
    EnviarMensaje(flores, jefe)
  fin
  robot coordinador
  variables
    cant: numero
  comenzar
    RecibirMensaje(cant, r1)
    Informar('Recibidas', cant)
  fin
variables
  r1: trabajador
  jefe: coordinador
comenzar
  AsignarArea(r1, zona1)
  AsignarArea(r1, deposito)
  AsignarArea(jefe, zonaJefe)
  Iniciar(r1, 1, 1)
  Iniciar(jefe, 20, 1)
fin`
  }
];

export const REGLAS_SINTAXIS = [
  {
    titulo: "Orden estricto de secciones",
    detalle: "Siempre respetá el orden: programa → procesos (opcional) → areas → robots → variables → comenzar → fin."
  },
  {
    titulo: "Indentación exacta de 2 espacios",
    detalle: "R-Info usa sangría (sin llaves ni begin/end) para delimitar bloques de si, sino, mientras y repetir."
  },
  {
    titulo: "Columna 1 obligatoria",
    detalle: "Las palabras programa, procesos, areas, robots, variables (globales), comenzar y fin principales arrancan sin sangría."
  },
  {
    titulo: "Asignación ':=' vs Igualdad '='",
    detalle: "Para guardar un valor usá ':=' (ej. cant := 0). Dentro de condiciones si/mientras compará con un solo '='."
  }
];
