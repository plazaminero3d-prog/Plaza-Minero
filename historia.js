/* ============================================================
   HISTORIA INTERACTIVA POR ZONAS (AL CAMINAR) Y RECORRIDO
   PLAZA DEL MINERO - LLALLAGUA - SIGLO XX
   + MÚSICA DE FONDO CONTINUA + AUDIO NARRADO SIMULTÁNEO (01 AL 08)
============================================================ */

(function () {
    console.log("Sistema de Historia por Zonas 3D con Música + Audio simultáneo cargado.");

    var historiaOverlay, historiaPanel, historiaTitulo, historiaTexto;
    var historiaImagen, historiaNumero, historiaProgreso, historiaProgresoFill;
    var botonSiguiente, botonExplorar, botonAudioHistoria;

    window.historiaEnCurso = false; 
    window.camaraHistoriaObjetivo = null; 
    var modoRecorridoCompleto = false;
    var indiceActual = 0;

    // Canal independiente para los audios de la historia (no interrumpe ni baja la música de fondo)
    var narradorAudio = new Audio();
    narradorAudio.preload = "auto";
    narradorAudio.volume = 1.0; 
    var usandoSintesisVoz = false;
    var narracionPausada = false;

    // Las 8 Estaciones históricas enfocadas dentro de los límites de la Plaza del Minero
    window.ESTACIONES_HISTORIA = [
        {
            numero: "01",
            audio: "audios/01.mp3",
            titulo: "El Origen de la Plaza y la Era del Estaño",
            imagen: "imagenes/historia.jpg",
            texto: "La historia de este espacio nace con la explotación industrial de estaño en la mina Siglo XX (Llallagua). A finales del siglo XIX, el cochabambino Simón I. Patiño adquirió la mina 'La Salvadora' y descubrió la veta más rica del mundo, consolidando en 1924 la 'Patiño Mines'. En este contexto de extrema riqueza para los empresarios y gran pobreza para los obreros, se conformó la histórica Plaza del Minero entre los campamentos de calamina y el edificio sindical. Este espacio abierto fue concebido como el corazón de reunión, resistencia y organización de los trabajadores del subsuelo contra el sistema capitalista.\n\n[Fuente de imagen: Fotografía histórica de la mina Siglo XX, 1940-1946 (Wikipedia, 2026)].",
            zona: new THREE.Vector3(10, 0, -10),
            camara: { posicion: new THREE.Vector3(-48, 32, 32), objetivo: new THREE.Vector3(-85, 12, -20) },
            visitado: false
        },
        {
            numero: "02",
            audio: "audios/02.mp3",
            titulo: "Fundación del Sindicato y la Sede de Piedra (1941)",
            imagen: "imagenes/ladoantiguo.jpg",
            texto: "El 10 de enero de 1941, impulsados por la necesidad de defender sus intereses de clase frente a la rosca minera, los obreros fundaron el Sindicato Mixto de Trabajadores Mineros de Siglo XX. Poco después, con el sudor de su frente, los propios mineros construyeron su imponente sede sindical. La levantaron con piedra labrada, edificándola directamente sobre las ruinas de una antigua construcción que apenas tenía paredes de adobe y techo de paja, convirtiéndola en una verdadera fortaleza del sindicalismo revolucionario boliviano.\n\n[Fuente de imagen: Archivo documental del Sindicato Mixto de Trabajadores Mineros de Siglo XX (Montoya, 2022)].",
            zona: new THREE.Vector3(-55, 7.5, 15),
            camara: { posicion: new THREE.Vector3(-50, 24, 15), objetivo: new THREE.Vector3(-73, 16, 11) },
            visitado: false
        },
        {
            numero: "03",
            audio: "audios/03.mp3",
            titulo: "El Balcón, la Sirena y 'La Voz del Minero'",
            imagen: "imagenes/antiguofrenteminero.jpg",
            texto: "En los momentos de mayor agitación, la plaza se repletaba de obreros, valerosas 'amas de casa' y estudiantes. Desde el emblemático balcón del segundo piso se pronunciaban arengas incendiarias. En el techo del edificio se instaló una estridente sirena que cumplía múltiples funciones: despertaba a los obreros de la 'primera punta', convocaba a asambleas urgentes y alertaba a las familias sobre las intervenciones militares. Simultáneamente, desde la segunda planta, los micrófonos de Radio 'La Voz del Minero' transmitían en directo y en cadena los conflictos al rojo vivo.\n\n[Fuente de imagen: Archivo Histórico de Asambleas Mineras en Siglo XX (Montoya, 2025)].",
            zona: new THREE.Vector3(-78, 7.5, -12),
            camara: { posicion: new THREE.Vector3(-55, 25, 5), objetivo: new THREE.Vector3(-95, 15, -20) },
            visitado: false
        },
        {
            numero: "04",
            audio: "audios/04.mp3",
            titulo: "La Huelga General y Rebelión de Mayo de 1949",
            imagen: "imagenes/frenteantigua.jpg",
            texto: "El 28 de mayo de 1949, bajo el gobierno 'rosquero' de Enrique Hertzog, estalló un gran conflicto. Cien carabineros interceptaron y apresaron a los dirigentes mineros (como Juan Lechín, Mario Torrez y Guillermo Lora) en el cruce hacia Uncía, mientras dos avionetas ametrallaban los campamentos. En respuesta, más de quinientos obreros y amas de casa enardecidas se reunieron al mediodía en la Plaza del Minero, declararon la huelga general y tomaron como rehenes en la sede sindical a varios altos técnicos norteamericanos de la Patiño Mines, exigiendo la libertad de sus líderes.\n\n[Fuente de imagen: Registro histórico del conflicto minero de 1949 (Lora, s.f.)].",
            zona: new THREE.Vector3(-55, 8.0, -45),
            camara: { posicion: new THREE.Vector3(-75, 32, 15), objetivo: new THREE.Vector3(-111.5, 25, -13) },
            visitado: false
        },
        {
            numero: "05",
            audio: "audios/05.mp3",
            titulo: "El Ataque con Morteros a la Plaza (29 de Mayo de 1949)",
            imagen: "imagenes/lateral.jpg",
            texto: "Al día siguiente, el 29 de mayo de 1949, el gobierno respondió con brutalidad. Los regimientos Ingavi, Colorados y Andino rodearon la plaza. Por orden militar, se abrió fuego con morteros directamente contra el edificio del sindicato, abriendo un boquete en la sala de la radio. En medio del caos, murieron en el segundo piso los rehenes John O'Connor, Albert Kreffting y el jefe de campamento. Afuera, la represión desató una de las peores masacres de la historia, dejando entre 144 y 300 mineros asesinados.\n\n[Fuente de imagen: Vista del frontis sindical e ingreso a la plaza. Elaboración propia, 2026].",
            zona: new THREE.Vector3(-93, 7.5, -50),
            camara: { posicion: new THREE.Vector3(-52, 30, -25), objetivo: new THREE.Vector3(-74, 15, -38) },
            visitado: false
        },
        {
            numero: "06",
            audio: "audios/06.mp3",
            titulo: "La Masacre de San Juan en la Plaza (24 de Junio de 1967)",
            imagen: "imagenes/masacre.png",
            texto: "Tras la Revolución de 1952, la mina fue nacionalizada y pasó a manos de COMIBOL. Sin embargo, la violencia retornó en la madrugada del 24 de junio de 1967, cuando el régimen dictatorial de René Barrientos Ortuño, con apoyo del Alto Mando Militar y asesores de la CIA, perpetró la horrenda Masacre de San Juan. Las tropas atacaron la plaza y, en la misma segunda planta del sindicato, asesinaron a tiros al dirigente minero Rosendo García Maisman. Hasta el día de hoy, el frontis de piedra conserva los impactos de bala como testigos mudos.\n\n[Fuente de imagen: Fotografía actual de la Plaza del Minero. Elaboración propia, 2026].",
            zona: new THREE.Vector3(-93.5, 7.5, -74),
            camara: { posicion: new THREE.Vector3(-52, 30, -60), objetivo: new THREE.Vector3(-78, 16, -74) },
            visitado: false
        },
        {
            numero: "07",
            audio: "audios/07.mp3",
            titulo: "El Cierre Histórico de 1987 y la Relocalización",
            imagen: "imagenes/reco.png",
            texto: "El Sindicato Mixto de Trabajadores Mineros de Siglo XX, considerado el más combativo del país, resistió por 46 años. Su final llegó en 1987, poco después de que el gobierno de Víctor Paz Estenssoro promulgara el nefasto Decreto Supremo 21060 (agosto de 1985). Tras la histórica 'Marcha por la Vida' en 1986 y el cierre de las operaciones estatales de COMIBOL, miles de mineros fueron despedidos y obligados a abandonar los campamentos en el proceso conocido como la 'relocalización', dejando la imponente sede sindical vacía.\n\n[Fuente de imagen: Vista lateral de la plaza y áreas verdes. Elaboración propia, 2026].",
            zona: new THREE.Vector3(-96, 7.5, -105),
            camara: { posicion: new THREE.Vector3(-75, 30, -85), objetivo: new THREE.Vector3(-114, 12, -104) },
            visitado: false
        },
        {
            numero: "08",
            audio: "audios/08.mp3",
            titulo: "El Legado Ideológico y la Conciencia de Clase",
            imagen: "imagenes/lateral.jpg",
            texto: "La Plaza del Minero es el testamento vivo de un pasado glorioso. Aquí, con el verbo encendido y una afilada conciencia política, los mineros, estudiantes y las valerosas 'amas de casa' trazaron los lineamientos estratégicos para liberarse de la opresión imperialista. Convencidos de que la lucha contra la injusticia social solo sería posible mediante la unidad monolítica, convirtieron este espacio en la máxima trinchera del sindicalismo revolucionario para enfrentar a la oligarquía y a las dictaduras (Montoya, 2022).\n\n[Fuente de imagen: Reconstrucción tridimensional de la Plaza del Minero. Elaboración propia, 2026].",
            zona: new THREE.Vector3(-95, 7.5, -142),
            camara: { posicion: new THREE.Vector3(-52, 32, -115), objetivo: new THREE.Vector3(-78, 12, -133) },
            visitado: false
        }
    ];

    // ============================================================
    // ASEGURAR QUE LA MÚSICA DE FONDO SIGA SONANDO NORMAL SIEMPRE
    // ============================================================
    function asegurarMusicaDeFondoActiva() {
        // window.sound es la música cargada en modelo.js ('assets/mieros.mp3')
        if (window.sound) {
            if (window.sound.buffer && !window.sound.isPlaying) {
                try { window.sound.play(); } catch (e) {}
            }
            if (typeof window.sound.setVolume === "function") {
                window.sound.setVolume(0.3); // Se mantiene constante en su volumen normal
            }
        }
    }

    function actualizarEstadoBotonAudio(texto, activo) {
        if (!botonAudioHistoria) return;
        botonAudioHistoria.innerHTML = texto;
        botonAudioHistoria.style.borderColor = activo ? "#4ade80" : "rgba(224, 176, 102, 0.5)";
        botonAudioHistoria.style.color = activo ? "#86efac" : "#fde047";
    }

    function detenerNarracionActual() {
        try {
            narradorAudio.pause();
            narradorAudio.currentTime = 0;
        } catch (e) {}

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        usandoSintesisVoz = false;
        narracionPausada = false;
        asegurarMusicaDeFondoActiva();
    }

    // Lectura automática de la narración mientras la música de fondo sigue sonando normal
    function narrarConVozNavegador(estacion) {
        if (!("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();

        asegurarMusicaDeFondoActiva();

        var textoLimpio = estacion.titulo + ". " + estacion.texto.split("[Fuente")[0];
        var locucion = new SpeechSynthesisUtterance(textoLimpio);
        locucion.lang = "es-ES";
        locucion.rate = 0.98;
        locucion.pitch = 0.95;
        locucion.volume = 1.0;

        usandoSintesisVoz = true;
        narracionPausada = false;
        actualizarEstadoBotonAudio("🔊 NARRANDO... (PAUSAR)", true);

        locucion.onend = function () {
            usandoSintesisVoz = false;
            actualizarEstadoBotonAudio("🔈 REPETIR AUDIO", false);
        };

        locucion.onerror = function () {
            usandoSintesisVoz = false;
        };

        window.speechSynthesis.speak(locucion);
    }

    // Reproduce el archivo MP3 de la estación (01.mp3, 02.mp3...) junto con la música de fondo
    function reproducirAudioEstacion(estacion) {
        detenerNarracionActual();
        if (!estacion) return;

        asegurarMusicaDeFondoActiva();

        var rutaAudio = estacion.audio || ("audios/" + estacion.numero + ".mp3");
        narradorAudio.src = rutaAudio;

        actualizarEstadoBotonAudio("🔊 NARRANDO... (PAUSAR)", true);

        narradorAudio.onended = function () {
            narracionPausada = false;
            actualizarEstadoBotonAudio("🔈 REPETIR AUDIO", false);
        };

        narradorAudio.onerror = function () {
            // Si aún no existe el archivo audios/01.mp3, lee el texto automáticamente sin cortar la música
            narrarConVozNavegador(estacion);
        };

        var playPromise = narradorAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(function () {
                narrarConVozNavegador(estacion);
            });
        }
    }

    function alternarPausaAudio() {
        var estacion = window.ESTACIONES_HISTORIA[indiceActual];
        if (!estacion) return;

        asegurarMusicaDeFondoActiva();

        if (usandoSintesisVoz && "speechSynthesis" in window) {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                window.speechSynthesis.pause();
                narracionPausada = true;
                actualizarEstadoBotonAudio("▶️ CONTINUAR AUDIO", false);
            } else if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
                narracionPausada = false;
                actualizarEstadoBotonAudio("🔊 NARRANDO... (PAUSAR)", true);
            } else {
                narrarConVozNavegador(estacion);
            }
            return;
        }

        if (!narradorAudio.paused && !narradorAudio.ended) {
            narradorAudio.pause();
            narracionPausada = true;
            actualizarEstadoBotonAudio("▶️ CONTINUAR AUDIO", false);
        } else if (narracionPausada && narradorAudio.currentTime > 0 && !narradorAudio.ended) {
            narradorAudio.play();
            narracionPausada = false;
            actualizarEstadoBotonAudio("🔊 NARRANDO... (PAUSAR)", true);
        } else {
            reproducirAudioEstacion(estacion);
        }
    }

    function inicializarDOM() {
        historiaOverlay = document.getElementById("historia-overlay");
        historiaPanel = document.getElementById("historia-panel");
        historiaTitulo = document.getElementById("historia-titulo");
        historiaTexto = document.getElementById("historia-texto");
        historiaImagen = document.getElementById("historia-imagen");
        historiaNumero = document.getElementById("historia-numero");
        historiaProgreso = document.getElementById("historia-progreso-texto");
        historiaProgresoFill = document.getElementById("historia-progreso-fill");
        botonSiguiente = document.getElementById("historia-siguiente");
        botonExplorar = document.getElementById("btn-explorar-plaza");

        // Botón en la cabecera de la tarjeta para pausar/repetir la voz sin afectar la música de fondo
        var indicadorEl = document.querySelector(".historia-indicador");
        if (indicadorEl && !document.getElementById("btn-audio-historia")) {
            botonAudioHistoria = document.createElement("button");
            botonAudioHistoria.id = "btn-audio-historia";
            botonAudioHistoria.type = "button";
            botonAudioHistoria.style.cssText =
                "margin-left:auto; background:rgba(10,25,18,0.9); border:1.5px solid #4ade80; " +
                "color:#86efac; padding:5px 12px; border-radius:20px; font-family:Montserrat,sans-serif; " +
                "font-size:10px; font-weight:800; letter-spacing:1px; cursor:pointer; transition:all 0.25s ease;";
            botonAudioHistoria.innerHTML = "🔊 NARRANDO...";
            botonAudioHistoria.onclick = function (e) {
                e.stopPropagation();
                alternarPausaAudio();
            };
            indicadorEl.appendChild(botonAudioHistoria);
        }

        if (botonSiguiente) {
            botonSiguiente.onclick = function () {
                if (modoRecorridoCompleto && indiceActual < window.ESTACIONES_HISTORIA.length - 1) {
                    window.abrirCapituloZona(indiceActual + 1, true);
                } else {
                    window.cerrarVentanaHistoria();
                }
            };
        }

        if (botonExplorar) {
            botonExplorar.onclick = function () {
                window.cerrarVentanaHistoria();
            };
        }
    }

    window.abrirCapituloZona = function (indice, esTourContinuo) {
        if (!historiaOverlay) inicializarDOM();
        modoRecorridoCompleto = !!esTourContinuo;
        indiceActual = indice;

        var estacion = window.ESTACIONES_HISTORIA[indice];
        if (!estacion) return;

        window.historiaEnCurso = true;
        estacion.visitado = true;

        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        if (typeof window.marcarAnilloVisitado === "function") {
            window.marcarAnilloVisitado(indice);
        }

        document.body.classList.add("historia-activa");
        if (historiaOverlay) historiaOverlay.classList.add("activa");

        if (historiaNumero) historiaNumero.innerText = estacion.numero;
        if (historiaTitulo) historiaTitulo.innerText = estacion.titulo;
        if (historiaTexto) historiaTexto.innerText = estacion.texto;

        var visitadosCount = window.ESTACIONES_HISTORIA.filter(function(e) { return e.visitado; }).length;
        if (historiaProgreso) {
            historiaProgreso.innerText = "Estación " + (indice + 1) + " de " + window.ESTACIONES_HISTORIA.length + " (" + visitadosCount + " descubiertas)";
        }
        if (historiaProgresoFill) {
            historiaProgresoFill.style.width = ((indice + 1) / window.ESTACIONES_HISTORIA.length * 100) + "%";
        }

        if (historiaPanel) {
            if (indice % 2 === 0) {
                historiaPanel.classList.remove("historia-izquierda");
                historiaPanel.classList.add("historia-derecha");
            } else {
                historiaPanel.classList.remove("historia-derecha");
                historiaPanel.classList.add("historia-izquierda");
            }
        }

        if (historiaImagen) {
            historiaImagen.classList.add("cambiando");
            setTimeout(function () {
                historiaImagen.src = estacion.imagen;
                historiaImagen.onload = function () {
                    historiaImagen.classList.remove("cambiando");
                };
                setTimeout(function () {
                    historiaImagen.classList.remove("cambiando");
                }, 600);
            }, 200);
        }

        window.camaraHistoriaObjetivo = estacion.camara;

        if (botonSiguiente) {
            if (modoRecorridoCompleto && indice < window.ESTACIONES_HISTORIA.length - 1) {
                botonSiguiente.innerText = "SIGUIENTE PUNTO →";
            } else {
                botonSiguiente.innerText = "SEGUIR CAMINANDO →";
            }
        }

        // 👉 Reproduce la narración de la estación (01, 02, 03...) mientras la música de fondo sigue sonando normal
        reproducirAudioEstacion(estacion);
    };

    window.cerrarVentanaHistoria = function () {
        detenerNarracionActual();

        window.historiaEnCurso = false;
        window.camaraHistoriaObjetivo = null;
        sessionStorage.setItem("historiaCompletada", "true");

        if (historiaOverlay) historiaOverlay.classList.remove("activa");
        document.body.classList.remove("historia-activa");

        if (typeof window.actualizarHUDProgreso === "function") {
            window.actualizarHUDProgreso();
        }
    };

    window.iniciarHistoriaApp = function () {
        inicializarDOM();
        console.log("Modo exploración activo: camina hacia los anillos dorados para descubrir la historia.");
    };

    document.addEventListener("DOMContentLoaded", inicializarDOM);
})();