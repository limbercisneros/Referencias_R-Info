/**
 * Diccionario de palabras clave, primitivas, operadores y estructuras de R-Info (UNLP).
 * Cada entrada contiene descripción didáctica, sintaxis oficial, ejemplo y notas clave.
 */
export const DATOS_DICCIONARIO = [
  {
    palabraClave: "programa",
    categoria: "Estructura",
    alcance: "basico",
    descripcion: "Palabra clave obligatoria que inicia todo código R-Info. Debe ir seguida por el nombre identificador del programa y comenzar en la columna 1.",
    sintaxis: "programa NombreDelPrograma",
    ejemplo: "programa Cap2Ejemplo1\nareas\n  ciudad: AreaC(1,1,100,100)\n...",
    nota: "Siempre va en minúsculas y en la primera columna (sin sangría)."
  },
  {
    palabraClave: "procesos",
    categoria: "Estructura",
    alcance: "basico",
    descripcion: "Sección opcional ubicada después de 'programa' donde se declaran todos los módulos ('proceso') reutilizables del programa.",
    sintaxis: "procesos\n  proceso Nombre ...",
    ejemplo: "procesos\n  proceso GirarIzquierda\n  comenzar\n    repetir 3\n      derecha\n  fin",
    nota: "Un proceso solo puede invocar a otro proceso si este fue declarado previamente (arriba de él)."
  },
  {
    palabraClave: "proceso",
    categoria: "Estructura",
    alcance: "basico",
    descripcion: "Define un módulo o subprograma con una tarea específica. Puede incluir parámetros (E / ES) y variables locales propias.",
    sintaxis: "proceso Nombre(parametros)",
    ejemplo: "proceso JuntarFlores\ncomenzar\n  mientras (HayFlorEnLaEsquina)\n    tomarFlor\nfin",
    nota: "Las variables declaradas dentro de un proceso son locales: no existen fuera de él."
  },
  {
    palabraClave: "areas",
    categoria: "Estructura",
    alcance: "basico",
    descripcion: "Sección obligatoria donde se definen las regiones de la ciudad (100x100) por las que podrán moverse los robots.",
    sintaxis: "areas\n  nombreArea: AreaC(av1,ca1,av2,ca2)",
    ejemplo: "areas\n  ciudad: AreaC(1,1,100,100)",
    nota: "En el Curso de Ingreso normalmente se declara una única área 'ciudad' que cubre toda la grilla (1,1,100,100)."
  },
  {
    palabraClave: "robots",
    categoria: "Estructura",
    alcance: "basico",
    descripcion: "Sección obligatoria donde se definen los tipos de robots ('robot') y el algoritmo que ejecutará cada tipo.",
    sintaxis: "robots\n  robot nombreTipo",
    ejemplo: "robots\n  robot robot1\n  comenzar\n    mover\n  fin",
    nota: "Aquí se define el comportamiento (el molde), pero todavía no se crean las instancias."
  },
  {
    palabraClave: "robot",
    categoria: "Estructura",
    alcance: "basico",
    descripcion: "Declara un tipo específico de robot con sus propias variables locales y su bloque ejecutable 'comenzar ... fin'.",
    sintaxis: "robot nombreTipo\nvariables ...\ncomenzar ... fin",
    ejemplo: "robot recolector\nvariables\n  flores: numero\ncomenzar\n  flores := 0\nfin",
    nota: "No confundir el tipo de robot (ej. 'robot1') con la variable robot (ej. 'Rinfo: robot1')."
  },
  {
    palabraClave: "variables",
    categoria: "Estructura",
    alcance: "basico",
    descripcion: "Sección para declarar datos locales (dentro de 'robot' o 'proceso') o para instanciar los robots (en el programa principal, antes del comenzar global).",
    sintaxis: "variables\n  nombre: tipo",
    ejemplo: "variables\n  cantPasos: numero\n  encontro: boolean",
    nota: "En el programa principal solo se pueden declarar variables de tipo robot; los datos 'numero' y 'boolean' van dentro del robot o proceso."
  },
  {
    palabraClave: "comenzar",
    categoria: "Estructura",
    alcance: "basico",
    descripcion: "Delimita el inicio del cuerpo de instrucciones de un proceso, de un robot o del programa principal.",
    sintaxis: "comenzar\n  { sentencias }\nfin",
    ejemplo: "comenzar\n  AsignarArea(Rinfo, ciudad)\n  Iniciar(Rinfo, 1, 1)\nfin",
    nota: "El 'comenzar' del programa principal debe alinearse en la columna 1 junto con 'programa' y 'fin'."
  },
  {
    palabraClave: "fin",
    categoria: "Estructura",
    alcance: "basico",
    descripcion: "Marca el cierre de un bloque 'comenzar'. Al llegar al 'fin' del robot o del programa, el robot detiene su ejecución naturalmente.",
    sintaxis: "fin",
    ejemplo: "comenzar\n  mover\nfin",
    nota: "No existe una instrucción 'detener'; el robot frena al alcanzar su 'fin'."
  },
  {
    palabraClave: "AreaC",
    categoria: "Áreas e Inicio",
    alcance: "basico",
    descripcion: "Define un área compartida total delimitada por las esquinas (av1, ca1) y (av2, ca2). Cualquier robot asignado puede acceder a ella.",
    sintaxis: "nombre: AreaC(av1, ca1, av2, ca2)",
    ejemplo: "areas\n  ciudad: AreaC(1,1,100,100)",
    nota: "El rango válido para avenidas y calles es de 1 a 100."
  },
  {
    palabraClave: "AreaP",
    categoria: "Áreas e Inicio",
    alcance: "extendido",
    descripcion: "Define un área privada delimitada por (av1, ca1) y (av2, ca2). Solo puede ser asignada a un único robot.",
    sintaxis: "nombre: AreaP(av1, ca1, av2, ca2)",
    ejemplo: "areas\n  area1: AreaP(1,1,1,100)",
    nota: "Si intentás asignar una misma AreaP a dos robots distintos, el entorno arrojará error."
  },
  {
    palabraClave: "AreaPC",
    categoria: "Áreas e Inicio",
    alcance: "extendido",
    descripcion: "Define un área parcialmente compartida entre dos o más robots autorizados explícitamente mediante AsignarArea.",
    sintaxis: "nombre: AreaPC(av1, ca1, av2, ca2)",
    ejemplo: "areas\n  deposito: AreaPC(10,10,10,10)",
    nota: "Para evitar choques en esquinas compartidas de un AreaPC, usá BloquearEsquina y LiberarEsquina."
  },
  {
    palabraClave: "AsignarArea",
    categoria: "Áreas e Inicio",
    alcance: "basico",
    descripcion: "Vincula una variable robot con un área declarada, habilitando al robot a moverse y posicionarse dentro de esas coordenadas.",
    sintaxis: "AsignarArea(nombreRobot, nombreArea)",
    ejemplo: "comenzar\n  AsignarArea(Rinfo, ciudad)\n  Iniciar(Rinfo, 1, 1)\nfin",
    nota: "Debe ejecutarse en el bloque principal antes de Iniciar. Lleva mayúsculas iniciales (PascalCase)."
  },
  {
    palabraClave: "Iniciar",
    categoria: "Áreas e Inicio",
    alcance: "basico",
    descripcion: "Posiciona al robot en la esquina (av, ca) orientado hacia el Norte (arriba) y comienza la ejecución de sus instrucciones.",
    sintaxis: "Iniciar(nombreRobot, av, ca)",
    ejemplo: "Iniciar(Rinfo, 1, 1)",
    nota: "En el Curso de Ingreso siempre se inicia en (1,1). La esquina debe pertenecer a un área asignada al robot."
  },
  {
    palabraClave: "si",
    categoria: "Control de Flujo",
    alcance: "basico",
    descripcion: "Estructura de selección: evalúa una condición lógica; si es Verdadera (V), ejecuta el bloque de sentencias indentado debajo.",
    sintaxis: "si (condicion)\n  acciones",
    ejemplo: "si (HayFlorEnLaEsquina)\n  tomarFlor",
    nota: "La indentación (2 espacios más a la derecha) es obligatoria para indicar qué instrucciones pertenecen al 'si'."
  },
  {
    palabraClave: "sino",
    categoria: "Control de Flujo",
    alcance: "basico",
    descripcion: "Cláusula opcional de la estructura 'si'. Su bloque indentado se ejecuta únicamente cuando la condición del 'si' resulta Falsa (F).",
    sintaxis: "si (condicion)\n  accionesV\nsino\n  accionesF",
    ejemplo: "si (HayFlorEnLaBolsa)\n  depositarFlor\nsino\n  Informar(PosAv)",
    nota: "Debe alinearse exactamente en la misma columna que su 'si' correspondiente."
  },
  {
    palabraClave: "repetir",
    categoria: "Control de Flujo",
    alcance: "basico",
    descripcion: "Estructura de repetición fija: ejecuta el bloque de acciones indentado un número exacto N de veces conocido de antemano.",
    sintaxis: "repetir N\n  acciones",
    ejemplo: "repetir 99\n  mover",
    nota: "N puede ser un literal entero (ej. 99) o una variable 'numero'. Si N vale 0, no ejecuta ninguna iteración."
  },
  {
    palabraClave: "mientras",
    categoria: "Control de Flujo",
    alcance: "basico",
    descripcion: "Estructura de iteración condicional: evalúa la condición ANTES de cada vuelta y ejecuta el bloque mientras sea Verdadera (V).",
    sintaxis: "mientras (condicion)\n  acciones",
    ejemplo: "mientras (HayFlorEnLaEsquina)\n  tomarFlor",
    nota: "Si la condición es Falsa desde el inicio, no entra ni una sola vez. Cuidá que el bloque modifique la condición para evitar bucles infinitos."
  },
  {
    palabraClave: "mover",
    categoria: "Acciones",
    alcance: "basico",
    descripcion: "Desplaza al robot una cuadra hacia adelante según su orientación actual (Norte, Este, Sur u Oeste).",
    sintaxis: "mover",
    ejemplo: "repetir 4\n  mover",
    nota: "ERROR COMÚN: Si intentás ejecutar 'mover' en el borde (ej. calle 100 mirando al norte) o fuera de tu área, el programa aborta con error."
  },
  {
    palabraClave: "derecha",
    categoria: "Acciones",
    alcance: "basico",
    descripcion: "Cambia la orientación del robot girando 90° en sentido horario (Norte → Este → Sur → Oeste → Norte).",
    sintaxis: "derecha",
    ejemplo: "{ Girar a la izquierda }\nrepetir 3\n  derecha",
    nota: "No existe una primitiva 'izquierda'; se logra ejecutando 3 veces 'derecha'."
  },
  {
    palabraClave: "Pos",
    categoria: "Acciones",
    alcance: "basico",
    descripcion: "Teletransporta o posiciona al robot directamente en la esquina (av, ca) sin modificar su orientación actual.",
    sintaxis: "Pos(avenida, calle)",
    ejemplo: "Pos(4, 3)\nPos(PosAv + 1, 1)",
    nota: "Las coordenadas deben estar en el rango 1..100 y dentro de un área asignada al robot."
  },
  {
    palabraClave: "tomarFlor",
    categoria: "Acciones",
    alcance: "basico",
    descripcion: "Recoge una flor de la esquina donde está parado el robot y la guarda en su bolsa (capacidad ilimitada).",
    sintaxis: "tomarFlor",
    ejemplo: "si (HayFlorEnLaEsquina)\n  tomarFlor",
    nota: "Solo debe ejecutarse si hay al menos una flor en la esquina; de lo contrario, el programa aborta."
  },
  {
    palabraClave: "tomarPapel",
    categoria: "Acciones",
    alcance: "basico",
    descripcion: "Recoge un papel de la esquina actual y lo guarda en la bolsa del robot.",
    sintaxis: "tomarPapel",
    ejemplo: "mientras (HayPapelEnLaEsquina)\n  tomarPapel",
    nota: "Solo debe ejecutarse si hay al menos un papel en la esquina; si no, el programa aborta."
  },
  {
    palabraClave: "depositarFlor",
    categoria: "Acciones",
    alcance: "basico",
    descripcion: "Saca una flor de la bolsa del robot y la coloca en la esquina donde se encuentra parado.",
    sintaxis: "depositarFlor",
    ejemplo: "si (HayFlorEnLaBolsa)\n  depositarFlor",
    nota: "Si la bolsa no tiene flores, el programa aborta con error. Verificá siempre con HayFlorEnLaBolsa."
  },
  {
    palabraClave: "depositarPapel",
    categoria: "Acciones",
    alcance: "basico",
    descripcion: "Saca un papel de la bolsa del robot y lo coloca en la esquina actual.",
    sintaxis: "depositarPapel",
    ejemplo: "si (HayPapelEnLaBolsa)\n  depositarPapel",
    nota: "Si la bolsa no tiene papeles, el programa aborta con error. Verificá con HayPapelEnLaBolsa."
  },
  {
    palabraClave: "PosAv",
    categoria: "Sensores y Estado",
    alcance: "basico",
    descripcion: "Identificador de solo lectura que devuelve el número de avenida (1..100) en la que está posicionado el robot.",
    sintaxis: "PosAv",
    ejemplo: "Pos(PosAv + 1, 1)\nInformar(PosAv)",
    nota: "NO se puede modificar por asignación (PosAv := 3 es inválido). Para cambiar de esquina usá 'mover' o 'Pos'."
  },
  {
    palabraClave: "PosCa",
    categoria: "Sensores y Estado",
    alcance: "basico",
    descripcion: "Identificador de solo lectura que devuelve el número de calle (1..100) en la que está posicionado el robot.",
    sintaxis: "PosCa",
    ejemplo: "mientras ((~HayFlorEnLaEsquina) & (PosCa < 100))\n  mover",
    nota: "Solo lectura. Muy útil como condición de corte para no caerse de la ciudad."
  },
  {
    palabraClave: "HayFlorEnLaEsquina",
    categoria: "Sensores y Estado",
    alcance: "basico",
    descripcion: "Proposición atómica booleana: vale V si existe al menos una flor en la esquina actual, o F en caso contrario.",
    sintaxis: "HayFlorEnLaEsquina",
    ejemplo: "si (HayFlorEnLaEsquina)\n  tomarFlor",
    nota: "No indica cuántas flores hay; para contarlas hay que juntarlas con un 'mientras' y un contador."
  },
  {
    palabraClave: "HayPapelEnLaEsquina",
    categoria: "Sensores y Estado",
    alcance: "basico",
    descripcion: "Proposición atómica booleana: vale V si existe al menos un papel en la esquina actual, o F en caso contrario.",
    sintaxis: "HayPapelEnLaEsquina",
    ejemplo: "mientras (HayPapelEnLaEsquina)\n  tomarPapel",
    nota: "Para saber si una esquina está vacía se evalúa: ~(HayFlorEnLaEsquina | HayPapelEnLaEsquina)."
  },
  {
    palabraClave: "HayFlorEnLaBolsa",
    categoria: "Sensores y Estado",
    alcance: "basico",
    descripcion: "Proposición atómica booleana: vale V si el robot tiene al menos una flor en su bolsa, o F si está vacía de flores.",
    sintaxis: "HayFlorEnLaBolsa",
    ejemplo: "mientras (HayFlorEnLaBolsa)\n  depositarFlor",
    nota: "Indispensable antes de 'depositarFlor' cuando no se sabe si quedan flores en la bolsa."
  },
  {
    palabraClave: "HayPapelEnLaBolsa",
    categoria: "Sensores y Estado",
    alcance: "basico",
    descripcion: "Proposición atómica booleana: vale V si el robot tiene al menos un papel en su bolsa, o F si no tiene ninguno.",
    sintaxis: "HayPapelEnLaBolsa",
    ejemplo: "si (HayPapelEnLaBolsa)\n  depositarPapel",
    nota: "Su valor no puede ser modificado manualmente por el programador."
  },
  {
    palabraClave: "numero",
    categoria: "Tipos y Parámetros",
    alcance: "basico",
    descripcion: "Tipo de dato para números enteros (sin tilde: 'numero'). Permite operar con +, -, *, / (división entera) y comparar valores.",
    sintaxis: "nombreVar: numero",
    ejemplo: "variables\n  totalFlores: numero",
    nota: "Rango en R-Info: -2147483647 a 2147483647. Atención: se escribe sin tilde ('numero')."
  },
  {
    palabraClave: "boolean",
    categoria: "Tipos y Parámetros",
    alcance: "basico",
    descripcion: "Tipo de dato lógico que almacena únicamente uno de dos valores posibles: Verdadero (V) o Falso (F).",
    sintaxis: "nombreVar: boolean",
    ejemplo: "variables\n  habiaFlor: boolean\ncomenzar\n  habiaFlor := HayFlorEnLaEsquina",
    nota: "Ideal para recordar el resultado de una condición antes de modificar la esquina."
  },
  {
    palabraClave: "V",
    categoria: "Tipos y Parámetros",
    alcance: "basico",
    descripcion: "Literal booleano que representa el valor lógico Verdadero.",
    sintaxis: "V",
    ejemplo: "encontro := V\nInformar(V)",
    nota: "Siempre se escribe en mayúscula sola: V (no 'true' ni 'Verdadero')."
  },
  {
    palabraClave: "F",
    categoria: "Tipos y Parámetros",
    alcance: "basico",
    descripcion: "Literal booleano que representa el valor lógico Falso.",
    sintaxis: "F",
    ejemplo: "encontro := F\nsino\n  Informar(F)",
    nota: "Siempre se escribe en mayúscula sola: F (no 'false' ni 'Falso')."
  },
  {
    palabraClave: "E",
    categoria: "Tipos y Parámetros",
    alcance: "extendido",
    descripcion: "Especificador de parámetro de Entrada en un 'proceso'. Pasa una copia del valor; modificarlo adentro no afecta al llamador.",
    sintaxis: "proceso Nombre(E param: tipo)",
    ejemplo: "proceso RecorrerCuadras(E cant: numero)\ncomenzar\n  repetir cant\n    mover\nfin",
    nota: "Se pueden pasar literales o expresiones (ej. RecorrerCuadras(5)) cuando el parámetro es de tipo E."
  },
  {
    palabraClave: "ES",
    categoria: "Tipos y Parámetros",
    alcance: "extendido",
    descripcion: "Especificador de parámetro de Entrada/Salida en un 'proceso'. Pasa la variable por referencia, permitiendo devolver cambios.",
    sintaxis: "proceso Nombre(ES param: tipo)",
    ejemplo: "proceso ContarFlores(ES cant: numero)\ncomenzar\n  mientras (HayFlorEnLaEsquina)\n    tomarFlor\n    cant := cant + 1\nfin",
    nota: "Al invocar un proceso con parámetro ES, debés pasarle una variable (nunca un literal como 5 o V)."
  },
  {
    palabraClave: "Informar",
    categoria: "E/S y Concurrencia",
    alcance: "basico",
    descripcion: "Muestra en pantalla el valor de una variable, expresión o literal. En versiones extendidas acepta un texto descriptivo previo.",
    sintaxis: "Informar(valor)  o  Informar('texto', valor)",
    ejemplo: "Informar(PosAv, PosCa)\nInformar('Flores', cant)",
    nota: "Útil para mostrar resultados finales o depurar valores durante la ejecución."
  },
  {
    palabraClave: "Random",
    categoria: "E/S y Concurrencia",
    alcance: "extendido",
    descripcion: "Genera un número entero aleatorio dentro del rango inclusivo [min, max] y lo almacena en la variable indicada.",
    sintaxis: "Random(variable, min, max)",
    ejemplo: "Random(avDestino, 1, 100)",
    nota: "El valor mínimo debe ser menor que el máximo; de lo contrario produce error."
  },
  {
    palabraClave: "BloquearEsquina",
    categoria: "E/S y Concurrencia",
    alcance: "extendido",
    descripcion: "Solicita acceso exclusivo sobre la esquina (av, ca) para que ningún otro robot entre en ella hasta ser liberada.",
    sintaxis: "BloquearEsquina(av, ca)",
    ejemplo: "BloquearEsquina(10, 10)\nPos(10, 10)\ndepositarFlor\nPos(av, ca)\nLiberarEsquina(10, 10)",
    nota: "Fundamental en programación concurrente para evitar colisiones o condiciones de carrera en áreas compartidas."
  },
  {
    palabraClave: "LiberarEsquina",
    categoria: "E/S y Concurrencia",
    alcance: "extendido",
    descripcion: "Libera la exclusión mutua de la esquina (av, ca) previamente bloqueada con BloquearEsquina.",
    sintaxis: "LiberarEsquina(av, ca)",
    ejemplo: "Pos(avOriginal, caOriginal)\nLiberarEsquina(10, 10)",
    nota: "Siempre salí de la esquina compartida ANTES de llamar a LiberarEsquina."
  },
  {
    palabraClave: "EnviarMensaje",
    categoria: "E/S y Concurrencia",
    alcance: "extendido",
    descripcion: "Envía de forma asíncrona un valor o variable hacia otro robot receptor (especificado por su nombre de variable robot).",
    sintaxis: "EnviarMensaje(valor, robotDestino)",
    ejemplo: "EnviarMensaje(cantFlores, robotJefe)",
    nota: "Es asíncrono: el emisor envía el dato y continúa inmediatamente sin esperar a que el receptor lo lea."
  },
  {
    palabraClave: "RecibirMensaje",
    categoria: "E/S y Concurrencia",
    alcance: "extendido",
    descripcion: "Recibe de forma síncrona un mensaje desde un robot emisor concreto (o cualquiera usando '*') y lo guarda en una variable.",
    sintaxis: "RecibirMensaje(var, robotEmisor)  o  RecibirMensaje(var, *)",
    ejemplo: "RecibirMensaje(id, *)\nsi (id = 1)\n  RecibirMensaje(flores, r1)",
    nota: "Es síncrono (bloqueante): el robot se detiene hasta que llegue un mensaje del emisor indicado."
  },
  {
    palabraClave: ":=",
    categoria: "Operadores",
    alcance: "basico",
    descripcion: "Operador de asignación. Evalúa la expresión de la derecha y guarda el resultado en la variable de la izquierda.",
    sintaxis: "variable := expresion",
    ejemplo: "cuadras := 0\ncuadras := cuadras + 1",
    nota: "No confundir ':=' (asignar) con '=' (comparar igualdad en condiciones)."
  },
  {
    palabraClave: "&",
    categoria: "Operadores",
    alcance: "basico",
    descripcion: "Operador lógico Conjunción (Y). Devuelve Verdadero (V) únicamente cuando ambas proposiciones son verdaderas.",
    sintaxis: "prop1 & prop2",
    ejemplo: "si (HayFlorEnLaEsquina & HayPapelEnLaEsquina)\n  cant := cant + 1",
    nota: "Tiene la misma precedencia que '|' (se evalúan de izquierda a derecha), pero menor precedencia que '~'."
  },
  {
    palabraClave: "|",
    categoria: "Operadores",
    alcance: "basico",
    descripcion: "Operador lógico Disyunción incluyente (O). Devuelve Verdadero (V) si al menos una de las proposiciones es verdadera.",
    sintaxis: "prop1 | prop2",
    ejemplo: "mientras (~HayFlorEnLaEsquina | ~HayPapelEnLaEsquina)\n  mover",
    nota: "Usá paréntesis cuando lo combines con '&' o '~' para dejar explícito el orden de evaluación."
  },
  {
    palabraClave: "~",
    categoria: "Operadores",
    alcance: "basico",
    descripcion: "Operador lógico Negación (NO). Invierte el valor de verdad de la proposición siguiente (V → F, F → V).",
    sintaxis: "~(proposicion)",
    ejemplo: "mientras (~HayFlorEnLaEsquina)\n  mover",
    nota: "Es el operador lógico de MAYOR prioridad. '~p | q' equivale a '(~p) | q', distinto de '~(p | q)'."
  },
  {
    palabraClave: "+  -  *  /",
    categoria: "Operadores",
    alcance: "basico",
    descripcion: "Operadores aritméticos para datos 'numero': suma (+), resta (-), multiplicación (*) y división entera (/).",
    sintaxis: "expr1 + expr2  |  25 / 3  {da 8}",
    ejemplo: "Informar(nro1 * nro2)\nmitad := cant / 2",
    nota: "La división '/' es ENTERA: descarta la parte fraccionaria (ej. 25 / 3 = 8). No existe operador de resto (%)."
  },
  {
    palabraClave: "=  <>  <  >  <=  >=",
    categoria: "Operadores",
    alcance: "basico",
    descripcion: "Operadores relacionales para comparar valores: igual (=), distinto (<>), menor (<), mayor (>), menor o igual (<=) y mayor o igual (>=).",
    sintaxis: "A = B  |  A <> B  |  PosCa < 100",
    ejemplo: "si (flores > papeles)\n  Informar(flores)",
    nota: "Atención: la igualdad se escribe con un solo '=' y el distinto con '<>' (como en Pascal)."
  },
  {
    palabraClave: "{ ... }",
    categoria: "Operadores",
    alcance: "basico",
    descripcion: "Delimitadores de comentarios lógicos. Todo texto entre llaves es ignorado al compilar y sirve para documentar qué hace cada bloque.",
    sintaxis: "{ comentario explicativo }",
    ejemplo: "{ Recorre la Av. 1 contando flores }\nrepetir 99\n  ...",
    nota: "Buena práctica UNLP: los comentarios lógicos explican la intención/transformación del bloque, no repiten el código."
  }
];
