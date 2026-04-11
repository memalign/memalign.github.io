// main.js - Browser Entry Point
// All dependencies are loaded via <script> tags in index.html and available as globals.

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const rendererSnapshotCanvas = document.createElement('canvas');
const rendererSnapshotCtx = rendererSnapshotCanvas.getContext('2d');
const RENDERER_MODES = {
    CLASSIC_2D: "classic_2d",
    THREE_SURFACE: "three_surface",
};

let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;
let dpr = window.devicePixelRatio || 1;

function resizeCanvasSurface(width, height) {
    viewportWidth = Math.max(1, width);
    viewportHeight = Math.max(1, height);
    dpr = window.devicePixelRatio || 1;

    canvas.width = viewportWidth * dpr;
    canvas.height = viewportHeight * dpr;
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    rendererSnapshotCanvas.width = viewportWidth * dpr;
    rendererSnapshotCanvas.height = viewportHeight * dpr;
    rendererSnapshotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rendererSnapshotCtx.imageSmoothingEnabled = false;
}

resizeCanvasSurface(viewportWidth, viewportHeight);

function getConfiguredRendererMode() {
    const configured = Tuning.RENDERER_FEATURE_FLAG || RENDERER_MODES.CLASSIC_2D;
    const urlParam = new URLSearchParams(window.location.search).get("renderer");
    const stored = window.localStorage ? window.localStorage.getItem("memtopia_renderer_mode") : null;
    const requested = urlParam || stored || configured;
    return Object.values(RENDERER_MODES).includes(requested) ? requested : RENDERER_MODES.CLASSIC_2D;
}

const rendererMode = getConfiguredRendererMode();

// INITIALIZE VIA ORCHESTRATOR
const orchestrator = new AppOrchestrator();
const {
    gameState,
    soundEffects,
    uiManager,
    camera,
    globeRenderer,
    threeMapRenderer,
    engine,
    gridSize: GRID_SIZE
} = orchestrator.start(viewportWidth, viewportHeight, rendererMode, RENDERER_MODES);

if (typeof maStorage === 'undefined') {
    console.error("maStorage is undefined! Persistence will not work.");
}

let globeWasActive = false;
let globeInteractionWasActive = false;

function handleViewportResize() {
    resizeCanvasSurface(window.innerWidth, window.innerHeight);
    camera.resizeViewport(viewportWidth, viewportHeight);
    globeRenderer.resize(viewportWidth, viewportHeight);
    if (threeMapRenderer) {
        threeMapRenderer.resize(viewportWidth, viewportHeight);
    }
}

function syncGlobeToCameraCenter() {
    const centerGrid = camera.getCenterGridPosition();
    globeRenderer.setViewFromGrid(
        Math.max(0, Math.min(centerGrid.x, gameState.gridSize - 1)),
        Math.max(0, Math.min(centerGrid.y, gameState.gridSize - 1)),
        gameState.gridSize,
        gameState.gridSize
    );
}

function syncCameraToGlobeFocus() {
    const focus = globeRenderer.getFocusGrid(gameState.gridSize, gameState.gridSize);
    camera.centerOn(focus.x, focus.y);
}

function getGlobeBlend() {
    return globeRenderer.getSmoothedBlendForCellSize(camera.cellSize);
}

function isGlobeInteractionActive() {
    return globeRenderer.isInteractive(camera.targetCellSize);
}

function getThreeSurfaceState(cellSize = camera.cellSize) {
    if (rendererMode !== RENDERER_MODES.THREE_SURFACE || !threeMapRenderer) {
        return null;
    }
    return threeMapRenderer.getRenderState(cellSize);
}

function isThreeSurfaceGlobeInteractive() {
    return rendererMode === RENDERER_MODES.THREE_SURFACE
        && !!threeMapRenderer
        && threeMapRenderer.isInteractive(camera.targetCellSize);
}

function buildGlobeDiagnostics() {
    const centerGrid = camera.getCenterGridPosition();
    const focusGrid = globeRenderer.getFocusGrid(gameState.gridSize, gameState.gridSize);
    const projectionMetrics = globeRenderer.getProjectionMetrics(gameState.gridSize, gameState.gridSize);
    return {
        mode: 'globe',
        blend: getGlobeBlend(),
        globeActive: globeRenderer.isActive(camera.cellSize),
        globeInteractive: isGlobeInteractionActive(),
        camera: {
            x: camera.x,
            y: camera.y,
            targetX: camera.targetX,
            targetY: camera.targetY,
            cellSize: camera.cellSize,
            targetCellSize: camera.targetCellSize
        },
        mapViewCells: {
            width: camera.canvasWidth / camera.cellSize,
            height: camera.canvasHeight / camera.cellSize
        },
        mapCenterGrid: centerGrid,
        globeFocusGrid: focusGrid,
        alignmentDelta: {
            x: focusGrid.x - centerGrid.x,
            y: focusGrid.y - centerGrid.y
        },
        globeView: {
            viewLon: globeRenderer.viewLon,
            viewLat: globeRenderer.viewLat,
            targetViewLon: globeRenderer.targetViewLon,
            targetViewLat: globeRenderer.targetViewLat
        },
        globeCamera: {
            distance: globeRenderer.getCameraDistanceForCellSize(camera.cellSize),
            fov: globeRenderer.getCameraFovForCellSize(camera.cellSize),
            zoomProgress: globeRenderer.getZoomProgressForCellSize(camera.cellSize),
            curvatureProgress: globeRenderer.getCurvatureProgressForCellSize(camera.cellSize),
            radiusScale: globeRenderer.getRadiusScaleForCellSize(camera.cellSize)
        },
        globeProjection: projectionMetrics ? {
            projectedCellWidthPx: projectionMetrics.projectedCellWidthPx,
            projectedCellHeightPx: projectionMetrics.projectedCellHeightPx,
            visibleWidthCells: projectionMetrics.visibleWidthCells,
            visibleHeightCells: projectionMetrics.visibleHeightCells
        } : null
    };
}

function buildThreeSurfaceDiagnostics() {
    const centerGrid = camera.getCenterGridPosition();
    const threeDiagnostics = threeMapRenderer ? threeMapRenderer.getDiagnostics(camera) : null;
    const surfaceState = threeDiagnostics ? threeDiagnostics.state : null;
    const focusGrid = (threeMapRenderer && surfaceState !== ThreeMapRenderer.RENDER_STATES.GRID_2D)
        ? threeMapRenderer.getFocusGrid(gameState.gridSize, gameState.gridSize)
        : null;
    const transitionVisuals = surfaceState === ThreeMapRenderer.RENDER_STATES.TRANSITION_PATCH
        ? getThreeSurfaceTransitionMapOptions(camera.cellSize)
        : null;

    return {
        mode: 'three_surface',
        state: surfaceState,
        camera: {
            x: camera.x,
            y: camera.y,
            targetX: camera.targetX,
            targetY: camera.targetY,
            cellSize: camera.cellSize,
            targetCellSize: camera.targetCellSize
        },
        mapCenterGrid: centerGrid,
        focusGrid,
        mapViewCells: {
            width: camera.canvasWidth / camera.cellSize,
            height: camera.canvasHeight / camera.cellSize
        },
        transitionVisuals,
        surface: threeDiagnostics
    };
}

function refreshDiagnosticsForCurrentView() {
    if (debugMenu.classList.contains('hidden')) {
        return;
    }
    if (rendererMode === RENDERER_MODES.THREE_SURFACE && threeMapRenderer) {
        setDiagnosticsText(JSON.stringify(buildThreeSurfaceDiagnostics(), null, 2));
        return;
    }
    if (globeRenderer.isActive(camera.cellSize)) {
        setDiagnosticsText(JSON.stringify(buildGlobeDiagnostics(), null, 2));
    }
}

function drawThreeSurfaceTuningOverlay() {
    if (rendererMode !== RENDERER_MODES.THREE_SURFACE || !threeMapRenderer) {
        return;
    }

    const diagnostics = buildThreeSurfaceDiagnostics();
    const surface = diagnostics.surface;
    if (!surface) {
        return;
    }

    const lines = [
        'Renderer: three_surface',
        `State: ${surface.state}`,
        `Texture: ${surface.textureMode}`,
        `Tiles: ${surface.tileRepeats} / Polar fade: ${surface.polarFade.toFixed(2)}`,
        `Curve progress: ${surface.curveProgress.toFixed(3)}`,
        `Transition curve: ${surface.transitionCurve.toFixed(3)}`,
        `Coverage: ${surface.coverageU.toFixed(3)} x ${surface.coverageV.toFixed(3)}`,
        surface.worldCoverageU !== undefined ? `World coverage: ${surface.worldCoverageU.toFixed(3)} x ${surface.worldCoverageV.toFixed(3)}` : 'World coverage: n/a',
        surface.projection ? `Cell px: ${surface.projection.projectedCellWidthPx.toFixed(2)} x ${surface.projection.projectedCellHeightPx.toFixed(2)}` : 'Cell px: n/a',
        surface.projection ? `Cell ratio error: ${surface.projection.ratioError.toFixed(3)}` : 'Cell ratio error: n/a',
        surface.continuity ? `Focus drift (grid): ${surface.continuity.deltaGridX.toFixed(2)}, ${surface.continuity.deltaGridY.toFixed(2)}` : 'Focus drift (grid): n/a',
        surface.continuity ? `Focus drift (lon/lat): ${surface.continuity.lonError.toFixed(4)}, ${surface.continuity.latError.toFixed(4)}` : 'Focus drift (lon/lat): n/a',
        surface.seam ? `Seam window: ${surface.seam.windowStartU.toFixed(3)} -> ${surface.seam.windowEndU.toFixed(3)} (cross: ${surface.seam.crossesSeam})` : 'Seam window: n/a',
        `Interactive: ${surface.interactive}`,
        `Cell size: ${surface.cellSize.toFixed(2)}`,
        surface.zoom ? `Zoom headroom: ${surface.zoom.zoomOutHeadroom.toFixed(2)} (min: ${surface.zoom.minCellSize.toFixed(2)})` : 'Zoom headroom: n/a',
        `Center: ${diagnostics.mapCenterGrid.x}, ${diagnostics.mapCenterGrid.y}`,
        diagnostics.focusGrid ? `Focus: ${diagnostics.focusGrid.x}, ${diagnostics.focusGrid.y}` : 'Focus: n/a',
        diagnostics.transitionVisuals ? `Fog blend: ${diagnostics.transitionVisuals.fogRevealBlend.toFixed(3)}` : 'Fog blend: n/a',
        diagnostics.transitionVisuals ? `Icons alpha: ${diagnostics.transitionVisuals.iconAlpha.toFixed(3)}` : 'Icons alpha: n/a',
        surface.warnings && surface.warnings.length > 0 ? `Warnings: ${surface.warnings.join(', ')}` : 'Warnings: none'
    ];

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(16, 16, 280, 18 + (lines.length * 18));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '12px monospace';
    lines.forEach((line, index) => {
        ctx.fillText(line, 24, 24 + (index * 18));
    });
    ctx.restore();
}

function drawThreeSurfaceAtmosphereOverlay(surfaceDiagnostics) {
    if (!surfaceDiagnostics || surfaceDiagnostics.state !== ThreeMapRenderer.RENDER_STATES.GLOBE_3D) {
        return;
    }

    const curveProgress = clamp01(surfaceDiagnostics.curveProgress || 0);
    if (curveProgress < 0.45) {
        return;
    }

    const alpha = Math.min(0.22, (curveProgress - 0.45) * 0.4);
    if (alpha <= 0.001) {
        return;
    }

    const cx = camera.canvasWidth / 2;
    const cy = camera.canvasHeight / 2;
    const outerRadius = Math.hypot(camera.canvasWidth, camera.canvasHeight) * 0.56;
    const innerRadius = outerRadius * 0.7;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const radial = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
    radial.addColorStop(0, 'rgba(120, 170, 220, 0)');
    radial.addColorStop(0.7, `rgba(120, 170, 220, ${alpha * 0.45})`);
    radial.addColorStop(1, `rgba(120, 170, 220, ${alpha})`);
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, camera.canvasWidth, camera.canvasHeight);
    ctx.restore();
}

function drawGlobeTuningOverlay() {
    if (!globeRenderer.isActive(camera.cellSize)) {
        return;
    }

    const diagnostics = buildGlobeDiagnostics();
    const lines = [
        `Globe blend: ${diagnostics.blend.toFixed(3)}`,
        `Distance: ${diagnostics.globeCamera.distance.toFixed(2)}`,
        `FOV: ${diagnostics.globeCamera.fov.toFixed(2)}`,
        `Zoom progress: ${diagnostics.globeCamera.zoomProgress.toFixed(3)}`,
        `Curvature: ${diagnostics.globeCamera.curvatureProgress.toFixed(3)} (x${diagnostics.globeCamera.radiusScale.toFixed(2)})`,
        `Center: ${diagnostics.mapCenterGrid.x}, ${diagnostics.mapCenterGrid.y}`,
        `Map view: ${diagnostics.mapViewCells.width.toFixed(1)} x ${diagnostics.mapViewCells.height.toFixed(1)} cells`,
        diagnostics.globeProjection ? `Globe view: ${diagnostics.globeProjection.visibleWidthCells.toFixed(1)} x ${diagnostics.globeProjection.visibleHeightCells.toFixed(1)} cells` : 'Globe view: n/a',
        diagnostics.globeProjection ? `Cell px: ${diagnostics.globeProjection.projectedCellWidthPx.toFixed(1)} x ${diagnostics.globeProjection.projectedCellHeightPx.toFixed(1)}` : 'Cell px: n/a'
    ];

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(16, 16, 280, 18 + (lines.length * 18));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '12px monospace';
    lines.forEach((line, index) => {
        ctx.fillText(line, 24, 24 + (index * 18));
    });
    ctx.restore();
}

function isRegionDebugVisible() {
    return !debugMenu.classList.contains('hidden');
}

function getRegionDebugInfo(regionX, regionY) {
    const label = `${String.fromCharCode(65 + regionY)}${regionX + 1}`;
    const hue = ((regionY * 6) + regionX) * 33;
    return {
        label,
        fill: `hsla(${hue}, 85%, 55%, 0.24)`,
        stroke: `hsla(${hue}, 90%, 78%, 0.95)`
    };
}

function drawRegionDebugOverlay(targetCtx = ctx) {
    const columns = 6;
    const rows = 6;
    const regionWidth = gameState.gridSize / columns;
    const regionHeight = gameState.gridSize / rows;

    targetCtx.save();
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';

    for (let regionY = 0; regionY < rows; regionY++) {
        for (let regionX = 0; regionX < columns; regionX++) {
            const info = getRegionDebugInfo(regionX, regionY);
            const gridLeft = regionX * regionWidth;
            const gridTop = regionY * regionHeight;
            const screenLeft = (gridLeft * camera.cellSize) - camera.x;
            const screenTop = (gridTop * camera.cellSize) - camera.y;
            const screenWidth = regionWidth * camera.cellSize;
            const screenHeight = regionHeight * camera.cellSize;

            targetCtx.fillStyle = info.fill;
            targetCtx.fillRect(screenLeft, screenTop, screenWidth, screenHeight);
            targetCtx.strokeStyle = info.stroke;
            targetCtx.lineWidth = Math.max(1, 2 / dpr);
            targetCtx.strokeRect(screenLeft, screenTop, screenWidth, screenHeight);

            const fontSize = Math.max(12, Math.min(42, Math.floor(Math.min(screenWidth, screenHeight) * 0.18)));
            if (fontSize >= 12) {
                targetCtx.font = `bold ${fontSize}px monospace`;
                targetCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                targetCtx.fillText(info.label, screenLeft + (screenWidth / 2), screenTop + (screenHeight / 2));
            }
        }
    }

    targetCtx.restore();
}

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function parseHexColorForBlend(color) {
    if (typeof color !== 'string') {
        return null;
    }

    const normalized = color.trim();
    if (!normalized.startsWith('#')) {
        return null;
    }

    if (normalized.length === 4) {
        return {
            r: parseInt(normalized[1] + normalized[1], 16),
            g: parseInt(normalized[2] + normalized[2], 16),
            b: parseInt(normalized[3] + normalized[3], 16)
        };
    }

    if (normalized.length === 7) {
        return {
            r: parseInt(normalized.slice(1, 3), 16),
            g: parseInt(normalized.slice(3, 5), 16),
            b: parseInt(normalized.slice(5, 7), 16)
        };
    }

    return null;
}

function blendHexColors(colorA, colorB, amount) {
    const rgbA = parseHexColorForBlend(colorA);
    const rgbB = parseHexColorForBlend(colorB);
    if (!rgbA || !rgbB) {
        return amount >= 0.5 ? colorB : colorA;
    }

    const t = clamp01(amount);
    const mix = (a, b) => Math.round(a + ((b - a) * t));
    return `rgb(${mix(rgbA.r, rgbB.r)}, ${mix(rgbA.g, rgbB.g)}, ${mix(rgbA.b, rgbB.b)})`;
}

function getThreeSurfaceTransitionMapOptions(cellSize = camera.cellSize) {
    if (rendererMode !== RENDERER_MODES.THREE_SURFACE || !threeMapRenderer) {
        return null;
    }

    const state = getThreeSurfaceState(cellSize);
    if (state !== ThreeMapRenderer.RENDER_STATES.TRANSITION_PATCH) {
        return null;
    }

    const transitionCurve = clamp01(threeMapRenderer.getTransitionCurve(cellSize));
    return {
        transitionCurve,
        fogRevealBlend: transitionCurve,
        iconAlpha: 1 - transitionCurve,
        gridAlpha: 1 - (0.85 * transitionCurve)
    };
}

function renderFlatMapSnapshot(showRegionDebug = false, mapOptions = null) {
    rendererSnapshotCtx.clearRect(0, 0, camera.canvasWidth, camera.canvasHeight);
    drawMap(rendererSnapshotCtx, mapOptions || undefined);
    if (showRegionDebug) {
        drawRegionDebugOverlay(rendererSnapshotCtx);
    }
}

// INITIAL CAMERA POSITION
const currentGridWidth = gameState.grid.width;
const currentGridHeight = gameState.grid.height;
let startCellX = Math.floor(currentGridWidth / 2);
let startCellY = Math.floor(currentGridHeight / 2);
for (let y = 0; y < currentGridHeight; y++) {
    for (let x = 0; x < currentGridWidth; x++) {
        const cell = gameState.grid.getCell(x, y);
        if (cell && cell.item === "Space Ship") {
            startCellX = x;
            startCellY = y;
            break;
        }
    }
}
camera.centerOn(startCellX, startCellY);
camera.x = camera.targetX;
camera.y = camera.targetY;
camera.clamp();
camera.clampTarget();
if (threeMapRenderer) {
    threeMapRenderer.setViewFromGrid(startCellX, startCellY, gameState.gridSize, gameState.gridSize);
}
syncGlobeToCameraCenter();
window.addEventListener("resize", handleViewportResize);
window.addEventListener("pageshow", handleViewportResize);
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        lastTime = performance.now();
        handleViewportResize();
        draw();
    }
});

function drawMap(targetCtx = ctx, renderOptions = null) {
    const options = renderOptions || {};
    const fogRevealBlend = clamp01(options.fogRevealBlend ?? 0);
    const iconAlpha = clamp01(options.iconAlpha ?? 1);
    const gridAlpha = clamp01(options.gridAlpha ?? 1);
    const range = camera.getVisibleRange();

    for (let y = range.startY; y <= range.endY; y++) {
        for (let x = range.startX; x <= range.endX; x++) {
            const cell = gameState.grid.getCell(x, y);
            const screenX = (x * camera.cellSize) - camera.x;
            const screenY = (y * camera.cellSize) - camera.y;

            const revealedColor = cell.getDisplayColor(true);
            let fillColor = cell.getDisplayColor(gameState.grid.debugRevealAll);
            if (!gameState.grid.debugRevealAll && !cell.revealed) {
                if (gameState.grid.canReveal(x, y)) {
                    fillColor = blendHexColors('#444444', revealedColor, fogRevealBlend);
                } else {
                    fillColor = blendHexColors(cell.getDisplayColor(false), revealedColor, fogRevealBlend);
                }
            }

            targetCtx.fillStyle = fillColor;
            targetCtx.fillRect(Math.floor(screenX), Math.floor(screenY), Math.ceil(camera.cellSize), Math.ceil(camera.cellSize));

            if (camera.cellSize > 15 && gridAlpha > 0.001) {
                targetCtx.strokeStyle = `rgba(0, 0, 0, ${0.1 * gridAlpha})`;
                targetCtx.lineWidth = 1 / dpr;
                targetCtx.strokeRect(Math.floor(screenX), Math.floor(screenY), Math.ceil(camera.cellSize), Math.ceil(camera.cellSize));
            }

            if ((cell.revealed || gameState.grid.debugRevealAll) && iconAlpha > 0.001) {
                const fontSize = Math.floor(camera.cellSize * 0.5);
                if (fontSize > 6) {
                    if (iconAlpha < 0.999) {
                        targetCtx.save();
                        targetCtx.globalAlpha *= iconAlpha;
                    }

                    targetCtx.textAlign = "center";
                    targetCtx.textBaseline = "middle";
                    targetCtx.font = `${fontSize}px Arial`;

                    if (cell.character) {
                        targetCtx.fillText(uiManager.getCharacterEmoji(cell.character.type), screenX + camera.cellSize / 2, screenY + camera.cellSize / 2);
                        if (cell.character.owned) {
                            targetCtx.strokeStyle = cell.character.isHungry ? "#FF0000" : "#FFD700";
                            targetCtx.lineWidth = 2;
                            targetCtx.strokeRect(Math.floor(screenX) + 2, Math.floor(screenY) + 2, Math.ceil(camera.cellSize) - 4, Math.ceil(camera.cellSize) - 4);
                            if (cell.character.isHungry) {
                                targetCtx.fillStyle = "red";
                                targetCtx.font = `bold ${Math.floor(fontSize * 0.8)}px Arial`;
                                targetCtx.fillText("🍴", screenX + camera.cellSize * 0.8, screenY + camera.cellSize * 0.2);
                            }
                        }
                    } else if (cell.item) {
                        targetCtx.fillText(uiManager.getItemEmoji(cell.item), screenX + camera.cellSize / 2, screenY + camera.cellSize / 2);
                    }

                    if (iconAlpha < 0.999) {
                        targetCtx.restore();
                    }
                }
            }
        }
    }
}

// --- RENDERING ---
function draw() {
    ctx.clearRect(0, 0, camera.canvasWidth, camera.canvasHeight);

    if (rendererMode === RENDERER_MODES.THREE_SURFACE && threeMapRenderer) {
        const showRegionDebug = isRegionDebugVisible();
        const renderState = getThreeSurfaceState(camera.cellSize);

        if (renderState === ThreeMapRenderer.RENDER_STATES.GRID_2D) {
            drawMap();
            if (showRegionDebug) {
                drawRegionDebugOverlay();
            }
        } else {
            const transitionMapOptions = renderState === ThreeMapRenderer.RENDER_STATES.TRANSITION_PATCH
                ? getThreeSurfaceTransitionMapOptions(camera.cellSize)
                : null;

            if (transitionMapOptions) {
                renderFlatMapSnapshot(showRegionDebug, transitionMapOptions);
            }

            const renderResult = threeMapRenderer.render(ctx, gameState.grid, camera, {
                showRegionDebug,
                snapshotCanvas: transitionMapOptions ? rendererSnapshotCanvas : null
            });
            if (!renderResult || !renderResult.rendered) {
                drawMap(ctx, transitionMapOptions || undefined);
                if (showRegionDebug) {
                    drawRegionDebugOverlay();
                }
            } else if (renderState === ThreeMapRenderer.RENDER_STATES.GLOBE_3D) {
                drawThreeSurfaceAtmosphereOverlay(threeMapRenderer.getDiagnostics(camera));
            }
        }

        refreshDiagnosticsForCurrentView();
        if (showRegionDebug) {
            drawThreeSurfaceTuningOverlay();
        }
        return;
    }

    const globeBlend = getGlobeBlend();
    const showRegionDebug = isRegionDebugVisible();
    if (globeBlend < 0.999) {
        ctx.save();
        ctx.globalAlpha = 1 - globeBlend;
        drawMap();
        if (showRegionDebug) {
            drawRegionDebugOverlay();
        }
        ctx.restore();
    }

    if (globeBlend > 0.001) {
        globeRenderer.render(ctx, gameState.grid, camera.cellSize, globeBlend, showRegionDebug);
    }

    refreshDiagnosticsForCurrentView();
    if (showRegionDebug) {
        drawGlobeTuningOverlay();
    }
}

// --- MAIN LOOP ---
let lastTime = performance.now();

function gameLoop() {
    const now = performance.now();
    const deltaTime = now - lastTime;
    lastTime = now;

    if (rendererMode === RENDERER_MODES.THREE_SURFACE) {
        camera.update();
        engine.update(deltaTime);
        draw();
        requestAnimationFrame(gameLoop);
        return;
    }

    const shouldUseGlobe = globeRenderer.isActive(camera.targetCellSize);
    const globeInteractiveNow = globeRenderer.isInteractive(camera.targetCellSize);

    if (shouldUseGlobe && !globeWasActive) {
        syncGlobeToCameraCenter();
    }

    if (shouldUseGlobe) {
        if (globeInteractiveNow || globeInteractionWasActive) {
            syncCameraToGlobeFocus();
        } else {
            syncGlobeToCameraCenter();
        }
    }

    camera.update();
    globeRenderer.update();
    engine.update(deltaTime);

    draw();
    globeWasActive = globeRenderer.isActive(camera.cellSize);
    globeInteractionWasActive = globeInteractiveNow;
    requestAnimationFrame(gameLoop);
}

// --- DEBUG MENU HANDLERS ---
const debugMenu = document.getElementById("debug-menu");
const settingsMenu = document.getElementById("settings-menu");
const settingsBtn = document.getElementById("settings-btn");
const musicToggle = document.getElementById("music-toggle");
const startOverBtn = document.getElementById("start-over-btn");
const debugToggleMap = document.getElementById("debug-toggle-map");
const debugAddWood = document.getElementById("debug-add-wood");
const debugAddOre = document.getElementById("debug-add-ore");
const debugAddCarrot = document.getElementById("debug-add-carrot");
const diagnosticsPanel = document.getElementById("click-diagnostics");
const diagnosticsOutput = document.getElementById("diagnostics-output");
const copyDiagnosticsBtn = document.getElementById("copy-diagnostics");
let latestDiagnosticsText = "Click a cell to capture diagnostics.";

function setDiagnosticsText(text) {
    latestDiagnosticsText = text;
    if (diagnosticsOutput) {
        diagnosticsOutput.textContent = text;
    }
}

function syncDiagnosticsVisibility() {
    if (diagnosticsPanel) {
        diagnosticsPanel.classList.toggle("hidden", debugMenu.classList.contains("hidden"));
    }
}

document.getElementById("debug-btn").addEventListener("click", () => {
    soundEffects.requestSong();
    debugMenu.classList.toggle("hidden");
    settingsMenu.classList.add("hidden");
    syncDiagnosticsVisibility();
});

settingsBtn.addEventListener("click", () => {
    settingsMenu.classList.toggle("hidden");
    debugMenu.classList.add("hidden");
    syncDiagnosticsVisibility();
});

musicToggle.addEventListener("change", (e) => {
    const enabled = e.target.checked;
    soundEffects.setMusicEnabled(enabled);
    if (enabled) {
        pLog.log(91);
        soundEffects.requestSong();
    } else {
        pLog.log(92);
    }
});

startOverBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to start over? This action cannot be undone and all your progress will be lost.")) {
        gameState.resetGame();
    }
});

syncDiagnosticsVisibility();

copyDiagnosticsBtn.addEventListener("click", async () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(latestDiagnosticsText);
            return;
        } catch (err) {
        }
    }

    const textarea = document.createElement("textarea");
    textarea.value = latestDiagnosticsText;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
});

debugToggleMap.addEventListener("click", () => {
    gameState.grid.toggleDebug();
});

debugAddWood.addEventListener("click", () => {
    for (let i = 0; i < 10; i++) {
        gameState.inventory.addItem("wood");
    }
    uiManager.updateInventoryUI();
    uiManager.updateMissions();
});

debugAddOre.addEventListener("click", () => {
    for (let i = 0; i < 10; i++) {
        gameState.inventory.addItem("ore");
    }
    uiManager.updateInventoryUI();
    uiManager.updateMissions();
});

debugAddCarrot.addEventListener("click", () => {
    for (let i = 0; i < 10; i++) {
        gameState.inventory.addItem("carrot");
    }
    uiManager.updateInventoryUI();
    uiManager.updateMissions();
});

// --- INPUT HANDLERS ---
const missionsList = document.getElementById("missions-list");
const inventoryInfo = document.getElementById("inventory-info");

inventoryInfo.addEventListener("click", (e) => {
    soundEffects.requestSong();
    const jumpBtn = e.target.closest(".hungry-jump");
    if (jumpBtn) {
        const type = jumpBtn._type;
        for (let y = 0; y < gameState.gridSize; y++) {
            for (let x = 0; x < gameState.gridSize; x++) {
                const char = gameState.grid.getCell(x, y).character;
                if (char && char.type === type && char.owned && char.isHungry) {
                    camera.centerOn(x, y);
                    return;
                }
            }
        }
    }
});

missionsList.addEventListener("click", (e) => {
    soundEffects.requestSong();
    uiManager.handleMissionClick(e.target);
});

const activePointers = new Map();
let lastPinchDistance = null;
let isDragging = false, lastX = 0, lastY = 0, movedSinceDown = false;

function getDistance(p1, p2) { return Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2)); }
function getMidpoint(p1, p2) { return { x: (p1.clientX + p2.clientX) / 2, y: (p1.clientY + p2.clientY) / 2 }; }

canvas.addEventListener("pointerdown", (e) => {
    soundEffects.requestSong();
    activePointers.set(e.pointerId, e);
    canvas.setPointerCapture(e.pointerId);
    if (activePointers.size === 1) {
        isDragging = true; lastX = e.clientX; lastY = e.clientY; movedSinceDown = false;
    } else if (activePointers.size === 2) {
        isDragging = false;
        const pointers = Array.from(activePointers.values());
        lastPinchDistance = getDistance(pointers[0], pointers[1]);
    }
});

canvas.addEventListener("pointermove", (e) => {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, e);
    if (activePointers.size === 1 && isDragging) {
        const deltaClientX = e.clientX - lastX;
        const deltaClientY = e.clientY - lastY;
        if (Math.abs(deltaClientX) > 3 || Math.abs(deltaClientY) > 3) movedSinceDown = true;

        if (rendererMode === RENDERER_MODES.THREE_SURFACE && threeMapRenderer) {
            if (isThreeSurfaceGlobeInteractive()) {
                threeMapRenderer.rotateByScreenDelta(deltaClientX, deltaClientY);
            } else {
                const rect = canvas.getBoundingClientRect();
                const dx = (lastX - e.clientX) * (camera.canvasWidth / rect.width);
                const dy = (lastY - e.clientY) * (camera.canvasHeight / rect.height);
                camera.move(dx, dy);
            }
        } else if (isGlobeInteractionActive()) {
            globeRenderer.rotateByScreenDelta(deltaClientX, deltaClientY);
        } else {
            const rect = canvas.getBoundingClientRect();
            const dx = (lastX - e.clientX) * (camera.canvasWidth / rect.width);
            const dy = (lastY - e.clientY) * (camera.canvasHeight / rect.height);
            camera.move(dx, dy);
        }

        lastX = e.clientX;
        lastY = e.clientY;
    } else if (activePointers.size === 2) {
        const pointers = Array.from(activePointers.values());
        const currentDistance = getDistance(pointers[0], pointers[1]);
        if (lastPinchDistance) {
            const midpoint = getMidpoint(pointers[0], pointers[1]);
            const interactionPoint = rendererMode === RENDERER_MODES.THREE_SURFACE
                ? getThreeSurfaceInteractionPoint(midpoint.x, midpoint.y)
                : getCanvasPoint(midpoint.x, midpoint.y);
            camera.zoom(currentDistance / lastPinchDistance, interactionPoint.x, interactionPoint.y);
        }
        lastPinchDistance = currentDistance;
    }
});

function getCanvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (clientX - rect.left) * (camera.canvasWidth / rect.width),
        y: (clientY - rect.top) * (camera.canvasHeight / rect.height),
        rect
    };
}

function getThreeSurfaceInteractionPoint(clientX, clientY) {
    const canvasPoint = getCanvasPoint(clientX, clientY);
    if (rendererMode !== RENDERER_MODES.THREE_SURFACE || !threeMapRenderer || !threeMapRenderer.canProjectInteraction(camera.targetCellSize)) {
        return { ...canvasPoint, gridPos: camera.screenToGrid(canvasPoint.x, canvasPoint.y) };
    }

    const projected = threeMapRenderer.screenToGrid(canvasPoint.x, canvasPoint.y, gameState.gridSize, gameState.gridSize);
    if (!projected) {
        return { ...canvasPoint, gridPos: camera.screenToGrid(canvasPoint.x, canvasPoint.y) };
    }

    return {
        ...canvasPoint,
        x: projected.surfaceX,
        y: projected.surfaceY,
        gridPos: { x: projected.x, y: projected.y },
        projected
    };
}

function getVisibleCanvasBounds(rect) {
    const scaleX = camera.canvasWidth / rect.width;
    const scaleY = camera.canvasHeight / rect.height;

    return {
        left: Math.max(0, -rect.left * scaleX),
        top: Math.max(0, -rect.top * scaleY),
        right: Math.min(camera.canvasWidth, camera.canvasWidth - Math.max(0, rect.right - window.innerWidth) * scaleX),
        bottom: Math.min(camera.canvasHeight, camera.canvasHeight - Math.max(0, rect.bottom - window.innerHeight) * scaleY),
    };
}

function handlePointerUp(e) {
    activePointers.delete(e.pointerId);
    if (activePointers.size < 2) lastPinchDistance = null;
    if (activePointers.size === 0) isDragging = false;
}
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", handlePointerUp);

canvas.addEventListener("click", (e) => {
    soundEffects.requestSong();
    if (movedSinceDown || activePointers.size > 0) return;
    if (isThreeSurfaceGlobeInteractive()) {
        setDiagnosticsText(JSON.stringify({ mode: "three_surface", action: "click ignored while globe interaction is active" }, null, 2));
        return;
    }
    if (isGlobeInteractionActive()) {
        setDiagnosticsText(JSON.stringify({ mode: "globe", action: "click ignored while globe mode is active" }, null, 2));
        return;
    }

    const canvasPoint = rendererMode === RENDERER_MODES.THREE_SURFACE
        ? getThreeSurfaceInteractionPoint(e.clientX, e.clientY)
        : getCanvasPoint(e.clientX, e.clientY);
    const clickX = canvasPoint.x, clickY = canvasPoint.y;
    const gridPos = canvasPoint.gridPos || camera.screenToGrid(clickX, clickY);
    const visibleBounds = getVisibleCanvasBounds(canvasPoint.rect);
    const cell = gameState.grid.getCell(gridPos.x, gridPos.y);
    const panTarget = camera.getEdgePanTargetForCell(gridPos.x, gridPos.y, visibleBounds);
    const cellLeft = gridPos.x * camera.cellSize;
    const cellTop = gridPos.y * camera.cellSize;
    const threshold = camera.cellSize;
    const diagnostics = {
        clickClient: { x: e.clientX, y: e.clientY },
        canvasPoint: { x: clickX, y: clickY },
        canvasRect: {
            left: canvasPoint.rect.left,
            top: canvasPoint.rect.top,
            right: canvasPoint.rect.right,
            bottom: canvasPoint.rect.bottom,
            width: canvasPoint.rect.width,
            height: canvasPoint.rect.height
        },
        visibleBounds,
        globe: {
            blend: getGlobeBlend(),
            viewLon: globeRenderer.viewLon,
            viewLat: globeRenderer.viewLat
        },
        camera: {
            x: camera.x,
            y: camera.y,
            targetX: camera.targetX,
            targetY: camera.targetY,
            cellSize: camera.cellSize,
            targetCellSize: camera.targetCellSize,
            canvasWidth: camera.canvasWidth,
            canvasHeight: camera.canvasHeight
        },
        gridPos,
        cell: cell ? {
            revealedBeforeClick: cell.revealed,
            landType: cell.landType,
            hasItem: !!cell.item,
            hasCharacter: !!cell.character,
            worldLeft: cellLeft,
            worldTop: cellTop,
            screenLeft: cellLeft - camera.x,
            screenTop: cellTop - camera.y,
            screenRight: cellLeft + camera.cellSize - camera.x,
            screenBottom: cellTop + camera.cellSize - camera.y
        } : null,
        edgePan: {
            threshold,
            targetX: panTarget.targetX,
            targetY: panTarget.targetY,
            deltaX: panTarget.targetX - camera.x,
            deltaY: panTarget.targetY - camera.y
        }
    };

    const handled = uiManager.handleCellClick(gridPos.x, gridPos.y);
    diagnostics.clickHandled = handled;
    if (cell) {
        diagnostics.cell.revealedAfterClick = cell.revealed;
    }

    if (handled) {
        camera.targetX = panTarget.targetX;
        camera.targetY = panTarget.targetY;
    }

    diagnostics.cameraAfterClick = {
        targetX: camera.targetX,
        targetY: camera.targetY
    };
    setDiagnosticsText(JSON.stringify(diagnostics, null, 2));
});

const zoomInBtn = document.getElementById("zoom-in");
zoomInBtn.addEventListener("click", () => {
    soundEffects.requestSong();
    camera.zoom(1.2);
});
const zoomOutBtn = document.getElementById("zoom-out");
zoomOutBtn.addEventListener("click", () => {
    soundEffects.requestSong();
    camera.zoom(0.8);
});
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const interactionPoint = rendererMode === RENDERER_MODES.THREE_SURFACE
        ? getThreeSurfaceInteractionPoint(e.clientX, e.clientY)
        : getCanvasPoint(e.clientX, e.clientY);
    camera.zoom(e.deltaY < 0 ? 1.1 : 0.9, interactionPoint.x, interactionPoint.y);
}, { passive: false });

uiManager.updateInventoryUI();
gameLoop();
