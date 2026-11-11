// ====================================================
// MODELO 3D Y ESCENA THREE.JS - PLAZA DEL MINERO (ALTA CALIDAD VISUAL + FLUIDEZ + SIN OUTLINE)
// SUBIDA TOTAL EN GRADAS DE COLORES, ACERA DEL POSTE Y RAMPA AL OTRO LADO
// + MINIMAPA RADAR 2D ROTATORIO (FRENTE SIEMPRE ARRIBA) + MODO POSTAL (TECLA P)
// ====================================================

var scene, camera, renderer, plaza, controles, sound;
var ambientLight, hemisphereLight, directionalLight, directionalLight2;
var lucesPostes = [];
var clock = new THREE.Clock();

var composer, renderPass, filmPass;
var maxAnisotropy = 4;

// ====================================================
// CONFIGURACIÓN CALIBRADA DEL PERSONAJE, CÁMARA Y GRADAS/RAMPAS
// ====================================================
var CONFIG_PLAYER = {
    startPosition: [30, 0, -10], // Punto de inicio
    startYaw: 0.45,
    baseGroundY: 7.2,
    minSafetyY: -2.0,              // Nivel más bajo permitido

    // 👉 TAMAÑO Y AJUSTE DE PIES DEL MINERO:
    alturaDeseadaPersonaje: 9.5,
    characterFootOffset: 0.0,
    characterYawOffset: Math.PI,

    // 👉 CONFIGURACIÓN PARA SUBIR TODAS LAS GRADAS, ACERAS Y RAMPAS:
    maxStepUp: 6.8,                // Sube gradas de colores, acera del poste y rampas sin trabarse
    maxStepDown: 16.0,             // Baja cualquier grada o rampa suavemente
    floorUpSpeed: 28.0,            // Subida rápida para que NUNCA se entierre en la acera ni en las gradas
    floorDownSpeed: 18.0,          // Bajada fluida por escalones y rampas

    // 👉 CÁMARA EN 3ª PERSONA ELEVADA Y ALEJADA
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

    // 👉 DURACIÓN DEL RECORRIDO AÉREO POR TODA LA PLAZA (segundos)
    tourDuration: 22.0,

    // 👉 VELOCIDAD Y COLISIONES
    moveSpeed: 18.0,
    runSpeed: 30.0,
    acceleration: 12.0,
    characterTurnSpeed: 10.0,
    wallCollisionBuffer: 1.15,

    // Radios de activación
    triggerRadius: 5.5,
    monumentRadius: 13.5,

    // Límites amplios (se auto-ajustan a todo el modelo piso.glb al cargar)
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
var tourActivo = true; // Inicia activo para que desde el splash nunca enfoque directo al minero
var tourElapsed = 0;
var tourCurves = null;
var tourOverlayEl = null;
var tourBarEl = null;
var tourLabelEl = null;

// Listas de colisión física
var floorMeshes = [];        // Todas las mallas de piso, gradas de colores, acera del poste y rampas
var wallMeshes = [];         // Solo muros verticales altos, barandas y bancas (NO gradas)
var cameraBlockMeshes = [];  // Fachadas exteriores altas
var collisionMeshes = [];
var circleObstacles = [];    // Obstáculos cilíndricos (postes, árboles, sillas, macetas, pilares, monumentos)

var characterGroup = new THREE.Group();
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
var minimapScale = 0.62; // Escala de metros 3D a píxeles en el radar
var monumentoGuiaManual = null;
var logoPostalImg = new Image();
logoPostalImg.crossOrigin = "anonymous";
logoPostalImg.src = "imagenes/logo.png";

var marcadores = [
    { texto: "Monumento a Irineo Pimentel Rojas", corto: "Irineo", posicion: new THREE.Vector3(-73, 41, 22.5), pisoPos: new THREE.Vector3(-73, 7.2, 22.5), elemento: null, enlace: "irineo.html" },
    { texto: "Monumento a Federico Escobar", corto: "Federico", posicion: new THREE.Vector3(-70, 40, 11.5), pisoPos: new THREE.Vector3(-70, 7.2, 11.5), elemento: null, enlace: "federico.html" },
    { texto: "Monumento a Cesar, Gillermo e Isaac", corto: "Mártires", posicion: new THREE.Vector3(-74, 39, -38), pisoPos: new THREE.Vector3(-74, 7.2, -38), elemento: null, enlace: "cesar.html" },
    { texto: "Monumento a las Palliris", corto: "Palliris", posicion: new THREE.Vector3(-78, 40, -74), pisoPos: new THREE.Vector3(-78, 7.2, -74), elemento: null, enlace: "palliri.html" },
    // 👉 Alcance aumentado a 28.0 metros exclusivamente para el Monumento al Minero
    { texto: "Monumento al Minero", corto: "Minero", posicion: new THREE.Vector3(-111.5, 57, -13), pisoPos: new THREE.Vector3(-111.5, 7.2, -13), elemento: null, enlace: "minero.html", radio: 28.0 }
];

// ====================================================
// MEJORA DE NITIDEZ DE TEXTURAS (FILTRADO ANISOTRÓPICO)
// ====================================================
function mejorarCalidadMaterial(material) {
    if (!material) return;
    var mats = Array.isArray(material) ? material : [material];
    for (var i = 0; i < mats.length; i++) {
        var m = mats[i];
        if (!m) continue;
        if (m.map) m.map.anisotropy = maxAnisotropy;
        if (m.normalMap) m.normalMap.anisotropy = maxAnisotropy;
        if (m.roughnessMap) m.roughnessMap.anisotropy = maxAnisotropy;
        if (m.metalnessMap) m.metalnessMap.anisotropy = maxAnisotropy;
    }
}

// ====================================================
// REGISTRO SEGURO DE COLISIONES
// ====================================================
function registrarParaColision(objeto, esMuro) {
    if (!objeto) return;
    objeto.updateMatrixWorld(true);
    objeto.traverse(function(child) {
        if (child && child.isMesh && child.geometry) {
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

    if (window.historiaEnCurso && typeof window.cerrarVentanaHistoria === 'function') {
        window.cerrarVentanaHistoria();
    }
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }

    tourCurves = construirCurvasTourPlaza();
    tourElapsed = 0;
    tourActivo = true;

    camera.position.copy(tourCurves.positions.getPoint(0));
    camera.lookAt(tourCurves.looks.getPoint(0));

    if (tourOverlayEl) tourOverlayEl.style.display = mostrarUI ? 'flex' : 'none';
    if (hudGuiaEl) hudGuiaEl.style.opacity = '0';
    if (hudPromptEl) hudPromptEl.style.display = 'none';
};

window.terminarTourPlaza = function() {
    tourActivo = false;
    if (tourOverlayEl) tourOverlayEl.style.display = 'none';
    if (hudGuiaEl) hudGuiaEl.style.opacity = '1';
    placeCharacterAndCamera(clock.getElapsedTime());
};

// ====================================================
// 1. MINIMAPA / RADAR 2D INTERACTIVO (ORIENTADO AL FRENTE DEL JUGADOR)
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
        'position:fixed; bottom:78px; left:30px; width:185px; background:rgba(10,16,20,0.88); ' +
        'backdrop-filter:blur(8px); border:1.5px solid rgba(224,176,102,0.55); border-radius:18px; ' +
        'padding:10px; z-index:650; box-shadow:0 8px 28px rgba(0,0,0,0.75); pointer-events:auto; ' +
        'font-family:Montserrat,sans-serif; color:#e0dacf; user-select:none; transition:opacity 0.3s ease;';

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
    leyenda.style.cssText = 'display:flex; justify-content:space-around; font-size:0.62rem; margin-top:7px; color:#cbd5e1; font-weight:600;';
    leyenda.innerHTML =
        '<span><b style="color:#38bdf8;">▲</b> Tú</span>' +
        '<span><b style="color:#f97316;">◆</b> Monum.</span>' +
        '<span><b style="color:#facc15;">●</b> Historia</span>';
    minimapContainerEl.appendChild(leyenda);

    document.body.appendChild(minimapContainerEl);

    minimapCanvas.addEventListener('click', function(e) {
        if (tourActivo || window.historiaEnCurso) return;

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
            var destY = getFloorHeightBelow(destX, destZ, mejorMonumento.pisoPos.y);

            player.position.set(destX, destY, destZ);
            player.velocity.set(0, 0, 0);
            var anguloMirar = Math.atan2(player.position.x - mejorMonumento.pisoPos.x, player.position.z - mejorMonumento.pisoPos.z);
            player.yaw = anguloMirar;
            characterFacingYaw = anguloMirar;
            placeCharacterAndCamera(clock.getElapsedTime());
            return;
        }

        if (window.ESTACIONES_HISTORIA) {
            for (var i = 0; i < window.ESTACIONES_HISTORIA.length; i++) {
                var est = window.ESTACIONES_HISTORIA[i];
                var dEst = Math.hypot(est.zona.x - worldX, est.zona.z - worldZ);
                if (dEst < 14.0) {
                    var ny = getFloorHeightBelow(est.zona.x + 4.5, est.zona.z, est.zona.y);
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
        minimapContainerEl.style.opacity = (splashVisible || window.historiaEnCurso) ? '0.2' : '1';
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
    if (!renderer || !scene || !camera) return;

    if (composer && filmPass && filmPass.enabled) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }

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
// HUD DE GUÍA (EN LA PARTE INFERIOR), BOTONES Y OVERLAY DEL TOUR
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
    hudGuiaEl.style.cssText = 'position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:rgba(5,15,10,0.90); border:1.5px solid #c9a84c; color:#fff; padding:10px 22px; border-radius:40px; font-family:Montserrat,sans-serif; font-size:0.86rem; font-weight:600; z-index:9000; display:flex; align-items:center; gap:12px; box-shadow:0 4px 20px rgba(0,0,0,0.7); pointer-events:none; transition:opacity 0.4s ease; opacity:0; white-space:nowrap; max-width:92vw;';
    hudGuiaEl.innerHTML = '<span style="color:#facc15; font-weight:800;">🧭 RECORRIDO:</span> <span id="hud-guia-texto">Camina hacia el Punto 01 (Anillo Dorado)</span>';
    document.body.appendChild(hudGuiaEl);

    hudPromptEl = document.createElement('div');
    hudPromptEl.id = 'hud-prompt-interaccion';
    hudPromptEl.style.cssText = 'position:fixed; bottom:76px; left:50%; transform:translateX(-50%); background:rgba(10,25,18,0.94); border:2px solid #4ade80; color:#fff; padding:11px 24px; border-radius:50px; font-family:Montserrat,sans-serif; font-size:0.92rem; font-weight:700; z-index:9001; display:none; box-shadow:0 0 25px rgba(34,197,94,0.5); pointer-events:none; white-space:nowrap;';
    document.body.appendChild(hudPromptEl);

    tourOverlayEl = document.createElement('div');
    tourOverlayEl.id = 'tour-aereo-overlay';
    tourOverlayEl.style.cssText = 'position:fixed; bottom:28px; left:50%; transform:translateX(-50%); background:rgba(10,16,22,0.90); backdrop-filter:blur(10px); border:1.5px solid rgba(224,176,102,0.6); color:#fff; padding:14px 24px; border-radius:20px; font-family:Montserrat,sans-serif; z-index:9500; display:none; align-items:center; gap:20px; box-shadow:0 12px 35px rgba(0,0,0,0.8); min-width:340px;';
    tourOverlayEl.innerHTML =
        '<div style="flex:1;">' +
            '<div id="tour-aereo-label" style="color:#facc15; font-size:0.8rem; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:6px;">✈️ Recorrido Aéreo por la Plaza...</div>' +
            '<div style="width:100%; height:5px; background:rgba(255,255,255,0.15); border-radius:4px; overflow:hidden;">' +
                '<div id="tour-aereo-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #e0b066, #4ade80); transition:width 0.1s linear;"></div>' +
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
            window.terminarTourPlaza();
        });
    }

    var contenedorBotones = document.querySelector('.botones-container');
    if (contenedorBotones) {
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
            '<li><strong>Tecla P:</strong> Tomar Foto Postal</li>' +
            '<li><strong>Tecla T:</strong> Vuelo por la Plaza</li>' +
            '<li><strong>Tecla Z:</strong> Volver al Inicio</li>' +
            '</ul>';
    }

    crearMinimapaRadar();
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

    var nuevoHTML = "";
    if (siguiente) {
        var dist = Math.round(Math.hypot(siguiente.zona.x - player.position.x, siguiente.zona.z - player.position.z));
        nuevoHTML = 'Estaciones: <b>' + visitados + '/' + total + '</b> · Siguiente: <span style="color:#fde047;">[' + siguiente.numero + '] ' + siguiente.titulo.split('(')[0] + '</span> (' + dist + 'm)';
    } else {
        nuevoHTML = '✨ <b>¡Historia Completada (' + total + '/' + total + ')!</b> Acércate a los monumentos y presiona <b>F</b>.';
    }

    if (nuevoHTML !== _ultimoTextoHud) {
        txtEl.innerHTML = nuevoHTML;
        _ultimoTextoHud = nuevoHTML;
    }
};

// ====================================================
// ANILLOS DE LUZ Y CAMINO GUÍA
// ====================================================
function construirEstacionesYCamino() {
    if (!window.ESTACIONES_HISTORIA) return;

    var puntosCamino = [];
    puntosCamino.push(new THREE.Vector3(CONFIG_PLAYER.startPosition[0], 1.55, CONFIG_PLAYER.startPosition[2]));

    var etiquetasContainer = document.getElementById('etiquetas-container');

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
        var ring = new THREE.Mesh(new THREE.RingGeometry(2.5, 3.4, 40), ringMat);
        ring.rotation.x = -Math.PI / 2;

        var beamMat = new THREE.MeshBasicMaterial({
            color: 0xfacc15,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        var beam = new THREE.Mesh(new THREE.CircleGeometry(2.5, 32), beamMat);
        beam.rotation.x = -Math.PI / 2;

        g.add(ring);
        g.add(beam);
        storyRingsGroup.add(g);

        var divEst = null;
        if (etiquetasContainer) {
            divEst = document.createElement('div');
            divEst.className = 'etiqueta-estacion-historia';
            divEst.style.cssText = 'position:absolute; left:0; top:0; will-change:transform; background:rgba(201,168,76,0.95); color:#050d0a; font-family:Montserrat,sans-serif; font-weight:800; font-size:0.78rem; padding:5px 12px; border-radius:20px; pointer-events:none; white-space:nowrap; box-shadow:0 2px 10px rgba(0,0,0,0.6); border:1.5px solid #fff;';
            divEst.innerText = '📜 Punto ' + est.numero + ': ' + est.titulo.split('(')[0];
            etiquetasContainer.appendChild(divEst);
        }

        storyRings.push({
            group: g,
            ring: ring,
            beam: beam,
            labelDiv: divEst,
            estacionIndex: idx,
            dentroAhora: false
        });
    });

    var curvaCamino = new THREE.CatmullRomCurve3(puntosCamino);
    var puntosSuaves = curvaCamino.getPoints(160);
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
    storyRingsGroup.add(lineaGuia);

    var arrowGeo = new THREE.ConeGeometry(0.65, 1.8, 12);
    arrowGeo.rotateX(Math.PI / 2);
    var arrowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.9 });
    guideArrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    scene.add(guideArrowMesh);

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
// ELIMINACIÓN DEL BUCLE QUE RETROCEDE (COMPATIBLE CON r108)
// ====================================================
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
    model.updateMatrixWorld(true);

    var minX = Infinity, maxX = -Infinity;
    var minY = Infinity, maxY = -Infinity;
    var minZ = Infinity, maxZ = -Infinity;

    model.traverse(function(child) {
        if (child && child.isMesh && child.geometry) {
            var posAttr = child.geometry.attributes && child.geometry.attributes.position;
            if (posAttr && typeof posAttr.getX === 'function') {
                var v = new THREE.Vector3();
                var stride = Math.max(1, Math.floor(posAttr.count / 500));
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
    model.traverse(function(node) {
        if (node && (node.isBone || node.type === 'Bone')) {
            var bp = new THREE.Vector3();
            node.getWorldPosition(bp);
            if (bp.y < boneMinY) boneMinY = bp.y;
            if (bp.y > boneMaxY) boneMaxY = bp.y;
        }
    });

    var altoVertices = (isFinite(maxY) && isFinite(minY)) ? (maxY - minY) : 0;
    var altoHuesos = (isFinite(boneMaxY) && isFinite(boneMinY)) ? (boneMaxY - boneMinY) * 1.15 : 0;
    var alturaActual = Math.max(altoVertices, altoHuesos);
    if (alturaActual < 0.001) alturaActual = 100;

    var factorEscala = CONFIG_PLAYER.alturaDeseadaPersonaje / alturaActual;
    model.scale.setScalar(factorEscala);
    model.updateMatrixWorld(true);

    var boneMinY2 = Infinity;
    model.traverse(function(node) {
        if (node && (node.isBone || node.type === 'Bone')) {
            var bp = new THREE.Vector3();
            node.getWorldPosition(bp);
            if (bp.y < boneMinY2) boneMinY2 = bp.y;
        }
    });

    var minX2 = Infinity, maxX2 = -Infinity;
    var minY2 = Infinity, maxY2 = -Infinity;
    var minZ2 = Infinity, maxZ2 = -Infinity;

    model.traverse(function(child) {
        if (child && child.isMesh && child.geometry && child.geometry.attributes && child.geometry.attributes.position) {
            var posAttr = child.geometry.attributes.position;
            if (typeof posAttr.getX === 'function') {
                var v = new THREE.Vector3();
                var stride = Math.max(1, Math.floor(posAttr.count / 500));
                for (var i = 0; i < posAttr.count; i += stride) {
                    v.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
                    v.applyMatrix4(child.matrixWorld);
                    if (v.x < minX2) minX2 = v.x;
                    if (v.x > maxX2) maxX2 = v.x;
                    if (v.y < minY2) minY2 = v.y;
                    if (v.y > maxY2) maxY2 = v.y;
                    if (v.z < minZ2) minZ2 = v.z;
                    if (v.z > maxZ2) maxZ2 = v.z;
                }
            }
        }
    });

    var basePies = isFinite(boneMinY2) ? boneMinY2 : (isFinite(minY2) ? minY2 : 0);
    var centroX = isFinite(minX2) ? (minX2 + maxX2) * 0.5 : 0;
    var centroZ = isFinite(minZ2) ? (minZ2 + maxZ2) * 0.5 : 0;
    model.position.set(-centroX, -basePies, -centroZ);
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
        characterMixer.update(delta);
        fijarCaderaEnElSitio();
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

// ====================================================
// INICIALIZACIÓN DE LA ESCENA
// ====================================================
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0xa0c4e0, 0.0014);
    
    camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.25, 1800);
    camera.position.set(-35, 58, 45);
    camera.lookAt(new THREE.Vector3(-92, 12, -55));

    scene.add(characterGroup);

    crearHUDGuia();

    var manager = new THREE.LoadingManager();
    
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
        console.log("✅ Carga al 100%. Mallas de pared:", wallMeshes.length, "| Obstáculos:", circleObstacles.length, "| Pisos y Gradas:", floorMeshes.length);
        var loaderContainer = document.getElementById("loader-container");
        if (loaderContainer) loaderContainer.classList.add("loaded");

        // Actualizar el mapa de sombras 2048x2048 una vez que toda la escena cargó
        if (directionalLight && directionalLight.shadow) {
            directionalLight.shadow.needsUpdate = true;
        }

        player.position.y = getFloorHeightBelow(player.position.x, player.position.z, player.position.y);
        characterGroup.position.set(
            player.position.x,
            player.position.y + (CONFIG_PLAYER.characterFootOffset || 0),
            player.position.z
        );
        characterGroup.rotation.y = characterFacingYaw + CONFIG_PLAYER.characterYawOffset;
        window.actualizarHUDProgreso();

        var pantallaBienvenida = document.getElementById('pantalla-bienvenida');
        var splashVisible = pantallaBienvenida && window.getComputedStyle(pantallaBienvenida).display !== 'none';

        window.iniciarTourPlaza(!splashVisible);

        if (pantallaBienvenida) {
            pantallaBienvenida.addEventListener('click', function() {
                window.iniciarTourPlaza(true);
            }, { once: true });
        }

        var btnExplorar = document.getElementById('btn-explorar-plaza');
        if (btnExplorar) {
            btnExplorar.onclick = function() {
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
        sound.setVolume(0.3);
    });
    
    // 👉 RENDERER EN ALTA CALIDAD VISUAL (PixelRatio hasta 2.0, precisión highp y sombras suaves 2048)
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        powerPreference: "high-performance",
        precision: "highp"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0)); 
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12; 
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    if (renderer.capabilities && typeof renderer.capabilities.getMaxAnisotropy === 'function') {
        maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    }
    
    composer = new THREE.EffectComposer(renderer);
    renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 👉 FilmPass ACTIVADO pero sutil y cinematográfico (sin OutlinePass para ganar máxima fluidez)
    filmPass = new THREE.FilmPass(0.14, 0.02, 1024, false);
    filmPass.enabled = true;
    if (filmPass.uniforms && filmPass.uniforms.nIntensity) {
        filmPass.uniforms.nIntensity.value = 0.07; // Toque cinematográfico ultra limpio en modo día
        filmPass.uniforms.sIntensity.value = 0.015;
    }
    composer.addPass(filmPass);
    
    ambientLight = new THREE.AmbientLight(0xffffff, 0.68);
    scene.add(ambientLight);
    
    hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x2d1a0e, 0.68);
    scene.add(hemisphereLight);
    
    directionalLight = new THREE.DirectionalLight(0xffe8cc, 1.35);
    directionalLight.position.set(60, 140, 80);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 450;
    directionalLight.shadow.camera.left = -180;
    directionalLight.shadow.camera.right = 180;
    directionalLight.shadow.camera.top = 180;
    directionalLight.shadow.camera.bottom = -180;
    directionalLight.shadow.bias = -0.0005;
    directionalLight.shadow.autoUpdate = false;
    directionalLight.shadow.needsUpdate = true;
    scene.add(directionalLight);
    
    directionalLight2 = new THREE.DirectionalLight(0xaaccff, 0.45);
    directionalLight2.position.set(-60, 40, -60);
    scene.add(directionalLight2);

    var textureLoader = new THREE.TextureLoader(manager);
    textureLoader.load("imagenes/cielo.jpg", function (texture) {
        if (THREE.sRGBEncoding) {
            texture.encoding = THREE.sRGBEncoding;
        }
        texture.anisotropy = maxAnisotropy;
        texture.mapping = THREE.EquirectangularReflectionMapping;
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
                window.location.href = marcador.enlace;
            };
            etiquetasContainer.appendChild(div);
            marcador.elemento = div;
        });
    }

    construirEstacionesYCamino();
    
    // ====================================================
    // 1. CARGAR PISO.GLB (CON FILTRADO ANISOTRÓPICO PARA TEXTURAS NÍTIDAS)
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
                obj.receiveShadow = true;
                mejorarCalidadMaterial(obj.material);
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(function(m) {
                        if (m) m.side = THREE.DoubleSide;
                    });
                } else if (obj.material) {
                    obj.material.side = THREE.DoubleSide;
                }
                obj.matrixAutoUpdate = false;
                obj.updateMatrix();
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
    }, undefined, function(error) {
        console.log("Error cargando piso.glb:", error);
    });

    // ====================================================
    // 1.B CARGAR MINERO (assets/personaje.glb)
    // ====================================================
    cargar.load("assets/personaje.glb", function(gltf) {
        while (characterGroup.children.length > 0) {
            characterGroup.remove(characterGroup.children[0]);
        }

        var model = gltf.scene;
        characterModel = model;

        model.traverse(function(child) {
            if (child && child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
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
            }
        }
    }, undefined, function(err) {
        console.error("⚠️ Error al cargar assets/personaje.glb:", err);
    });

    function cargarModeloSeguro(url, callbackExito) {
        var proyectaSombra = /Pedestal|Palliri|completomina|fuente|reloj|letrasiglo|arbol|banca|poste|pilar/i.test(url);
        cargar.load(url, function(gltf) {
            gltf.scene.traverse(function(c) {
                if (c && c.isMesh) {
                    c.castShadow = proyectaSombra;
                    c.receiveShadow = true;
                    mejorarCalidadMaterial(c.material);
                }
            });
            callbackExito(gltf.scene);
        }, undefined, function(error) {
            console.log("Error en modelo: " + url, error);
        });
    }

    // ====================================================
    // 2. MONUMENTOS Y PEDESTALES (SIN OUTLINE)
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
        var geometriaEsfera = new THREE.SphereGeometry(0.8, 16, 16);
        var materialEsfera = new THREE.MeshBasicMaterial({ color: 0xfffae6 });

        function crearPosteConLuz(x, y, z) {
            var posteClonado = modeloBase.clone();
            var luzFoco = new THREE.PointLight(0xffddaa, 0, 70, 2.0); 
            luzFoco.visible = false; // Apagada en modo día para máxima fluidez
            luzFoco.position.set(0, 20, 0); 
            var bolitaLuz = new THREE.Mesh(geometriaEsfera, materialEsfera);
            bolitaLuz.position.set(0, 18, 0);
            var grupoPoste = new THREE.Group();
            grupoPoste.add(posteClonado);
            grupoPoste.add(luzFoco);
            grupoPoste.add(bolitaLuz);
            grupoPoste.position.set(x, y, z);
            scene.add(grupoPoste);
            lucesPostes.push(luzFoco);

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
        var obj40 = modeloArbol.clone(); obj40.position.set(-105, 8, 20); scene.add(obj40); agregarObstaculoCircular(-105, 20, 1.8);
        var obj41 = modeloArbol.clone(); obj41.position.set(-105, 8, -38); scene.add(obj41); agregarObstaculoCircular(-105, -38, 1.8);
        var obj42 = modeloArbol.clone(); obj42.position.set(-128, 8, -38); scene.add(obj42); agregarObstaculoCircular(-128, -38, 1.8);
        var obj43 = modeloArbol.clone(); obj43.position.set(-86, 8, -120); scene.add(obj43); agregarObstaculoCircular(-86, -120, 1.8);
    });

    cargarModeloSeguro("assets/planta.glb", function(modeloPlanta) {
        modeloPlanta.scale.set(6, 7, 6);
        var obj40 = modeloPlanta.clone(); obj40.position.set(-85, 7, -82); scene.add(obj40); agregarObstaculoCircular(-85, -82, 1.4);
        var obj41 = modeloPlanta.clone(); obj41.position.set(-120, 7, -70); scene.add(obj41); agregarObstaculoCircular(-120, -70, 1.4);
        var obj42 = modeloPlanta.clone(); obj42.scale.set(8, 8, 8); obj42.position.set(-123, 7.5, -147); scene.add(obj42); agregarObstaculoCircular(-123, -147, 1.6);
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
        var obj14 = modeloSilla.clone(); obj14.position.set(-61.5, 7, 23); obj14.rotation.y = Math.PI; scene.add(obj14); registrarParaColision(obj14, true); agregarObstaculoCircular(-61.5, 23, 1.5);
        var silla2 = modeloSilla.clone(); silla2.position.set(-61.5, 7, 10); silla2.rotation.y = Math.PI; scene.add(silla2); registrarParaColision(silla2, true); agregarObstaculoCircular(-61.5, 10, 1.5);
        var silla3 = modeloSilla.clone(); silla3.position.set(-61.5, 7, -33); silla3.rotation.y = Math.PI; scene.add(silla3); registrarParaColision(silla3, true); agregarObstaculoCircular(-61.5, -33, 1.5);
        var silla4 = modeloSilla.clone(); silla4.position.set(-61.5, 7, -42); silla4.rotation.y = Math.PI; scene.add(silla4); registrarParaColision(silla4, true); agregarObstaculoCircular(-61.5, -42, 1.5);
        var silla5 = modeloSilla.clone(); silla5.position.set(-61.5, 7, -63); silla5.rotation.y = Math.PI; scene.add(silla5); registrarParaColision(silla5, true); agregarObstaculoCircular(-61.5, -63, 1.5);
        var silla6 = modeloSilla.clone(); silla6.position.set(-61.5, 7, -87); silla6.rotation.y = Math.PI; scene.add(silla6); registrarParaColision(silla6, true); agregarObstaculoCircular(-61.5, -87, 1.5);
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
        scene.add(grupoBarandas);
        registrarParaColision(grupoBarandas, true);

        var grupoBarandasCopia1 = grupoBarandas.clone();
        grupoBarandasCopia1.position.set(0, 0, -60); 
        scene.add(grupoBarandasCopia1);
        registrarParaColision(grupoBarandasCopia1, true);
    });

    // ====================================================
    // 7. VEGETACIÓN ADICIONAL Y ARBOLITOS
    // ====================================================
    cargarModeloSeguro("assets/planta1.glb", function(modeloplanta1) {
        var obj18 = modeloplanta1.clone(); obj18.scale.set(7, 7, 7); obj18.position.set(-83, 7.5, -70); scene.add(obj18); agregarObstaculoCircular(-83, -70, 1.2);
        var obj19 = modeloplanta1.clone(); obj19.scale.set(7, 7, 7); obj19.position.set(-105, 7.5, -70); scene.add(obj19); agregarObstaculoCircular(-105, -70, 1.2);
        var obj20 = modeloplanta1.clone(); obj20.scale.set(7, 7, 7); obj20.position.set(-83, 7.5, -40); scene.add(obj20); agregarObstaculoCircular(-83, -40, 1.2);
        var obj21 = modeloplanta1.clone(); obj21.scale.set(7, 7, 7); obj21.position.set(-74, 7.5, -134); scene.add(obj21); agregarObstaculoCircular(-74, -134, 1.2);
        var obj22 = modeloplanta1.clone(); obj22.scale.set(7, 7, 7); obj22.position.set(-103, 7.5, -134); scene.add(obj22); agregarObstaculoCircular(-103, -134, 1.2);
        var obj23 = modeloplanta1.clone(); obj23.scale.set(8, 8, 8); obj23.position.set(-121, 7.5, -134); scene.add(obj23); agregarObstaculoCircular(-121, -134, 1.2);
    });

    cargarModeloSeguro("assets/planta3.glb", function(modeloplanta3) {
        var obj18 = modeloplanta3.clone(); obj18.scale.set(7, 7, 7); obj18.position.set(-83, 7.5, -76.5); scene.add(obj18); agregarObstaculoCircular(-83, -76.5, 1.1);
        var obj19 = modeloplanta3.clone(); obj19.scale.set(7, 7, 7); obj19.position.set(-113, 7.5, -70); scene.add(obj19); agregarObstaculoCircular(-113, -70, 1.1);
        var obj20 = modeloplanta3.clone(); obj20.scale.set(7, 7, 7); obj20.position.set(-90, 7.5, -40); scene.add(obj20); agregarObstaculoCircular(-90, -40, 1.1);
        var obj21 = modeloplanta3.clone(); obj21.scale.set(7, 7, 7); obj21.position.set(-68, 7.5, -33); scene.add(obj21); agregarObstaculoCircular(-68, -33, 1.1);
        var obj22 = modeloplanta3.clone(); obj22.scale.set(7, 7, 7); obj22.position.set(-68, 7.5, -42); scene.add(obj22); agregarObstaculoCircular(-68, -42, 1.1);
        var obj23 = modeloplanta3.clone(); obj23.scale.set(7, 7, 7); obj23.position.set(-68, 7.5, 17); scene.add(obj23); agregarObstaculoCircular(-68, 17, 1.1);
        var obj24 = modeloplanta3.clone(); obj24.scale.set(7, 7, 7); obj24.position.set(-68, 7.5, 25); scene.add(obj24); agregarObstaculoCircular(-68, 25, 1.1);
        var obj25 = modeloplanta3.clone(); obj25.scale.set(7, 7, 7); obj25.position.set(-68, 7.5, 7); scene.add(obj25); agregarObstaculoCircular(-68, 7, 1.1);
        var obj26 = modeloplanta3.clone(); obj26.scale.set(7, 7, 7); obj26.position.set(-102, 7.5, -146); scene.add(obj26); agregarObstaculoCircular(-102, -146, 1.1);
        var obj27 = modeloplanta3.clone(); obj27.scale.set(7, 7, 7); obj27.position.set(-68, 7.5, -120); scene.add(obj27); agregarObstaculoCircular(-68, -120, 1.1);
    });

    cargarModeloSeguro("assets/otroarbolito.glb", function(modeloarbolito2) {
        var obj18 = modeloarbolito2.clone(); obj18.scale.set(2, 2, 2); obj18.position.set(-70, 7.5, -63); scene.add(obj18); agregarObstaculoCircular(-70, -63, 1.3);
        var obj19 = modeloarbolito2.clone(); obj19.scale.set(2, 2, 2); obj19.position.set(-100, 7.5, -64); scene.add(obj19); agregarObstaculoCircular(-100, -64, 1.3);
        var obj20 = modeloarbolito2.clone(); obj20.scale.set(4, 4, 4); obj20.position.set(-140, 7.5, -25); scene.add(obj20); agregarObstaculoCircular(-140, -25, 1.6);
        var obj21 = modeloarbolito2.clone(); obj21.scale.set(2, 2, 2); obj21.position.set(-85, 7.5, 10); scene.add(obj21); agregarObstaculoCircular(-85, 10, 1.3);
        var obj22 = modeloarbolito2.clone(); obj22.scale.set(1.8, 1.8, 1.8); obj22.position.set(-68, 7.5, -124); scene.add(obj22); agregarObstaculoCircular(-68, -124, 1.3);
        var obj23 = modeloarbolito2.clone(); obj23.scale.set(1.8, 1.8, 1.8); obj23.position.set(-103, 7.5, -122); scene.add(obj23); agregarObstaculoCircular(-103, -122, 1.3);
        var obj24 = modeloarbolito2.clone(); obj24.scale.set(4, 4, 4); obj24.position.set(-140, 7.5, 15); scene.add(obj24); agregarObstaculoCircular(-140, 15, 1.6);
    });

    cargarModeloSeguro("assets/otroarbolito1.glb", function(modeloarbolito3) {
        var obj18 = modeloarbolito3.clone(); obj18.scale.set(0.05, 0.05, 0.05); obj18.position.set(-75, 7.5, -83); scene.add(obj18); agregarObstaculoCircular(-75, -83, 1.3);
        var obj19 = modeloarbolito3.clone(); obj19.scale.set(0.05, 0.05, 0.05); obj19.position.set(-104, 7.5, -78); scene.add(obj19); agregarObstaculoCircular(-104, -78, 1.3);
        var obj20 = modeloarbolito3.clone(); obj20.scale.set(0.05, 0.05, 0.05); obj20.position.set(-140, 7.5, -18); scene.add(obj20); agregarObstaculoCircular(-140, -18, 1.3);
        var obj21 = modeloarbolito3.clone(); obj21.scale.set(0.05, 0.05, 0.05); obj21.position.set(-80, 7.5, 15); scene.add(obj21); agregarObstaculoCircular(-80, 15, 1.3);
        var obj22 = modeloarbolito3.clone(); obj22.scale.set(0.05, 0.05, 0.05); obj22.position.set(-74, 7.5, -128); scene.add(obj22); agregarObstaculoCircular(-74, -128, 1.3);
    });

    cargarModeloSeguro("assets/arbol1.glb", function(modeloarbol1) {
        modeloarbol1.scale.set(600, 600, 600);
        var pilar22 = modeloarbol1.clone(); pilar22.position.set(-103, 5, -82); scene.add(pilar22); agregarObstaculoCircular(-103, -82, 1.6);
        var pilar23 = modeloarbol1.clone(); pilar23.position.set(-123, 5, -82); scene.add(pilar23); agregarObstaculoCircular(-123, -82, 1.6);
        var pilar24 = modeloarbol1.clone(); pilar24.position.set(-85, 5, -145); scene.add(pilar24); agregarObstaculoCircular(-85, -145, 1.6);
        var pilar25 = modeloarbol1.clone(); pilar25.position.set(-121, 5, -120); scene.add(pilar25); agregarObstaculoCircular(-121, -120, 1.6);
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
        var obj18 = modelomaseta.clone(); obj18.scale.set(7, 7, 7); obj18.position.set(-80, 7.5, 23); scene.add(obj18); agregarObstaculoCircular(-80, 23, 1.5);
        var obj19 = modelomaseta.clone(); obj19.scale.set(7, 7, 7); obj19.position.set(-118, 7.5, -40); scene.add(obj19); agregarObstaculoCircular(-118, -40, 1.5);
        var obj20 = modelomaseta.clone(); obj20.scale.set(6, 6, 6); obj20.position.set(-86, 7.5, -33.5); scene.add(obj20); agregarObstaculoCircular(-86, -33.5, 1.4);
    });

    cargarModeloSeguro("assets/otromasetallanta.glb", function(modelomasetaotro) {
        var obj18 = modelomasetaotro.clone(); obj18.scale.set(7, 7, 7); obj18.position.set(-88, 7.5, 20); scene.add(obj18); agregarObstaculoCircular(-88, 20, 1.5);
        var obj19 = modelomasetaotro.clone(); obj19.scale.set(7, 7, 7); obj19.position.set(-138, 7.5, -35); scene.add(obj19); agregarObstaculoCircular(-138, -35, 1.5);
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
// MOTOR DE CÁMARA PANORÁMICA Y ESCANEO DE GRADAS / RAMPAS
// ====================================================
function lerpAngle(a, b, t) {
    var diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
}

var _cameraRaycaster = new THREE.Raycaster();
var _cameraLookTarget = new THREE.Vector3();
var _historiaCamPosAnimada = new THREE.Vector3();

function placeCharacterAndCamera(elapsedTime) {
    characterGroup.position.x = player.position.x;
    characterGroup.position.z = player.position.z;
    characterGroup.rotation.y = characterFacingYaw + CONFIG_PLAYER.characterYawOffset;

    if (window.historiaEnCurso && window.camaraHistoriaObjetivo) {
        var t = elapsedTime || 0;
        _historiaCamPosAnimada.copy(window.camaraHistoriaObjetivo.posicion);
        _historiaCamPosAnimada.x += Math.sin(t * 0.45) * 9.0;
        _historiaCamPosAnimada.y += Math.cos(t * 0.35) * 2.5;
        _historiaCamPosAnimada.z += Math.cos(t * 0.45) * 9.0;

        camera.position.lerp(_historiaCamPosAnimada, 0.04);
        _cameraLookTarget.lerp(window.camaraHistoriaObjetivo.objetivo, 0.06);
        camera.lookAt(_cameraLookTarget);
        return;
    }

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

    var desiredCamPos = targetPoint.clone().add(camDir);

    if (cameraBlockMeshes.length > 0) {
        var rayDir = camDir.clone().normalize();
        var maxDist = camDir.length();
        _cameraRaycaster.set(targetPoint, rayDir);
        _cameraRaycaster.near = 0.5;
        _cameraRaycaster.far = maxDist;
        var hits = _cameraRaycaster.intersectObjects(cameraBlockMeshes, false);
        if (hits.length > 0 && hits[0].distance < maxDist) {
            var safeDist = Math.max(CONFIG_PLAYER.cameraMinDistance, hits[0].distance - CONFIG_PLAYER.cameraCollisionBuffer);
            desiredCamPos.copy(targetPoint).addScaledVector(rayDir, safeDist);
        }
    }

    desiredCamPos.x = Math.max(CONFIG_PLAYER.bounds.minX - 6, Math.min(CONFIG_PLAYER.bounds.maxX + 6, desiredCamPos.x));
    desiredCamPos.z = Math.max(CONFIG_PLAYER.bounds.minZ - 6, Math.min(CONFIG_PLAYER.bounds.maxZ + 6, desiredCamPos.z));
    if (desiredCamPos.y < player.position.y + 2.2) {
        desiredCamPos.y = player.position.y + 2.2;
    }

    camera.position.copy(desiredCamPos);
    camera.lookAt(targetPoint);
}

var _floorRaycaster = new THREE.Raycaster();
var _floorDownVec = new THREE.Vector3(0, -1, 0);
var _rayOriginTemp = new THREE.Vector3();

function getFloorHeightBelow(x, z, currentY, moveDir) {
    var refY = (currentY !== undefined) ? currentY : player.position.y;
    if (floorMeshes.length === 0) return Math.max(CONFIG_PLAYER.minSafetyY, refY);

    var puntosMuestreo = [
        [0, 0],
        [0.85, 0], [-0.85, 0],
        [0, 0.85], [0, -0.85]
    ];
    if (moveDir && (Math.abs(moveDir.x) > 0.01 || Math.abs(moveDir.z) > 0.01)) {
        puntosMuestreo.push([moveDir.x * 1.4, moveDir.z * 1.4]);
    }

    var rayStartY = refY + CONFIG_PLAYER.maxStepUp;
    var maxReachableY = null;

    for (var k = 0; k < puntosMuestreo.length; k++) {
        var ox = x + puntosMuestreo[k][0];
        var oz = z + puntosMuestreo[k][1];
        _rayOriginTemp.set(ox, rayStartY, oz);
        _floorRaycaster.set(_rayOriginTemp, _floorDownVec);
        _floorRaycaster.near = 0;
        _floorRaycaster.far = CONFIG_PLAYER.maxStepUp + CONFIG_PLAYER.maxStepDown + 20.0;
        var hits = _floorRaycaster.intersectObjects(floorMeshes, false);

        for (var i = 0; i < hits.length; i++) {
            var py = hits[i].point.y;
            if (py >= -2.0 && py <= 32.0 && py <= refY + CONFIG_PLAYER.maxStepUp) {
                if (maxReachableY === null || py > maxReachableY) {
                    maxReachableY = py;
                }
            }
        }
    }

    if (maxReachableY !== null) {
        return Math.max(CONFIG_PLAYER.minSafetyY, maxReachableY);
    }
    return Math.max(CONFIG_PLAYER.minSafetyY, refY);
}

var _wallRaycaster = new THREE.Raycaster();
var _wallCheckHeights = [1.8, 3.4];
var _wallNormal2D = new THREE.Vector3();

function raycastWalls(feetPos, dir, distance) {
    if (wallMeshes.length === 0 || distance <= 0.0001) return null;
    var closest = null;
    for (var i = 0; i < _wallCheckHeights.length; i++) {
        _rayOriginTemp.set(feetPos.x, feetPos.y + _wallCheckHeights[i], feetPos.z);
        _wallRaycaster.set(_rayOriginTemp, dir);
        _wallRaycaster.near = 0;
        _wallRaycaster.far = distance;
        var hits = _wallRaycaster.intersectObjects(wallMeshes, false);
        for (var j = 0; j < hits.length; j++) {
            var h = hits[j];
            if (h.face && Math.abs(h.face.normal.y) > 0.45) continue;
            if (!closest || h.distance < closest.distance) {
                closest = h;
            }
        }
    }
    return closest;
}

function resolverObstaculosCirculares(pos) {
    for (var i = 0; i < circleObstacles.length; i++) {
        var obs = circleObstacles[i];
        var dx = pos.x - obs.x;
        var dz = pos.z - obs.z;
        var dist = Math.hypot(dx, dz);
        if (dist < obs.r && dist > 0.0001) {
            var empuje = obs.r - dist;
            pos.x += (dx / dist) * empuje;
            pos.z += (dz / dist) * empuje;
        }
    }
}

function tryMoveHorizontal(feetPos, moveVec) {
    var distance = Math.hypot(moveVec.x, moveVec.z);
    if (distance < 0.0001) return moveVec.clone();

    var dir = new THREE.Vector3(moveVec.x, 0, moveVec.z).normalize();
    var checkDist = distance + CONFIG_PLAYER.wallCollisionBuffer;
    var hit = raycastWalls(feetPos, dir, checkDist);

    if (!hit || hit.distance >= distance + CONFIG_PLAYER.wallCollisionBuffer * 0.5) {
        return moveVec.clone();
    }

    if (hit.face) {
        _wallNormal2D.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
        _wallNormal2D.y = 0;
        if (_wallNormal2D.lengthSq() >= 0.0001) {
            _wallNormal2D.normalize();
            var slideVec = moveVec.clone().sub(_wallNormal2D.clone().multiplyScalar(moveVec.dot(_wallNormal2D)));
            var slideDist = Math.hypot(slideVec.x, slideVec.z);
            if (slideDist >= 0.0001) {
                var slideDir = new THREE.Vector3(slideVec.x, 0, slideVec.z).normalize();
                var slideHit = raycastWalls(feetPos, slideDir, slideDist + CONFIG_PLAYER.wallCollisionBuffer * 0.8);
                if (!slideHit || slideHit.distance >= slideDist + CONFIG_PLAYER.wallCollisionBuffer * 0.4) {
                    return slideVec;
                }
            }
        }
    }
    return new THREE.Vector3(0, 0, 0);
}

function verificarZonasDeHistoriaYMonumentos(time) {
    if (!window.ESTACIONES_HISTORIA || tourActivo) return;

    var px = player.position.x;
    var pz = player.position.z;
    var estacionRepetible = null;
    var siguienteNoVisitada = null;

    for (var i = 0; i < storyRings.length; i++) {
        var item = storyRings[i];
        var est = window.ESTACIONES_HISTORIA[item.estacionIndex];

        var pulso = 1 + Math.sin(time * 2.5 + i) * 0.06;
        item.ring.scale.set(pulso, pulso, 1);

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

        if (objetivoX !== null && !window.historiaEnCurso && !tourActivo) {
            guideArrowMesh.visible = true;
            var anguloHaciaDestino = Math.atan2(objetivoX - px, objetivoZ - pz);
            guideArrowMesh.position.set(
                px + Math.sin(anguloHaciaDestino) * 3.5,
                player.position.y + 0.5 + Math.sin(time * 4) * 0.12,
                pz + Math.cos(anguloHaciaDestino) * 3.5
            );
            guideArrowMesh.rotation.y = anguloHaciaDestino;
        } else {
            guideArrowMesh.visible = false;
        }
    }

    monumentoCercanoActual = null;
    var menorDistMon = Infinity;
    marcadores.forEach(function(m) {
        var radioMonumento = m.radio || CONFIG_PLAYER.monumentRadius;
        var d = Math.hypot(m.pisoPos.x - px, m.pisoPos.z - pz);
        if (d <= radioMonumento && d < menorDistMon) {
            menorDistMon = d;
            monumentoCercanoActual = m;
        }
    });

    if (hudPromptEl) {
        if (window.historiaEnCurso || tourActivo) {
            hudPromptEl.style.display = 'none';
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
            delete hudPromptEl.dataset.repeatIndex;
        }
    }

    window.actualizarHUDProgreso();
}

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

    var pos = tourCurves.positions.getPoint(t);
    var look = tourCurves.looks.getPoint(t);

    camera.position.copy(pos);
    camera.lookAt(look);

    characterGroup.position.set(
        player.position.x,
        player.position.y + (CONFIG_PLAYER.characterFootOffset || 0),
        player.position.z
    );
    characterGroup.rotation.y = characterFacingYaw + CONFIG_PLAYER.characterYawOffset;
    actualizarAnimacionMinero(delta, false, false);

    if (tourBarEl) {
        tourBarEl.style.width = Math.round(rawT * 100) + '%';
    }
    if (tourLabelEl) {
        if (rawT < 0.22) tourLabelEl.innerText = '✈️ Sobrevuelo: Ingreso y Monumentos Sindicales...';
        else if (rawT < 0.45) tourLabelEl.innerText = '✈️ Sobrevuelo: Monumento al Minero de Siglo XX...';
        else if (rawT < 0.70) tourLabelEl.innerText = '✈️ Sobrevuelo: Monumento a las Palliris y Jardines...';
        else if (rawT < 0.88) tourLabelEl.innerText = '✈️ Sobrevuelo: Fuente, Reloj y Letras Siglo XX...';
        else tourLabelEl.innerText = '👷 Llegando a tu personaje para iniciar el recorrido a pie...';
    }

    if (!splashVisible && rawT >= 1.0) {
        window.terminarTourPlaza();
    }
}

function updatePlayer(delta, elapsedTime) {
    if (tourActivo) {
        actualizarTourAereo(delta);
        return;
    }

    if (window.historiaEnCurso) {
        player.velocity.set(0, 0, 0);
        actualizarAnimacionMinero(delta, false, false);
        placeCharacterAndCamera(elapsedTime);
        return;
    }

    if (keys['KeyE']) player.yaw -= 1.8 * delta;
    if (keys['KeyQ']) player.yaw += 1.8 * delta;

    var forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    var right = new THREE.Vector3(-forward.z, 0, forward.x);
    var moveDir = new THREE.Vector3(0, 0, 0);

    if (keys['KeyW'] || keys['ArrowUp']) moveDir.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) moveDir.sub(forward);
    if (keys['KeyA'] || keys['ArrowLeft']) moveDir.sub(right);
    if (keys['KeyD'] || keys['ArrowRight']) moveDir.add(right);

    var isWalking = moveDir.length() > 0;
    if (isWalking) moveDir.normalize();

    var isRunning = keys['ShiftLeft'] || keys['ShiftRight'];
    var speed = isRunning ? CONFIG_PLAYER.runSpeed : CONFIG_PLAYER.moveSpeed;

    var targetVelX = moveDir.x * speed;
    var targetVelZ = moveDir.z * speed;
    var accel = CONFIG_PLAYER.acceleration;
    player.velocity.x += (targetVelX - player.velocity.x) * Math.min(1, accel * delta);
    player.velocity.z += (targetVelZ - player.velocity.z) * Math.min(1, accel * delta);

    var desiredMove = new THREE.Vector3(player.velocity.x * delta, 0, player.velocity.z * delta);
    var allowedMove = tryMoveHorizontal(player.position, desiredMove);

    player.position.x += allowedMove.x;
    player.position.z += allowedMove.z;

    resolverObstaculosCirculares(player.position);

    player.position.x = Math.max(CONFIG_PLAYER.bounds.minX, Math.min(CONFIG_PLAYER.bounds.maxX, player.position.x));
    player.position.z = Math.max(CONFIG_PLAYER.bounds.minZ, Math.min(CONFIG_PLAYER.bounds.maxZ, player.position.z));

    if (isWalking || Math.hypot(player.velocity.x, player.velocity.z) > 0.05) {
        var targetFloorY = getFloorHeightBelow(player.position.x, player.position.z, player.position.y, moveDir);
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
        var targetYaw = Math.atan2(-moveDir.x, -moveDir.z);
        characterFacingYaw = lerpAngle(characterFacingYaw, targetYaw, Math.min(1, CONFIG_PLAYER.characterTurnSpeed * delta));
    }

    actualizarAnimacionMinero(delta, isWalking, isRunning);
    placeCharacterAndCamera(elapsedTime);
}

// ====================================================
// EVENTOS Y BUCLE PRINCIPAL OPTIMIZADO
// ====================================================
document.addEventListener('keydown', function(e) {
    keys[e.code] = true;

    if (tourActivo && (e.code === 'Escape' || e.code === 'Space')) {
        e.preventDefault();
        window.terminarTourPlaza();
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
        player.position.y = getFloorHeightBelow(player.position.x, player.position.z, CONFIG_PLAYER.baseGroundY);
    }

    if (window.historiaEnCurso && (e.code === 'Escape' || e.code === 'KeyF')) {
        window.cerrarVentanaHistoria();
        return;
    }

    if (e.code === 'KeyF' && !e.repeat && !window.historiaEnCurso && !tourActivo) {
        if (monumentoCercanoActual) {
            window.location.href = monumentoCercanoActual.enlace;
        } else if (hudPromptEl && hudPromptEl.dataset.repeatIndex !== undefined) {
            window.abrirCapituloZona(parseInt(hudPromptEl.dataset.repeatIndex, 10), false);
        }
    }
});

document.addEventListener('keyup', function(e) {
    keys[e.code] = false;
});

document.addEventListener('mousemove', function(e) {
    if (locked && !window.historiaEnCurso && !tourActivo) {
        player.yaw -= e.movementX * CONFIG_PLAYER.mouseSensitivity;
        player.pitch += e.movementY * CONFIG_PLAYER.mouseSensitivity;
        player.pitch = Math.max(CONFIG_PLAYER.pitchMin, Math.min(CONFIG_PLAYER.pitchMax, player.pitch));
    }
});

window.addEventListener('wheel', function(e) {
    if (window.historiaEnCurso || tourActivo) return;
    currentCameraDistance += Math.sign(e.deltaY) * CONFIG_PLAYER.cameraZoomSpeed;
    currentCameraDistance = Math.max(CONFIG_PLAYER.cameraMinDistance, Math.min(CONFIG_PLAYER.cameraMaxDistance, currentCameraDistance));
}, { passive: true });

document.addEventListener('pointerlockchange', function() {
    locked = (document.pointerLockElement === renderer.domElement);
});

window.addEventListener('click', function(e) {
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
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
}

var _frameCounter = 0;
var _projVec = new THREE.Vector3();

function animate() {
    requestAnimationFrame(animate);
    var delta = Math.min(clock.getDelta(), 0.05);
    var elapsedTime = clock.getElapsedTime();
    _frameCounter++;

    updatePlayer(delta, elapsedTime);

    // Actualizar zonas de historia, HUD y Radar 2D cada 2 frames para máxima fluidez
    if (_frameCounter % 2 === 0) {
        verificarZonasDeHistoriaYMonumentos(elapsedTime);
        actualizarMinimapaRadar(elapsedTime);
    }

    var winW = window.innerWidth;
    var winH = window.innerHeight;

    // Etiquetas 3D aceleradas por GPU con translate3d
    for (var i = 0; i < marcadores.length; i++) {
        var marcador = marcadores[i];
        if (marcador.elemento && camera) {
            _projVec.copy(marcador.posicion).project(camera); 
            if (_projVec.z < 1 && !window.historiaEnCurso) { 
                var x = (_projVec.x * 0.5 + 0.5) * winW;
                var y = (_projVec.y * -0.5 + 0.5) * winH;
                marcador.elemento.style.transform = 'translate(-50%, -50%) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px, 0)';
                if (marcador.elemento.style.display !== 'block') marcador.elemento.style.display = 'block'; 
            } else {
                if (marcador.elemento.style.display !== 'none') marcador.elemento.style.display = 'none'; 
            }
        }
    }

    for (var j = 0; j < storyRings.length; j++) {
        var item = storyRings[j];
        if (item.labelDiv && camera) {
            if (window.historiaEnCurso || tourActivo) {
                if (item.labelDiv.style.display !== 'none') item.labelDiv.style.display = 'none';
                continue;
            }
            var est = window.ESTACIONES_HISTORIA[item.estacionIndex];
            _projVec.set(est.zona.x, est.zona.y + 3.0, est.zona.z);
            var distCam = camera.position.distanceTo(_projVec);
            _projVec.project(camera);
            if (_projVec.z < 1 && distCam < 95) {
                var sx = (_projVec.x * 0.5 + 0.5) * winW;
                var sy = (_projVec.y * -0.5 + 0.5) * winH;
                item.labelDiv.style.transform = 'translate(-50%, -50%) translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px, 0)';
                if (item.labelDiv.style.display !== 'block') item.labelDiv.style.display = 'block';
            } else {
                if (item.labelDiv.style.display !== 'none') item.labelDiv.style.display = 'none';
            }
        }
    }

    if (composer && filmPass && filmPass.enabled) {
        composer.render();
    } else if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

window.cambiarAtmosfera = function(modo) {
    var textureLoader = new THREE.TextureLoader();
    var texturaRuta = "";

    if (modo === 'dia') {
        texturaRuta = "imagenes/cielo.jpg";
        directionalLight.color.setHex(0xffe8cc);
        directionalLight.intensity = 1.35;
        hemisphereLight.color.setHex(0xffffff);
        hemisphereLight.groundColor.setHex(0x2d1a0e);
        ambientLight.color.setHex(0xffffff);
        ambientLight.intensity = 0.68;
        if (scene.fog) scene.fog.color.setHex(0xa0c4e0);
        lucesPostes.forEach(function(luz) { 
            luz.intensity = 0; 
            luz.visible = false; 
        });
        if (filmPass) {
            filmPass.enabled = true;
            if (filmPass.uniforms && filmPass.uniforms.nIntensity) {
                filmPass.uniforms.nIntensity.value = 0.07; // Sutil acabado de cine sin granulado molesto
                filmPass.uniforms.sIntensity.value = 0.015;
            }
        }
        
    } else if (modo === 'atardecer' || modo === 'tarde') {
        texturaRuta = "imagenes/atardecer.jpg"; 
        directionalLight.color.setHex(0xff7722);
        directionalLight.intensity = 0.95;
        hemisphereLight.color.setHex(0xff9944);
        hemisphereLight.groundColor.setHex(0x3a1e12);
        ambientLight.color.setHex(0xff6622);
        ambientLight.intensity = 0.48;
        if (scene.fog) scene.fog.color.setHex(0xc06030);
        lucesPostes.forEach(function(luz) { 
            luz.visible = true;
            luz.intensity = 2.0; 
        });
        if (filmPass) {
            filmPass.enabled = true;
            if (filmPass.uniforms && filmPass.uniforms.nIntensity) {
                filmPass.uniforms.nIntensity.value = 0.16;
                filmPass.uniforms.sIntensity.value = 0.025;
            }
        }
        
    } else if (modo === 'noche' || modo === 'nublado') {
        texturaRuta = "imagenes/noche.png";
        directionalLight.color.setHex(0x7799dd);
        directionalLight.intensity = 0.28;
        hemisphereLight.color.setHex(0x223366);
        hemisphereLight.groundColor.setHex(0x050a14);
        ambientLight.color.setHex(0x1a2544);
        ambientLight.intensity = 0.28;
        if (scene.fog) scene.fog.color.setHex(0x0a0a1a);
        lucesPostes.forEach(function(luz) { 
            luz.visible = true;
            luz.intensity = 3.5; 
        });
        if (filmPass) {
            filmPass.enabled = true;
            if (filmPass.uniforms && filmPass.uniforms.nIntensity) {
                filmPass.uniforms.nIntensity.value = 0.18;
                filmPass.uniforms.sIntensity.value = 0.03;
            }
        }
    } else {
        return;
    }

    textureLoader.load(texturaRuta, function (texture) {
        if (THREE.sRGBEncoding) {
            texture.encoding = THREE.sRGBEncoding;
        }
        texture.anisotropy = maxAnisotropy;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
    });
};

document.addEventListener("DOMContentLoaded", function () {
    var btnDia = document.getElementById("btn-dia");
    var btnTarde = document.getElementById("btn-tarde");
    var btnNublado = document.getElementById("btn-nublado");
    var botonesClima = document.querySelectorAll(".btn-clima");

    function actualizarClaseActiva(botonSeleccionado) {
        botonesClima.forEach(function (btn) { btn.classList.remove("activo"); });
        if (botonSeleccionado) botonSeleccionado.classList.add("activo");
    }

    if (btnDia) btnDia.addEventListener("click", function () { actualizarClaseActiva(btnDia); window.cambiarAtmosfera("dia"); });
    if (btnTarde) btnTarde.addEventListener("click", function () { actualizarClaseActiva(btnTarde); window.cambiarAtmosfera("atardecer"); });
    if (btnNublado) btnNublado.addEventListener("click", function () { actualizarClaseActiva(btnNublado); window.cambiarAtmosfera("noche"); });
});

var btnSalir = document.getElementById("btn-salir");
if (btnSalir) {
    btnSalir.addEventListener("click", function () {
        sessionStorage.removeItem("historiaCompletada");
        window.location.href = window.location.pathname + "?inicio=" + Date.now();
    });
}

init();
animate();