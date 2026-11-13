// ====================================================
// MODELO 3D Y ESCENA THREE.JS - PLAZA DEL MINERO
// VERSIÓN EXTREMA FLUIDEZ + PUNTOS DE VIDEOS INFORMATIVOS (ESTÉTICA VERDE SPLASH)
// + BOTÓN Y TECLA (G) PARA SIRENA SINDICAL (sirena.mp3) + PERSONAJE SIN SOMBRA
// ====================================================

var scene, camera, renderer, plaza, controles, sound;
var ambientLight, hemisphereLight, directionalLight, directionalLight2;
var lucesPostes = [];
var bulbosPostes = [];
var objetosDetalleLejano = [];
var clock = new THREE.Clock();

var maxAnisotropy = 1;
var monumentoModalActivo = false;
var monumentoIframeOverlay = null;
var texturasCieloCache = {};

// Variables para el Selector de Personaje (Minero / Minera)
var seleccionPersonajeActiva = false;
var personajeYaElegido = false;
var tipoPersonajeActual = 'minero'; // 'minero' o 'minera'
var selectorPersonajeModalEl = null;
var visoresPreviewInicializados = false;

// Escenas dedicadas para previsualizar el Minero y la Minera
var previewScenes = { minero: null, minera: null };
var previewCameras = { minero: null, minera: null };
var previewModels = { minero: null, minera: null };
var previewMixers = { minero: null, minera: null };
var previewCanvasCtx = { minero: null, minera: null };

// 👉 RUTAS DE LOS MODELOS 3D DE TUS PERSONAJES (CON VARIANTES PARA GITHUB PAGES):
var MODELOS_PERSONAJES = {
    minero: ["assets/personaje.glb", "assets/Personaje.glb", "assets/minero.glb", "assets/Minero.glb"],
    minera: ["assets/minera.glb", "assets/Minera.glb", "assets/palliri.glb", "assets/Palliri.glb"]
};

// ====================================================
// 🎬 CONFIGURACIÓN DE LOS 4 PUNTOS DE VIDEOS INFORMATIVOS CORREGIDOS
// ====================================================
window.ESTACIONES_VIDEOS = [
    {
        numero: "01",
        titulo: "El Sindicato Mixto de Trabajadores Mineros y Radio 'La Voz del Minero'",
        subtitulo: "BALUARTE SINDICAL Y COMUNICACIÓN REVOLUCIONARIA EN SIGLO XX",
        descripcion: "Historia del edificio del Sindicato Mixto de Trabajadores Mineros de Siglo XX (fundado en 1941) y la emblemática emisora Radio 'La Voz del Minero', trinchera ideológica y de resistencia obrera.",
        fuente: "Proyecto FRK (@proyecto_frk). Documental corto sobre el Sindicato de Siglo XX y Radio La Voz del Minero (TikTok).",
        urlOriginal: "https://www.tiktok.com/@proyecto_frk/video/7451396319442210053?_r=1&_t=ZS-9BN5YoyTpmE",
        rutas: ["videos/video1.mp4", "audios/video1.mp4", "assets/video1.mp4", "audios/video1.mp3", "videos/video1.mp3"],
        zona: new THREE.Vector3(-65,15, 100),
        visitado: false
    },
    {
        numero: "02",
        titulo: "La Masacre de San Juan (24 de Junio de 1967)",
        subtitulo: "MEMORIA DE LA NOCHE MÁS FRÍA Y SANGRIENTA EN LOS CAMPAMENTOS MINEROS",
        descripcion: "Relato documental y testimonios históricos sobre la intervención militar de la madrugada del 24 de junio de 1967 en Siglo XX, Catavi y Llallagua durante la dictadura de René Barrientos Ortuño, donde cayó acribillado el dirigente Rosendo García Maisman en defensa del sindicato y la radio.",
        fuente: "RED MULTIMEDIA (2020). 'Masacre de San Juan Llallagua Catavi Uncía Siglo XX' (YouTube).",
        urlOriginal: "http://www.youtube.com/watch?v=EraoyZ7d_ao",
        rutas: ["videos/video2.mp4", "audios/video2.mp4", "assets/video2.mp4", "audios/video2.mp3", "videos/video2.mp3"],
        zona: new THREE.Vector3(-44, 7.5, -20),
        visitado: false
    },
    {
        numero: "03",
        titulo: "La Relocalización Minera y la Histórica 'Marcha por la Vida'",
        subtitulo: "EL DECRETO SUPREMO 21060 (1985) Y LA DEFENSA DE LAS FUENTES DE TRABAJO",
        descripcion: "Registro histórico del cierre de operaciones tras el Decreto Supremo 21060, el despido masivo de miles de trabajadores del subsuelo ('relocalización') y la multitudinaria 'Marcha por la Vida y la Paz' de 1986 protagonizada por los mineros y sus familias.",
        fuente: "Yo Soy Llallagua 360 (@yo_soy_llallagua360). Crónica audiovisual sobre la Relocalización y la Marcha por la Vida (TikTok).",
        urlOriginal: "https://www.tiktok.com/@yo_soy_llallagua360/video/7677646877482929428?_r=1&_t=ZS-9BN83EH72oC",
        rutas: ["videos/video3.mp4", "audios/video3.mp4", "assets/video3.mp4", "audios/video3.mp3", "videos/video3.mp3"],
        zona: new THREE.Vector3(-55, 7.5, -68),
        visitado: false
    },
    {
        numero: "04",
        titulo: "Creación de la Universidad Nacional 'Siglo XX' (UNSXX) por los Mineros",
        subtitulo: "LEGADO EDUCATIVO OBRERO ANTE LA CRISIS Y LA RELOCALIZACIÓN (1985)",
        descripcion: "Historia de cómo los trabajadores mineros de Siglo XX proyectaron y fundaron la Universidad Nacional 'Siglo XX' (reconocida por D.S. 20979 en 1985) aportando de sus propios salarios para garantizar la educación superior de sus hijos y dar vida al municipio tras la relocalización.",
        fuente: "Archivo Histórico / @luuuuu884. Historia de la creación de la Universidad Nacional 'Siglo XX' por los mineros (TikTok).",
        urlOriginal: "https://www.tiktok.com/@luuuuu884/video/7515766413747866886?_r=1&_t=ZS-9BN7jyHB9ey",
        rutas: ["videos/video4.mp4", "audios/video4.mp4", "assets/video4.mp4", "audios/video4.mp3", "videos/video4.mp3"],
        zona: new THREE.Vector3(-63, 7.5, -126),
        visitado: false
    }
];

var videoRingsGroup = new THREE.Group();
var videoRings = [];
var videoModalActivo = false;
var videoModalOverlayEl = null;
var videoPlayerEl = null;
var videoIndiceActual = 0;

// ====================================================
// 🚨 MOTOR DE LA SIRENA SINDICAL (sirena.mp3) - BOTÓN Y TECLA G
// ====================================================
var audioSirenaEl = null;
var sirenaActiva = false;
var rutasSirena = ["audios/sirena.mp3", "assets/sirena.mp3", "sirena.mp3"];
var indiceRutaSirena = 0;

function prepararAudioSirena() {
    if (audioSirenaEl) return;
    audioSirenaEl = new Audio(rutasSirena[0]);
    audioSirenaEl.loop = true;
    audioSirenaEl.preload = 'auto';
    audioSirenaEl.volume = 1;

    audioSirenaEl.addEventListener('error', function() {
        indiceRutaSirena++;
        if (indiceRutaSirena < rutasSirena.length) {
            audioSirenaEl.src = rutasSirena[indiceRutaSirena];
        }
    });
}

prepararAudioSirena();

function actualizarBotonSirenaUI() {
    var btnSirena = document.getElementById('btn-sirena');
    if (!btnSirena) return;
    if (sirenaActiva) {
        btnSirena.innerHTML = '🚨 SIRENA: ON (G)';
        btnSirena.style.background = 'rgba(220, 38, 38, 0.88)';
        btnSirena.style.borderColor = '#facc15';
        btnSirena.style.color = '#ffffff';
        btnSirena.style.boxShadow = '0 0 18px rgba(239, 68, 68, 0.9)';
    } else {
        btnSirena.innerHTML = '🚨 Sirena (G)';
        btnSirena.style.background = 'rgba(30, 25, 20, 0.65)';
        btnSirena.style.borderColor = 'rgba(239, 68, 68, 0.55)';
        btnSirena.style.color = '#fca5a5';
        btnSirena.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.4)';
    }
}

window.alternarSirena = function(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    prepararAudioSirena();

    if (!sirenaActiva) {
        sirenaActiva = true;
        audioSirenaEl.volume = 0.9;
        var prom = audioSirenaEl.play();
        if (prom !== undefined) {
            prom.catch(function(err) {
                console.warn("No se pudo reproducir sirena.mp3:", err);
            });
        }
    } else {
        sirenaActiva = false;
        audioSirenaEl.pause();
        audioSirenaEl.currentTime = 0;
    }
    actualizarBotonSirenaUI();
};

// ====================================================
// MOTOR DE AUDIO MP3 FUERTE (audios/pasos.mp3 y audios/viento.mp3)
// ====================================================
var audioVientoEl = null;
var audioPasosEl = null;
var audioMp3Inicializado = false;
var pasosMp3Disponible = true;
var vientoMp3Disponible = true;

var sfxCtx = null;
var sfxNoiseBuffer = null;
var sfxVientoActivo = false;
var sfxVientoGain = null;
var sfxVientoFilter = null;
var stepTimer = 0;
var stepFootIndex = 0;

function prepararElementosAudioMP3() {
    if (!audioVientoEl) {
        audioVientoEl = new Audio('audios/viento.mp3');
        audioVientoEl.loop = true;
        audioVientoEl.preload = 'auto';
        audioVientoEl.volume = 0.1;
        audioVientoEl.addEventListener('error', function() {
            vientoMp3Disponible = false;
        });
    }
    if (!audioPasosEl) {
        audioPasosEl = new Audio('audios/pasos.mp3');
        audioPasosEl.loop = true;
        audioPasosEl.preload = 'auto';
        audioPasosEl.volume = 1.0;
        audioPasosEl.addEventListener('error', function() {
            pasosMp3Disponible = false;
        });
    }
}

prepararElementosAudioMP3();

function inicializarAudioProcedural() {
    prepararElementosAudioMP3();

    if (vientoMp3Disponible && audioVientoEl && audioVientoEl.paused && !monumentoModalActivo && !videoModalActivo) {
        var playPromise = audioVientoEl.play();
        if (playPromise !== undefined) {
            playPromise.then(function() {
                audioMp3Inicializado = true;
            }).catch(function() {});
        }
    }

    if (sfxCtx) {
        if (sfxCtx.state === 'suspended') sfxCtx.resume();
        return;
    }
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    sfxCtx = new AudioContextClass();

    var sampleRate = sfxCtx.sampleRate;
    var length = sampleRate * 2;
    sfxNoiseBuffer = sfxCtx.createBuffer(1, length, sampleRate);
    var data = sfxNoiseBuffer.getChannelData(0);
    for (var i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    if (!vientoMp3Disponible) {
        iniciarSonidoVientoYArboles();
    }
}

function iniciarSonidoVientoYArboles() {
    if (!sfxCtx || sfxVientoActivo || !sfxNoiseBuffer) return;
    sfxVientoActivo = true;

    var windSource = sfxCtx.createBufferSource();
    windSource.buffer = sfxNoiseBuffer;
    windSource.loop = true;

    sfxVientoFilter = sfxCtx.createBiquadFilter();
    sfxVientoFilter.type = 'bandpass';
    sfxVientoFilter.frequency.value = 360;
    sfxVientoFilter.Q.value = 2.0;

    sfxVientoGain = sfxCtx.createGain();
    sfxVientoGain.gain.value = 0.14;

    windSource.connect(sfxVientoFilter);
    sfxVientoFilter.connect(sfxVientoGain);
    sfxVientoGain.connect(sfxCtx.destination);
    windSource.start(0);
}

function modularVientoAmbiental(elapsedTime) {
    if (vientoMp3Disponible && audioVientoEl) {
        if (monumentoModalActivo || seleccionPersonajeActiva || videoModalActivo) {
            audioVientoEl.volume = 0.12;
        } else {
            var rachaMp3 = Math.sin(elapsedTime * 0.5) * 0.12 + Math.cos(elapsedTime * 0.9) * 0.08;
            audioVientoEl.volume = Math.max(0.45, Math.min(0.88, 0.68 + rachaMp3));
        }
        return;
    }

    if (!sfxCtx || !sfxVientoFilter || !sfxVientoGain) return;
    if (monumentoModalActivo || seleccionPersonajeActiva || videoModalActivo) {
        sfxVientoGain.gain.value = 0.02;
        return;
    }
    var racha = Math.sin(elapsedTime * 0.45) * 0.5 + Math.sin(elapsedTime * 1.1) * 0.5;
    sfxVientoFilter.frequency.value = 310 + (racha + 1) * 110;
    sfxVientoGain.gain.value = 0.09 + (racha + 1) * 0.05;
}

function actualizarSonidoPasosJugador(isWalking, isRunning, delta) {
    var puedeSonar = isWalking && !tourActivo && !window.historiaEnCurso && !monumentoModalActivo && !seleccionPersonajeActiva && !videoModalActivo;

    if (pasosMp3Disponible && audioPasosEl) {
        if (puedeSonar) {
            audioPasosEl.volume = 1.0;
            audioPasosEl.playbackRate = isRunning ? 1.38 : 1.0;
            if (audioPasosEl.paused) {
                var p = audioPasosEl.play();
                if (p !== undefined) {
                    p.catch(function() {});
                }
            }
        } else {
            if (!audioPasosEl.paused) {
                audioPasosEl.pause();
            }
        }
        return;
    }

    if (puedeSonar) {
        inicializarAudioProcedural();
        var intervaloPaso = isRunning ? 0.28 : 0.42;
        stepTimer += delta;
        if (stepTimer >= intervaloPaso) {
            stepTimer = 0;
            reproducirPasoCementoRespaldo(isRunning);
        }
    } else {
        stepTimer = 0.35;
    }
}

function detenerSonidoPasos() {
    if (audioPasosEl && !audioPasosEl.paused) {
        audioPasosEl.pause();
    }
}

function reproducirPasoCementoRespaldo(isRunning) {
    if (!sfxCtx || !sfxNoiseBuffer) return;
    if (sfxCtx.state === 'suspended') sfxCtx.resume();

    var now = sfxCtx.currentTime;
    stepFootIndex = 1 - stepFootIndex;
    var variacionTono = (stepFootIndex === 0 ? 0.96 : 1.04) * (0.97 + Math.random() * 0.06);
    var vol = isRunning ? 0.65 : 0.48;

    var grit = sfxCtx.createBufferSource();
    grit.buffer = sfxNoiseBuffer;

    var bandpass = sfxCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1050 * variacionTono, now);
    bandpass.Q.setValueAtTime(1.8, now);

    var gritGain = sfxCtx.createGain();
    gritGain.gain.setValueAtTime(0.001, now);
    gritGain.gain.linearRampToValueAtTime(vol, now + 0.006);
    gritGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    grit.connect(bandpass);
    bandpass.connect(gritGain);
    gritGain.connect(sfxCtx.destination);
    grit.start(now, Math.random() * 1.2, 0.085);

    var thud = sfxCtx.createOscillator();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(145 * variacionTono, now);
    thud.frequency.exponentialRampToValueAtTime(45, now + 0.06);

    var thudGain = sfxCtx.createGain();
    thudGain.gain.setValueAtTime(vol * 0.95, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    thud.connect(thudGain);
    thudGain.connect(sfxCtx.destination);
    thud.start(now);
    thud.stop(now + 0.07);
}

// ====================================================
// CONFIGURACIÓN CALIBRADA DEL PERSONAJE, CÁMARA Y GRADAS/RAMPAS
// ====================================================
var CONFIG_PLAYER = {
    startPosition: [30, 0, -10],
    startYaw: 0.45,
    baseGroundY: 7.2,
    minSafetyY: -2.0,

    alturaDeseadaPersonaje: 9.5,
    characterFootOffset: 0.0,
    characterYawOffset: Math.PI,

    maxStepUp: 6.8,
    maxStepDown: 16.0,
    floorUpSpeed: 28.0,
    floorDownSpeed: 18.0,

    cameraDistance: 18.0,
    cameraMinDistance: 7.0,
    cameraMaxDistance: 38.0,
    cameraZoomSpeed: 2.0,
    cameraHeight: 11.5,
    cameraLookHeight: 5.2,
    cameraCollisionBuffer: 1.2,
    mouseSensitivity: 0.0022,
    pitchMin: -0.20,
    pitchMax: 6,

    tourDuration: 20.0,

    moveSpeed: 18.0,
    runSpeed: 30.0,
    acceleration: 12.0,
    characterTurnSpeed: 10.0,
    wallCollisionBuffer: 1.15,

    triggerRadius: 5.5,
    monumentRadius: 13.5,

    bounds: {
        minX: -240,
        maxX: 160,
        minZ: -240,
        maxZ: 160
    }
};

var player = {
    position: new THREE.Vector3(
        CONFIG_PLAYER.startPosition[0],
        CONFIG_PLAYER.startPosition[1],
        CONFIG_PLAYER.startPosition[2]
    ),
    velocity: new THREE.Vector3(0, 0, 0),
    yaw: CONFIG_PLAYER.startYaw,
    pitch: 0.18
};

var keys = {};
var locked = false;
var currentCameraDistance = CONFIG_PLAYER.cameraDistance;

// Estado del Recorrido Cinemático (Tour 3D)
var tourActivo = true;
var tourElapsed = 0;
var tourCurves = null;
var tourOverlayEl = null;
var tourBarEl = null;
var tourLabelEl = null;
var _ultimoPorcentajeTour = -1;
var _ultimoTextoTour = "";

// Listas de colisión física optimizadas
var floorMeshes = [];
var wallMeshes = [];
var cameraBlockMeshes = [];
var collisionMeshes = [];
var circleObstacles = [];

var characterGroup = new THREE.Group();
characterGroup.visible = false;
characterGroup.castShadow = false;
characterGroup.receiveShadow = false;
var characterModel = null;
var characterMixer = null;
var characterActions = { idle: null, walk: null };
var characterFacingYaw = CONFIG_PLAYER.startYaw;
var characterHasAnimations = false;
var walkCycleTime = 0;

var rigBones = {
    leftUpLeg: null, rightUpLeg: null,
    leftLeg: null, rightLeg: null,
    leftArm: null, rightArm: null,
    leftForeArm: null, rightForeArm: null,
    hips: null, spine: null,
    hipsRestPos: null,
    restPoseGuardada: false
};

var storyRingsGroup = new THREE.Group();
var storyRings = [];
var guideArrowMesh = null;
var monumentoCercanoActual = null;
var hudGuiaEl = null;
var hudPromptEl = null;

// Variables para Minimapa Radar 2D y Modo Fotografía
var minimapContainerEl = null;
var minimapCanvas = null;
var minimapCtx = null;
var minimapScale = 0.62;
var monumentoGuiaManual = null;
var logoPostalImg = new Image();
logoPostalImg.crossOrigin = "anonymous";
logoPostalImg.src = "imagenes/logo.png";

var marcadores = [
    { texto: "Monumento a Irineo Pimentel Rojas", corto: "Irineo", posicion: new THREE.Vector3(-73, 41, 22.5), pisoPos: new THREE.Vector3(-73, 7.2, 22.5), elemento: null, enlace: "irineo.html", _vis: false, _lx: 0, _ly: 0 },
    { texto: "Monumento a Federico Escobar", corto: "Federico", posicion: new THREE.Vector3(-70, 40, 11.5), pisoPos: new THREE.Vector3(-70, 7.2, 11.5), elemento: null, enlace: "federico.html", _vis: false, _lx: 0, _ly: 0 },
    { texto: "Monumento a Cesar, Gillermo e Isaac", corto: "Mártires", posicion: new THREE.Vector3(-74, 39, -38), pisoPos: new THREE.Vector3(-74, 7.2, -38), elemento: null, enlace: "cesar.html", _vis: false, _lx: 0, _ly: 0 },
    { texto: "Monumento a las Palliris", corto: "Palliris", posicion: new THREE.Vector3(-78, 40, -74), pisoPos: new THREE.Vector3(-78, 7.2, -74), elemento: null, enlace: "palliri.html", _vis: false, _lx: 0, _ly: 0 },
    { texto: "Monumento al Minero", corto: "Minero", posicion: new THREE.Vector3(-111.5, 57, -13), pisoPos: new THREE.Vector3(-111.5, 7.2, -13), elemento: null, enlace: "minero.html", radio: 28.0, _vis: false, _lx: 0, _ly: 0 }
];

// ====================================================
// 🎬 VENTANA MODAL REPRODUCTORA DE VIDEOS (MISMO VERDE ESMERALDA Y DORADO DEL SPLASH)
// ====================================================
function crearModalVideoInformativo() {
    if (videoModalOverlayEl) return;

    videoModalOverlayEl = document.createElement('div');
    videoModalOverlayEl.id = 'video-informativo-overlay';
    videoModalOverlayEl.style.cssText =
        'position:fixed; inset:0; width:100vw; height:100vh; background:rgba(4, 14, 9, 0.84); ' +
        'backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); z-index:97500; display:none; ' +
        'justify-content:center; align-items:center; padding:20px; font-family:Montserrat,sans-serif; user-select:none;';

    videoModalOverlayEl.innerHTML =
        '<div style="background:rgba(6, 20, 13, 0.95); border:2.5px solid #22c55e; border-radius:28px; width:min(900px, 95vw); max-height:92vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 80px rgba(0,0,0,0.95), 0 0 38px rgba(34,197,94,0.45), inset 0 0 40px rgba(34,197,94,0.12);">' +
            
            // CABECERA VERDE ESMERALDA + DORADO
            '<div style="display:flex; justify-content:space-between; align-items:center; padding:18px 28px; background:linear-gradient(90deg, rgba(10,34,22,0.98) 0%, rgba(4,16,10,0.98) 100%); border-bottom:1.5px solid rgba(34,197,94,0.45);">' +
                '<div>' +
                    '<span id="video-modal-badge" style="color:#facc15; font-size:0.78rem; font-weight:800; letter-spacing:3.5px; text-transform:uppercase; display:block; text-shadow:0 0 10px rgba(250,204,21,0.5);">🎬 DOCUMENTAL HISTÓRICO • ESTACIÓN DE VIDEO</span>' +
                    '<h3 id="video-modal-titulo" style="font-family:\'Cinzel Decorative\',Cinzel,serif; background:linear-gradient(180deg, #ffffff 0%, #4ade80 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-size:clamp(1.15rem, 2vw, 1.55rem); font-weight:900; margin:5px 0 2px 0; letter-spacing:1.5px;">Video Informativo</h3>' +
                    '<div id="video-modal-subtitulo" style="color:#86efac; font-size:0.74rem; font-weight:700; letter-spacing:1.8px; text-transform:uppercase;"></div>' +
                '</div>' +
                '<button type="button" id="btn-cerrar-video-x" title="Cerrar video" style="background:rgba(34,197,94,0.18); border:2px solid #22c55e; color:#ffffff; width:42px; height:42px; border-radius:50%; font-size:1.15rem; font-weight:bold; cursor:pointer; box-shadow:0 0 15px rgba(34,197,94,0.4); transition:all 0.25s ease;">✕</button>' +
            '</div>' +

            // CUERPO CON MARCO VERDE BRILLANTE PARA EL VIDEO
            '<div style="padding:20px 28px; display:flex; flex-direction:column; gap:14px; overflow-y:auto;">' +
                '<div style="width:100%; background:#020805; border-radius:18px; border:2.5px solid #22c55e; padding:5px; box-sizing:border-box; overflow:hidden; position:relative; min-height:260px; max-height:52vh; display:flex; align-items:center; justify-content:center; box-shadow:0 0 28px rgba(34,197,94,0.38), inset 0 0 18px rgba(34,197,94,0.2);">' +
                    '<video id="reproductor-video-punto" controls playsinline style="width:100%; max-height:49vh; border-radius:12px; display:block; background:#000;"></video>' +
                '</div>' +

                '<p id="video-modal-desc" style="color:#d1fae5; font-size:0.9rem; line-height:1.6; margin:0; text-align:justify;"></p>' +

                // CAJA DE BIBLIOGRAFÍA Y ENLACE ORIGINAL DEL VIDEO ABAJITO
                '<div style="background:rgba(4,16,10,0.92); border:1.5px solid rgba(34,197,94,0.45); border-left:4px solid #facc15; border-radius:12px; padding:12px 16px; display:flex; flex-direction:column; gap:6px;">' +
                    '<div id="video-modal-fuente" style="color:#f1cf76; font-size:0.8rem; font-weight:700;">📚 Fuente bibliográfica:</div>' +
                    '<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">' +
                        '<a id="video-modal-link" href="#" target="_blank" rel="noopener noreferrer" style="color:#4ade80; font-size:0.78rem; font-weight:700; text-decoration:underline; word-break:break-all;">🔗 Ver publicación original</a>' +
                        '<span id="video-modal-estado" style="color:#86efac; font-size:0.74rem; font-weight:600;">▶️ Reproduciendo...</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // PIE DEL MODAL CON BOTÓN VERDE ESTILO SPLASH
            '<div style="padding:14px 28px; background:rgba(3,12,7,0.96); border-top:1.5px solid rgba(34,197,94,0.35); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">' +
                '<span style="color:rgba(209,250,229,0.75); font-size:0.76rem; font-weight:600;">💡 Presiona <b style="color:#4ade80;">ESC</b> o <b style="color:#4ade80;">V</b> para volver al recorrido</span>' +
                '<button type="button" id="btn-cerrar-video-ok" style="background:linear-gradient(90deg, #16a34a 0%, #22c55e 50%, #4ade80 100%); color:#031109; border:2px solid #86efac; padding:11px 28px; border-radius:50px; font-family:Montserrat,sans-serif; font-size:0.82rem; font-weight:800; letter-spacing:1.5px; cursor:pointer; text-transform:uppercase; box-shadow:0 0 22px rgba(34,197,94,0.6);">CONTINUAR RECORRIDO →</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(videoModalOverlayEl);
    videoPlayerEl = document.getElementById('reproductor-video-punto');

    document.getElementById('btn-cerrar-video-x').onclick = function() { window.cerrarVideoPunto(); };
    document.getElementById('btn-cerrar-video-ok').onclick = function() { window.cerrarVideoPunto(); };
    videoModalOverlayEl.addEventListener('click', function(e) {
        if (e.target === videoModalOverlayEl) window.cerrarVideoPunto();
    });
}

window.abrirVideoPunto = function(indice) {
    if (!window.ESTACIONES_VIDEOS || !window.ESTACIONES_VIDEOS[indice]) return;
    crearModalVideoInformativo();

    var estVid = window.ESTACIONES_VIDEOS[indice];
    videoIndiceActual = indice;
    videoModalActivo = true;
    estVid.visitado = true;

    detenerSonidoPasos();
    keys = {};
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }

    var ringObj = videoRings[indice];
    if (ringObj) {
        ringObj.ring.material.color.setHex(0xfacc15);
        ringObj.beam.material.color.setHex(0xfacc15);
        if (ringObj.labelDiv) {
            ringObj.labelDiv.style.background = 'rgba(22,163,74,0.96)';
            ringObj.labelDiv.style.borderColor = '#facc15';
            ringObj.labelDiv.style.color = '#ffffff';
            ringObj.labelDiv.innerText = '✔ Video ' + estVid.numero + ': ' + estVid.titulo;
        }
    }

    document.getElementById('video-modal-badge').innerText = '🎬 DOCUMENTAL HISTÓRICO • VIDEO ' + estVid.numero + ' DE 04';
    document.getElementById('video-modal-titulo').innerText = estVid.titulo;
    document.getElementById('video-modal-subtitulo').innerText = estVid.subtitulo || '';
    document.getElementById('video-modal-desc').innerText = estVid.descripcion;
    document.getElementById('video-modal-fuente').innerHTML = '📚 <b>Bibliografía del video:</b> ' + (estVid.fuente || '');

    var linkEl = document.getElementById('video-modal-link');
    if (linkEl && estVid.urlOriginal) {
        linkEl.href = estVid.urlOriginal;
        linkEl.innerText = '🔗 Fuente original: ' + estVid.urlOriginal;
    }

    var estadoEl = document.getElementById('video-modal-estado');
    videoModalOverlayEl.style.display = 'flex';

    var idxRuta = 0;
    function probarSiguienteRutaVideo() {
        if (!videoPlayerEl) return;
        if (idxRuta >= estVid.rutas.length) {
            if (estadoEl) {
                estadoEl.innerHTML = '📁 Sube <b>' + estVid.rutas[0] + '</b> (o <b>' + estVid.rutas[3] + '</b>) o abre el enlace original.';
            }
            return;
        }
        var rutaActual = estVid.rutas[idxRuta++];
        videoPlayerEl.src = rutaActual;
        if (estadoEl) estadoEl.innerText = '▶️ Archivo local: ' + rutaActual;
        var p = videoPlayerEl.play();
        if (p !== undefined) {
            p.catch(function() {});
        }
    }

    if (videoPlayerEl) {
        videoPlayerEl.onerror = function() {
            probarSiguienteRutaVideo();
        };
        probarSiguienteRutaVideo();
    }
};

window.cerrarVideoPunto = function() {
    if (!videoModalActivo) return;
    videoModalActivo = false;
    if (videoPlayerEl) {
        videoPlayerEl.pause();
        videoPlayerEl.removeAttribute('src');
        videoPlayerEl.load();
    }
    if (videoModalOverlayEl) {
        videoModalOverlayEl.style.display = 'none';
    }
    clock.getDelta();
};

// ====================================================
// CARGADOR INTELIGENTE DE GLB
// ====================================================
function cargarGLBConRespaldo(listaRutas, onSuccess, onErrorFinal) {
    var rutas = Array.isArray(listaRutas) ? listaRutas : [listaRutas];
    var indice = 0;
    var loader = new THREE.GLTFLoader();

    function intentarSiguiente() {
        if (indice >= rutas.length) {
            if (onErrorFinal) onErrorFinal();
            return;
        }
        var rutaActual = rutas[indice++];
        loader.load(rutaActual, function(gltf) {
            onSuccess(gltf, rutaActual);
        }, undefined, function() {
            intentarSiguiente();
        });
    }

    intentarSiguiente();
}

function congelarObjetoEstatico(objeto) {
    if (!objeto) return;
    objeto.updateMatrix();
    objeto.updateMatrixWorld(true);
    objeto.matrixAutoUpdate = false;
    objeto.traverse(function(c) {
        if (c && !c.isSkinnedMesh && !c.isBone && c.type !== 'Bone') {
            c.updateMatrix();
            c.matrixAutoUpdate = false;
            if (c.isMesh && c.geometry) {
                if (!c.geometry.boundingSphere) c.geometry.computeBoundingSphere();
                if (!c.geometry.boundingBox) c.geometry.computeBoundingBox();
            }
        }
    });
}

function calcularLimitesSeguros(objeto) {
    objeto.updateMatrixWorld(true);

    var minX = Infinity, maxX = -Infinity;
    var minY = Infinity, maxY = -Infinity;
    var minZ = Infinity, maxZ = -Infinity;
    var v = new THREE.Vector3();

    objeto.traverse(function(child) {
        if (child && child.isMesh && child.geometry) {
            var posAttr = child.geometry.attributes && child.geometry.attributes.position;
            if (posAttr && typeof posAttr.getX === 'function') {
                var stride = Math.max(1, Math.floor(posAttr.count / 350));
                for (var i = 0; i < posAttr.count; i += stride) {
                    v.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
                    v.applyMatrix4(child.matrixWorld);
                    if (v.x < minX) minX = v.x;
                    if (v.x > maxX) maxX = v.x;
                    if (v.y < minY) minY = v.y;
                    if (v.y > maxY) maxY = v.y;
                    if (v.z < minZ) minZ = v.z;
                    if (v.z > maxZ) maxZ = v.z;
                }
            }
        }
    });

    var boneMinY = Infinity, boneMaxY = -Infinity;
    var boneMinX = Infinity, boneMaxX = -Infinity;
    objeto.traverse(function(node) {
        if (node && (node.isBone || node.type === 'Bone')) {
            node.getWorldPosition(v);
            if (v.y < boneMinY) boneMinY = v.y;
            if (v.y > boneMaxY) boneMaxY = v.y;
            if (v.x < boneMinX) boneMinX = v.x;
            if (v.x > boneMaxX) boneMaxX = v.x;
        }
    });

    if (isFinite(boneMaxY) && isFinite(boneMinY) && (boneMaxY - boneMinY) > 0.01) {
        var spanBoneY = boneMaxY - boneMinY;
        var topConCasco = boneMaxY + spanBoneY * 0.16;
        var bottomConBotas = boneMinY - spanBoneY * 0.06;
        if (!isFinite(maxY) || topConCasco > maxY) maxY = topConCasco;
        if (!isFinite(minY) || bottomConBotas < minY) minY = bottomConBotas;
        if (!isFinite(minX) || boneMinX < minX) minX = boneMinX;
        if (!isFinite(maxX) || boneMaxX > maxX) maxX = boneMaxX;
    }

    if (!isFinite(minY) || !isFinite(maxY) || Math.abs(maxY - minY) < 0.001) {
        return { minX: -2, maxX: 2, minY: 0, maxY: 9.5, minZ: -2, maxZ: 2 };
    }

    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY, minZ: minZ, maxZ: maxZ };
}

// ====================================================
// VISORES 3D DE SELECCIÓN
// ====================================================
var _offscreenPreviewRenderer = null;

function obtenerRendererPreviewCompartido(w, h) {
    if (!_offscreenPreviewRenderer) {
        _offscreenPreviewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
        _offscreenPreviewRenderer.setPixelRatio(1.0);
        _offscreenPreviewRenderer.gammaOutput = true;
        _offscreenPreviewRenderer.gammaFactor = 2.2;
    }
    _offscreenPreviewRenderer.setSize(w, h, false);
    return _offscreenPreviewRenderer;
}

function inicializarVisorPreview3D(tipo, canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var w = 300;
    var h = 260;
    canvas.width = w;
    canvas.height = h;
    previewCanvasCtx[tipo] = canvas.getContext('2d');

    var pScene = new THREE.Scene();
    var pCamera = new THREE.PerspectiveCamera(34, w / h, 0.1, 200);

    var amb = new THREE.AmbientLight(0xffffff, 1.15);
    pScene.add(amb);

    var dirFront = new THREE.DirectionalLight(0xfff4d6, 1.45);
    dirFront.position.set(5, 12, 18);
    pScene.add(dirFront);

    var dirRim = new THREE.DirectionalLight(0x4ade80, 0.65);
    dirRim.position.set(-8, 8, -12);
    pScene.add(dirRim);

    previewScenes[tipo] = pScene;
    previewCameras[tipo] = pCamera;

    var listaRutas = (tipo === 'minera') ? MODELOS_PERSONAJES.minera : MODELOS_PERSONAJES.minero;

    function colocarModeloEnPreview(gltf) {
        if (previewModels[tipo]) {
            pScene.remove(previewModels[tipo]);
        }

        var pivotGroup = new THREE.Group();
        var model = gltf.scene;

        model.traverse(function(c) {
            if (c && c.isMesh) {
                c.castShadow = false;
                c.receiveShadow = false;
                c.frustumCulled = false;
                mejorarCalidadMaterial(c.material);
            }
        });

        if (gltf.animations && gltf.animations.length > 0) {
            var pMixer = new THREE.AnimationMixer(model);
            var clip = gltf.animations[0];
            eliminarRetrocesoMixamoEnClip(clip);
            var action = pMixer.clipAction(clip);
            action.play();
            pMixer.update(0.01);
            previewMixers[tipo] = pMixer;
        }

        model.position.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        var boundsInicial = calcularLimitesSeguros(model);
        var altoInicial = Math.max(0.001, boundsInicial.maxY - boundsInicial.minY);
        var escala = CONFIG_PLAYER.alturaDeseadaPersonaje / altoInicial;
        model.scale.setScalar(escala);

        var boundsFinal = calcularLimitesSeguros(model);
        var cx = (boundsFinal.minX + boundsFinal.maxX) * 0.5;
        var cy = (boundsFinal.minY + boundsFinal.maxY) * 0.5;
        var cz = (boundsFinal.minZ + boundsFinal.maxZ) * 0.5;

        model.position.set(-cx, -cy, -cz);
        pivotGroup.add(model);
        pivotGroup.position.set(0, 0, 0);
        pScene.add(pivotGroup);

        var altoReal = Math.max(8.5, boundsFinal.maxY - boundsFinal.minY);
        var anchoReal = Math.max(5.5, boundsFinal.maxX - boundsFinal.minX);
        var fovRad = pCamera.fov * (Math.PI / 180);
        var aspect = w / h;

        var distAlto = (altoReal * 0.64) / Math.tan(fovRad * 0.5);
        var distAncho = (anchoReal * 0.68) / (Math.tan(fovRad * 0.5) * aspect);
        var distCamara = Math.max(distAlto, distAncho, 17.5);

        pCamera.position.set(0, 0, distCamara);
        pCamera.lookAt(new THREE.Vector3(0, 0, 0));
        pCamera.updateProjectionMatrix();

        previewModels[tipo] = pivotGroup;
    }

    cargarGLBConRespaldo(listaRutas, colocarModeloEnPreview, function() {
        cargarGLBConRespaldo(MODELOS_PERSONAJES.minero, colocarModeloEnPreview);
    });
}

function renderizarVisoresPreviewPersonajes(delta, elapsedTime) {
    if (!seleccionPersonajeActiva) return;
    var anguloFrontalSuave = Math.sin(elapsedTime * 1.4) * 0.25;
    var sharedRenderer = obtenerRendererPreviewCompartido(300, 260);

    ['minero', 'minera'].forEach(function(tipo) {
        var s = previewScenes[tipo];
        var c = previewCameras[tipo];
        var m = previewModels[tipo];
        var ctx2d = previewCanvasCtx[tipo];
        var mixer = previewMixers[tipo];

        if (s && c && m && ctx2d) {
            if (mixer) {
                mixer.update(delta * 0.75);
            }
            m.rotation.y = anguloFrontalSuave;
            sharedRenderer.render(s, c);

            var destCanvas = ctx2d.canvas;
            ctx2d.clearRect(0, 0, destCanvas.width, destCanvas.height);
            ctx2d.drawImage(sharedRenderer.domElement, 0, 0, destCanvas.width, destCanvas.height);
        }
    });
}

function crearModalSeleccionPersonaje() {
    var viejoModal = document.getElementById('modal-seleccion-personaje');
    if (viejoModal) viejoModal.remove();

    selectorPersonajeModalEl = document.createElement('div');
    selectorPersonajeModalEl.id = 'modal-seleccion-personaje';
    selectorPersonajeModalEl.style.cssText =
        'position:fixed; inset:0; width:100vw; height:100vh; background:rgba(4,12,8,0.88); ' +
        'z-index:98000; display:none; justify-content:center; align-items:center; padding:14px; user-select:none; ' +
        'font-family:Montserrat,sans-serif; opacity:0; transition:opacity 0.25s ease;';

    selectorPersonajeModalEl.innerHTML =
        '<div style="background:rgba(14,20,24,0.97); border:2px solid #e0b066; border-radius:24px; padding:20px 28px; max-width:960px; width:95vw; max-height:94vh; display:flex; flex-direction:column; justify-content:center; text-align:center; box-shadow:0 20px 55px rgba(0,0,0,0.92);">' +
            '<div style="color:#facc15; font-size:0.75rem; font-weight:800; letter-spacing:3px; text-transform:uppercase; margin-bottom:4px;">✨ PLAZA DEL MINERO - SIGLO XX ✨</div>' +
            '<h2 style="font-family:Cinzel Decorative,Cinzel,serif; color:#ffffff; font-size:clamp(1.4rem, 2.3vw, 2.0rem); margin:0 0 4px 0; letter-spacing:2px;">ELIGE TU PERSONAJE</h2>' +
            '<p style="color:#cbd5e1; font-size:0.85rem; margin:0 0 14px 0; line-height:1.35;">Selecciona con quién deseas recorrer a pie la histórica Plaza del Minero:</p>' +
            
            '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(310px, 1fr)); gap:22px; margin-bottom:8px; align-items:stretch;">' +
                
                '<div id="card-elegir-minero" style="background:linear-gradient(160deg, rgba(24,38,32,0.95) 0%, rgba(12,18,16,0.98) 100%); border:2px solid rgba(224,176,102,0.65); border-radius:20px; padding:14px 18px 16px 18px; cursor:pointer; transition:transform 0.2s ease; display:flex; flex-direction:column; align-items:center;">' +
                    '<div style="width:100%; height:clamp(240px, 38vh, 300px); border-radius:16px; background:radial-gradient(circle at 50% 50%, rgba(250,204,21,0.22) 0%, rgba(10,18,15,0.97) 74%); border:1.5px solid rgba(250,204,21,0.5); display:flex; align-items:center; justify-content:center; margin-bottom:10px; overflow:hidden;">' +
                        '<canvas id="preview-canvas-minero" style="width:100%; height:100%; max-width:300px; max-height:260px; object-fit:contain; display:block;"></canvas>' +
                    '</div>' +
                    '<h3 style="font-family:Cinzel,serif; color:#fde047; font-size:1.28rem; margin:0 0 4px 0; letter-spacing:1.5px;">MINERO</h3>' +
                    '<p style="color:#cbd5e1; font-size:0.78rem; line-height:1.35; margin:0 0 12px 0; max-width:340px;">Trabajador del subsuelo de Siglo XX con guardatojo y equipo tradicional.</p>' +
                    '<button type="button" style="margin-top:auto; width:100%; padding:12px 18px; border:none; border-radius:30px; background:linear-gradient(90deg, #e0b066, #facc15); color:#0a0f0d; font-family:Montserrat,sans-serif; font-weight:800; font-size:0.84rem; letter-spacing:1.5px; cursor:pointer; text-transform:uppercase;">ELEGIR MINERO</button>' +
                '</div>' +

                '<div id="card-elegir-minera" style="background:linear-gradient(160deg, rgba(24,38,32,0.95) 0%, rgba(12,18,16,0.98) 100%); border:2px solid rgba(74,222,128,0.65); border-radius:20px; padding:14px 18px 16px 18px; cursor:pointer; transition:transform 0.2s ease; display:flex; flex-direction:column; align-items:center;">' +
                    '<div style="width:100%; height:clamp(240px, 38vh, 300px); border-radius:16px; background:radial-gradient(circle at 50% 50%, rgba(74,222,128,0.22) 0%, rgba(10,18,15,0.97) 74%); border:1.5px solid rgba(74,222,128,0.5); display:flex; align-items:center; justify-content:center; margin-bottom:10px; overflow:hidden;">' +
                        '<canvas id="preview-canvas-minera" style="width:100%; height:100%; max-width:300px; max-height:260px; object-fit:contain; display:block;"></canvas>' +
                    '</div>' +
                    '<h3 style="font-family:Cinzel,serif; color:#86efac; font-size:1.28rem; margin:0 0 4px 0; letter-spacing:1.5px;">MINERA</h3>' +
                    '<p style="color:#cbd5e1; font-size:0.78rem; line-height:1.35; margin:0 0 12px 0; max-width:340px;">Mujer minera y valiente Palliri, símbolo de lucha e historia en Llallagua.</p>' +
                    '<button type="button" style="margin-top:auto; width:100%; padding:12px 18px; border:none; border-radius:30px; background:linear-gradient(90deg, #22c55e, #4ade80); color:#05140b; font-family:Montserrat,sans-serif; font-weight:800; font-size:0.84rem; letter-spacing:1.5px; cursor:pointer; text-transform:uppercase;">ELEGIR MINERA</button>' +
                '</div>' +

            '</div>' +
            '<div style="color:rgba(224,218,207,0.68); font-size:0.74rem; margin-top:4px;">💡 Puedes cambiar de personaje en cualquier momento presionando la <b>Tecla C</b></div>' +
        '</div>';

    document.body.appendChild(selectorPersonajeModalEl);

    var cardMinero = document.getElementById('card-elegir-minero');
    var cardMinera = document.getElementById('card-elegir-minera');

    [cardMinero, cardMinera].forEach(function(card) {
        if (!card) return;
        card.addEventListener('mouseenter', function() {
            card.style.transform = 'translateY(-4px)';
        });
        card.addEventListener('mouseleave', function() {
            card.style.transform = 'translateY(0)';
        });
    });

    if (cardMinero) {
        cardMinero.addEventListener('click', function(e) {
            e.stopPropagation();
            inicializarAudioProcedural();
            window.seleccionarPersonaje('minero');
        });
    }
    if (cardMinera) {
        cardMinera.addEventListener('click', function(e) {
            e.stopPropagation();
            inicializarAudioProcedural();
            window.seleccionarPersonaje('minera');
        });
    }
}

window.mostrarSelectorPersonaje = function() {
    if (!selectorPersonajeModalEl) {
        crearModalSeleccionPersonaje();
    }
    if (!visoresPreviewInicializados) {
        visoresPreviewInicializados = true;
        inicializarVisorPreview3D('minero', 'preview-canvas-minero');
        inicializarVisorPreview3D('minera', 'preview-canvas-minera');
    }

    keys = {};
    detenerSonidoPasos();
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
    seleccionPersonajeActiva = true;
    if (hudGuiaEl) hudGuiaEl.style.opacity = '0';
    if (hudPromptEl) hudPromptEl.style.display = 'none';

    selectorPersonajeModalEl.style.display = 'flex';
    setTimeout(function() {
        if (selectorPersonajeModalEl) selectorPersonajeModalEl.style.opacity = '1';
    }, 20);
};

window.seleccionarPersonaje = function(tipo) {
    tipoPersonajeActual = (tipo === 'minera') ? 'minera' : 'minero';
    personajeYaElegido = true;
    seleccionPersonajeActiva = false;

    try {
        sessionStorage.setItem('personajeElegidoPlaza', tipoPersonajeActual);
    } catch (e) {}

    if (selectorPersonajeModalEl) {
        selectorPersonajeModalEl.style.opacity = '0';
        setTimeout(function() {
            if (selectorPersonajeModalEl) selectorPersonajeModalEl.style.display = 'none';
        }, 250);
    }

    characterGroup.visible = true;
    if (hudGuiaEl) hudGuiaEl.style.opacity = '1';

    cargarModeloPersonaje(tipoPersonajeActual, function() {
        characterGroup.visible = true;
        clock.getDelta();
        placeCharacterAndCamera(clock.getElapsedTime());
    });
};

// ====================================================
// ANIMACIÓN DE MIXAMO IGUAL PARA EL MINERO Y LA MINERA
// ====================================================
function resetearHuesosRig() {
    rigBones = {
        leftUpLeg: null, rightUpLeg: null,
        leftLeg: null, rightLeg: null,
        leftArm: null, rightArm: null,
        leftForeArm: null, rightForeArm: null,
        hips: null, spine: null,
        hipsRestPos: null,
        restPoseGuardada: false
    };
    characterMixer = null;
    characterActions = { idle: null, walk: null };
    characterHasAnimations = false;
    walkCycleTime = 0;
}

function eliminarRetrocesoMixamoEnClip(clip) {
    if (!clip || !clip.tracks) return;
    clip.tracks.forEach(function(track) {
        if (/\.position$/i.test(track.name) && track.values && track.values.length >= 3) {
            var baseX = track.values[0];
            var baseY = track.values[1];
            var baseZ = track.values[2];
            for (var i = 0; i < track.values.length; i += 3) {
                track.values[i] = baseX;
                track.values[i + 1] = baseY + (track.values[i + 1] - baseY) * 0.2;
                track.values[i + 2] = baseZ;
            }
        }
    });
}

function fijarCaderaEnElSitio() {
    if (rigBones.hips && rigBones.hipsRestPos) {
        rigBones.hips.position.x = rigBones.hipsRestPos.x;
        rigBones.hips.position.z = rigBones.hipsRestPos.z;
    }
}

function normalizarTamanoYCentrarMinero(model) {
    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);

    var bounds1 = calcularLimitesSeguros(model);
    var alturaActual = Math.max(0.001, bounds1.maxY - bounds1.minY);

    var factorEscala = CONFIG_PLAYER.alturaDeseadaPersonaje / alturaActual;
    model.scale.setScalar(factorEscala);

    var bounds2 = calcularLimitesSeguros(model);
    var centroX = (bounds2.minX + bounds2.maxX) * 0.5;
    var centroZ = (bounds2.minZ + bounds2.maxZ) * 0.5;
    model.position.set(-centroX, -bounds2.minY, -centroZ);
}

function mapearHuesosPersonaje(model) {
    model.traverse(function(node) {
        if (node && (node.isBone || node.type === 'Bone' || /mixamorig|arm|leg|thigh|calf|hips|spine|shoulder/i.test(node.name))) {
            var n = (node.name || '').toLowerCase();

            if (/leftupleg|upleg_l|thigh_l|l_thigh|leftthigh/i.test(n)) rigBones.leftUpLeg = node;
            else if (/rightupleg|upleg_r|thigh_r|r_thigh|rightthigh/i.test(n)) rigBones.rightUpLeg = node;
            else if (/leftleg|leg_l|calf_l|shin_l|l_calf/i.test(n)) rigBones.leftLeg = node;
            else if (/rightleg|leg_r|calf_r|shin_r|r_calf/i.test(n)) rigBones.rightLeg = node;
            else if (/leftforearm|forearm_l|lowerarm_l/i.test(n)) rigBones.leftForeArm = node;
            else if (/rightforearm|forearm_r|lowerarm_r/i.test(n)) rigBones.rightForeArm = node;
            else if (/leftarm|arm_l|upperarm_l|l_upperarm/i.test(n)) rigBones.leftArm = node;
            else if (/rightarm|arm_r|upperarm_r|r_upperarm/i.test(n)) rigBones.rightArm = node;
            else if (/hips|pelvis|root/i.test(n) && !rigBones.hips) {
                rigBones.hips = node;
                rigBones.hipsRestPos = node.position.clone();
            }
            else if (/spine/i.test(n) && !rigBones.spine) rigBones.spine = node;
        }
    });

    ['leftUpLeg', 'rightUpLeg', 'leftLeg', 'rightLeg', 'leftArm', 'rightArm', 'leftForeArm', 'rightForeArm'].forEach(function(k) {
        var b = rigBones[k];
        if (b) {
            b.userData.initRot = b.rotation.clone();
        }
    });

    rigBones.restPoseGuardada = !!(rigBones.leftUpLeg || rigBones.rightUpLeg || rigBones.leftArm || rigBones.rightArm);
}

function actualizarAnimacionMinero(delta, isWalking, isRunning) {
    var footOffset = CONFIG_PLAYER.characterFootOffset || 0;

    if (characterHasAnimations && characterMixer && characterActions.walk) {
        characterActions.walk.paused = !isWalking;
        characterActions.walk.timeScale = isRunning ? 1.45 : 1.0;
        if (isWalking) {
            characterMixer.update(delta);
            fijarCaderaEnElSitio();
        }
        characterGroup.position.y = player.position.y + footOffset;
        return;
    }

    if (!characterModel) return;

    if (rigBones.restPoseGuardada) {
        if (rigBones.leftArm && rigBones.leftArm.userData.initRot) {
            rigBones.leftArm.rotation.z = rigBones.leftArm.userData.initRot.z - 1.1;
        }
        if (rigBones.rightArm && rigBones.rightArm.userData.initRot) {
            rigBones.rightArm.rotation.z = rigBones.rightArm.userData.initRot.z + 1.1;
        }

        if (isWalking) {
            walkCycleTime += delta * (isRunning ? 13.0 : 8.5);
            var s = Math.sin(walkCycleTime);
            var c = Math.cos(walkCycleTime);

            if (rigBones.leftUpLeg) rigBones.leftUpLeg.rotation.x = rigBones.leftUpLeg.userData.initRot.x + s * 0.65;
            if (rigBones.rightUpLeg) rigBones.rightUpLeg.rotation.x = rigBones.rightUpLeg.userData.initRot.x - s * 0.65;
            if (rigBones.leftLeg) rigBones.leftLeg.rotation.x = rigBones.leftLeg.userData.initRot.x + Math.max(0, -c) * 0.55;
            if (rigBones.rightLeg) rigBones.rightLeg.rotation.x = rigBones.rightLeg.userData.initRot.x + Math.max(0, c) * 0.55;
            if (rigBones.leftArm) rigBones.leftArm.rotation.x = rigBones.leftArm.userData.initRot.x - s * 0.45;
            if (rigBones.rightArm) rigBones.rightArm.rotation.x = rigBones.rightArm.userData.initRot.x + s * 0.45;

            characterGroup.position.y = player.position.y + footOffset + Math.abs(c) * 0.12;
        } else {
            ['leftUpLeg', 'rightUpLeg', 'leftLeg', 'rightLeg'].forEach(function(k) {
                if (rigBones[k] && rigBones[k].userData.initRot) {
                    rigBones[k].rotation.x = rigBones[k].userData.initRot.x;
                }
            });
            if (rigBones.leftArm && rigBones.leftArm.userData.initRot) rigBones.leftArm.rotation.x = rigBones.leftArm.userData.initRot.x;
            if (rigBones.rightArm && rigBones.rightArm.userData.initRot) rigBones.rightArm.rotation.x = rigBones.rightArm.userData.initRot.x;
            characterGroup.position.y = player.position.y + footOffset;
        }
    }
}

// 👉 PERSONAJE SIN SOMBRA (castShadow = false, receiveShadow = false)
function aplicarGltfAlPersonaje(gltf, tipo) {
    while (characterGroup.children.length > 0) {
        characterGroup.remove(characterGroup.children[0]);
    }
    resetearHuesosRig();

    var model = gltf.scene;
    characterModel = model;

    model.traverse(function(child) {
        if (child && child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
            child.frustumCulled = false;
            mejorarCalidadMaterial(child.material);
        }
    });

    normalizarTamanoYCentrarMinero(model);
    mapearHuesosPersonaje(model);

    characterGroup.add(model);

    if (gltf.animations && gltf.animations.length > 0) {
        var clipsConMovimiento = gltf.animations.filter(function(c) {
            return c.tracks && c.tracks.length > 2 && c.duration > 0.15;
        });

        if (clipsConMovimiento.length > 0) {
            characterMixer = new THREE.AnimationMixer(model);
            var walkClip = clipsConMovimiento[0];
            for (var i = 0; i < clipsConMovimiento.length; i++) {
                if (/walk|caminar|run|mixamo/i.test(clipsConMovimiento[i].name)) {
                    walkClip = clipsConMovimiento[i];
                    break;
                }
            }

            eliminarRetrocesoMixamoEnClip(walkClip);

            characterActions.walk = characterMixer.clipAction(walkClip);
            characterActions.walk.play();
            characterActions.walk.paused = true;
            characterHasAnimations = true;
            characterMixer.update(0.01);
            fijarCaderaEnElSitio();
        }
    }

    characterGroup.position.set(
        player.position.x,
        player.position.y + (CONFIG_PLAYER.characterFootOffset || 0),
        player.position.z
    );
    characterGroup.rotation.y = characterFacingYaw + CONFIG_PLAYER.characterYawOffset;
    characterGroup.updateMatrixWorld(true);
}

function cargarModeloPersonaje(tipo, onComplete) {
    var clave = (tipo === 'minera') ? 'minera' : 'minero';
    var rutas = MODELOS_PERSONAJES[clave];

    cargarGLBConRespaldo(rutas, function(gltf) {
        aplicarGltfAlPersonaje(gltf, clave);
        if (onComplete) onComplete();
    }, function() {
        cargarGLBConRespaldo(MODELOS_PERSONAJES.minero, function(gltfFallback) {
            aplicarGltfAlPersonaje(gltfFallback, clave);
            if (onComplete) onComplete();
        }, function() {
            if (onComplete) onComplete();
        });
    });
}

// ====================================================
// SISTEMA DE APERTURA Y RETORNO INSTANTÁNEO DE MONUMENTOS
// ====================================================
function guardarEstadoJugadorEnSesion() {
    try {
        var estado = {
            x: player.position.x,
            y: player.position.y,
            z: player.position.z,
            yaw: player.yaw,
            pitch: player.pitch,
            facingYaw: characterFacingYaw,
            camDist: currentCameraDistance,
            tipoPersonaje: tipoPersonajeActual,
            volverDeMonumento: true
        };
        sessionStorage.setItem('estadoJugadorPlaza', JSON.stringify(estado));
    } catch (e) {}
}

function restaurarEstadoJugadorDeSesion() {
    try {
        var raw = sessionStorage.getItem('estadoJugadorPlaza');
        if (!raw) return false;
        var estado = JSON.parse(raw);
        if (!estado || !estado.volverDeMonumento) return false;

        player.position.set(estado.x, estado.y, estado.z);
        player.yaw = estado.yaw;
        player.pitch = estado.pitch;
        characterFacingYaw = (estado.facingYaw !== undefined) ? estado.facingYaw : estado.yaw;
        if (estado.camDist) currentCameraDistance = estado.camDist;
        if (estado.tipoPersonaje) {
            tipoPersonajeActual = estado.tipoPersonaje;
            personajeYaElegido = true;
        }

        estado.volverDeMonumento = false;
        sessionStorage.setItem('estadoJugadorPlaza', JSON.stringify(estado));
        return true;
    } catch (e) {
        return false;
    }
}

window.abrirMonumentoInstantaneo = function(enlaceUrl) {
    if (!enlaceUrl) return;

    guardarEstadoJugadorEnSesion();
    detenerSonidoPasos();

    keys = {};
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }

    var musicaEstabaSonando = false;
    if (sound && sound.isPlaying) {
        musicaEstabaSonando = true;
        sound.pause();
    }

    if (!monumentoIframeOverlay) {
        monumentoIframeOverlay = document.createElement('div');
        monumentoIframeOverlay.id = 'monumento-overlay-instantaneo';
        monumentoIframeOverlay.style.cssText = 'position:fixed; inset:0; width:100vw; height:100vh; background:#120d0a; z-index:999999; display:none; border:none; margin:0; padding:0;';
        
        var iframe = document.createElement('iframe');
        iframe.id = 'monumento-iframe-visor';
        iframe.style.cssText = 'width:100%; height:100%; border:none; display:block;';
        iframe.setAttribute('allow', 'autoplay; fullscreen');
        monumentoIframeOverlay.appendChild(iframe);
        document.body.appendChild(monumentoIframeOverlay);

        iframe.addEventListener('load', function() {
            try {
                var idoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
                if (!idoc) return;

                var elementos = idoc.querySelectorAll('a, button');
                for (var i = 0; i < elementos.length; i++) {
                    var el = elementos[i];
                    var txt = (el.innerText || el.textContent || '').toUpperCase();
                    var href = (el.getAttribute('href') || '').toLowerCase();
                    if (txt.indexOf('VOLVER') !== -1 || href.indexOf('index') !== -1 || href.indexOf('plaza') !== -1 || href.indexOf('modelo') !== -1) {
                        el.addEventListener('click', function(ev) {
                            ev.preventDefault();
                            ev.stopPropagation();
                            window.cerrarMonumentoInstantaneo();
                        });
                    }
                }

                idoc.addEventListener('keydown', function(ev) {
                    if (ev.code === 'Escape') {
                        ev.preventDefault();
                        window.cerrarMonumentoInstantaneo();
                    }
                });
            } catch (err) {}
        });
    }

    var visor = document.getElementById('monumento-iframe-visor');
    if (visor) {
        visor.dataset.reanudarMusica = musicaEstabaSonando ? '1' : '0';
        visor.src = enlaceUrl;
    }

    monumentoIframeOverlay.style.display = 'block';
    monumentoModalActivo = true;

    try {
        history.pushState({ monumentoAbierto: true }, '', '#' + enlaceUrl.replace('.html', ''));
    } catch (e) {}
};

window.cerrarMonumentoInstantaneo = function(desdePopState) {
    if (!monumentoModalActivo) return;
    monumentoModalActivo = false;

    var visor = document.getElementById('monumento-iframe-visor');
    var reanudar = visor && visor.dataset.reanudarMusica === '1';
    if (visor) {
        visor.src = 'about:blank';
    }
    if (monumentoIframeOverlay) {
        monumentoIframeOverlay.style.display = 'none';
    }

    if (reanudar && sound && !sound.isPlaying && sound.buffer) {
        sound.play();
    }

    if (!desdePopState && window.location.hash) {
        try {
            history.back();
        } catch (e) {}
    }

    clock.getDelta();
    placeCharacterAndCamera(clock.getElapsedTime());
};

window.addEventListener('popstate', function() {
    if (monumentoModalActivo) {
        window.cerrarMonumentoInstantaneo(true);
    }
});

// ====================================================
// OPTIMIZACIÓN DE TEXTURAS Y MATERIALES
// ====================================================
function mejorarCalidadMaterial(material) {
    if (!material) return;
    var mats = Array.isArray(material) ? material : [material];
    for (var i = 0; i < mats.length; i++) {
        var m = mats[i];
        if (!m) continue;
        if (m.map) {
            m.map.anisotropy = maxAnisotropy;
        }
        m.shadowSide = null;
        m.precision = "mediump";
    }
}

function prepararEsferaColisionMundial(mesh) {
    if (!mesh || !mesh.geometry) return;
    if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
    var sphere = mesh.geometry.boundingSphere.clone();
    sphere.applyMatrix4(mesh.matrixWorld);
    mesh.userData.worldCenter = sphere.center;
    mesh.userData.worldRadius = sphere.radius;
}

function registrarParaColision(objeto, esMuro) {
    if (!objeto) return;
    congelarObjetoEstatico(objeto);
    objeto.traverse(function(child) {
        if (child && child.isMesh && child.geometry) {
            prepararEsferaColisionMundial(child);
            collisionMeshes.push(child);
            if (esMuro) {
                wallMeshes.push(child);
            }
        }
    });
}

function agregarObstaculoCircular(x, z, radio) {
    circleObstacles.push({ x: x, z: z, r: radio });
}

// ====================================================
// SISTEMA DE RECORRIDO AÉREO CINEMÁTICO (TOUR 3D)
// ====================================================
function obtenerPosicionCamaraTerceraPersona() {
    var targetPoint = new THREE.Vector3(
        player.position.x,
        player.position.y + CONFIG_PLAYER.cameraLookHeight,
        player.position.z
    );
    var horizDist = currentCameraDistance * Math.cos(player.pitch);
    var vertOffset = currentCameraDistance * Math.sin(player.pitch) + (CONFIG_PLAYER.cameraHeight - CONFIG_PLAYER.cameraLookHeight);
    var camDir = new THREE.Vector3(
        Math.sin(player.yaw) * horizDist,
        vertOffset,
        Math.cos(player.yaw) * horizDist
    );
    var pos = targetPoint.clone().add(camDir);
    if (pos.y < player.position.y + 2.0) pos.y = player.position.y + 2.0;
    return { camPos: pos, lookAt: targetPoint };
}

function construirCurvasTourPlaza() {
    var finalCam = obtenerPosicionCamaraTerceraPersona();

    var positions = [
        new THREE.Vector3(-35, 58, 45),
        new THREE.Vector3(-54, 32, 16),
        new THREE.Vector3(-82, 38, 12),
        new THREE.Vector3(-126, 36, -28),
        new THREE.Vector3(-56, 32, -48),
        new THREE.Vector3(-60, 34, -92),
        new THREE.Vector3(-122, 38, -135),
        new THREE.Vector3(-88, 48, -45),
        new THREE.Vector3(finalCam.camPos.x + 6, finalCam.camPos.y + 8, finalCam.camPos.z + 8),
        finalCam.camPos.clone()
    ];

    var looks = [
        new THREE.Vector3(-92, 12, -55),
        new THREE.Vector3(-73, 16, 16),
        new THREE.Vector3(-111.5, 26, -13),
        new THREE.Vector3(-105, 18, -15),
        new THREE.Vector3(-74, 15, -38),
        new THREE.Vector3(-78, 16, -74),
        new THREE.Vector3(-85, 12, -130),
        new THREE.Vector3(-80, 12, 0),
        finalCam.lookAt.clone(),
        finalCam.lookAt.clone()
    ];

    return {
        positions: new THREE.CatmullRomCurve3(positions),
        looks: new THREE.CatmullRomCurve3(looks)
    };
}

window.iniciarTourPlaza = function(mostrarUI) {
    if (mostrarUI === undefined) mostrarUI = true;
    detenerSonidoPasos();

    if (window.historiaEnCurso && typeof window.cerrarVentanaHistoria === 'function') {
        window.cerrarVentanaHistoria();
    }
    if (videoModalActivo) {
        window.cerrarVideoPunto();
    }
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
    if (selectorPersonajeModalEl) {
        selectorPersonajeModalEl.style.display = 'none';
        seleccionPersonajeActiva = false;
    }

    tourCurves = construirCurvasTourPlaza();
    tourElapsed = 0;
    tourActivo = true;
    _ultimoPorcentajeTour = -1;
    _ultimoTextoTour = "";

    if (renderer) {
        renderer.setPixelRatio(0.85);
    }

    characterGroup.visible = personajeYaElegido;

    camera.position.copy(tourCurves.positions.getPoint(0));
    camera.lookAt(tourCurves.looks.getPoint(0));
    camera.updateMatrixWorld(true);

    if (tourOverlayEl) tourOverlayEl.style.display = mostrarUI ? 'flex' : 'none';
    if (hudGuiaEl) hudGuiaEl.style.opacity = '0';
    if (hudPromptEl) hudPromptEl.style.display = 'none';
};

window.terminarTourPlaza = function(omitirSelector) {
    tourActivo = false;
    if (tourOverlayEl) tourOverlayEl.style.display = 'none';

    if (renderer) {
        renderer.setPixelRatio(1.0);
    }

    placeCharacterAndCamera(clock.getElapsedTime());
    camera.updateMatrixWorld(true);

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }

    if (!personajeYaElegido && !omitirSelector) {
        characterGroup.visible = false;
        window.mostrarSelectorPersonaje();
    } else {
        characterGroup.visible = true;
        if (hudGuiaEl) hudGuiaEl.style.opacity = '1';
    }
};

// ====================================================
// 1. MINIMAPA / RADAR 2D INTERACTIVO (INCLUYE PUNTOS DE VIDEO VERDE ESMERALDA)
// ====================================================
function mundoARadar(wx, wz, cx, cy) {
    var dx = wx - player.position.x;
    var dz = wz - player.position.z;

    var sinY = Math.sin(player.yaw);
    var cosY = Math.cos(player.yaw);

    var distDerecha = dx * cosY - dz * sinY;
    var distFrente  = -dx * sinY - dz * cosY;

    return {
        x: cx + distDerecha * minimapScale,
        y: cy - distFrente * minimapScale
    };
}

function radarAMundo(rx, ry, cx, cy) {
    var distDerecha = (rx - cx) / minimapScale;
    var distFrente  = -(ry - cy) / minimapScale;

    var sinY = Math.sin(player.yaw);
    var cosY = Math.cos(player.yaw);

    var dx = distDerecha * cosY - distFrente * sinY;
    var dz = -distDerecha * sinY - distFrente * cosY;

    return {
        x: player.position.x + dx,
        z: player.position.z + dz
    };
}

function crearMinimapaRadar() {
    var viejoMapa = document.getElementById('minimapa-radar-container');
    if (viejoMapa) viejoMapa.remove();

    minimapContainerEl = document.createElement('div');
    minimapContainerEl.id = 'minimapa-radar-container';
    minimapContainerEl.style.cssText =
        'position:fixed; bottom:78px; left:30px; width:195px; background:rgba(10,16,20,0.92); ' +
        'border:1.5px solid rgba(224,176,102,0.55); border-radius:18px; ' +
        'padding:10px; z-index:650; box-shadow:0 8px 24px rgba(0,0,0,0.7); pointer-events:auto; ' +
        'font-family:Montserrat,sans-serif; color:#e0dacf; user-select:none;';

    var tituloMapa = document.createElement('div');
    tituloMapa.style.cssText = 'font-size:0.68rem; font-weight:800; color:#facc15; letter-spacing:1.2px; text-align:center; margin-bottom:6px; text-transform:uppercase;';
    tituloMapa.innerHTML = '🧭 RADAR (CLIC = IR)';
    minimapContainerEl.appendChild(tituloMapa);

    minimapCanvas = document.createElement('canvas');
    minimapCanvas.width = 162;
    minimapCanvas.height = 162;
    minimapCanvas.style.cssText = 'display:block; margin:0 auto; border-radius:50%; border:1.5px solid rgba(250,204,21,0.4); background:radial-gradient(circle, rgba(20,42,32,0.95) 0%, rgba(7,15,12,0.98) 100%); cursor:pointer;';
    minimapContainerEl.appendChild(minimapCanvas);
    minimapCtx = minimapCanvas.getContext('2d');

    var leyenda = document.createElement('div');
    leyenda.style.cssText = 'display:flex; justify-content:space-around; font-size:0.58rem; margin-top:7px; color:#cbd5e1; font-weight:600;';
    leyenda.innerHTML =
        '<span><b style="color:#38bdf8;">▲</b> Tú</span>' +
        '<span><b style="color:#f97316;">◆</b> Monum.</span>' +
        '<span><b style="color:#facc15;">●</b> Hist.</span>' +
        '<span><b style="color:#22c55e;">■</b> Video</span>';
    minimapContainerEl.appendChild(leyenda);

    document.body.appendChild(minimapContainerEl);

    minimapCanvas.addEventListener('click', function(e) {
        if (tourActivo || window.historiaEnCurso || monumentoModalActivo || seleccionPersonajeActiva || videoModalActivo) return;

        var rect = minimapCanvas.getBoundingClientRect();
        var clickX = e.clientX - rect.left;
        var clickY = e.clientY - rect.top;
        var cx = minimapCanvas.width / 2;
        var cy = minimapCanvas.height / 2;

        var puntoMundo = radarAMundo(clickX, clickY, cx, cy);
        var worldX = puntoMundo.x;
        var worldZ = puntoMundo.z;

        var mejorMonumento = null;
        var mejorDist = 18.0;
        marcadores.forEach(function(m) {
            var d = Math.hypot(m.pisoPos.x - worldX, m.pisoPos.z - worldZ);
            if (d < mejorDist) {
                mejorDist = d;
                mejorMonumento = m;
            }
        });

        if (mejorMonumento) {
            monumentoGuiaManual = mejorMonumento;
            var offsetDist = (mejorMonumento.enlace === 'minero.html') ? 16.0 : 8.5;
            var destX = mejorMonumento.pisoPos.x + offsetDist;
            var destZ = mejorMonumento.pisoPos.z;
            var destY = getFloorHeightBelow(destX, destZ, mejorMonumento.pisoPos.y, null, true);

            player.position.set(destX, destY, destZ);
            player.velocity.set(0, 0, 0);
            var anguloMirar = Math.atan2(player.position.x - mejorMonumento.pisoPos.x, player.position.z - mejorMonumento.pisoPos.z);
            player.yaw = anguloMirar;
            characterFacingYaw = anguloMirar;
            placeCharacterAndCamera(clock.getElapsedTime());
            return;
        }

        if (window.ESTACIONES_VIDEOS) {
            for (var v = 0; v < window.ESTACIONES_VIDEOS.length; v++) {
                var ev = window.ESTACIONES_VIDEOS[v];
                if (Math.hypot(ev.zona.x - worldX, ev.zona.z - worldZ) < 14.0) {
                    var vy = getFloorHeightBelow(ev.zona.x + 4.0, ev.zona.z, ev.zona.y, null, true);
                    player.position.set(ev.zona.x + 4.0, vy, ev.zona.z);
                    player.velocity.set(0, 0, 0);
                    placeCharacterAndCamera(clock.getElapsedTime());
                    return;
                }
            }
        }

        if (window.ESTACIONES_HISTORIA) {
            for (var i = 0; i < window.ESTACIONES_HISTORIA.length; i++) {
                var est = window.ESTACIONES_HISTORIA[i];
                var dEst = Math.hypot(est.zona.x - worldX, est.zona.z - worldZ);
                if (dEst < 14.0) {
                    var ny = getFloorHeightBelow(est.zona.x + 4.5, est.zona.z, est.zona.y, null, true);
                    player.position.set(est.zona.x + 4.5, ny, est.zona.z);
                    player.velocity.set(0, 0, 0);
                    var anguloEst = Math.atan2(player.position.x - est.zona.x, player.position.z - est.zona.z);
                    player.yaw = anguloEst;
                    characterFacingYaw = anguloEst;
                    placeCharacterAndCamera(clock.getElapsedTime());
                    break;
                }
            }
        }
    });
}

function actualizarMinimapaRadar(time) {
    if (!minimapCtx || !minimapCanvas) return;

    var pantallaBienvenida = document.getElementById('pantalla-bienvenida');
    var splashVisible = pantallaBienvenida && window.getComputedStyle(pantallaBienvenida).display !== 'none';
    if (minimapContainerEl) {
        minimapContainerEl.style.opacity = (splashVisible || window.historiaEnCurso || seleccionPersonajeActiva || videoModalActivo) ? '0.2' : '1';
    }

    var w = minimapCanvas.width;
    var h = minimapCanvas.height;
    var cx = w / 2;
    var cy = h / 2;
    var radius = cx - 4;

    minimapCtx.clearRect(0, 0, w, h);
    minimapCtx.save();

    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    minimapCtx.clip();

    minimapCtx.strokeStyle = 'rgba(224, 176, 102, 0.16)';
    minimapCtx.lineWidth = 1;
    [26, 52, 76].forEach(function(r) {
        minimapCtx.beginPath();
        minimapCtx.arc(cx, cy, r, 0, Math.PI * 2);
        minimapCtx.stroke();
    });
    minimapCtx.beginPath();
    minimapCtx.moveTo(cx, 0); minimapCtx.lineTo(cx, h);
    minimapCtx.moveTo(0, cy); minimapCtx.lineTo(w, cy);
    minimapCtx.stroke();

    var frontAngle = -Math.PI / 2;
    minimapCtx.fillStyle = 'rgba(56, 189, 248, 0.24)';
    minimapCtx.beginPath();
    minimapCtx.moveTo(cx, cy);
    minimapCtx.arc(cx, cy, 42, frontAngle - 0.48, frontAngle + 0.48);
    minimapCtx.closePath();
    minimapCtx.fill();

    if (window.ESTACIONES_HISTORIA) {
        window.ESTACIONES_HISTORIA.forEach(function(est) {
            var p = mundoARadar(est.zona.x, est.zona.z, cx, cy);
            if (Math.hypot(p.x - cx, p.y - cy) < radius - 3) {
                minimapCtx.fillStyle = est.visitado ? '#4ade80' : '#facc15';
                minimapCtx.beginPath();
                minimapCtx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
                minimapCtx.fill();
                minimapCtx.strokeStyle = '#050d0a';
                minimapCtx.lineWidth = 1.2;
                minimapCtx.stroke();
            }
        });
    }

    // Dibujar Puntos de Video en el Radar (Cuadrados Verde Esmeralda)
    if (window.ESTACIONES_VIDEOS) {
        window.ESTACIONES_VIDEOS.forEach(function(ev) {
            var pv = mundoARadar(ev.zona.x, ev.zona.z, cx, cy);
            if (Math.hypot(pv.x - cx, pv.y - cy) < radius - 3) {
                minimapCtx.fillStyle = ev.visitado ? '#facc15' : '#22c55e';
                minimapCtx.strokeStyle = '#ffffff';
                minimapCtx.lineWidth = 1.2;
                minimapCtx.fillRect(pv.x - 4, pv.y - 4, 8, 8);
                minimapCtx.strokeRect(pv.x - 4, pv.y - 4, 8, 8);
            }
        });
    }

    marcadores.forEach(function(m) {
        var p = mundoARadar(m.pisoPos.x, m.pisoPos.z, cx, cy);
        var mx = p.x;
        var my = p.y;
        var distCentro = Math.hypot(mx - cx, my - cy);

        if (distCentro > radius - 8) {
            var ang = Math.atan2(my - cy, mx - cx);
            mx = cx + Math.cos(ang) * (radius - 8);
            my = cy + Math.sin(ang) * (radius - 8);
        }

        minimapCtx.save();
        minimapCtx.translate(mx, my);
        minimapCtx.rotate(Math.PI / 4);
        minimapCtx.fillStyle = (m.enlace === 'minero.html') ? '#fde047' : '#f97316';
        minimapCtx.strokeStyle = '#ffffff';
        minimapCtx.lineWidth = 1.2;
        var tam = (m.enlace === 'minero.html') ? 7.5 : 6.0;
        minimapCtx.fillRect(-tam / 2, -tam / 2, tam, tam);
        minimapCtx.strokeRect(-tam / 2, -tam / 2, tam, tam);
        minimapCtx.restore();

        if (distCentro <= radius - 8) {
            minimapCtx.fillStyle = '#ffffff';
            minimapCtx.font = 'bold 8.5px Montserrat, sans-serif';
            minimapCtx.textAlign = 'center';
            minimapCtx.fillText(m.corto || '', mx, my - 7);
        }
    });

    var relCharYaw = characterFacingYaw - player.yaw;
    minimapCtx.save();
    minimapCtx.translate(cx, cy);
    minimapCtx.rotate(-relCharYaw);
    minimapCtx.fillStyle = '#38bdf8';
    minimapCtx.strokeStyle = '#ffffff';
    minimapCtx.lineWidth = 1.5;
    minimapCtx.beginPath();
    minimapCtx.moveTo(0, -7);
    minimapCtx.lineTo(-5, 5);
    minimapCtx.lineTo(0, 2.5);
    minimapCtx.lineTo(5, 5);
    minimapCtx.closePath();
    minimapCtx.fill();
    minimapCtx.stroke();
    minimapCtx.restore();

    minimapCtx.restore();
}

// ====================================================
// 5. MODO FOTOGRAFÍA / POSTAL TURÍSTICA (TECLA P)
// ====================================================
window.tomarFotoPostal = function() {
    if (!renderer || !scene || !camera || monumentoModalActivo) return;

    renderer.render(scene, camera);

    var flashEl = document.createElement('div');
    flashEl.style.cssText = 'position:fixed; inset:0; background:#ffffff; z-index:999999; opacity:0.92; pointer-events:none; transition:opacity 0.45s ease;';
    document.body.appendChild(flashEl);
    setTimeout(function() {
        flashEl.style.opacity = '0';
        setTimeout(function() { flashEl.remove(); }, 480);
    }, 60);

    var srcCanvas = renderer.domElement;
    var w = srcCanvas.width;
    var h = srcCanvas.height;

    var postalCanvas = document.createElement('canvas');
    postalCanvas.width = w;
    postalCanvas.height = h;
    var ctx = postalCanvas.getContext('2d');

    ctx.drawImage(srcCanvas, 0, 0, w, h);

    var pad = Math.max(16, Math.round(Math.min(w, h) * 0.025));
    var bannerHeight = Math.max(85, Math.round(h * 0.12));

    var grad = ctx.createLinearGradient(0, h - bannerHeight - pad * 2, 0, h);
    grad.addColorStop(0, 'rgba(5, 15, 10, 0)');
    grad.addColorStop(0.35, 'rgba(5, 15, 10, 0.88)');
    grad.addColorStop(1, 'rgba(4, 12, 8, 0.96)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - bannerHeight - pad * 2, w, bannerHeight + pad * 2);

    ctx.strokeStyle = '#e0b066';
    ctx.lineWidth = Math.max(3, Math.round(w * 0.003));
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

    ctx.strokeStyle = 'rgba(74, 222, 128, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad + 6, pad + 6, w - (pad + 6) * 2, h - (pad + 6) * 2);

    var textStartX = pad + 26;
    if (logoPostalImg && logoPostalImg.complete && logoPostalImg.naturalWidth > 0) {
        var logoH = Math.round(bannerHeight * 0.82);
        var logoW = Math.round((logoPostalImg.naturalWidth / logoPostalImg.naturalHeight) * logoH);
        var logoX = pad + 24;
        var logoY = h - pad - logoH - 10;
        ctx.drawImage(logoPostalImg, logoX, logoY, logoW, logoH);
        textStartX = logoX + logoW + 20;
    }

    var fontTitle = Math.max(18, Math.round(w * 0.019));
    var fontSub = Math.max(12, Math.round(w * 0.011));

    ctx.fillStyle = '#facc15';
    ctx.font = '800 ' + fontTitle + 'px "Cinzel", Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Recuerdo de mi visita a la Plaza del Minero - Siglo XX', textStartX, h - pad - Math.round(bannerHeight * 0.48));

    var fechaActual = new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillStyle = '#e0dacf';
    ctx.font = '600 ' + fontSub + 'px "Montserrat", sans-serif';
    ctx.fillText('📍 Llallagua, Potosí - Bolivia   |   🗓️ ' + fechaActual, textStartX, h - pad - Math.round(bannerHeight * 0.18));

    try {
        var dataURL = postalCanvas.toDataURL('image/png');
        var link = document.createElement('a');
        link.download = 'Postal_Plaza_Del_Minero_SigloXX_' + Date.now() + '.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        console.error('Error al exportar la postal:', err);
    }
};

// ====================================================
// HUD DE GUÍA, BOTÓN DE SIRENA (JUNTO A CLIMAS) Y OVERLAY DEL TOUR
// ====================================================
function crearHUDGuia() {
    var viejoHud = document.getElementById('hud-guia-recorrido');
    if (viejoHud) viejoHud.remove();
    var viejoPrompt = document.getElementById('hud-prompt-interaccion');
    if (viejoPrompt) viejoPrompt.remove();
    var viejoTour = document.getElementById('tour-aereo-overlay');
    if (viejoTour) viejoTour.remove();

    hudGuiaEl = document.createElement('div');
    hudGuiaEl.id = 'hud-guia-recorrido';
    hudGuiaEl.style.cssText = 'position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:rgba(5,15,10,0.92); border:1.5px solid #c9a84c; color:#fff; padding:10px 22px; border-radius:40px; font-family:Montserrat,sans-serif; font-size:0.86rem; font-weight:600; z-index:9000; display:flex; align-items:center; gap:12px; box-shadow:0 4px 16px rgba(0,0,0,0.65); pointer-events:none; transition:opacity 0.3s ease; opacity:0; white-space:nowrap; max-width:92vw;';
    hudGuiaEl.innerHTML = '<span style="color:#facc15; font-weight:800;">🧭 RECORRIDO:</span> <span id="hud-guia-texto">Camina hacia el Punto 01 (Anillo Dorado)</span>';
    document.body.appendChild(hudGuiaEl);

    hudPromptEl = document.createElement('div');
    hudPromptEl.id = 'hud-prompt-interaccion';
    hudPromptEl.style.cssText = 'position:fixed; bottom:76px; left:50%; transform:translateX(-50%); background:rgba(6,20,13,0.95); border:2px solid #22c55e; color:#fff; padding:11px 24px; border-radius:50px; font-family:Montserrat,sans-serif; font-size:0.92rem; font-weight:700; z-index:9001; display:none; box-shadow:0 0 22px rgba(34,197,94,0.55); pointer-events:none; white-space:nowrap;';
    document.body.appendChild(hudPromptEl);

    tourOverlayEl = document.createElement('div');
    tourOverlayEl.id = 'tour-aereo-overlay';
    tourOverlayEl.style.cssText = 'position:fixed; bottom:28px; left:50%; transform:translateX(-50%); background:rgba(10,16,22,0.92); border:1.5px solid rgba(224,176,102,0.6); color:#fff; padding:14px 24px; border-radius:20px; font-family:Montserrat,sans-serif; z-index:9500; display:none; align-items:center; gap:20px; box-shadow:0 10px 28px rgba(0,0,0,0.75); min-width:340px;';
    tourOverlayEl.innerHTML =
        '<div style="flex:1;">' +
            '<div id="tour-aereo-label" style="color:#facc15; font-size:0.8rem; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:6px;">✈️ Recorrido Aéreo por la Plaza...</div>' +
            '<div style="width:100%; height:5px; background:rgba(255,255,255,0.15); border-radius:4px; overflow:hidden;">' +
                '<div id="tour-aereo-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #e0b066, #4ade80);"></div>' +
            '</div>' +
        '</div>' +
        '<button id="btn-saltar-tour" style="background:#e0b066; color:#111; border:none; padding:10px 18px; border-radius:25px; font-family:Montserrat,sans-serif; font-size:0.78rem; font-weight:800; letter-spacing:1px; cursor:pointer; white-space:nowrap;">SALTAR ⏭</button>';
    document.body.appendChild(tourOverlayEl);

    tourBarEl = document.getElementById('tour-aereo-bar');
    tourLabelEl = document.getElementById('tour-aereo-label');
    var btnSaltar = document.getElementById('btn-saltar-tour');
    if (btnSaltar) {
        btnSaltar.addEventListener('click', function(e) {
            e.stopPropagation();
            inicializarAudioProcedural();
            window.terminarTourPlaza();
        });
    }

    // 👉 AÑADIR BOTÓN DE SIRENA AL LADO DE DÍA / TARDE / NOCHE
    var contenedorClima = document.querySelector('.clima-botones-container');
    if (contenedorClima && !document.getElementById('btn-sirena')) {
        var btnSirena = document.createElement('button');
        btnSirena.id = 'btn-sirena';
        btnSirena.type = 'button';
        btnSirena.className = 'btn-clima';
        btnSirena.style.borderColor = 'rgba(239, 68, 68, 0.55)';
        btnSirena.style.color = '#fca5a5';
        btnSirena.innerHTML = '🚨 Sirena (G)';
        btnSirena.onclick = function(e) {
            window.alternarSirena(e);
        };
        contenedorClima.appendChild(btnSirena);
    }

    var contenedorBotones = document.querySelector('.botones-container');
    if (contenedorBotones) {
        if (!document.getElementById('btn-cambiar-personaje')) {
            var btnChar = document.createElement('button');
            btnChar.id = 'btn-cambiar-personaje';
            btnChar.className = 'btn-fotografias';
            btnChar.style.borderColor = '#38bdf8';
            btnChar.style.color = '#7dd3fc';
            btnChar.innerHTML = '👷 PERSONAJE (C)';
            btnChar.onclick = function(e) {
                e.stopPropagation();
                if (!tourActivo) window.mostrarSelectorPersonaje();
            };
            contenedorBotones.insertBefore(btnChar, contenedorBotones.firstChild);
        }

        if (!document.getElementById('btn-iniciar-tour')) {
            var btnTour = document.createElement('button');
            btnTour.id = 'btn-iniciar-tour';
            btnTour.className = 'btn-fotografias';
            btnTour.style.borderColor = '#facc15';
            btnTour.style.color = '#fde047';
            btnTour.innerHTML = '✈️ RECORRIDO 3D';
            btnTour.onclick = function(e) {
                e.stopPropagation();
                window.iniciarTourPlaza(true);
            };
            contenedorBotones.insertBefore(btnTour, contenedorBotones.firstChild);
        }

        if (!document.getElementById('btn-tomar-postal')) {
            var btnFoto = document.createElement('button');
            btnFoto.id = 'btn-tomar-postal';
            btnFoto.className = 'btn-fotografias';
            btnFoto.style.borderColor = '#4ade80';
            btnFoto.style.color = '#86efac';
            btnFoto.innerHTML = '📸 TOMAR FOTO (P)';
            btnFoto.onclick = function(e) {
                e.stopPropagation();
                window.tomarFotoPostal();
            };
            contenedorBotones.insertBefore(btnFoto, contenedorBotones.firstChild);
        }
    }

    var cajaControles = document.querySelector('.instrucciones-navegacion');
    if (cajaControles) {
        cajaControles.innerHTML = '<h3>Controles del Personaje</h3><ul>' +
            '<li><strong>W, A, S, D / Flechas:</strong> Caminar</li>' +
            '<li><strong>Shift:</strong> Correr</li>' +
            '<li><strong>Mouse / Q, E:</strong> Girar vista</li>' +
            '<li><strong>Rueda ratón:</strong> Zoom cámara</li>' +
            '<li><strong>Tecla F:</strong> Interactuar / Historia</li>' +
            '<li><strong>Tecla V:</strong> Ver Video Documental</li>' +
            '<li><strong>Tecla G:</strong> Sirena Sindical ON/OFF</li>' +
            '<li><strong>Tecla C:</strong> Cambiar Personaje</li>' +
            '<li><strong>Tecla P:</strong> Tomar Foto Postal</li>' +
            '<li><strong>Tecla T:</strong> Vuelo por la Plaza</li>' +
            '<li><strong>Tecla Z:</strong> Volver al Inicio</li>' +
            '</ul>';
    }

    crearMinimapaRadar();
    crearModalSeleccionPersonaje();
    crearModalVideoInformativo();
}

var _ultimoTextoHud = "";
window.actualizarHUDProgreso = function() {
    var txtEl = document.getElementById('hud-guia-texto');
    if (!txtEl || !window.ESTACIONES_HISTORIA) return;

    var total = window.ESTACIONES_HISTORIA.length;
    var visitados = 0;
    var siguiente = null;

    for (var i = 0; i < total; i++) {
        if (window.ESTACIONES_HISTORIA[i].visitado) {
            visitados++;
        } else if (!siguiente) {
            siguiente = window.ESTACIONES_HISTORIA[i];
        }
    }

    var vidsVisitados = 0;
    var totalVids = window.ESTACIONES_VIDEOS ? window.ESTACIONES_VIDEOS.length : 0;
    if (window.ESTACIONES_VIDEOS) {
        for (var v = 0; v < totalVids; v++) {
            if (window.ESTACIONES_VIDEOS[v].visitado) vidsVisitados++;
        }
    }

    var nuevoHTML = "";
    if (siguiente) {
        var dist = Math.round(Math.hypot(siguiente.zona.x - player.position.x, siguiente.zona.z - player.position.z));
        nuevoHTML = 'Historia: <b>' + visitados + '/' + total + '</b> · Videos: <b style="color:#4ade80;">' + vidsVisitados + '/' + totalVids + '</b> · Siguiente: <span style="color:#fde047;">[' + siguiente.numero + '] ' + siguiente.titulo.split('(')[0] + '</span> (' + dist + 'm)';
    } else {
        nuevoHTML = '✨ <b>¡Historia Completada!</b> · Videos: <b style="color:#4ade80;">' + vidsVisitados + '/' + totalVids + '</b> · Presiona <b>F</b> en monumentos o <b>V</b> en puntos de video.';
    }

    if (nuevoHTML !== _ultimoTextoHud) {
        txtEl.innerHTML = nuevoHTML;
        _ultimoTextoHud = nuevoHTML;
    }
};

// ====================================================
// ANILLOS DE LUZ (DORADOS = HISTORIA, VERDE ESMERALDA = VIDEOS)
// ====================================================
function construirEstacionesYCamino() {
    var etiquetasContainer = document.getElementById('etiquetas-container');

    if (window.ESTACIONES_HISTORIA) {
        var puntosCamino = [];
        puntosCamino.push(new THREE.Vector3(CONFIG_PLAYER.startPosition[0], 1.55, CONFIG_PLAYER.startPosition[2]));

        window.ESTACIONES_HISTORIA.forEach(function(est, idx) {
            var yRealAnillo = est.zona.y + 0.15;
            puntosCamino.push(new THREE.Vector3(est.zona.x, yRealAnillo + 0.05, est.zona.z));

            var g = new THREE.Group();
            g.position.set(est.zona.x, yRealAnillo, est.zona.z);

            var ringMat = new THREE.MeshBasicMaterial({
                color: 0xfacc15,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            var ring = new THREE.Mesh(new THREE.RingGeometry(2.5, 3.4, 18), ringMat);
            ring.rotation.x = -Math.PI / 2;

            var beamMat = new THREE.MeshBasicMaterial({
                color: 0xfacc15,
                transparent: true,
                opacity: 0.22,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            var beam = new THREE.Mesh(new THREE.CircleGeometry(2.5, 14), beamMat);
            beam.rotation.x = -Math.PI / 2;

            g.add(ring);
            g.add(beam);
            congelarObjetoEstatico(g);
            storyRingsGroup.add(g);

            var divEst = null;
            if (etiquetasContainer) {
                divEst = document.createElement('div');
                divEst.className = 'etiqueta-estacion-historia';
                divEst.style.cssText = 'position:absolute; left:0; top:0; will-change:transform; background:rgba(201,168,76,0.95); color:#050d0a; font-family:Montserrat,sans-serif; font-weight:800; font-size:0.78rem; padding:5px 12px; border-radius:20px; pointer-events:none; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.5); border:1.5px solid #fff;';
                divEst.innerText = '📜 Punto ' + est.numero + ': ' + est.titulo.split('(')[0];
                etiquetasContainer.appendChild(divEst);
            }

            storyRings.push({
                group: g,
                ring: ring,
                beam: beam,
                labelDiv: divEst,
                estacionIndex: idx,
                dentroAhora: false,
                _vis: false,
                _lx: 0,
                _ly: 0
            });
        });

        var curvaCamino = new THREE.CatmullRomCurve3(puntosCamino);
        var puntosSuaves = curvaCamino.getPoints(70);
        var lineaGeo = new THREE.BufferGeometry().setFromPoints(puntosSuaves);
        var lineaMat = new THREE.LineDashedMaterial({
            color: 0xfde047,
            dashSize: 1.8,
            gapSize: 1.0,
            linewidth: 2,
            transparent: true,
            opacity: 0.85
        });
        var lineaGuia = new THREE.Line(lineaGeo, lineaMat);
        if (lineaGuia.computeLineDistances) lineaGuia.computeLineDistances();
        congelarObjetoEstatico(lineaGuia);
        storyRingsGroup.add(lineaGuia);
    }

    // 👉 CONSTRUIR LOS 4 ANILLOS VERDE ESMERALDA DE VIDEOS INFORMATIVOS
    if (window.ESTACIONES_VIDEOS) {
        window.ESTACIONES_VIDEOS.forEach(function(ev, vIdx) {
            var yVid = ev.zona.y + 0.18;
            var vg = new THREE.Group();
            vg.position.set(ev.zona.x, yVid, ev.zona.z);

            var vRingMat = new THREE.MeshBasicMaterial({
                color: 0x22c55e,
                transparent: true,
                opacity: 0.95,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            var vRing = new THREE.Mesh(new THREE.RingGeometry(2.3, 3.2, 18), vRingMat);
            vRing.rotation.x = -Math.PI / 2;

            var vBeamMat = new THREE.MeshBasicMaterial({
                color: 0x4ade80,
                transparent: true,
                opacity: 0.28,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            var vBeam = new THREE.Mesh(new THREE.CircleGeometry(2.3, 14), vBeamMat);
            vBeam.rotation.x = -Math.PI / 2;

            vg.add(vRing);
            vg.add(vBeam);
            congelarObjetoEstatico(vg);
            videoRingsGroup.add(vg);

            var divVid = null;
            if (etiquetasContainer) {
                divVid = document.createElement('div');
                divVid.className = 'etiqueta-estacion-video';
                divVid.style.cssText = 'position:absolute; left:0; top:0; will-change:transform; background:rgba(6,24,14,0.95); color:#4ade80; font-family:Montserrat,sans-serif; font-weight:800; font-size:0.78rem; padding:6px 14px; border-radius:20px; pointer-events:auto; cursor:pointer; white-space:nowrap; box-shadow:0 0 16px rgba(34,197,94,0.65); border:2px solid #22c55e;';
                divVid.innerText = '🎬 Video ' + ev.numero + ': ' + ev.titulo;
                divVid.onclick = function(e) {
                    e.stopPropagation();
                    window.abrirVideoPunto(vIdx);
                };
                etiquetasContainer.appendChild(divVid);
            }

            videoRings.push({
                group: vg,
                ring: vRing,
                beam: vBeam,
                labelDiv: divVid,
                videoIndex: vIdx,
                dentroAhora: false,
                _vis: false,
                _lx: 0,
                _ly: 0
            });
        });

        congelarObjetoEstatico(videoRingsGroup);
        scene.add(videoRingsGroup);
    }

    var arrowGeo = new THREE.ConeGeometry(0.65, 1.8, 8);
    arrowGeo.rotateX(Math.PI / 2);
    var arrowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.9 });
    guideArrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    scene.add(guideArrowMesh);

    congelarObjetoEstatico(storyRingsGroup);
    scene.add(storyRingsGroup);
}

window.marcarAnilloVisitado = function(indice) {
    var item = storyRings[indice];
    if (!item) return;
    item.ring.material.color.setHex(0x4ade80);
    item.beam.material.color.setHex(0x4ade80);
    if (item.labelDiv) {
        item.labelDiv.style.background = 'rgba(34,197,94,0.95)';
        item.labelDiv.style.color = '#fff';
        item.labelDiv.innerText = '✔ Punto ' + window.ESTACIONES_HISTORIA[indice].numero + ' Completado';
    }
};

// ====================================================
// INICIALIZACIÓN DE LA ESCENA
// ====================================================
function init() {
    scene = new THREE.Scene();
    scene.matrixAutoUpdate = false;
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0xa0c4e0, 0.0015);
    
    camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.6, 550);
    camera.position.set(-35, 58, 45);
    camera.lookAt(new THREE.Vector3(-92, 12, -55));
    camera.updateMatrixWorld(true);

    scene.add(characterGroup);

    var manager = new THREE.LoadingManager();

    renderer = new THREE.WebGLRenderer({ 
        antialias: false, 
        powerPreference: "high-performance",
        precision: "mediump",
        stencil: false,
        depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(0.85);
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1.08; 
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    renderer.shadowMap.enabled = false;
    document.body.appendChild(renderer.domElement);

    maxAnisotropy = 1;

    crearHUDGuia();
    
    manager.onProgress = function (url, itemsLoaded, itemsTotal) {
        var progressBar = document.getElementById('progress-bar'); 
        var progressText = document.getElementById('progress-text');
        if (itemsTotal > 0 && progressText) {
            var porcentaje = Math.round((itemsLoaded / itemsTotal) * 100);
            if (progressBar) progressBar.style.width = porcentaje + '%';
            progressText.innerText = porcentaje + '%';
        }
    };

    manager.onLoad = function () {
        scene.updateMatrixWorld(true);

        if (window.ESTACIONES_VIDEOS && videoRings.length > 0) {
            for (var v = 0; v < videoRings.length; v++) {
                var ev = window.ESTACIONES_VIDEOS[v];
                var yPiso = getFloorHeightBelow(ev.zona.x, ev.zona.z, ev.zona.y, null, true);
                ev.zona.y = yPiso;
                videoRings[v].group.position.set(ev.zona.x, yPiso + 0.18, ev.zona.z);
                congelarObjetoEstatico(videoRings[v].group);
            }
            congelarObjetoEstatico(videoRingsGroup);
        }

        var loaderContainer = document.getElementById("loader-container");
        if (loaderContainer) loaderContainer.classList.add("loaded");

        var pantallaBienvenida = document.getElementById('pantalla-bienvenida');
        var volvioDeMonumento = restaurarEstadoJugadorDeSesion();

        player.position.y = getFloorHeightBelow(player.position.x, player.position.z, player.position.y, null, true);
        characterGroup.position.set(
            player.position.x,
            player.position.y + (CONFIG_PLAYER.characterFootOffset || 0),
            player.position.z
        );
        characterGroup.rotation.y = characterFacingYaw + CONFIG_PLAYER.characterYawOffset;
        characterGroup.updateMatrixWorld(true);
        window.actualizarHUDProgreso();

        if (volvioDeMonumento) {
            if (pantallaBienvenida) {
                pantallaBienvenida.style.display = 'none';
            }
            cargarModeloPersonaje(tipoPersonajeActual, function() {
                window.terminarTourPlaza(true);
            });
            return;
        }

        var splashVisible = pantallaBienvenida && window.getComputedStyle(pantallaBienvenida).display !== 'none';
        window.iniciarTourPlaza(!splashVisible);

        if (pantallaBienvenida) {
            pantallaBienvenida.addEventListener('click', function() {
                inicializarAudioProcedural();
                window.iniciarTourPlaza(true);
            }, { once: true });
        }

        var btnExplorar = document.getElementById('btn-explorar-plaza');
        if (btnExplorar) {
            btnExplorar.onclick = function() {
                inicializarAudioProcedural();
                window.iniciarTourPlaza(true);
            };
        }
    };

    var listener = new THREE.AudioListener();
    camera.add(listener);
    sound = new THREE.Audio(listener);
    var audioLoader = new THREE.AudioLoader(manager);
    audioLoader.load('assets/mieros.mp3', function(buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.28);
    });
    
    ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);
    
    hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x2d1a0e, 0.82);
    scene.add(hemisphereLight);
    
    directionalLight = new THREE.DirectionalLight(0xffe8cc, 1.35);
    directionalLight.position.set(60, 140, 80);
    directionalLight.castShadow = false;
    directionalLight.updateMatrixWorld(true);
    scene.add(directionalLight);

    var textureLoader = new THREE.TextureLoader(manager);
    textureLoader.load("imagenes/cielo.jpg", function (texture) {
        if (THREE.sRGBEncoding) {
            texture.encoding = THREE.sRGBEncoding;
        }
        texture.anisotropy = 1;
        texturasCieloCache["imagenes/cielo.jpg"] = texture;
        scene.background = texture;
    });
    
    var cargar = new THREE.GLTFLoader(manager);
    
    var etiquetasContainer = document.getElementById('etiquetas-container');
    if (etiquetasContainer) {
        marcadores.forEach(function(marcador) {
            var div = document.createElement('div');
            div.className = 'etiqueta-3d';
            div.style.left = '0px';
            div.style.top = '0px';
            div.style.willChange = 'transform';
            div.innerText = marcador.texto;
            div.onclick = function() {
                window.abrirMonumentoInstantaneo(marcador.enlace);
            };
            etiquetasContainer.appendChild(div);
            marcador.elemento = div;
        });
    }

    construirEstacionesYCamino();
    
    // ====================================================
    // 1. CARGAR PISO.GLB
    // ====================================================
    cargar.load("assets/piso.glb", function(gltf) {
        plaza = gltf.scene;
        plaza.position.set(0, 0, 0);
        plaza.scale.set(5, 5, 5);
        scene.add(plaza);
        plaza.updateMatrixWorld(true);

        var plazaBox = new THREE.Box3().setFromObject(plaza);
        if (!plazaBox.isEmpty()) {
            CONFIG_PLAYER.bounds.minX = plazaBox.min.x + 2.0;
            CONFIG_PLAYER.bounds.maxX = plazaBox.max.x - 2.0;
            CONFIG_PLAYER.bounds.minZ = plazaBox.min.z + 2.0;
            CONFIG_PLAYER.bounds.maxZ = plazaBox.max.z - 2.0;
        }

        plaza.traverse(function(obj) {
            if (obj && obj.isMesh && obj.geometry) {
                obj.castShadow = false;
                obj.receiveShadow = false;
                mejorarCalidadMaterial(obj.material);
                obj.matrixAutoUpdate = false;
                obj.updateMatrix();
                prepararEsferaColisionMundial(obj);
                collisionMeshes.push(obj);

                var box = new THREE.Box3().setFromObject(obj);
                var size = box.getSize(new THREE.Vector3());

                if (size.y > 16.0 && (size.x < 8.0 || size.z < 8.0)) {
                    wallMeshes.push(obj);
                    cameraBlockMeshes.push(obj);
                } else {
                    floorMeshes.push(obj);
                }
            }
        });
        congelarObjetoEstatico(plaza);
    }, undefined, function(error) {
        console.log("Error cargando piso.glb:", error);
    });

    // ====================================================
    // 1.B PRE-CARGAR MODELO BASE DEL MINERO (SIN SOMBRA)
    // ====================================================
    cargar.load("assets/personaje.glb", function(gltf) {
        aplicarGltfAlPersonaje(gltf, 'minero');
        characterGroup.visible = false;
    }, undefined, function(err) {
        console.error("⚠️ Error al cargar assets/personaje.glb:", err);
    });

    function cargarModeloSeguro(url, callbackExito) {
        cargar.load(url, function(gltf) {
            gltf.scene.traverse(function(c) {
                if (c && c.isMesh) {
                    c.castShadow = false;
                    c.receiveShadow = false;
                    mejorarCalidadMaterial(c.material);
                }
            });
            callbackExito(gltf.scene);
        }, undefined, function(error) {
            console.log("Error en modelo: " + url, error);
        });
    }

    // ====================================================
    // 2. MONUMENTOS Y PEDESTALES
    // ====================================================
    cargarModeloSeguro("assets/Pedestalirineo.glb", function(est1) { 
        est1.scale.set(3.5, 3.5, 3.5); est1.position.set(-73, 3.5, 22); scene.add(est1); 
        registrarParaColision(est1, true);
        agregarObstaculoCircular(-73, 22, 2.4);
    });
    cargarModeloSeguro("assets/Pedestalfederico.glb", function(est2) { 
        est2.scale.set(3.5, 3.5, 3.5); est2.position.set(-73, 3.3, 11); scene.add(est2); 
        registrarParaColision(est2, true);
        agregarObstaculoCircular(-73, 11, 2.4);
    });
    cargarModeloSeguro("assets/Pedestalescobar.glb", function(est3) { 
        est3.scale.set(3.5, 3.5, 3.5); est3.position.set(-74, 3.5, -38); scene.add(est3); 
        registrarParaColision(est3, true);
        agregarObstaculoCircular(-74, -38, 2.4);
    });
    cargarModeloSeguro("assets/Palliri.glb", function(est4) { 
        est4.scale.set(4, 4, 4); est4.position.set(-78, 11, -74); est4.rotation.set(0, Math.PI / 2, 0); scene.add(est4); 
        registrarParaColision(est4, true);
        agregarObstaculoCircular(-78, -74, 3.0);
    });
    cargarModeloSeguro("assets/completomina.glb", function(est6) { 
        est6.scale.set(10, 10, 10); est6.position.set(-111.5, 19, -13); est6.rotation.set(0, Math.PI / 2, 0); scene.add(est6); 
        registrarParaColision(est6, true);
        agregarObstaculoCircular(-111.5, -13, 5.8);
    });
    
    // ====================================================
    // 3. POSTES DE ALUMBRADO
    // ====================================================
    cargarModeloSeguro("assets/poste.glb", function(modeloBase) {
        modeloBase.scale.set(8.5, 8.5, 8.5);
        var geometriaEsfera = new THREE.SphereGeometry(0.85, 6, 6);
        var materialEsfera = new THREE.MeshBasicMaterial({ color: 0xfffae6 });

        function crearPosteConLuz(x, y, z) {
            var posteClonado = modeloBase.clone();
            var bolitaLuz = new THREE.Mesh(geometriaEsfera, materialEsfera);
            bolitaLuz.position.set(0, 18, 0);
            var grupoPoste = new THREE.Group();
            grupoPoste.add(posteClonado);
            grupoPoste.add(bolitaLuz);
            grupoPoste.position.set(x, y, z);
            scene.add(grupoPoste);
            congelarObjetoEstatico(grupoPoste);
            bulbosPostes.push(bolitaLuz);

            registrarParaColision(posteClonado, true);
            agregarObstaculoCircular(x, z, 1.35);
        }

        crearPosteConLuz(-52, 7, 30); crearPosteConLuz(-52, 7, -5); crearPosteConLuz(-52, 7, -35);
        crearPosteConLuz(-52, 7, -65); crearPosteConLuz(-52, 7, -95); crearPosteConLuz(-25, 1.4, 79);
        crearPosteConLuz(-89.5, 7, -93.5); crearPosteConLuz(-89, 7, -117); crearPosteConLuz(-52, 7, -120);
        crearPosteConLuz(-130, 7, -150); crearPosteConLuz(-135, 7, -103); crearPosteConLuz(-52, 7, -150);
    });

    // ====================================================
    // 4. BANCAS VERDES
    // ====================================================
    cargarModeloSeguro("assets/bancaverde.glb", function(modeloBanca) {
        modeloBanca.scale.set(11, 11, 10);
        var obj7 = modeloBanca.clone(); obj7.position.set(-77.5, 8, -60); scene.add(obj7); registrarParaColision(obj7, true); agregarObstaculoCircular(-77.5, -60, 2.3);
        var obj8 = modeloBanca.clone(); obj8.position.set(-77.5, 8, -88.5); obj8.rotation.y += Math.PI; scene.add(obj8); registrarParaColision(obj8, true); agregarObstaculoCircular(-77.5, -88.5, 2.3);
        var obj9 = modeloBanca.clone(); obj9.position.set(-68, 8, -75.5); obj9.rotation.set(0, Math.PI / 2, 0); scene.add(obj9); registrarParaColision(obj9, true); agregarObstaculoCircular(-68, -75.5, 2.3);
        var obj10 = modeloBanca.clone(); obj10.position.set(-111, 8, -60); scene.add(obj10); registrarParaColision(obj10, true); agregarObstaculoCircular(-111, -60, 2.3);
        var obj11 = modeloBanca.clone(); obj11.position.set(-114.5, 8, -88.5); obj11.rotation.y += Math.PI; scene.add(obj11); registrarParaColision(obj11, true); agregarObstaculoCircular(-114.5, -88.5, 2.3);
        var obj12 = modeloBanca.clone(); obj12.position.set(-112, 8, -120); scene.add(obj12); registrarParaColision(obj12, true); agregarObstaculoCircular(-112, -120, 2.3);
        var obj13 = modeloBanca.clone(); obj13.position.set(-112.5, 8, -148); obj13.rotation.y += Math.PI; scene.add(obj13); registrarParaColision(obj13, true); agregarObstaculoCircular(-112.5, -148, 2.3);
        var obj14 = modeloBanca.clone(); obj14.position.set(-77.5, 8, -148); obj14.rotation.y += Math.PI; scene.add(obj14); registrarParaColision(obj14, true); agregarObstaculoCircular(-77.5, -148, 2.3);
        var obj15 = modeloBanca.clone(); obj15.position.set(-77.5, 8, -119); scene.add(obj15); registrarParaColision(obj15, true); agregarObstaculoCircular(-77.5, -119, 2.3);
        var obj16 = modeloBanca.clone(); obj16.position.set(-68, 8, -134.5); obj16.rotation.set(0, Math.PI / 2, 0); scene.add(obj16); registrarParaColision(obj16, true); agregarObstaculoCircular(-68, -134.5, 2.3);
    });

    // ====================================================
    // 4.B ÁRBOLES, PLANTAS, LETRAS Y PILARES
    // ====================================================
    cargarModeloSeguro("assets/arbol.glb", function(modeloArbol) {
        modeloArbol.scale.set(35, 35, 35);
        var obj40 = modeloArbol.clone(); obj40.position.set(-105, 8, 20); scene.add(obj40); congelarObjetoEstatico(obj40); agregarObstaculoCircular(-105, 20, 1.8);
        var obj41 = modeloArbol.clone(); obj41.position.set(-105, 8, -38); scene.add(obj41); congelarObjetoEstatico(obj41); agregarObstaculoCircular(-105, -38, 1.8);
        var obj42 = modeloArbol.clone(); obj42.position.set(-128, 8, -38); scene.add(obj42); congelarObjetoEstatico(obj42); agregarObstaculoCircular(-128, -38, 1.8);
        var obj43 = modeloArbol.clone(); obj43.position.set(-86, 8, -120); scene.add(obj43); congelarObjetoEstatico(obj43); agregarObstaculoCircular(-86, -120, 1.8);
    });

    cargarModeloSeguro("assets/planta.glb", function(modeloPlanta) {
        modeloPlanta.scale.set(6, 7, 6);
        var obj40 = modeloPlanta.clone(); obj40.position.set(-85, 7, -82); scene.add(obj40); congelarObjetoEstatico(obj40); objetosDetalleLejano.push(obj40); agregarObstaculoCircular(-85, -82, 1.4);
        var obj41 = modeloPlanta.clone(); obj41.position.set(-120, 7, -70); scene.add(obj41); congelarObjetoEstatico(obj41); objetosDetalleLejano.push(obj41); agregarObstaculoCircular(-120, -70, 1.4);
        var obj42 = modeloPlanta.clone(); obj42.scale.set(8, 8, 8); obj42.position.set(-123, 7.5, -147); scene.add(obj42); congelarObjetoEstatico(obj42); objetosDetalleLejano.push(obj42); agregarObstaculoCircular(-123, -147, 1.6);
    });

    cargarModeloSeguro("assets/letrasiglo.glb", function(modeloletra) {
        modeloletra.scale.set(24, 24, 24);
        var obj40 = modeloletra.clone(); obj40.position.set(-78, 8, -133); obj40.rotation.set(0, Math.PI / -2, 0); scene.add(obj40);
        registrarParaColision(obj40, true);
        agregarObstaculoCircular(-78, -133, 2.5);
    });
    
    cargarModeloSeguro("assets/pilar.glb", function(modelopilar) {
        modelopilar.scale.set(9, 12, 12);
        var pilar22 = modelopilar.clone(); pilar22.position.set(-105, 10.5, 0.5); pilar22.rotation.y = Math.PI / 2; scene.add(pilar22); registrarParaColision(pilar22, true); agregarObstaculoCircular(-105, 0.5, 1.4);
        var pilar23 = modelopilar.clone(); pilar23.position.set(-116.9, 10.5, 0.5); pilar23.rotation.y = Math.PI / 2; scene.add(pilar23); registrarParaColision(pilar23, true); agregarObstaculoCircular(-116.9, 0.5, 1.4);
        var pilar7 = modelopilar.clone(); pilar7.position.set(-121.5, 10.5, -22); scene.add(pilar7); registrarParaColision(pilar7, true); agregarObstaculoCircular(-121.5, -22, 1.4);
        var pilar17 = modelopilar.clone(); pilar17.position.set(-121.5, 10.5, -13); scene.add(pilar17); registrarParaColision(pilar17, true); agregarObstaculoCircular(-121.5, -13, 1.4);
        var pilar18 = modelopilar.clone(); pilar18.position.set(-121.5, 10.5, -4); scene.add(pilar18); registrarParaColision(pilar18, true); agregarObstaculoCircular(-121.5, -4, 1.4);
        var pilar19 = modelopilar.clone(); pilar19.position.set(-100.5, 10.5, -22); scene.add(pilar19); registrarParaColision(pilar19, true); agregarObstaculoCircular(-100.5, -22, 1.4);
        var pilar20 = modelopilar.clone(); pilar20.position.set(-100.5, 10.5, -13); scene.add(pilar20); registrarParaColision(pilar20, true); agregarObstaculoCircular(-100.5, -13, 1.4);
        var pilar21 = modelopilar.clone(); pilar21.position.set(-100.5, 10.5, -4); scene.add(pilar21); registrarParaColision(pilar21, true); agregarObstaculoCircular(-100.5, -4, 1.4);
    });
    
    // ====================================================
    // 5. SILLAS DE GOMA
    // ====================================================
    cargarModeloSeguro("assets/sillagoma.glb", function(modeloSilla) {
        modeloSilla.scale.set(6, 6.5, 6);
        var obj14 = modeloSilla.clone(); obj14.position.set(-61.5, 7, 23); obj14.rotation.y = Math.PI; scene.add(obj14); registrarParaColision(obj14, true); objetosDetalleLejano.push(obj14); agregarObstaculoCircular(-61.5, 23, 1.5);
        var silla2 = modeloSilla.clone(); silla2.position.set(-61.5, 7, 10); silla2.rotation.y = Math.PI; scene.add(silla2); registrarParaColision(silla2, true); objetosDetalleLejano.push(silla2); agregarObstaculoCircular(-61.5, 10, 1.5);
        var silla3 = modeloSilla.clone(); silla3.position.set(-61.5, 7, -33); silla3.rotation.y = Math.PI; scene.add(silla3); registrarParaColision(silla3, true); objetosDetalleLejano.push(silla3); agregarObstaculoCircular(-61.5, -33, 1.5);
        var silla4 = modeloSilla.clone(); silla4.position.set(-61.5, 7, -42); silla4.rotation.y = Math.PI; scene.add(silla4); registrarParaColision(silla4, true); objetosDetalleLejano.push(silla4); agregarObstaculoCircular(-61.5, -42, 1.5);
        var silla5 = modeloSilla.clone(); silla5.position.set(-61.5, 7, -63); silla5.rotation.y = Math.PI; scene.add(silla5); registrarParaColision(silla5, true); objetosDetalleLejano.push(silla5); agregarObstaculoCircular(-61.5, -63, 1.5);
        var silla6 = modeloSilla.clone(); silla6.position.set(-61.5, 7, -87); silla6.rotation.y = Math.PI; scene.add(silla6); registrarParaColision(silla6, true); objetosDetalleLejano.push(silla6); agregarObstaculoCircular(-61.5, -87, 1.5);
    });

    // ====================================================
    // 6. BARANDAS DE LA PLAZA
    // ====================================================
    cargarModeloSeguro("assets/barandasplaza.glb", function(modeloBaranda) {
        var obj8 = modeloBaranda.clone(); obj8.scale.set(6, 7, 8.5); obj8.position.set(-65, 8.6, 30); obj8.rotation.set(0, Math.PI / 2, 0); scene.add(obj8); registrarParaColision(obj8, true);
        var obj9 = modeloBaranda.clone(); obj9.scale.set(6, 7, 8.5); obj9.position.set(-96.3, 8.6, 30); obj9.rotation.set(0, Math.PI / 2, 0); scene.add(obj9); registrarParaColision(obj9, true);
        var obj10 = modeloBaranda.clone(); obj10.scale.set(6, 7, 7.5); obj10.position.set(-65, 8.6, 30); scene.add(obj10); registrarParaColision(obj10, true);
        var obj11 = modeloBaranda.clone(); obj11.scale.set(6, 7, 6); obj11.position.set(-65, 8.6, 2); obj11.rotation.set(0, Math.PI / 2, 0); scene.add(obj11); registrarParaColision(obj11, true);
        var obj12 = modeloBaranda.clone(); obj12.scale.set(6, 7, 8); obj12.position.set(-87, 8.6, 1); scene.add(obj12); registrarParaColision(obj12, true);
        var obj13 = modeloBaranda.clone(); obj13.scale.set(6, 7, 6); obj13.position.set(-65, 8.6, -29.5); obj13.rotation.set(0, Math.PI / 2, 0); scene.add(obj13); registrarParaColision(obj13, true);
        var obj15 = modeloBaranda.clone(); obj15.scale.set(6, 7, 8.5); obj15.position.set(-65, 8.6, -45); obj15.rotation.set(0, Math.PI / 2, 0); scene.add(obj15); registrarParaColision(obj15, true);
        var obj16 = modeloBaranda.clone(); obj16.scale.set(6, 7, 8.5); obj16.position.set(-96.3, 8.6, -45); obj16.rotation.set(0, Math.PI / 2, 0); scene.add(obj16); registrarParaColision(obj16, true);
        var obj17 = modeloBaranda.clone(); obj17.scale.set(6, 7, 4.2); obj17.position.set(-65, 8.6, -29.5); scene.add(obj17); registrarParaColision(obj17, true);
        var obj18 = modeloBaranda.clone(); obj18.scale.set(6, 5.5, 1.3); obj18.position.set(-87, 8.6, -117.5); obj18.rotation.set(0, Math.PI / 5, 0); scene.add(obj18); registrarParaColision(obj18, true);
        var obj19 = modeloBaranda.clone(); obj19.scale.set(3, 9.5, 6); obj19.position.set(-127.5, 8.6, 30); obj19.rotation.set(0, Math.PI / 2, 0); scene.add(obj19); registrarParaColision(obj19, true);
        var obj20 = modeloBaranda.clone(); obj20.scale.set(3, 9.5, 6); obj20.position.set(-127.5, 8.6, -45); obj20.rotation.set(0, Math.PI / 2, 0); scene.add(obj20); registrarParaColision(obj20, true);
        var obj21 = modeloBaranda.clone(); obj21.scale.set(6, 7, 7.5); obj21.position.set(-150, 13, 30); scene.add(obj21); registrarParaColision(obj21, true);
        var obj22 = modeloBaranda.clone(); obj22.scale.set(6, 7, 7.5); obj22.position.set(-150, 13, 2); scene.add(obj22); registrarParaColision(obj22, true);
        var obj103 = modeloBaranda.clone(); obj103.scale.set(6, 7, 5); obj103.position.set(-150, 13, -26); scene.add(obj103); registrarParaColision(obj103, true);

        var grupoBarandas = new THREE.Group();
        var obj30 = modeloBaranda.clone(); obj30.scale.set(6, 5.5, 1.6); obj30.position.set(-65, 8.6, -57); obj30.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj30);
        var obj31 = modeloBaranda.clone(); obj31.scale.set(6, 5.5, 1.5); obj31.position.set(-71, 8.6, -57); grupoBarandas.add(obj31);
        var obj32 = modeloBaranda.clone(); obj32.scale.set(6, 5.5, 3.3); obj32.position.set(-65, 8.6, -57); grupoBarandas.add(obj32);
        var obj33 = modeloBaranda.clone(); obj33.scale.set(6, 5.5, 3.5); obj33.position.set(-71, 8.6, -63); obj33.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj33);
        var obj34 = modeloBaranda.clone(); obj34.scale.set(6, 5.5, 1.5); obj34.position.set(-84, 8.6, -57); grupoBarandas.add(obj34);
        var obj35 = modeloBaranda.clone(); obj35.scale.set(6, 5.5, 3.5); obj35.position.set(-71, 8.6, -86); obj35.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj35);
        var obj36 = modeloBaranda.clone(); obj36.scale.set(6, 5.5, 1.5); obj36.position.set(-84, 8.6, -86); grupoBarandas.add(obj36);
        var obj37 = modeloBaranda.clone(); obj37.scale.set(6, 5.5, 1.6); obj37.position.set(-65, 8.6, -91); obj37.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj37);
        var obj38 = modeloBaranda.clone(); obj38.scale.set(6, 5.5, 1.5); obj38.position.set(-71, 8.6, -86); grupoBarandas.add(obj38);
        var obj39 = modeloBaranda.clone(); obj39.scale.set(6, 5.5, 9); obj39.position.set(-87, 8.6, -57); obj39.rotation.set(0, -Math.PI / -30, 0); grupoBarandas.add(obj39);
        var obj40 = modeloBaranda.clone(); obj40.scale.set(6, 5.5, 1.5); obj40.position.set(-65, 8.6, -69); obj40.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj40);
        var obj41 = modeloBaranda.clone(); obj41.scale.set(6, 5.5, 1.5); obj41.position.set(-65, 8.6, -82); obj41.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj41);
        var obj42 = modeloBaranda.clone(); obj42.scale.set(6, 5.5, 3.5); obj42.position.set(-71, 8.6, -69); grupoBarandas.add(obj42);
        var obj43 = modeloBaranda.clone(); obj43.scale.set(6, 5.5, 2.5); obj43.position.set(-65, 8.6, -82); grupoBarandas.add(obj43);
        var obj44 = modeloBaranda.clone(); obj44.scale.set(6, 5.5, 1.8); obj44.position.set(-84, 8.6, -91); obj44.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj44);
        var obj45 = modeloBaranda.clone(); obj45.scale.set(6, 5.5, 0.8); obj45.position.set(-84, 8.6, -57); obj45.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj45);
        var obj46 = modeloBaranda.clone(); obj46.scale.set(6, 5.5, 9); obj46.position.set(-97, 8.6, -57); obj46.rotation.set(0, -Math.PI / -30, 0); grupoBarandas.add(obj46);
        var obj47 = modeloBaranda.clone(); obj47.scale.set(6, 5.5, 1.8); obj47.position.set(-97.5, 8.6, -57); obj47.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj47);
        var obj48 = modeloBaranda.clone(); obj48.scale.set(6, 5.5, 1.5); obj48.position.set(-104.5, 8.6, -57); grupoBarandas.add(obj48);
        var obj49 = modeloBaranda.clone(); obj49.scale.set(6, 5.5, 1.5); obj49.position.set(-117.5, 8.6, -57); grupoBarandas.add(obj49);
        var obj50 = modeloBaranda.clone(); obj50.scale.set(6, 5.5, 3.5); obj50.position.set(-104.5, 8.6, -63); obj50.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj50);
        var obj51 = modeloBaranda.clone(); obj51.scale.set(6, 5.5, 1.8); obj51.position.set(-117.5, 8.6, -57); obj51.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj51);
        var obj52 = modeloBaranda.clone(); obj52.scale.set(6, 5.5, 9); obj52.position.set(-124, 8.6, -57); obj52.rotation.set(0, -Math.PI / -30, 0); grupoBarandas.add(obj52);
        var obj53 = modeloBaranda.clone(); obj53.scale.set(6, 5.5, 3.5); obj53.position.set(-108, 8.6, -85); obj53.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj53);
        var obj54 = modeloBaranda.clone(); obj54.scale.set(6, 5.5, 1.8); obj54.position.set(-121, 8.6, -90.5); obj54.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj54);
        var obj55 = modeloBaranda.clone(); obj55.scale.set(6, 5.5, 1.5); obj55.position.set(-121, 8.6, -85); grupoBarandas.add(obj55);
        var obj56 = modeloBaranda.clone(); obj56.scale.set(6, 5.5, 1.5); obj56.position.set(-108, 8.6, -85); grupoBarandas.add(obj56);
        var obj57 = modeloBaranda.clone(); obj57.scale.set(6, 5.5, 1.8); obj57.position.set(-101, 8.6, -90.5); obj57.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj57);

        var grupoBarandasCopia1 = grupoBarandas.clone();
        grupoBarandasCopia1.position.set(0, 0, -60);

        scene.add(grupoBarandas);
        registrarParaColision(grupoBarandas, true);

        scene.add(grupoBarandasCopia1);
        registrarParaColision(grupoBarandasCopia1, true);
    });

    // ====================================================
    // 7. VEGETACIÓN ADICIONAL Y ARBOLITOS
    // ====================================================
    cargarModeloSeguro("assets/planta1.glb", function(modeloplanta1) {
        var obj18 = modeloplanta1.clone(); obj18.scale.set(7, 7, 7); obj18.position.set(-83, 7.5, -70); scene.add(obj18); congelarObjetoEstatico(obj18); objetosDetalleLejano.push(obj18); agregarObstaculoCircular(-83, -70, 1.2);
        var obj19 = modeloplanta1.clone(); obj19.scale.set(7, 7, 7); obj19.position.set(-105, 7.5, -70); scene.add(obj19); congelarObjetoEstatico(obj19); objetosDetalleLejano.push(obj19); agregarObstaculoCircular(-105, -70, 1.2);
        var obj20 = modeloplanta1.clone(); obj20.scale.set(7, 7, 7); obj20.position.set(-83, 7.5, -40); scene.add(obj20); congelarObjetoEstatico(obj20); objetosDetalleLejano.push(obj20); agregarObstaculoCircular(-83, -40, 1.2);
        var obj21 = modeloplanta1.clone(); obj21.scale.set(7, 7, 7); obj21.position.set(-74, 7.5, -134); scene.add(obj21); congelarObjetoEstatico(obj21); objetosDetalleLejano.push(obj21); agregarObstaculoCircular(-74, -134, 1.2);
        var obj22 = modeloplanta1.clone(); obj22.scale.set(7, 7, 7); obj22.position.set(-103, 7.5, -134); scene.add(obj22); congelarObjetoEstatico(obj22); objetosDetalleLejano.push(obj22); agregarObstaculoCircular(-103, -134, 1.2);
        var obj23 = modeloplanta1.clone(); obj23.scale.set(8, 8, 8); obj23.position.set(-121, 7.5, -134); scene.add(obj23); congelarObjetoEstatico(obj23); objetosDetalleLejano.push(obj23); agregarObstaculoCircular(-121, -134, 1.2);
    });

    cargarModeloSeguro("assets/planta3.glb", function(modeloplanta3) {
        var obj18 = modeloplanta3.clone(); obj18.scale.set(7, 7, 7); obj18.position.set(-83, 7.5, -76.5); scene.add(obj18); congelarObjetoEstatico(obj18); objetosDetalleLejano.push(obj18); agregarObstaculoCircular(-83, -76.5, 1.1);
        var obj19 = modeloplanta3.clone(); obj19.scale.set(7, 7, 7); obj19.position.set(-113, 7.5, -70); scene.add(obj19); congelarObjetoEstatico(obj19); objetosDetalleLejano.push(obj19); agregarObstaculoCircular(-113, -70, 1.1);
        var obj20 = modeloplanta3.clone(); obj20.scale.set(7, 7, 7); obj20.position.set(-90, 7.5, -40); scene.add(obj20); congelarObjetoEstatico(obj20); objetosDetalleLejano.push(obj20); agregarObstaculoCircular(-90, -40, 1.1);
        var obj21 = modeloplanta3.clone(); obj21.scale.set(7, 7, 7); obj21.position.set(-68, 7.5, -33); scene.add(obj21); congelarObjetoEstatico(obj21); objetosDetalleLejano.push(obj21); agregarObstaculoCircular(-68, -33, 1.1);
        var obj22 = modeloplanta3.clone(); obj22.scale.set(7, 7, 7); obj22.position.set(-68, 7.5, -42); scene.add(obj22); congelarObjetoEstatico(obj22); objetosDetalleLejano.push(obj22); agregarObstaculoCircular(-68, -42, 1.1);
        var obj23 = modeloplanta3.clone(); obj23.scale.set(7, 7, 7); obj23.position.set(-68, 7.5, 17); scene.add(obj23); congelarObjetoEstatico(obj23); objetosDetalleLejano.push(obj23); agregarObstaculoCircular(-68, 17, 1.1);
        var obj24 = modeloplanta3.clone(); obj24.scale.set(7, 7, 7); obj24.position.set(-68, 7.5, 25); scene.add(obj24); congelarObjetoEstatico(obj24); objetosDetalleLejano.push(obj24); agregarObstaculoCircular(-68, 25, 1.1);
        var obj25 = modeloplanta3.clone(); obj25.scale.set(7, 7, 7); obj25.position.set(-68, 7.5, 7); scene.add(obj25); congelarObjetoEstatico(obj25); objetosDetalleLejano.push(obj25); agregarObstaculoCircular(-68, 7, 1.1);
        var obj26 = modeloplanta3.clone(); obj26.scale.set(7, 7, 7); obj26.position.set(-102, 7.5, -146); scene.add(obj26); congelarObjetoEstatico(obj26); objetosDetalleLejano.push(obj26); agregarObstaculoCircular(-102, -146, 1.1);
        var obj27 = modeloplanta3.clone(); obj27.scale.set(7, 7, 7); obj27.position.set(-68, 7.5, -120); scene.add(obj27); congelarObjetoEstatico(obj27); objetosDetalleLejano.push(obj27); agregarObstaculoCircular(-68, -120, 1.1);
    });

    cargarModeloSeguro("assets/otroarbolito.glb", function(modeloarbolito2) {
        var obj18 = modeloarbolito2.clone(); obj18.scale.set(2, 2, 2); obj18.position.set(-70, 7.5, -63); scene.add(obj18); congelarObjetoEstatico(obj18); objetosDetalleLejano.push(obj18); agregarObstaculoCircular(-70, -63, 1.3);
        var obj19 = modeloarbolito2.clone(); obj19.scale.set(2, 2, 2); obj19.position.set(-100, 7.5, -64); scene.add(obj19); congelarObjetoEstatico(obj19); objetosDetalleLejano.push(obj19); agregarObstaculoCircular(-100, -64, 1.3);
        var obj20 = modeloarbolito2.clone(); obj20.scale.set(4, 4, 4); obj20.position.set(-140, 7.5, -25); scene.add(obj20); congelarObjetoEstatico(obj20); agregarObstaculoCircular(-140, -25, 1.6);
        var obj21 = modeloarbolito2.clone(); obj21.scale.set(2, 2, 2); obj21.position.set(-85, 7.5, 10); scene.add(obj21); congelarObjetoEstatico(obj21); objetosDetalleLejano.push(obj21); agregarObstaculoCircular(-85, 10, 1.3);
        var obj22 = modeloarbolito2.clone(); obj22.scale.set(1.8, 1.8, 1.8); obj22.position.set(-68, 7.5, -124); scene.add(obj22); congelarObjetoEstatico(obj22); objetosDetalleLejano.push(obj22); agregarObstaculoCircular(-68, -124, 1.3);
        var obj23 = modeloarbolito2.clone(); obj23.scale.set(1.8, 1.8, 1.8); obj23.position.set(-103, 7.5, -122); scene.add(obj23); congelarObjetoEstatico(obj23); objetosDetalleLejano.push(obj23); agregarObstaculoCircular(-103, -122, 1.3);
        var obj24 = modeloarbolito2.clone(); obj24.scale.set(4, 4, 4); obj24.position.set(-140, 7.5, 15); scene.add(obj24); congelarObjetoEstatico(obj24); agregarObstaculoCircular(-140, 15, 1.6);
    });

    cargarModeloSeguro("assets/otroarbolito1.glb", function(modeloarbolito3) {
        var obj18 = modeloarbolito3.clone(); obj18.scale.set(0.05, 0.05, 0.05); obj18.position.set(-75, 7.5, -83); scene.add(obj18); congelarObjetoEstatico(obj18); objetosDetalleLejano.push(obj18); agregarObstaculoCircular(-75, -83, 1.3);
        var obj19 = modeloarbolito3.clone(); obj19.scale.set(0.05, 0.05, 0.05); obj19.position.set(-104, 7.5, -78); scene.add(obj19); congelarObjetoEstatico(obj19); objetosDetalleLejano.push(obj19); agregarObstaculoCircular(-104, -78, 1.3);
        var obj20 = modeloarbolito3.clone(); obj20.scale.set(0.05, 0.05, 0.05); obj20.position.set(-140, 7.5, -18); scene.add(obj20); congelarObjetoEstatico(obj20); objetosDetalleLejano.push(obj20); agregarObstaculoCircular(-140, -18, 1.3);
        var obj21 = modeloarbolito3.clone(); obj21.scale.set(0.05, 0.05, 0.05); obj21.position.set(-80, 7.5, 15); scene.add(obj21); congelarObjetoEstatico(obj21); objetosDetalleLejano.push(obj21); agregarObstaculoCircular(-80, 15, 1.3);
        var obj22 = modeloarbolito3.clone(); obj22.scale.set(0.05, 0.05, 0.05); obj22.position.set(-74, 7.5, -128); scene.add(obj22); congelarObjetoEstatico(obj22); objetosDetalleLejano.push(obj22); agregarObstaculoCircular(-74, -128, 1.3);
    });

    cargarModeloSeguro("assets/arbol1.glb", function(modeloarbol1) {
        modeloarbol1.scale.set(600, 600, 600);
        var pilar22 = modeloarbol1.clone(); pilar22.position.set(-103, 5, -82); scene.add(pilar22); congelarObjetoEstatico(pilar22); agregarObstaculoCircular(-103, -82, 1.6);
        var pilar23 = modeloarbol1.clone(); pilar23.position.set(-123, 5, -82); scene.add(pilar23); congelarObjetoEstatico(pilar23); agregarObstaculoCircular(-123, -82, 1.6);
        var pilar24 = modeloarbol1.clone(); pilar24.position.set(-85, 5, -145); scene.add(pilar24); congelarObjetoEstatico(pilar24); agregarObstaculoCircular(-85, -145, 1.6);
        var pilar25 = modeloarbol1.clone(); pilar25.position.set(-121, 5, -120); scene.add(pilar25); congelarObjetoEstatico(pilar25); agregarObstaculoCircular(-121, -120, 1.6);
    });

    // ====================================================
    // 8. ELEMENTOS URBANOS, MACETAS Y BARANDAS DORADAS
    // ====================================================
    cargarModeloSeguro("assets/fuente.glb", function(modelofuente) {
        modelofuente.scale.set(15, 15, 15);
        var pilar22 = modelofuente.clone(); pilar22.position.set(-114, 7, -104); pilar22.rotation.y = Math.PI / 2; scene.add(pilar22);
        registrarParaColision(pilar22, true);
        agregarObstaculoCircular(-114, -104, 4.2);
    });

    cargarModeloSeguro("assets/reloj.glb", function(modeloreloj) {
        modeloreloj.scale.set(19, 19, 19);
        var pilar22 = modeloreloj.clone(); pilar22.position.set(-68, 8, -147); pilar22.rotation.y = Math.PI / 2; scene.add(pilar22);
        registrarParaColision(pilar22, true);
        agregarObstaculoCircular(-68, -147, 2.2);
    });

    cargarModeloSeguro("assets/plantarecta.glb", function(modeloplantarecta) {
        var obj18 = modeloplantarecta.clone(); obj18.scale.set(10, 10, 10); obj18.position.set(-83, 7.5, -135); scene.add(obj18); registrarParaColision(obj18, true);
        var obj19 = modeloplantarecta.clone(); obj19.scale.set(12, 12, 12); obj19.position.set(-112, 7.5, -136); scene.add(obj19); registrarParaColision(obj19, true);
        var obj20 = modeloplantarecta.clone(); obj20.scale.set(13, 13, 13); obj20.position.set(-140, 7.5, -8); scene.add(obj20); registrarParaColision(obj20, true);
        var obj21 = modeloplantarecta.clone(); obj21.scale.set(14, 14, 14); obj21.position.set(-120, 7.5, 19); scene.add(obj21); registrarParaColision(obj21, true);
    });

    cargarModeloSeguro("assets/llantamaseta.glb", function(modelomaseta) {
        var obj18 = modelomaseta.clone(); obj18.scale.set(7, 7, 7); obj18.position.set(-80, 7.5, 23); scene.add(obj18); congelarObjetoEstatico(obj18); objetosDetalleLejano.push(obj18); agregarObstaculoCircular(-80, 23, 1.5);
        var obj19 = modelomaseta.clone(); obj19.scale.set(7, 7, 7); obj19.position.set(-118, 7.5, -40); scene.add(obj19); congelarObjetoEstatico(obj19); objetosDetalleLejano.push(obj19); agregarObstaculoCircular(-118, -40, 1.5);
        var obj20 = modelomaseta.clone(); obj20.scale.set(6, 6, 6); obj20.position.set(-86, 7.5, -33.5); scene.add(obj20); congelarObjetoEstatico(obj20); objetosDetalleLejano.push(obj20); agregarObstaculoCircular(-86, -33.5, 1.4);
    });

    cargarModeloSeguro("assets/otromasetallanta.glb", function(modelomasetaotro) {
        var obj18 = modelomasetaotro.clone(); obj18.scale.set(7, 7, 7); obj18.position.set(-88, 7.5, 20); scene.add(obj18); congelarObjetoEstatico(obj18); objetosDetalleLejano.push(obj18); agregarObstaculoCircular(-88, 20, 1.5);
        var obj19 = modelomasetaotro.clone(); obj19.scale.set(7, 7, 7); obj19.position.set(-138, 7.5, -35); scene.add(obj19); congelarObjetoEstatico(obj19); objetosDetalleLejano.push(obj19); agregarObstaculoCircular(-138, -35, 1.5);
    });

    cargarModeloSeguro("assets/barandadorada.glb", function(modelodorado) {
        modelodorado.scale.set(18, 11, 11);
        [-67, -80, -93, -106, -119, -132, -145].forEach(function(z) {
            var p = modelodorado.clone(); p.position.set(-142, 14, z); p.rotation.y = Math.PI / 2; scene.add(p);
            registrarParaColision(p, true);
        });
    });

    window.addEventListener('resize', onWindowResize, false);
}

// ====================================================
// MOTOR DE CÁMARA PANORÁMICA Y ESCANEO RÁPIDO DE PISO Y MUROS
// ====================================================
function lerpAngle(a, b, t) {
    var diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
}

var _cameraRaycaster = new THREE.Raycaster();
var _cameraLookTarget = new THREE.Vector3();
var _historiaCamPosAnimada = new THREE.Vector3();
var _targetPointTemp = new THREE.Vector3();
var _camDirTemp = new THREE.Vector3();
var _desiredCamPosTemp = new THREE.Vector3();
var _rayDirTemp = new THREE.Vector3();
var _lastSafeCamDist = null;

function placeCharacterAndCamera(elapsedTime) {
    characterGroup.position.x = player.position.x;
    characterGroup.position.z = player.position.z;
    characterGroup.rotation.y = characterFacingYaw + CONFIG_PLAYER.characterYawOffset;
    if (characterGroup.visible) {
        characterGroup.updateMatrixWorld(true);
    }

    if (window.historiaEnCurso && window.camaraHistoriaObjetivo) {
        var t = elapsedTime || 0;
        _historiaCamPosAnimada.copy(window.camaraHistoriaObjetivo.posicion);
        _historiaCamPosAnimada.x += Math.sin(t * 0.45) * 9.0;
        _historiaCamPosAnimada.y += Math.cos(t * 0.35) * 2.5;
        _historiaCamPosAnimada.z += Math.cos(t * 0.45) * 9.0;

        camera.position.lerp(_historiaCamPosAnimada, 0.04);
        _cameraLookTarget.lerp(window.camaraHistoriaObjetivo.objetivo, 0.06);
        camera.lookAt(_cameraLookTarget);
        camera.updateMatrixWorld(true);
        return;
    }

    _targetPointTemp.set(
        player.position.x,
        player.position.y + CONFIG_PLAYER.cameraLookHeight,
        player.position.z
    );

    var horizDist = currentCameraDistance * Math.cos(player.pitch);
    var vertOffset = currentCameraDistance * Math.sin(player.pitch) + (CONFIG_PLAYER.cameraHeight - CONFIG_PLAYER.cameraLookHeight);

    _camDirTemp.set(
        Math.sin(player.yaw) * horizDist,
        vertOffset,
        Math.cos(player.yaw) * horizDist
    );

    _desiredCamPosTemp.copy(_targetPointTemp).add(_camDirTemp);

    if (cameraBlockMeshes.length > 0 && (_frameCounter % 6 === 0 || _lastSafeCamDist !== null)) {
        var maxDist = _camDirTemp.length();
        _rayDirTemp.copy(_camDirTemp).divideScalar(maxDist || 1);
        if (_frameCounter % 6 === 0) {
            _cameraRaycaster.set(_targetPointTemp, _rayDirTemp);
            _cameraRaycaster.near = 0.5;
            _cameraRaycaster.far = maxDist;
            var hits = _cameraRaycaster.intersectObjects(cameraBlockMeshes, false);
            if (hits.length > 0 && hits[0].distance < maxDist) {
                _lastSafeCamDist = Math.max(CONFIG_PLAYER.cameraMinDistance, hits[0].distance - CONFIG_PLAYER.cameraCollisionBuffer);
            } else {
                _lastSafeCamDist = null;
            }
        }
        if (_lastSafeCamDist !== null) {
            _desiredCamPosTemp.copy(_targetPointTemp).addScaledVector(_rayDirTemp, _lastSafeCamDist);
        }
    }

    _desiredCamPosTemp.x = Math.max(CONFIG_PLAYER.bounds.minX - 6, Math.min(CONFIG_PLAYER.bounds.maxX + 6, _desiredCamPosTemp.x));
    _desiredCamPosTemp.z = Math.max(CONFIG_PLAYER.bounds.minZ - 6, Math.min(CONFIG_PLAYER.bounds.maxZ + 6, _desiredCamPosTemp.z));
    if (_desiredCamPosTemp.y < player.position.y + 2.2) {
        _desiredCamPosTemp.y = player.position.y + 2.2;
    }

    camera.position.copy(_desiredCamPosTemp);
    camera.lookAt(_targetPointTemp);
    camera.updateMatrixWorld(true);
}

var _floorRaycaster = new THREE.Raycaster();
var _floorDownVec = new THREE.Vector3(0, -1, 0);
var _rayOriginTemp = new THREE.Vector3();
var _nearbyFloorCandidates = [];
var _nearbyWallCandidates = [];
var _lastFloorSampleX = Infinity;
var _lastFloorSampleZ = Infinity;
var _cachedFloorHeight = CONFIG_PLAYER.baseGroundY;

function getFloorHeightBelow(x, z, currentY, moveDir, forceCheck) {
    var refY = (currentY !== undefined) ? currentY : player.position.y;
    if (floorMeshes.length === 0) return Math.max(CONFIG_PLAYER.minSafetyY, refY);

    var ox = x;
    var oz = z;
    if (moveDir && (Math.abs(moveDir.x) > 0.01 || Math.abs(moveDir.z) > 0.01)) {
        ox += moveDir.x * 0.9;
        oz += moveDir.z * 0.9;
    }

    if (!forceCheck) {
        var dSampleSq = (ox - _lastFloorSampleX) * (ox - _lastFloorSampleX) + (oz - _lastFloorSampleZ) * (oz - _lastFloorSampleZ);
        if (dSampleSq < 0.05) {
            return _cachedFloorHeight;
        }
    }
    _lastFloorSampleX = ox;
    _lastFloorSampleZ = oz;

    _nearbyFloorCandidates.length = 0;
    for (var k = 0; k < floorMeshes.length; k++) {
        var fm = floorMeshes[k];
        var wc = fm.userData.worldCenter;
        var wr = fm.userData.worldRadius;
        if (wc && wr) {
            var dx = ox - wc.x;
            var dz = oz - wc.z;
            if (dx * dx + dz * dz <= (wr + 4.0) * (wr + 4.0)) {
                _nearbyFloorCandidates.push(fm);
            }
        } else {
            _nearbyFloorCandidates.push(fm);
        }
    }

    if (_nearbyFloorCandidates.length === 0) {
        _cachedFloorHeight = Math.max(CONFIG_PLAYER.minSafetyY, refY);
        return _cachedFloorHeight;
    }

    var rayStartY = refY + CONFIG_PLAYER.maxStepUp;
    _rayOriginTemp.set(ox, rayStartY, oz);
    _floorRaycaster.set(_rayOriginTemp, _floorDownVec);
    _floorRaycaster.near = 0;
    _floorRaycaster.far = CONFIG_PLAYER.maxStepUp + CONFIG_PLAYER.maxStepDown + 16.0;
    var hits = _floorRaycaster.intersectObjects(_nearbyFloorCandidates, false);

    var maxReachableY = null;
    for (var i = 0; i < hits.length; i++) {
        var py = hits[i].point.y;
        if (py >= -2.0 && py <= 32.0 && py <= refY + CONFIG_PLAYER.maxStepUp) {
            if (maxReachableY === null || py > maxReachableY) {
                maxReachableY = py;
            }
        }
    }

    if (maxReachableY !== null) {
        _cachedFloorHeight = Math.max(CONFIG_PLAYER.minSafetyY, maxReachableY);
        return _cachedFloorHeight;
    }
    _cachedFloorHeight = Math.max(CONFIG_PLAYER.minSafetyY, refY);
    return _cachedFloorHeight;
}

var _wallRaycaster = new THREE.Raycaster();
var _wallNormal2D = new THREE.Vector3();
var _moveDirNormTemp = new THREE.Vector3();
var _slideVecTemp = new THREE.Vector3();
var _slideDirTemp = new THREE.Vector3();
var _zeroVecTemp = new THREE.Vector3(0, 0, 0);

function raycastWalls(feetPos, dir, distance) {
    if (wallMeshes.length === 0 || distance <= 0.0001) return null;

    _nearbyWallCandidates.length = 0;
    var maxRange = distance + 4.0;
    for (var i = 0; i < wallMeshes.length; i++) {
        var wm = wallMeshes[i];
        var wc = wm.userData.worldCenter;
        var wr = wm.userData.worldRadius;
        if (wc && wr) {
            var dx = feetPos.x - wc.x;
            var dz = feetPos.z - wc.z;
            var rSum = wr + maxRange;
            if (dx * dx + dz * dz <= rSum * rSum) {
                _nearbyWallCandidates.push(wm);
            }
        } else {
            _nearbyWallCandidates.push(wm);
        }
    }

    if (_nearbyWallCandidates.length === 0) return null;

    _rayOriginTemp.set(feetPos.x, feetPos.y + 2.4, feetPos.z);
    _wallRaycaster.set(_rayOriginTemp, dir);
    _wallRaycaster.near = 0;
    _wallRaycaster.far = distance;
    var hits = _wallRaycaster.intersectObjects(_nearbyWallCandidates, false);
    var closest = null;
    for (var j = 0; j < hits.length; j++) {
        var h = hits[j];
        if (h.face && Math.abs(h.face.normal.y) > 0.45) continue;
        if (!closest || h.distance < closest.distance) {
            closest = h;
        }
    }
    return closest;
}

function resolverObstaculosCirculares(pos) {
    for (var i = 0; i < circleObstacles.length; i++) {
        var obs = circleObstacles[i];
        var dx = pos.x - obs.x;
        var dz = pos.z - obs.z;
        var distSq = dx * dx + dz * dz;
        if (distSq < obs.r * obs.r && distSq > 0.00001) {
            var dist = Math.sqrt(distSq);
            var empuje = obs.r - dist;
            pos.x += (dx / dist) * empuje;
            pos.z += (dz / dist) * empuje;
        }
    }
}

function tryMoveHorizontal(feetPos, moveVec) {
    var distance = Math.hypot(moveVec.x, moveVec.z);
    if (distance < 0.0001) return moveVec;

    _moveDirNormTemp.set(moveVec.x / distance, 0, moveVec.z / distance);
    var checkDist = distance + CONFIG_PLAYER.wallCollisionBuffer;
    var hit = raycastWalls(feetPos, _moveDirNormTemp, checkDist);

    if (!hit || hit.distance >= distance + CONFIG_PLAYER.wallCollisionBuffer * 0.5) {
        return moveVec;
    }

    if (hit.face) {
        _wallNormal2D.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
        _wallNormal2D.y = 0;
        if (_wallNormal2D.lengthSq() >= 0.0001) {
            _wallNormal2D.normalize();
            var dot = moveVec.x * _wallNormal2D.x + moveVec.z * _wallNormal2D.z;
            _slideVecTemp.set(
                moveVec.x - _wallNormal2D.x * dot,
                0,
                moveVec.z - _wallNormal2D.z * dot
            );
            var slideDist = Math.hypot(_slideVecTemp.x, _slideVecTemp.z);
            if (slideDist >= 0.0001) {
                _slideDirTemp.set(_slideVecTemp.x / slideDist, 0, _slideVecTemp.z / slideDist);
                var slideHit = raycastWalls(feetPos, _slideDirTemp, slideDist + CONFIG_PLAYER.wallCollisionBuffer * 0.8);
                if (!slideHit || slideHit.distance >= slideDist + CONFIG_PLAYER.wallCollisionBuffer * 0.4) {
                    return _slideVecTemp;
                }
            }
        }
    }
    _zeroVecTemp.set(0, 0, 0);
    return _zeroVecTemp;
}

// ====================================================
// DETECCIÓN DE PUNTOS DE HISTORIA, PUNTOS DE VIDEO Y MONUMENTOS
// ====================================================
function verificarZonasDeHistoriaYMonumentos(time) {
    if (tourActivo || monumentoModalActivo || seleccionPersonajeActiva || videoModalActivo) return;

    var px = player.position.x;
    var pz = player.position.z;
    var estacionRepetible = null;
    var videoCercanoIndex = null;
    var siguienteNoVisitada = null;

    if (window.ESTACIONES_HISTORIA) {
        for (var i = 0; i < storyRings.length; i++) {
            var item = storyRings[i];
            var est = window.ESTACIONES_HISTORIA[item.estacionIndex];

            if (!est.visitado && !siguienteNoVisitada) {
                siguienteNoVisitada = est;
            }

            var dist = Math.hypot(est.zona.x - px, est.zona.z - pz);
            var dentro = dist <= CONFIG_PLAYER.triggerRadius;

            if (dentro && !item.dentroAhora) {
                item.dentroAhora = true;
                if (!est.visitado && !window.historiaEnCurso) {
                    window.abrirCapituloZona(item.estacionIndex, false);
                }
            } else if (!dentro && item.dentroAhora) {
                item.dentroAhora = false;
            }

            if (dentro && est.visitado) {
                estacionRepetible = item.estacionIndex;
            }
        }
    }

    if (window.ESTACIONES_VIDEOS) {
        for (var v = 0; v < videoRings.length; v++) {
            var vItem = videoRings[v];
            var ev = window.ESTACIONES_VIDEOS[vItem.videoIndex];
            var dVid = Math.hypot(ev.zona.x - px, ev.zona.z - pz);
            var dentroVid = dVid <= CONFIG_PLAYER.triggerRadius;

            if (dentroVid && !vItem.dentroAhora) {
                vItem.dentroAhora = true;
                if (!ev.visitado && !window.historiaEnCurso && !videoModalActivo) {
                    window.abrirVideoPunto(vItem.videoIndex);
                }
            } else if (!dentroVid && vItem.dentroAhora) {
                vItem.dentroAhora = false;
            }

            if (dentroVid) {
                videoCercanoIndex = vItem.videoIndex;
            }
        }
    }

    if (guideArrowMesh) {
        var objetivoX = null;
        var objetivoZ = null;
        if (monumentoGuiaManual) {
            objetivoX = monumentoGuiaManual.pisoPos.x;
            objetivoZ = monumentoGuiaManual.pisoPos.z;
            if (Math.hypot(objetivoX - px, objetivoZ - pz) < 12.0) {
                monumentoGuiaManual = null;
            }
        } else if (siguienteNoVisitada) {
            objetivoX = siguienteNoVisitada.zona.x;
            objetivoZ = siguienteNoVisitada.zona.z;
        }

        if (objetivoX !== null && !window.historiaEnCurso && !tourActivo && !seleccionPersonajeActiva) {
            guideArrowMesh.visible = true;
            var anguloHaciaDestino = Math.atan2(objetivoX - px, objetivoZ - pz);
            guideArrowMesh.position.set(
                px + Math.sin(anguloHaciaDestino) * 3.5,
                player.position.y + 0.5 + Math.sin(time * 4) * 0.12,
                pz + Math.cos(anguloHaciaDestino) * 3.5
            );
            guideArrowMesh.rotation.y = anguloHaciaDestino;
            guideArrowMesh.updateMatrixWorld(true);
        } else {
            guideArrowMesh.visible = false;
        }
    }

    monumentoCercanoActual = null;
    var menorDistMon = Infinity;
    for (var mIdx = 0; mIdx < marcadores.length; mIdx++) {
        var m = marcadores[mIdx];
        var radioMonumento = m.radio || CONFIG_PLAYER.monumentRadius;
        var d = Math.hypot(m.pisoPos.x - px, m.pisoPos.z - pz);
        if (d <= radioMonumento && d < menorDistMon) {
            menorDistMon = d;
            monumentoCercanoActual = m;
        }
    }

    if (hudPromptEl) {
        delete hudPromptEl.dataset.repeatIndex;
        delete hudPromptEl.dataset.videoIndex;

        if (window.historiaEnCurso || tourActivo || monumentoModalActivo || seleccionPersonajeActiva || videoModalActivo) {
            hudPromptEl.style.display = 'none';
        } else if (videoCercanoIndex !== null) {
            var evPrompt = window.ESTACIONES_VIDEOS[videoCercanoIndex];
            hudPromptEl.style.display = 'block';
            hudPromptEl.innerHTML = '🎬 Presiona <kbd style="background:#22c55e;color:#000;padding:2px 8px;border-radius:6px;">V</kbd> o <kbd style="background:#facc15;color:#000;padding:2px 8px;border-radius:6px;">F</kbd> para ver Video: <b>[' + evPrompt.numero + '] ' + evPrompt.titulo + '</b>';
            hudPromptEl.dataset.videoIndex = videoCercanoIndex;
        } else if (monumentoCercanoActual) {
            hudPromptEl.style.display = 'block';
            hudPromptEl.innerHTML = '🏛️ Presiona <kbd style="background:#22c55e;color:#000;padding:2px 8px;border-radius:6px;">F</kbd> para explorar: <b>' + monumentoCercanoActual.texto + '</b>';
        } else if (estacionRepetible !== null) {
            var estRep = window.ESTACIONES_HISTORIA[estacionRepetible];
            hudPromptEl.style.display = 'block';
            hudPromptEl.innerHTML = '📜 Presiona <kbd style="background:#facc15;color:#000;padding:2px 8px;border-radius:6px;">F</kbd> para volver a leer: <b>[' + estRep.numero + '] ' + estRep.titulo.split('(')[0] + '</b>';
            hudPromptEl.dataset.repeatIndex = estacionRepetible;
        } else {
            hudPromptEl.style.display = 'none';
        }
    }

    window.actualizarHUDProgreso();
}

var _tourPosTemp = new THREE.Vector3();
var _tourLookTemp = new THREE.Vector3();

function actualizarTourAereo(delta) {
    if (!tourCurves) {
        tourCurves = construirCurvasTourPlaza();
    }

    var pantallaBienvenida = document.getElementById('pantalla-bienvenida');
    var splashVisible = pantallaBienvenida && window.getComputedStyle(pantallaBienvenida).display !== 'none';

    tourElapsed += delta;

    if (splashVisible && tourElapsed >= CONFIG_PLAYER.tourDuration * 0.85) {
        tourElapsed = 0;
    }

    var rawT = Math.min(tourElapsed / CONFIG_PLAYER.tourDuration, 1.0);
    var t = rawT < 0.5 ? 2 * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 2) / 2;

    tourCurves.positions.getPoint(t, _tourPosTemp);
    tourCurves.looks.getPoint(t, _tourLookTemp);

    camera.position.copy(_tourPosTemp);
    camera.lookAt(_tourLookTemp);
    camera.updateMatrixWorld(true);

    var pct = Math.round(rawT * 100);
    if (tourBarEl && pct !== _ultimoPorcentajeTour) {
        _ultimoPorcentajeTour = pct;
        tourBarEl.style.width = pct + '%';
    }

    if (tourLabelEl) {
        var nuevoTxt = '';
        if (rawT < 0.22) nuevoTxt = '✈️ Sobrevuelo: Ingreso y Monumentos Sindicales...';
        else if (rawT < 0.45) nuevoTxt = '✈️ Sobrevuelo: Monumento al Minero de Siglo XX...';
        else if (rawT < 0.70) nuevoTxt = '✈️ Sobrevuelo: Monumento a las Palliris y Jardines...';
        else if (rawT < 0.88) nuevoTxt = '✈️ Sobrevuelo: Fuente, Reloj y Letras Siglo XX...';
        else nuevoTxt = '👷 Llegando al punto de inicio para elegir tu personaje...';

        if (nuevoTxt !== _ultimoTextoTour) {
            _ultimoTextoTour = nuevoTxt;
            tourLabelEl.innerText = nuevoTxt;
        }
    }

    if (!splashVisible && rawT >= 1.0) {
        window.terminarTourPlaza();
    }
}

var _forwardTemp = new THREE.Vector3();
var _rightTemp = new THREE.Vector3();
var _moveDirTemp = new THREE.Vector3();
var _desiredMoveTemp = new THREE.Vector3();

function updatePlayer(delta, elapsedTime) {
    if (tourActivo) {
        detenerSonidoPasos();
        actualizarTourAereo(delta);
        return;
    }

    if (window.historiaEnCurso || monumentoModalActivo || seleccionPersonajeActiva || videoModalActivo) {
        player.velocity.set(0, 0, 0);
        detenerSonidoPasos();
        actualizarAnimacionMinero(delta, false, false);
        placeCharacterAndCamera(elapsedTime);
        return;
    }

    if (keys['KeyE']) player.yaw -= 1.8 * delta;
    if (keys['KeyQ']) player.yaw += 1.8 * delta;

    _forwardTemp.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    _rightTemp.set(-_forwardTemp.z, 0, _forwardTemp.x);
    _moveDirTemp.set(0, 0, 0);

    if (keys['KeyW'] || keys['ArrowUp']) _moveDirTemp.add(_forwardTemp);
    if (keys['KeyS'] || keys['ArrowDown']) _moveDirTemp.sub(_forwardTemp);
    if (keys['KeyA'] || keys['ArrowLeft']) _moveDirTemp.sub(_rightTemp);
    if (keys['KeyD'] || keys['ArrowRight']) _moveDirTemp.add(_rightTemp);

    var isWalking = _moveDirTemp.lengthSq() > 0;
    if (isWalking) _moveDirTemp.normalize();

    var isRunning = keys['ShiftLeft'] || keys['ShiftRight'];
    var speed = isRunning ? CONFIG_PLAYER.runSpeed : CONFIG_PLAYER.moveSpeed;

    actualizarSonidoPasosJugador(isWalking, isRunning, delta);

    var targetVelX = _moveDirTemp.x * speed;
    var targetVelZ = _moveDirTemp.z * speed;
    var accel = CONFIG_PLAYER.acceleration;
    player.velocity.x += (targetVelX - player.velocity.x) * Math.min(1, accel * delta);
    player.velocity.z += (targetVelZ - player.velocity.z) * Math.min(1, accel * delta);

    if (!isWalking && Math.abs(player.velocity.x) < 0.01 && Math.abs(player.velocity.z) < 0.01) {
        player.velocity.x = 0;
        player.velocity.z = 0;
    }

    _desiredMoveTemp.set(player.velocity.x * delta, 0, player.velocity.z * delta);
    if (_desiredMoveTemp.lengthSq() > 0.000001) {
        var allowedMove = tryMoveHorizontal(player.position, _desiredMoveTemp);

        player.position.x += allowedMove.x;
        player.position.z += allowedMove.z;

        resolverObstaculosCirculares(player.position);

        player.position.x = Math.max(CONFIG_PLAYER.bounds.minX, Math.min(CONFIG_PLAYER.bounds.maxX, player.position.x));
        player.position.z = Math.max(CONFIG_PLAYER.bounds.minZ, Math.min(CONFIG_PLAYER.bounds.maxZ, player.position.z));

        var targetFloorY = getFloorHeightBelow(player.position.x, player.position.z, player.position.y, _moveDirTemp, false);
        if (targetFloorY > player.position.y) {
            player.position.y += (targetFloorY - player.position.y) * Math.min(1, CONFIG_PLAYER.floorUpSpeed * delta);
        } else {
            player.position.y += (targetFloorY - player.position.y) * Math.min(1, CONFIG_PLAYER.floorDownSpeed * delta);
        }
        if (player.position.y < CONFIG_PLAYER.minSafetyY) {
            player.position.y = CONFIG_PLAYER.minSafetyY;
        }
    }

    if (isWalking) {
        var targetYaw = Math.atan2(-_moveDirTemp.x, -_moveDirTemp.z);
        characterFacingYaw = lerpAngle(characterFacingYaw, targetYaw, Math.min(1, CONFIG_PLAYER.characterTurnSpeed * delta));
    }

    actualizarAnimacionMinero(delta, isWalking, isRunning);
    placeCharacterAndCamera(elapsedTime);
}

function actualizarCullingObjetosPequenos() {
    if (!camera || objetosDetalleLejano.length === 0) return;
    var camX = camera.position.x;
    var camZ = camera.position.z;
    var maxDistSq = tourActivo ? (95 * 95) : (125 * 125);

    for (var i = 0; i < objetosDetalleLejano.length; i++) {
        var obj = objetosDetalleLejano[i];
        var dx = obj.position.x - camX;
        var dz = obj.position.z - camZ;
        obj.visible = (dx * dx + dz * dz) <= maxDistSq;
    }
}

// ====================================================
// EVENTOS DE TECLADO (INCLUYE TECLA G = SIRENA, TECLA V = VIDEO)
// ====================================================
document.addEventListener('keydown', function(e) {
    inicializarAudioProcedural();

    if (e.code === 'KeyG' && !e.repeat) {
        e.preventDefault();
        window.alternarSirena();
        return;
    }

    if (videoModalActivo) {
        if (e.code === 'Escape' || e.code === 'KeyV' || e.code === 'KeyF') {
            e.preventDefault();
            window.cerrarVideoPunto();
        }
        return;
    }

    if (monumentoModalActivo) {
        if (e.code === 'Escape') {
            e.preventDefault();
            window.cerrarMonumentoInstantaneo();
        }
        return;
    }

    if (seleccionPersonajeActiva) {
        if (e.code === 'Digit1') window.seleccionarPersonaje('minero');
        if (e.code === 'Digit2') window.seleccionarPersonaje('minera');
        return;
    }

    keys[e.code] = true;

    if (tourActivo && (e.code === 'Escape' || e.code === 'Space')) {
        e.preventDefault();
        window.terminarTourPlaza();
        return;
    }

    if (e.code === 'KeyC' && !e.repeat && !tourActivo && !window.historiaEnCurso) {
        e.preventDefault();
        window.mostrarSelectorPersonaje();
        return;
    }

    if (e.code === 'KeyP' && !e.repeat) {
        e.preventDefault();
        window.tomarFotoPostal();
        return;
    }

    if (e.code === 'KeyT' && !e.repeat && !window.historiaEnCurso) {
        if (tourActivo) window.terminarTourPlaza();
        else window.iniciarTourPlaza(true);
        return;
    }

    if (e.code === 'KeyZ' && !tourActivo) {
        player.position.set(CONFIG_PLAYER.startPosition[0], CONFIG_PLAYER.startPosition[1], CONFIG_PLAYER.startPosition[2]);
        player.velocity.set(0, 0, 0);
        player.yaw = CONFIG_PLAYER.startYaw;
        player.position.y = getFloorHeightBelow(player.position.x, player.position.z, CONFIG_PLAYER.baseGroundY, null, true);
    }

    if (window.historiaEnCurso && (e.code === 'Escape' || e.code === 'KeyF')) {
        window.cerrarVentanaHistoria();
        return;
    }

    if (e.code === 'KeyV' && !e.repeat && !window.historiaEnCurso && !tourActivo) {
        if (hudPromptEl && hudPromptEl.dataset.videoIndex !== undefined) {
            window.abrirVideoPunto(parseInt(hudPromptEl.dataset.videoIndex, 10));
            return;
        }
    }

    if (e.code === 'KeyF' && !e.repeat && !window.historiaEnCurso && !tourActivo) {
        if (hudPromptEl && hudPromptEl.dataset.videoIndex !== undefined) {
            window.abrirVideoPunto(parseInt(hudPromptEl.dataset.videoIndex, 10));
        } else if (monumentoCercanoActual) {
            window.abrirMonumentoInstantaneo(monumentoCercanoActual.enlace);
        } else if (hudPromptEl && hudPromptEl.dataset.repeatIndex !== undefined) {
            window.abrirCapituloZona(parseInt(hudPromptEl.dataset.repeatIndex, 10), false);
        }
    }
});

document.addEventListener('keyup', function(e) {
    keys[e.code] = false;
});

document.addEventListener('mousemove', function(e) {
    if (locked && !window.historiaEnCurso && !tourActivo && !monumentoModalActivo && !seleccionPersonajeActiva && !videoModalActivo) {
        player.yaw -= e.movementX * CONFIG_PLAYER.mouseSensitivity;
        player.pitch += e.movementY * CONFIG_PLAYER.mouseSensitivity;
        player.pitch = Math.max(CONFIG_PLAYER.pitchMin, Math.min(CONFIG_PLAYER.pitchMax, player.pitch));
    }
});

window.addEventListener('wheel', function(e) {
    if (window.historiaEnCurso || tourActivo || monumentoModalActivo || seleccionPersonajeActiva || videoModalActivo) return;
    currentCameraDistance += Math.sign(e.deltaY) * CONFIG_PLAYER.cameraZoomSpeed;
    currentCameraDistance = Math.max(CONFIG_PLAYER.cameraMinDistance, Math.min(CONFIG_PLAYER.cameraMaxDistance, currentCameraDistance));
}, { passive: true });

document.addEventListener('pointerlockchange', function() {
    locked = (document.pointerLockElement === renderer.domElement);
});

window.addEventListener('click', function(e) {
    inicializarAudioProcedural();
    if (monumentoModalActivo || seleccionPersonajeActiva || videoModalActivo) return;
    if (sound && !sound.isPlaying && sound.buffer) {
        sound.play();
    }
    if (renderer && e.target === renderer.domElement && !locked && !window.historiaEnCurso && !tourActivo) {
        renderer.domElement.requestPointerLock();
    }
});

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

var _frameCounter = 0;
var _projVec = new THREE.Vector3();

function animate() {
    requestAnimationFrame(animate);

    if (monumentoModalActivo) {
        return;
    }

    var delta = Math.min(clock.getDelta(), 0.05);
    var elapsedTime = clock.getElapsedTime();
    _frameCounter++;

    if (_frameCounter % 12 === 0) {
        modularVientoAmbiental(elapsedTime);
    }

    if (seleccionPersonajeActiva) {
        renderizarVisoresPreviewPersonajes(delta, elapsedTime);
        return;
    }

    updatePlayer(delta, elapsedTime);

    if (_frameCounter % 6 === 0) {
        actualizarCullingObjetosPequenos();
    }

    if (!tourActivo && _frameCounter % 6 === 0) {
        verificarZonasDeHistoriaYMonumentos(elapsedTime);
        actualizarMinimapaRadar(elapsedTime);
    }

    var stepEtiquetas = tourActivo ? 3 : 2;
    if (_frameCounter % stepEtiquetas === 0 && camera) {
        var winW = window.innerWidth;
        var winH = window.innerHeight;

        for (var i = 0; i < marcadores.length; i++) {
            var marcador = marcadores[i];
            if (marcador.elemento) {
                _projVec.copy(marcador.posicion).project(camera); 
                if (_projVec.z < 1 && !window.historiaEnCurso && !videoModalActivo) { 
                    var x = Math.round((_projVec.x * 0.5 + 0.5) * winW);
                    var y = Math.round((_projVec.y * -0.5 + 0.5) * winH);
                    if (Math.abs(x - marcador._lx) > 1 || Math.abs(y - marcador._ly) > 1) {
                        marcador._lx = x;
                        marcador._ly = y;
                        marcador.elemento.style.transform = 'translate(-50%, -50%) translate3d(' + x + 'px,' + y + 'px, 0)';
                    }
                    if (!marcador._vis) {
                        marcador._vis = true;
                        marcador.elemento.style.display = 'block';
                    }
                } else if (marcador._vis) {
                    marcador._vis = false;
                    marcador.elemento.style.display = 'none'; 
                }
            }
        }

        if (!tourActivo) {
            for (var j = 0; j < storyRings.length; j++) {
                var item = storyRings[j];
                if (item.labelDiv) {
                    if (window.historiaEnCurso || videoModalActivo) {
                        if (item._vis) {
                            item._vis = false;
                            item.labelDiv.style.display = 'none';
                        }
                        continue;
                    }
                    var est = window.ESTACIONES_HISTORIA[item.estacionIndex];
                    _projVec.set(est.zona.x, est.zona.y + 3.0, est.zona.z);
                    var distCamSq = camera.position.distanceToSquared(_projVec);
                    _projVec.project(camera);
                    if (_projVec.z < 1 && distCamSq < 9025) {
                        var sx = Math.round((_projVec.x * 0.5 + 0.5) * winW);
                        var sy = Math.round((_projVec.y * -0.5 + 0.5) * winH);
                        if (Math.abs(sx - item._lx) > 1 || Math.abs(sy - item._ly) > 1) {
                            item._lx = sx;
                            item._ly = sy;
                            item.labelDiv.style.transform = 'translate(-50%, -50%) translate3d(' + sx + 'px,' + sy + 'px, 0)';
                        }
                        if (!item._vis) {
                            item._vis = true;
                            item.labelDiv.style.display = 'block';
                        }
                    } else if (item._vis) {
                        item._vis = false;
                        item.labelDiv.style.display = 'none';
                    }
                }
            }

            for (var vIdx = 0; vIdx < videoRings.length; vIdx++) {
                var vItem = videoRings[vIdx];
                if (vItem.labelDiv) {
                    if (window.historiaEnCurso || videoModalActivo) {
                        if (vItem._vis) {
                            vItem._vis = false;
                            vItem.labelDiv.style.display = 'none';
                        }
                        continue;
                    }
                    var ev = window.ESTACIONES_VIDEOS[vItem.videoIndex];
                    _projVec.set(ev.zona.x, ev.zona.y + 3.2, ev.zona.z);
                    var distVidSq = camera.position.distanceToSquared(_projVec);
                    _projVec.project(camera);
                    if (_projVec.z < 1 && distVidSq < 11000) {
                        var vx = Math.round((_projVec.x * 0.5 + 0.5) * winW);
                        var vy = Math.round((_projVec.y * -0.5 + 0.5) * winH);
                        if (Math.abs(vx - vItem._lx) > 1 || Math.abs(vy - vItem._ly) > 1) {
                            vItem._lx = vx;
                            vItem._ly = vy;
                            vItem.labelDiv.style.transform = 'translate(-50%, -50%) translate3d(' + vx + 'px,' + vy + 'px, 0)';
                        }
                        if (!vItem._vis) {
                            vItem._vis = true;
                            vItem.labelDiv.style.display = 'block';
                        }
                    } else if (vItem._vis) {
                        vItem._vis = false;
                        vItem.labelDiv.style.display = 'none';
                    }
                }
            }
        }
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

window.cambiarAtmosfera = function(modo) {
    var texturaRuta = "";

    if (modo === 'dia') {
        texturaRuta = "imagenes/cielo.jpg";
        directionalLight.color.setHex(0xffe8cc);
        directionalLight.intensity = 1.35;
        hemisphereLight.color.setHex(0xffffff);
        hemisphereLight.groundColor.setHex(0x2d1a0e);
        ambientLight.color.setHex(0xffffff);
        ambientLight.intensity = 0.85;
        if (scene.fog) scene.fog.color.setHex(0xa0c4e0);
        bulbosPostes.forEach(function(b) { if (b.material) b.material.color.setHex(0xfffae6); });
        
    } else if (modo === 'atardecer' || modo === 'tarde') {
        texturaRuta = "imagenes/atardecer.jpg"; 
        directionalLight.color.setHex(0xff7722);
        directionalLight.intensity = 1.05;
        hemisphereLight.color.setHex(0xff9944);
        hemisphereLight.groundColor.setHex(0x3a1e12);
        ambientLight.color.setHex(0xff8844);
        ambientLight.intensity = 0.65;
        if (scene.fog) scene.fog.color.setHex(0xc06030);
        bulbosPostes.forEach(function(b) { if (b.material) b.material.color.setHex(0xffcc55); });
        
    } else if (modo === 'noche' || modo === 'nublado') {
        texturaRuta = "imagenes/noche.png";
        directionalLight.color.setHex(0x88aaee);
        directionalLight.intensity = 0.55;
        hemisphereLight.color.setHex(0x334477);
        hemisphereLight.groundColor.setHex(0x111a2e);
        ambientLight.color.setHex(0x2a3b66);
        ambientLight.intensity = 0.55;
        if (scene.fog) scene.fog.color.setHex(0x0a0a1a);
        bulbosPostes.forEach(function(b) { if (b.material) b.material.color.setHex(0xffe066); });
    } else {
        return;
    }

    if (texturasCieloCache[texturaRuta]) {
        scene.background = texturasCieloCache[texturaRuta];
        return;
    }

    var textureLoader = new THREE.TextureLoader();
    textureLoader.load(texturaRuta, function (texture) {
        if (THREE.sRGBEncoding) {
            texture.encoding = THREE.sRGBEncoding;
        }
        texture.anisotropy = 1;
        texturasCieloCache[texturaRuta] = texture;
        scene.background = texture;
    });
};

document.addEventListener("DOMContentLoaded", function () {
    var btnDia = document.getElementById("btn-dia");
    var btnTarde = document.getElementById("btn-tarde");
    var btnNublado = document.getElementById("btn-nublado");

    function actualizarClaseActiva(botonSeleccionado) {
        [btnDia, btnTarde, btnNublado].forEach(function (btn) {
            if (btn) btn.classList.remove("activo");
        });
        if (botonSeleccionado) botonSeleccionado.classList.add("activo");
    }

    if (btnDia) btnDia.addEventListener("click", function () { actualizarClaseActiva(btnDia); window.cambiarAtmosfera("dia"); });
    if (btnTarde) btnTarde.addEventListener("click", function () { actualizarClaseActiva(btnTarde); window.cambiarAtmosfera("atardecer"); });
    if (btnNublado) btnNublado.addEventListener("click", function () { actualizarClaseActiva(btnNublado); window.cambiarAtmosfera("noche"); });
});

var btnSalir = document.getElementById("btn-salir");
if (btnSalir) {
    btnSalir.addEventListener("click", function () {
        detenerSonidoPasos();
        if (audioSirenaEl) audioSirenaEl.pause();
        sessionStorage.removeItem("historiaCompletada");
        sessionStorage.removeItem("estadoJugadorPlaza");
        sessionStorage.removeItem("personajeElegidoPlaza");
        window.location.href = window.location.pathname + "?inicio=" + Date.now();
    });
}

init();
animate();