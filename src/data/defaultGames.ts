import { Category } from '../types';

export interface PredefinedGame {
  id: string;
  title: string;
  description: string;
  categories: Category[];
}

export const PREDEFINED_GAMES: PredefinedGame[] = [
  {
    id: 'tech',
    title: 'Jeopardy de Programación y Tecnología',
    description: 'Preguntas sobre desarrollo web, bases de datos, algoritmos, ciberseguridad e historia de la computación.',
    categories: [
      {
        id: 'cat-js',
        name: 'JavaScript & Web',
        clues: [
          { id: 'js-100', value: 100, question: 'Palabra clave introducida en ES6 para declarar variables con ámbito de bloque que no pueden ser reasignadas.', answer: 'const', isAnswered: false, answeredByTeamId: null },
          { id: 'js-200', value: 200, question: 'Estructura asíncrona que representa la terminación o el fracaso eventual de una operación en JS.', answer: 'Promise (o Promesa)', isAnswered: false, answeredByTeamId: null },
          { id: 'js-300', value: 300, question: 'Mecanismo en JS que busca identificadores a través de funciones anidadas hasta el objeto global.', answer: 'Scope Chain (o Cadena de Ámbito)', isAnswered: false, answeredByTeamId: null },
          { id: 'js-400', value: 400, question: 'Hook de React que permite ejecutar efectos secundarios como suscripciones, llamadas a APIs o temporizadores.', answer: 'useEffect', isAnswered: false, answeredByTeamId: null },
          { id: 'js-500', value: 500, question: 'Técnica de optimización que retrasa la ejecución de una función costosa hasta que haya pasado un tiempo de inactividad.', answer: 'Debounce (o Debouncing)', isAnswered: false, answeredByTeamId: null },
        ],
      },
      {
        id: 'cat-db',
        name: 'Bases de Datos',
        clues: [
          { id: 'db-100', value: 100, question: 'Comando SQL fundamental utilizado para extraer registros de una o más tablas.', answer: 'SELECT', isAnswered: false, answeredByTeamId: null },
          { id: 'db-200', value: 200, question: 'Propiedades de transacciones ACID: Atomicidad, Consistencia, Aislamiento y esta cuarta cualidad.', answer: 'Durabilidad (Durability)', isAnswered: false, answeredByTeamId: null },
          { id: 'db-300', value: 300, question: 'Estructura de datos en forma de árbol comúnmente usada por motores relacionales para indexar claves.', answer: 'B-Tree (Árbol B / B+ Tree)', isAnswered: false, answeredByTeamId: null },
          { id: 'db-400', value: 400, question: 'Tipo de base de datos NoSQL caracterizada por almacenar pares clave-documento JSON o BSON.', answer: 'Documental (ej. MongoDB)', isAnswered: false, answeredByTeamId: null },
          { id: 'db-500', value: 500, question: 'Teorema que postula que un sistema distribuido solo puede garantizar dos de tres: Consistencia, Disponibilidad o Tolerancia a Particiones.', answer: 'Teorema CAP', isAnswered: false, answeredByTeamId: null },
        ],
      },
      {
        id: 'cat-algo',
        name: 'Algoritmos & Lógica',
        clues: [
          { id: 'algo-100', value: 100, question: 'Estructura de datos lineal que opera bajo el principio LIFO (Last In, First Out).', answer: 'Pila (Stack)', isAnswered: false, answeredByTeamId: null },
          { id: 'algo-200', value: 200, question: 'Notación matemática utilizada para clasificar algoritmos según su tiempo de ejecución o espacio.', answer: 'Big O (Notación O Grande)', isAnswered: false, answeredByTeamId: null },
          { id: 'algo-300', value: 300, question: 'Algoritmo de ordenamiento divide y vencerás inventado por Tony Hoare en 1959 con complejidad promedio O(n log n).', answer: 'Quicksort', isAnswered: false, answeredByTeamId: null },
          { id: 'algo-400', value: 400, question: 'Algoritmo voraz (greedy) utilizado para encontrar los caminos más cortos desde un origen en grafos con pesos no negativos.', answer: 'Algoritmo de Dijkstra', isAnswered: false, answeredByTeamId: null },
          { id: 'algo-500', value: 500, question: 'Problema clásico de optimización combinatoria NP-hard donde un comerciante debe visitar N ciudades volviendo al punto de inicio.', answer: 'Problema del Viajante (TSP)', isAnswered: false, answeredByTeamId: null },
        ],
      },
      {
        id: 'cat-net',
        name: 'Redes & Protocolos',
        clues: [
          { id: 'net-100', value: 100, question: 'Código de estado HTTP que indica que el recurso solicitado no fue encontrado en el servidor.', answer: '404 (Not Found)', isAnswered: false, answeredByTeamId: null },
          { id: 'net-200', value: 200, question: 'Protocolo de transporte orientado a la conexión con apretón de manos en tres pasos (SYN, SYN-ACK, ACK).', answer: 'TCP (Transmission Control Protocol)', isAnswered: false, answeredByTeamId: null },
          { id: 'net-300', value: 300, question: 'Sistema de nombres que traduce direcciones legibles por humanos (ej. google.com) a direcciones IP numéricas.', answer: 'DNS (Domain Name System)', isAnswered: false, answeredByTeamId: null },
          { id: 'net-400', value: 400, question: 'Mecanismo de seguridad en navegadores que restringe que una página web cargue recursos de un dominio distinto.', answer: 'CORS (Cross-Origin Resource Sharing)', isAnswered: false, answeredByTeamId: null },
          { id: 'net-500', value: 500, question: 'Protocolo bidireccional full-duplex sobre una sola conexión TCP que permite comunicación instantánea cliente-servidor.', answer: 'WebSocket', isAnswered: false, answeredByTeamId: null },
        ],
      },
      {
        id: 'cat-hist',
        name: 'Historia Tech & Curiosidades',
        clues: [
          { id: 'hist-100', value: 100, question: 'Considerada la primera programadora de la historia por su trabajo en la máquina analítica de Babbage.', answer: 'Ada Lovelace', isAnswered: false, answeredByTeamId: null },
          { id: 'hist-200', value: 200, question: 'Creador de Linux y del sistema de control de versiones Git en 2005.', answer: 'Linus Torvalds', isAnswered: false, answeredByTeamId: null },
          { id: 'hist-300', value: 300, question: 'Famoso insecto polilla encontrado en 1947 en el relé de la computadora Mark II que popularizó este término.', answer: 'Bug (o Depuración/Debug)', isAnswered: false, answeredByTeamId: null },
          { id: 'hist-400', value: 400, question: 'Lenguaje de programación creado por Brendan Eich en Netscape en tan solo 10 días en mayo de 1995.', answer: 'JavaScript (Mocha / LiveScript)', isAnswered: false, answeredByTeamId: null },
          { id: 'hist-500', value: 500, question: 'Científico de la computación británico padre de la informática teórica y descifrador de la máquina Enigma.', answer: 'Alan Turing', isAnswered: false, answeredByTeamId: null },
        ],
      },
    ],
  },
  {
    id: 'school',
    title: 'Jeopardy Escolar y Cultura General',
    description: 'Preguntas desafiantes sobre Historia, Geografía, Ciencias Naturales, Literatura y Arte universal.',
    categories: [
      {
        id: 'cat-hist-gen',
        name: 'Historia Universal',
        clues: [
          { id: 'hg-100', value: 100, question: 'Año en que Cristóbal Colón llegó por primera vez al continente americano.', answer: '1492', isAnswered: false, answeredByTeamId: null },
          { id: 'hg-200', value: 200, question: 'Civilización antigua que construyó la majestuosa ciudadela de Machu Picchu en los Andes peruanos.', answer: 'Los Incas (Imperio Incaico)', isAnswered: false, answeredByTeamId: null },
          { id: 'hg-300', value: 300, question: 'Revolución iniciada en 1789 con la toma de la fortaleza de la Bastilla en París.', answer: 'Revolución Francesa', isAnswered: false, answeredByTeamId: null },
          { id: 'hg-400', value: 400, question: 'Muro que dividió una capital europea durante la Guerra Fría entre 1961 y noviembre de 1989.', answer: 'El Muro de Berlín', isAnswered: false, answeredByTeamId: null },
          { id: 'hg-500', value: 500, question: 'General cartaginés que cruzó los Alpes con elefantes de guerra para desafiar a la República Romana.', answer: 'Aníbal Barca', isAnswered: false, answeredByTeamId: null },
        ],
      },
      {
        id: 'cat-geo',
        name: 'Geografía del Mundo',
        clues: [
          { id: 'geo-100', value: 100, question: 'El río más largo y caudaloso del planeta Tierra, que atraviesa la selva sudamericana.', answer: 'Río Amazonas', isAnswered: false, answeredByTeamId: null },
          { id: 'geo-200', value: 200, question: 'País del mundo con mayor superficie territorial, extendido por Europa y Asia.', answer: 'Rusia', isAnswered: false, answeredByTeamId: null },
          { id: 'geo-300', value: 300, question: 'Montaña más alta del mundo sobre el nivel del mar, ubicada en la cordillera del Himalaya.', answer: 'Monte Everest (8,848 m)', isAnswered: false, answeredByTeamId: null },
          { id: 'geo-400', value: 400, question: 'Capital del país del sol naciente, Japón.', answer: 'Tokio', isAnswered: false, answeredByTeamId: null },
          { id: 'geo-500', value: 500, question: 'Estrecho marítimo natural que separa España y Marruecos, uniendo el Mediterráneo con el Atlántico.', answer: 'Estrecho de Gibraltar', isAnswered: false, answeredByTeamId: null },
        ],
      },
      {
        id: 'cat-cie',
        name: 'Ciencia & Planeta',
        clues: [
          { id: 'cie-100', value: 100, question: 'Planeta conocido como el "Planeta Rojo" debido al óxido de hierro en su superficie.', answer: 'Marte', isAnswered: false, answeredByTeamId: null },
          { id: 'cie-200', value: 200, question: 'Proceso mediante el cual las plantas convierten la luz solar, agua y dióxido de carbono en glucosa y oxígeno.', answer: 'Fotosíntesis', isAnswered: false, answeredByTeamId: null },
          { id: 'cie-300', value: 300, question: 'Elemento químico más abundante del universo conocido, con número atómico 1.', answer: 'Hidrógeno (H)', isAnswered: false, answeredByTeamId: null },
          { id: 'cie-400', value: 400, question: 'Órgano vital del cuerpo humano responsable de bombear sangre oxigenada a todo el organismo.', answer: 'El Corazón', isAnswered: false, answeredByTeamId: null },
          { id: 'cie-500', value: 500, question: 'Científica polaco-francesa pionera en radiactividad y la primera persona en ganar dos Premios Nobel en distintas ciencias.', answer: 'Marie Curie (Física y Química)', isAnswered: false, answeredByTeamId: null },
        ],
      },
      {
        id: 'cat-lit',
        name: 'Literatura & Palabras',
        clues: [
          { id: 'lit-100', value: 100, question: 'Autor español creador del ingenioso hidalgo Don Quijote de la Mancha.', answer: 'Miguel de Cervantes Saavedra', isAnswered: false, answeredByTeamId: null },
          { id: 'lit-200', value: 200, question: 'Dramaturgo inglés autor de tragedias inmortales como "Hamlet", "Macbeth" y "Romeo y Julieta".', answer: 'William Shakespeare', isAnswered: false, answeredByTeamId: null },
          { id: 'lit-300', value: 300, question: 'Novela cumbre del realismo mágico ambientada en Macondo escrita por Gabriel García Márquez.', answer: 'Cien años de soledad', isAnswered: false, answeredByTeamId: null },
          { id: 'lit-400', value: 400, question: 'Poeta de la Grecia clásica a quien se le atribuyen las dos grandes epopeyas: La Ilíada y La Odisea.', answer: 'Homero', isAnswered: false, answeredByTeamId: null },
          { id: 'lit-500', value: 500, question: 'Figura retórica que consiste en atribuir cualidades o acciones humanas a objetos inanimados o animales.', answer: 'Personificación (o Prosopopeya)', isAnswered: false, answeredByTeamId: null },
        ],
      },
      {
        id: 'cat-art',
        name: 'Arte, Música & Cine',
        clues: [
          { id: 'art-100', value: 100, question: 'Famosa pintura renacentista de Leonardo da Vinci exhibida en el Museo del Louvre.', answer: 'La Mona Lisa (La Gioconda)', isAnswered: false, answeredByTeamId: null },
          { id: 'art-200', value: 200, question: 'Compositor alemán sordo en su madurez que compuso la célebre Novena Sinfonía con el Himno a la Alegría.', answer: 'Ludwig van Beethoven', isAnswered: false, answeredByTeamId: null },
          { id: 'art-300', value: 300, question: 'Pintor postimpresionista neerlandés autor de "La noche estrellada" y "Los girasoles".', answer: 'Vincent van Gogh', isAnswered: false, answeredByTeamId: null },
          { id: 'art-400', value: 400, question: 'Director de cine estadounidense creador de clásicos como "Tiburón", "E.T.", "Parque Jurásico" y "La lista de Schindler".', answer: 'Steven Spielberg', isAnswered: false, answeredByTeamId: null },
          { id: 'art-500', value: 500, question: 'Movimiento artístico español de vanguardia del siglo XX liderado por Salvador Dalí con obras oníricas.', answer: 'Surrealismo', isAnswered: false, answeredByTeamId: null },
        ],
      },
    ],
  },
];
