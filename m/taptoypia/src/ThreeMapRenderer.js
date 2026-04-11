if (typeof module !== 'undefined' && module.exports) {
    ({ Tuning } = require('./Tuning.js'));
    ({ MapProjection } = require('./MapProjection.js'));
}

class ThreeMapRenderer {
    static get RENDER_STATES() {
        return {
            GRID_2D: 'grid_2d',
            TRANSITION_PATCH: 'transition_patch',
            GLOBE_3D: 'globe_3d'
        };
    }

    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.three = null;
        this.threeReady = false;
        this.threeLoadPromise = null;
        this.loadError = null;

        this.renderer = null;
        this.scene = null;
        this.camera3d = null;
        this.renderCanvas = null;
        this.textureCanvas = null;
        this.textureContext = null;
        this.texture = null;
        this.surfaceMesh = null;
        this.surfacePivot = null;
        this.surfaceGeometry = null;
        this.baseUvs = null;
        this.raycaster = null;
        this.ndcPointer = null;

        this.textureWidth = 0;
        this.textureHeight = 0;
        this.textureCellPixels = 12;
        this.lastTextureCellPixels = 0;
        this.maxTextureSize = 8192;
        this.lastTextureBuildMs = -Infinity;
        this.lastTextureDetailBucket = '';
        this.lastCurveProgress = null;
        this.lastViewWidth = 0;
        this.lastViewHeight = 0;
        this.lastCoverageU = 1;
        this.lastCoverageV = 1;
        this.currentCoverage = { u: 1, v: 1 };
        this.currentOffset = { u: 0, v: 0 };
        this.lastGridWidth = Tuning.GRID_SIZE || 300;
        this.lastGridHeight = Tuning.GRID_SIZE || 300;
        this.lastProjectionMetrics = null;

        this.viewLon = 0;
        this.viewLat = 0;
        this.targetViewLon = 0;
        this.targetViewLat = 0;
        this.spinVelocityLon = 0;
        this.spinVelocityLat = 0;
        this.transitionRotationX = 0;
        this.transitionRotationY = 0;
        this.targetTransitionRotationX = 0;
        this.targetTransitionRotationY = 0;
        this.hasInitialViewSync = false;

        this.renderState = ThreeMapRenderer.RENDER_STATES.GRID_2D;
        this.snapshotMaxSize = Tuning.THREE_SURFACE_SNAPSHOT_MAX_SIZE || 2048;
        this.globeTileRepeats = Math.max(2, Math.floor(Tuning.THREE_SURFACE_GLOBE_LONGITUDE_TILES || 4));
        this.globePolarFade = Math.max(0, Math.min(0.45, Tuning.THREE_SURFACE_GLOBE_POLAR_FADE ?? 0.12));
        this.globePolarColor = Tuning.THREE_SURFACE_GLOBE_POLAR_COLOR || '#2A4363';
        this.transitionDebugLastLogMs = -Infinity;

        if (typeof document !== 'undefined') {
            this.ensureThreeReady();
        }
    }

    static getThreeModuleUrl() {
        if (typeof document === 'undefined') {
            return null;
        }

        const script = document.querySelector('script[src$="src/ThreeMapRenderer.js"]');
        if (script && script.src) {
            return new URL('../vendor/three/three.module.min.js', script.src).href;
        }

        return new URL('./vendor/three/three.module.min.js', window.location.href).href;
    }

    ensureThreeReady() {
        if (this.threeReady || this.loadError || typeof document === 'undefined') {
            return this.threeLoadPromise;
        }
        if (this.threeLoadPromise) {
            return this.threeLoadPromise;
        }

        this.threeLoadPromise = import(ThreeMapRenderer.getThreeModuleUrl())
            .then((THREE) => {
                this.initializeThree(THREE);
                this.threeReady = true;
                return THREE;
            })
            .catch((err) => {
                this.loadError = err;
                console.error('Failed to load vendored three.js for ThreeMapRenderer', err);
                throw err;
            });

        return this.threeLoadPromise;
    }

    initializeThree(THREE) {
        this.three = THREE;
        this.renderCanvas = document.createElement('canvas');
        this.textureCanvas = document.createElement('canvas');
        this.textureContext = this.textureCanvas.getContext('2d');
        this.raycaster = new THREE.Raycaster();
        this.ndcPointer = new THREE.Vector2();

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.renderCanvas,
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: false,
        });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setPixelRatio(window.devicePixelRatio || 1);
        this.renderer.setSize(this.canvasWidth, this.canvasHeight, false);
        if ('outputColorSpace' in this.renderer && 'SRGBColorSpace' in THREE) {
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        }
        if (this.renderer.capabilities && this.renderer.capabilities.maxTextureSize) {
            this.maxTextureSize = this.renderer.capabilities.maxTextureSize;
        }

        this.scene = new THREE.Scene();
        this.camera3d = new THREE.PerspectiveCamera(24, this.canvasWidth / Math.max(this.canvasHeight, 1), 0.1, 4000);
        this.camera3d.position.set(0, 0, 10);
        this.camera3d.lookAt(0, 0, 0);

        this.texture = new THREE.CanvasTexture(this.textureCanvas);
        if ('colorSpace' in this.texture && 'SRGBColorSpace' in THREE) {
            this.texture.colorSpace = THREE.SRGBColorSpace;
        }
        this.texture.wrapS = THREE.ClampToEdgeWrapping;
        this.texture.wrapT = THREE.ClampToEdgeWrapping;
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.generateMipmaps = false;
        this.texture.flipY = false;

        const geometry = new THREE.PlaneGeometry(1, 1, 128, 96);
        this.surfaceGeometry = geometry;
        this.baseUvs = new Float32Array(geometry.attributes.uv.array);
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            side: THREE.DoubleSide,
        });
        this.surfaceMesh = new THREE.Mesh(geometry, material);
        this.surfaceMesh.frustumCulled = false;
        this.surfacePivot = new THREE.Group();
        this.surfacePivot.add(this.surfaceMesh);
        this.scene.add(this.surfacePivot);

        this.resize(this.canvasWidth, this.canvasHeight);
    }

    resize(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        if (!this.renderer || !this.camera3d) {
            return;
        }

        this.renderer.setPixelRatio((typeof window !== 'undefined' && window.devicePixelRatio) || 1);
        this.renderer.setSize(canvasWidth, canvasHeight, false);
        this.camera3d.aspect = canvasWidth / Math.max(canvasHeight, 1);
        this.camera3d.updateProjectionMatrix();
    }

    smoothstep(value) {
        const clamped = Math.max(0, Math.min(1, value));
        return clamped * clamped * (3 - (2 * clamped));
    }

    getPostFormationZoomProgress(cellSize) {
        const thresholds = this.getStateThresholds();
        const minCellSize = Tuning.CAMERA_MIN_CELL_SIZE || 1.25;
        const span = thresholds.globeEnter - minCellSize;
        if (span <= 0) {
            return cellSize <= minCellSize ? 1 : 0;
        }
        return this.smoothstep((thresholds.globeEnter - cellSize) / span);
    }

    applyLatLonDelta(lonDelta, latDelta) {
        let lon = this.targetViewLon + lonDelta;
        let lat = this.targetViewLat + latDelta;
        const halfPi = Math.PI * 0.5;

        // Reflect at the poles so dragging remains continuous instead of hard-clamped.
        while (lat > halfPi) {
            lat = Math.PI - lat;
            lon += Math.PI;
        }
        while (lat < -halfPi) {
            lat = -Math.PI - lat;
            lon += Math.PI;
        }

        this.targetViewLon = MapProjection.wrapLongitude(lon);
        this.targetViewLat = MapProjection.clampLatitude(lat);
    }

    syncPivotFromView() {
        if (!this.surfacePivot) {
            return;
        }

        this.transitionRotationY = -this.viewLon;
        this.transitionRotationX = this.viewLat;
        this.targetTransitionRotationY = this.transitionRotationY;
        this.targetTransitionRotationX = this.transitionRotationX;
        this.spinVelocityLon = 0;
        this.spinVelocityLat = 0;
        this.surfacePivot.rotation.set(this.transitionRotationX, this.transitionRotationY, 0);
    }

    syncViewFromPivot() {
        if (!this.surfacePivot || !this.three) {
            return;
        }

        const forward = new this.three.Vector3(0, 0, 1).applyQuaternion(this.surfacePivot.quaternion);
        const lat = MapProjection.clampLatitude(Math.asin(MapProjection.clamp(forward.y, -1, 1)));
        const lon = MapProjection.wrapLongitude(Math.atan2(forward.x, forward.z));

        this.viewLon = lon;
        this.viewLat = lat;
        this.targetViewLon = lon;
        this.targetViewLat = lat;
    }

    getStateThresholds() {

        const transitionEnter = Tuning.THREE_SURFACE_TRANSITION_ENTER_CELL_SIZE || Tuning.THREE_SURFACE_CURVE_END_CELL_SIZE || 18;
        const transitionExit = Math.max(transitionEnter + 0.1, Tuning.THREE_SURFACE_TRANSITION_EXIT_CELL_SIZE || (transitionEnter + 4));
        const globeEnterConfigured = Tuning.THREE_SURFACE_GLOBE_ENTER_CELL_SIZE || Math.max(Tuning.CAMERA_MIN_CELL_SIZE || 1.25, transitionEnter * 0.45);
        const globeEnter = Math.max((Tuning.CAMERA_MIN_CELL_SIZE || 1.25), Math.min(globeEnterConfigured, transitionEnter - 0.1));
        const globeExit = Math.max(globeEnter + 0.1, Tuning.THREE_SURFACE_GLOBE_EXIT_CELL_SIZE || (globeEnter + 2));
        return { transitionEnter, transitionExit, globeEnter, globeExit };
    }

    updateRenderState(cellSize) {
        const states = ThreeMapRenderer.RENDER_STATES;
        const thresholds = this.getStateThresholds();

        if (this.renderState === states.GLOBE_3D) {
            this.renderState = states.TRANSITION_PATCH;
        }

        if (this.renderState === states.GRID_2D) {
            if (cellSize <= thresholds.transitionEnter) {
                this.renderState = states.TRANSITION_PATCH;
            }
            return this.renderState;
        }

        if (this.renderState === states.TRANSITION_PATCH) {
            if (cellSize >= thresholds.transitionExit) {
                this.renderState = states.GRID_2D;
                this.spinVelocityLon = 0;
                this.spinVelocityLat = 0;
            }
            return this.renderState;
        }

        this.renderState = states.TRANSITION_PATCH;
        return this.renderState;
    }

    getRenderState(cellSize) {
        return this.updateRenderState(cellSize);
    }

    getCurveProgress(cellSize) {
        const start = Tuning.THREE_SURFACE_CURVE_START_CELL_SIZE;
        const end = Tuning.THREE_SURFACE_CURVE_END_CELL_SIZE;
        const span = start - end;
        if (span <= 0) {
            return cellSize <= end ? 1 : 0;
        }
        return this.smoothstep((start - cellSize) / span);
    }

    getTransitionCurve(cellSize) {
        const thresholds = this.getStateThresholds();
        if (cellSize <= thresholds.globeEnter) {
            return 1;
        }
        if (cellSize >= thresholds.transitionEnter) {
            return 0;
        }

        const span = thresholds.transitionEnter - thresholds.globeEnter;
        if (span <= 0) {
            return 1;
        }

        const value = this.smoothstep((thresholds.transitionEnter - cellSize) / span);
        return value >= 0.96 ? 1 : value;
    }

    isInteractive(cellSize) {
        const state = this.updateRenderState(cellSize);
        if (state === ThreeMapRenderer.RENDER_STATES.GRID_2D) {
            return false;
        }

        const interactiveCurveMin = MapProjection.clamp(Tuning.THREE_SURFACE_INTERACTIVE_CURVE_MIN ?? 0.985, 0.8, 1);
        return this.getTransitionCurve(cellSize) >= interactiveCurveMin;
    }

    canProjectInteraction(cellSize) {
        return this.isReady() && this.updateRenderState(cellSize) !== ThreeMapRenderer.RENDER_STATES.GRID_2D;
    }

    setViewFromGrid(gridX, gridY, gridWidth, gridHeight) {
        const latLon = MapProjection.gridToLatLon(
            Math.max(0, Math.min(gridWidth - 1, gridX)),
            Math.max(0, Math.min(gridHeight - 1, gridY)),
            gridWidth,
            gridHeight
        );
        this.viewLon = latLon.lon;
        this.viewLat = latLon.lat;
        this.targetViewLon = latLon.lon;
        this.targetViewLat = latLon.lat;
        this.syncPivotFromView();
        this.hasInitialViewSync = true;
    }

    syncViewFromCamera(camera, gridWidth, gridHeight) {
        const centerGrid = this.getCameraCenterGrid(camera, gridWidth, gridHeight);
        const latLon = MapProjection.gridToLatLon(
            centerGrid.x,
            centerGrid.y,
            gridWidth,
            gridHeight
        );
        this.viewLon = latLon.lon;
        this.viewLat = latLon.lat;
        this.targetViewLon = latLon.lon;
        this.targetViewLat = latLon.lat;
        this.syncPivotFromView();
    }

    getCameraCenterGrid(camera, gridWidth, gridHeight) {
        const centerGridX = ((camera.x + (camera.canvasWidth / 2)) / camera.cellSize) - 0.5;
        const centerGridY = ((camera.y + (camera.canvasHeight / 2)) / camera.cellSize) - 0.5;
        return {
            x: MapProjection.clamp(centerGridX, 0, Math.max(0, gridWidth - 1)),
            y: MapProjection.clamp(centerGridY, 0, Math.max(0, gridHeight - 1))
        };
    }

    getLatLonFromCamera(camera, gridWidth, gridHeight) {
        const centerGrid = this.getCameraCenterGrid(camera, gridWidth, gridHeight);
        return MapProjection.gridToLatLon(centerGrid.x, centerGrid.y, gridWidth, gridHeight);
    }

    getProjectionMetrics(camera, gridWidth, gridHeight, coverage) {
        const worldCoverageU = MapProjection.clamp(coverage.u * this.globeTileRepeats, 0.000001, 1);
        const worldCoverageV = MapProjection.clamp(coverage.v, 0.000001, 1);
        const visibleWidthCells = worldCoverageU * Math.max(1, gridWidth);
        const visibleHeightCells = worldCoverageV * Math.max(1, gridHeight);
        const projectedCellWidthPx = this.canvasWidth / Math.max(visibleWidthCells, 0.000001);
        const projectedCellHeightPx = this.canvasHeight / Math.max(visibleHeightCells, 0.000001);
        const projectedCellRatio = projectedCellWidthPx / Math.max(projectedCellHeightPx, 0.000001);
        const ratioError = Math.abs(1 - projectedCellRatio);

        const viewWidth = this.canvasWidth / Math.max(camera.cellSize, 0.0001);
        const viewHeight = this.canvasHeight / Math.max(camera.cellSize, 0.0001);
        const radiusFromWidth = viewWidth / Math.max(worldCoverageU * Math.PI * 2, 0.0001);
        const radiusFromHeight = viewHeight / Math.max(worldCoverageV * Math.PI, 0.0001);
        const radiusSkew = radiusFromHeight <= 0 ? 1 : radiusFromWidth / radiusFromHeight;

        return {
            worldCoverageU,
            worldCoverageV,
            visibleWidthCells,
            visibleHeightCells,
            projectedCellWidthPx,
            projectedCellHeightPx,
            projectedCellRatio,
            ratioError,
            radiusFromWidth,
            radiusFromHeight,
            radiusSkew
        };
    }

    updateDebugMetrics(camera, gridWidth, gridHeight, coverage, curveProgress) {
        const cameraCenterGrid = this.getCameraCenterGrid(camera, gridWidth, gridHeight);
        const cameraLatLon = this.getLatLonFromCamera(camera, gridWidth, gridHeight);
        const focusGrid = this.getFocusGrid(gridWidth, gridHeight);
        const lonError = MapProjection.wrapLongitude(this.viewLon - cameraLatLon.lon);
        const latError = this.viewLat - cameraLatLon.lat;
        const projection = this.getProjectionMetrics(camera, gridWidth, gridHeight, coverage);

        const worldCoverageU = coverage.u * this.globeTileRepeats;
        const windowStartU = MapProjection.wrapUnitInterval(this.currentOffset.u * this.globeTileRepeats);
        const windowEndU = MapProjection.wrapUnitInterval(windowStartU + worldCoverageU);
        const seamCrosses = (windowStartU + worldCoverageU) > 1;

        const warnings = [];
        if (Math.abs(focusGrid.x - cameraCenterGrid.x) > 0.75 || Math.abs(focusGrid.y - cameraCenterGrid.y) > 0.75) {
            warnings.push('focus_grid_drift');
        }
        if (Math.abs(lonError) > ((Math.PI * 2) / Math.max(gridWidth, 1))) {
            warnings.push('focus_lon_drift');
        }
        if (Math.abs(latError) > (Math.PI / Math.max(gridHeight, 1))) {
            warnings.push('focus_lat_drift');
        }
        if (projection.ratioError > 0.18) {
            warnings.push('projected_cell_ratio_drift');
        }
        if (seamCrosses) {
            warnings.push('uv_window_crosses_seam');
        }

        this.lastProjectionMetrics = {
            gridWidth,
            gridHeight,
            curveProgress,
            cameraCenterGrid,
            focusGrid,
            lonError,
            latError,
            windowStartU,
            windowEndU,
            seamCrosses,
            warnings,
            ...projection
        };
    }

    applySurfaceRotation(yawDelta, pitchDelta) {
        if (!this.surfacePivot || !this.three) {
            return;
        }

        const yawQuat = new this.three.Quaternion().setFromAxisAngle(new this.three.Vector3(0, 1, 0), yawDelta);
        const pitchQuat = new this.three.Quaternion().setFromAxisAngle(new this.three.Vector3(1, 0, 0), pitchDelta);
        this.surfacePivot.quaternion.premultiply(yawQuat);
        this.surfacePivot.quaternion.premultiply(pitchQuat);
        this.surfacePivot.updateMatrixWorld(true);
        this.syncViewFromPivot();
    }

    rotateByScreenDelta(deltaX, deltaY) {
        const rotationSensitivity = MapProjection.clamp(Tuning.THREE_SURFACE_ROTATION_SENSITIVITY ?? 0.005, 0.001, 0.02);
        const yawDelta = deltaX * rotationSensitivity;
        const pitchDelta = deltaY * rotationSensitivity;
        this.applySurfaceRotation(yawDelta, pitchDelta);

        const momentumBoost = MapProjection.clamp(Tuning.THREE_SURFACE_MOMENTUM_BOOST ?? 0.03, 0, 0.25);
        const momentumBlend = MapProjection.clamp(Tuning.THREE_SURFACE_MOMENTUM_BLEND ?? 0.12, 0, 0.85);
        const maxVelocity = MapProjection.clamp(Tuning.THREE_SURFACE_MOMENTUM_MAX_SPEED ?? 0.005, 0.001, 0.03);
        this.spinVelocityLon = MapProjection.clamp((this.spinVelocityLon * momentumBlend) + (yawDelta * momentumBoost), -maxVelocity, maxVelocity);
        this.spinVelocityLat = MapProjection.clamp((this.spinVelocityLat * momentumBlend) + (pitchDelta * momentumBoost), -maxVelocity, maxVelocity);
    }

    updateInteractiveView() {
        const damping = MapProjection.clamp(Tuning.THREE_SURFACE_MOMENTUM_DAMPING ?? 0.78, 0.55, 0.95);
        const minSpeed = Math.max(0.000001, Tuning.THREE_SURFACE_MOMENTUM_MIN_SPEED ?? 0.00008);
        const maxVelocity = MapProjection.clamp(Tuning.THREE_SURFACE_MOMENTUM_MAX_SPEED ?? 0.005, 0.001, 0.03);

        if (Math.abs(this.spinVelocityLon) > minSpeed || Math.abs(this.spinVelocityLat) > minSpeed) {
            const yawDelta = MapProjection.clamp(this.spinVelocityLon, -maxVelocity, maxVelocity);
            const pitchDelta = MapProjection.clamp(this.spinVelocityLat, -maxVelocity, maxVelocity);
            this.applySurfaceRotation(yawDelta, pitchDelta);
            this.spinVelocityLon *= damping;
            this.spinVelocityLat *= damping;
        } else {
            this.spinVelocityLon = 0;
            this.spinVelocityLat = 0;
        }
    }

    getFocusGrid(gridWidth, gridHeight) {
        return MapProjection.latLonToGrid(this.viewLat, this.viewLon, gridWidth, gridHeight);
    }

    getCoverageForCellSize(cellSize, gridWidth, gridHeight) {
        const progress = this.getCurveProgress(cellSize);
        const visibleWidthCells = this.canvasWidth / Math.max(cellSize, 0.0001);
        const visibleHeightCells = this.canvasHeight / Math.max(cellSize, 0.0001);
        const fullWorldCoverageU = 1 / Math.max(1, this.globeTileRepeats);
        const initialCoverageU = MapProjection.clamp(
            (visibleWidthCells / Math.max(1, gridWidth)) * fullWorldCoverageU,
            0.005,
            fullWorldCoverageU
        );
        const initialCoverageV = MapProjection.clamp(visibleHeightCells / Math.max(1, gridHeight), 0.02, 1);
        return {
            u: initialCoverageU + ((fullWorldCoverageU - initialCoverageU) * progress),
            v: initialCoverageV + ((1 - initialCoverageV) * progress)
        };
    }

    updateTextureWindowFromView(coverage) {
        const centerWorldU = MapProjection.wrapUnitInterval((this.viewLon + Math.PI) / (Math.PI * 2));
        const centerV = MapProjection.clamp(((Math.PI / 2) - this.viewLat) / Math.PI, 0, 1);
        const worldCoverageU = coverage.u * this.globeTileRepeats;
        const worldOffsetU = MapProjection.wrapUnitInterval(centerWorldU - (worldCoverageU / 2));
        this.currentCoverage = { u: coverage.u, v: coverage.v };
        this.currentOffset = {
            u: worldOffsetU / this.globeTileRepeats,
            v: MapProjection.clamp(centerV - (coverage.v / 2), 0, 1 - coverage.v)
        };
        this.texture.repeat.set(coverage.u, coverage.v);
        this.texture.offset.set(this.currentOffset.u, this.currentOffset.v);
        this.texture.needsUpdate = true;
    }

    updateTextureWindowFromCamera(camera, gridWidth, gridHeight, coverage) {
        const topLeftGridX = camera.x / Math.max(camera.cellSize, 0.0001);
        const topLeftGridY = camera.y / Math.max(camera.cellSize, 0.0001);
        const worldOffsetU = MapProjection.wrapUnitInterval(topLeftGridX / Math.max(gridWidth, 1));
        this.currentCoverage = { u: coverage.u, v: coverage.v };
        this.currentOffset = {
            u: worldOffsetU / this.globeTileRepeats,
            v: MapProjection.clamp(topLeftGridY / Math.max(gridHeight, 1), 0, 1 - coverage.v)
        };
        this.texture.repeat.set(coverage.u, coverage.v);
        this.texture.offset.set(this.currentOffset.u, this.currentOffset.v);
        this.texture.needsUpdate = true;
    }

    parseHexColor(color) {
        const normalized = color.startsWith('#') ? color.slice(1) : color;
        return {
            r: parseInt(normalized.slice(0, 2), 16),
            g: parseInt(normalized.slice(2, 4), 16),
            b: parseInt(normalized.slice(4, 6), 16)
        };
    }

    getCharacterEmoji(type) {
        switch (type) {
            case 'WaterAnimal': return '🐬';
            case 'FireAnimal': return '🔥';
            case 'GrassAnimal': return '🐘';
            case 'Egg': return '🥚';
            default: return '🦁';
        }
    }

    getItemEmoji(item) {
        switch (item) {
            case 'Space Ship': return '🚀';
            case 'seed': return '🌱';
            case 'carrot': return '🥕';
            case 'tree': return '🌳';
            case 'wood': return '🪵';
            case 'house': return '🏠';
            case 'Research Center': return '🔬';
            case 'ore': return '🪨';
            case 'Communication Tower': return '📡';
            default: return '📦';
        }
    }

    blendColors(colorA, colorB, amount) {
        const a = this.parseHexColor(colorA);
        const b = this.parseHexColor(colorB);
        const t = Math.max(0, Math.min(1, amount));
        const mix = (start, end) => Math.round(start + ((end - start) * t));
        return `rgb(${mix(a.r, b.r)}, ${mix(a.g, b.g)}, ${mix(a.b, b.b)})`;
    }

    getCellFillColor(grid, x, y, cell, curveProgress) {
        const revealedColor = cell.getDisplayColor(true);
        if (cell.revealed || grid.debugRevealAll) {
            return revealedColor;
        }
        if (grid.canReveal(x, y)) {
            return this.blendColors('#444444', revealedColor, curveProgress);
        }
        return this.blendColors(cell.getDisplayColor(false), revealedColor, curveProgress);
    }

    getRegionDebugInfo(regionX, regionY) {
        const label = `${String.fromCharCode(65 + regionY)}${regionX + 1}`;
        const hue = ((regionY * 6) + regionX) * 33;
        return {
            label,
            fill: `hsla(${hue}, 85%, 55%, 0.24)`,
            stroke: `hsla(${hue}, 90%, 78%, 0.9)`
        };
    }

    drawRegionDebugOverlay(ctx, width, height) {
        const columns = 6;
        const rows = 6;
        const regionWidth = width / columns;
        const regionHeight = height / rows;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.max(10, Math.floor(Math.min(regionWidth, regionHeight) * 0.28))}px monospace`;

        for (let regionY = 0; regionY < rows; regionY++) {
            for (let regionX = 0; regionX < columns; regionX++) {
                const info = this.getRegionDebugInfo(regionX, regionY);
                const x = regionX * regionWidth;
                const y = regionY * regionHeight;
                ctx.fillStyle = info.fill;
                ctx.fillRect(x, y, regionWidth, regionHeight);
                ctx.strokeStyle = info.stroke;
                ctx.lineWidth = Math.max(1, Math.min(regionWidth, regionHeight) * 0.03);
                ctx.strokeRect(x, y, regionWidth, regionHeight);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.fillText(info.label, x + (regionWidth / 2), y + (regionHeight / 2));
            }
        }

        ctx.restore();
    }

    getMaxAllowedCellPixels(gridWidth, gridHeight) {
        const widthLimit = Math.floor(this.maxTextureSize / Math.max(1, gridWidth * this.globeTileRepeats));
        const heightLimit = Math.floor(this.maxTextureSize / Math.max(1, gridHeight));
        return Math.max(1, Math.min(widthLimit, heightLimit));
    }

    getTextureCellPixels(cellSize, curveProgress, gridWidth, gridHeight) {
        let desired;
        if (curveProgress >= 0.95) {
            desired = 6;
        } else if (curveProgress >= 0.72) {
            desired = 8;
        } else {
            desired = Math.max(12, Math.min(48, Math.round(cellSize * 0.6)));
        }

        const maxAllowed = this.getMaxAllowedCellPixels(gridWidth, gridHeight);
        return Math.max(1, Math.min(desired, maxAllowed));
    }

    getTextureDetailBucket(cellSize, curveProgress, showRegionDebug, textureMode = 'dynamic') {
        if (textureMode === 'terrain_only') {
            const intervalMs = 1800;
            const cellPixels = Math.max(2, Math.min(8, this.getTextureCellPixels(cellSize, 1, 300, 300)));
            return `terrain:${intervalMs}:${cellPixels}:${showRegionDebug ? 'debug' : 'normal'}`;
        }

        const iconsVisible = curveProgress < 0.72;
        const intervalMs = curveProgress >= 0.95 ? 1600 : (curveProgress >= 0.72 ? 900 : 350);
        const cellPixels = this.getTextureCellPixels(cellSize, curveProgress, 300, 300);
        return `${iconsVisible ? 'icons' : 'land'}:${intervalMs}:${cellPixels}:${showRegionDebug ? 'debug' : 'normal'}`;
    }

    shouldRebuildWorldTexture(cellSize, curveProgress, showRegionDebug = false, textureMode = 'dynamic') {
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const detailBucket = this.getTextureDetailBucket(cellSize, curveProgress, showRegionDebug, textureMode);
        const intervalMs = parseInt(detailBucket.split(':')[1], 10);
        if (detailBucket !== this.lastTextureDetailBucket) {
            this.lastTextureDetailBucket = detailBucket;
            this.lastTextureBuildMs = now;
            return true;
        }
        if ((now - this.lastTextureBuildMs) >= intervalMs) {
            this.lastTextureBuildMs = now;
            return true;
        }
        return this.textureWidth === 0 || this.textureHeight === 0;
    }

    rebuildWorldTexture(grid, cellSize, curveProgress, showRegionDebug = false, textureMode = 'dynamic') {
        const terrainOnly = textureMode === 'terrain_only';
        const effectiveCurveProgress = terrainOnly ? 1 : curveProgress;
        const cellPixels = this.getTextureCellPixels(cellSize, effectiveCurveProgress, grid.width, grid.height);
        this.lastTextureCellPixels = cellPixels;
        const width = grid.width * cellPixels * this.globeTileRepeats;
        const height = grid.height * cellPixels;
        if (this.textureWidth !== width || this.textureHeight !== height) {
            this.textureWidth = width;
            this.textureHeight = height;
            this.textureCanvas.width = width;
            this.textureCanvas.height = height;
        }

        const ctx = this.textureContext;
        const iconsVisible = !terrainOnly && effectiveCurveProgress < 0.72;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, width, height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.max(10, Math.floor(cellPixels * 0.9))}px Arial`;

        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const cell = grid.getCell(x, y);
                let fillColor = terrainOnly
                    ? cell.getDisplayColor(true)
                    : this.getCellFillColor(grid, x, y, cell, effectiveCurveProgress);

                if (terrainOnly && this.globePolarFade > 0) {
                    const latNorm = grid.height <= 1 ? 0.5 : (y / (grid.height - 1));
                    let poleWeight = 0;
                    if (latNorm < this.globePolarFade) {
                        poleWeight = (this.globePolarFade - latNorm) / this.globePolarFade;
                    } else if (latNorm > (1 - this.globePolarFade)) {
                        poleWeight = (latNorm - (1 - this.globePolarFade)) / this.globePolarFade;
                    }

                    if (poleWeight > 0.001) {
                        fillColor = this.blendColors(fillColor, this.globePolarColor, this.smoothstep(Math.min(1, poleWeight)));
                    }
                }

                for (let wrap = 0; wrap < this.globeTileRepeats; wrap++) {
                    const drawX = (x + (wrap * grid.width)) * cellPixels;
                    const drawY = y * cellPixels;
                    ctx.fillStyle = fillColor;
                    ctx.fillRect(drawX, drawY, cellPixels, cellPixels);

                    const shouldAlwaysShowIcon = cell.item === 'Space Ship' || cell.item === 'Research Center' || cell.item === 'Communication Tower' || cell.item === 'house';
                    if (iconsVisible && (cell.revealed || grid.debugRevealAll || shouldAlwaysShowIcon)) {
                        const icon = cell.character
                            ? this.getCharacterEmoji(cell.character.type)
                            : (cell.item ? this.getItemEmoji(cell.item) : '');
                        if (icon) {
                            ctx.fillStyle = '#ffffff';
                            ctx.fillText(icon, drawX + (cellPixels / 2), drawY + (cellPixels / 2) + 0.5);
                        }
                    }
                }
            }
        }

        if (showRegionDebug) {
            this.drawRegionDebugOverlay(ctx, width, height);
        }

        this.texture.needsUpdate = true;
    }

    ensureSnapshotTexture(snapshotCanvas) {
        if (!snapshotCanvas || !this.textureContext) {
            return false;
        }

        const sourceWidth = Math.max(1, snapshotCanvas.width || this.canvasWidth);
        const sourceHeight = Math.max(1, snapshotCanvas.height || this.canvasHeight);
        const maxDimension = Math.max(64, Math.min(this.snapshotMaxSize, this.maxTextureSize));
        const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
        const targetWidth = Math.max(1, Math.floor(sourceWidth * scale));
        const targetHeight = Math.max(1, Math.floor(sourceHeight * scale));

        if (this.textureCanvas.width !== targetWidth || this.textureCanvas.height !== targetHeight) {
            this.textureCanvas.width = targetWidth;
            this.textureCanvas.height = targetHeight;
            this.textureWidth = targetWidth;
            this.textureHeight = targetHeight;
        }

        this.textureContext.setTransform(1, 0, 0, 1, 0, 0);
        this.textureContext.imageSmoothingEnabled = false;
        this.textureContext.clearRect(0, 0, targetWidth, targetHeight);
        this.textureContext.drawImage(snapshotCanvas, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

        this.currentCoverage = { u: 1, v: 1 };
        this.currentOffset = { u: 0, v: 0 };
        this.texture.repeat.set(1, 1);
        this.texture.offset.set(0, 0);
        this.texture.needsUpdate = true;

        return true;
    }

    updateTransitionGeometry(transitionCurve, imageAspect) {
        if (!this.surfaceGeometry || !this.baseUvs) {
            return;
        }

        const curve = MapProjection.clamp(transitionCurve, 0, 1);
        const curvature = Math.max(curve, 0.0001);
        const radius = 1 / curvature;
        const flatPhiRange = imageAspect * Math.PI;
        const phiRange = flatPhiRange + (((Math.PI * 2) - flatPhiRange) * curve);

        const positionAttr = this.surfaceGeometry.attributes.position;
        const positions = positionAttr.array;

        for (let i = 0; i < positions.length; i += 3) {
            const uvIndex = (i / 3) * 2;
            const u = this.baseUvs[uvIndex];
            const v = this.baseUvs[uvIndex + 1];

            const phi = (0.5 - u) * phiRange;
            const thetaOffset = (v - 0.5) * Math.PI;
            const spherePhi = phi * curvature;
            const sphereTheta = (Math.PI * 0.5) + (thetaOffset * curvature);
            const sinTheta = Math.sin(sphereTheta);
            const cosTheta = Math.cos(sphereTheta);
            const sinPhi = Math.sin(spherePhi);
            const cosPhi = Math.cos(spherePhi);

            positions[i] = -radius * sinPhi * sinTheta;
            positions[i + 1] = radius * cosTheta;
            positions[i + 2] = radius * ((cosPhi * sinTheta) - 1);
        }

        positionAttr.needsUpdate = true;
        this.surfaceGeometry.computeVertexNormals();
        this.surfaceGeometry.computeBoundingSphere();
    }

    syncTransitionCamera(transitionCurve, imageAspect, cellSize) {
        const fov = 45;
        const cameraAspect = this.canvasWidth / Math.max(this.canvasHeight, 1);
        const vFovRadians = (fov * Math.PI) / 180;
        const flatWidth = imageAspect * Math.PI;
        const flatHeight = Math.PI;
        const closeZ = (Math.max(flatHeight, flatWidth / Math.max(cameraAspect, 0.0001)) / (2 * Math.tan(vFovRadians * 0.5))) * 1.05;
        const nearDistance = closeZ + 1;
        const formedDistance = 3;
        const formedBlend = MapProjection.clamp(transitionCurve, 0, 1);
        const postFormationZoomProgress = this.getPostFormationZoomProgress(cellSize);
        const zoomOutDistanceFactor = Math.max(1, Tuning.THREE_SURFACE_POST_FORM_DISTANCE_FACTOR ?? 3.25);
        const distanceAtFormation = nearDistance + ((formedDistance - nearDistance) * formedBlend);
        const farZoomDistance = formedDistance * zoomOutDistanceFactor;
        const distance = distanceAtFormation + ((farZoomDistance - formedDistance) * postFormationZoomProgress);

        this.camera3d.fov = fov;
        this.camera3d.aspect = cameraAspect;
        this.camera3d.position.set(0, 0, distance);
        this.camera3d.lookAt(0, 0, 0);
        this.camera3d.updateProjectionMatrix();

        if (this.surfaceMesh) {
            this.surfaceMesh.position.set(0, 0, 1);
        }
    }

    logTransitionDiagnostics(camera, transitionCurveRaw, transitionCurve, imageAspect) {
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if ((now - this.transitionDebugLastLogMs) < 300) {
            return;
        }
        this.transitionDebugLastLogMs = now;

        if (!this.surfaceGeometry || !this.surfaceGeometry.attributes || !this.surfaceGeometry.attributes.position) {
            return;
        }

        const positions = this.surfaceGeometry.attributes.position.array;
        const meshZ = this.surfaceMesh ? this.surfaceMesh.position.z : 0;
        let minZ = Infinity;
        let maxZ = -Infinity;
        let minR = Infinity;
        let maxR = -Infinity;

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2] + meshZ;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;

            if (transitionCurve >= 0.999) {
                const r = Math.sqrt((x * x) + (y * y) + (z * z));
                if (r < minR) minR = r;
                if (r > maxR) maxR = r;
            }
        }

        const thresholds = this.getStateThresholds();
        const postFormationZoom = this.getPostFormationZoomProgress(camera.cellSize);
        const payload = {
            cellSize: Number(camera.cellSize.toFixed(4)),
            transitionCurveRaw: Number(transitionCurveRaw.toFixed(6)),
            transitionCurve: Number(transitionCurve.toFixed(6)),
            globeEnter: Number(thresholds.globeEnter.toFixed(4)),
            transitionEnter: Number(thresholds.transitionEnter.toFixed(4)),
            postFormationZoom: Number(postFormationZoom.toFixed(6)),
            cameraZ: Number(this.camera3d.position.z.toFixed(4)),
            imageAspect: Number(imageAspect.toFixed(4)),
            geomMinZ: Number(minZ.toFixed(4)),
            geomMaxZ: Number(maxZ.toFixed(4))
        };

        if (transitionCurve >= 0.999 && minR < Infinity && maxR > -Infinity) {
            payload.radiusMin = Number(minR.toFixed(6));
            payload.radiusMax = Number(maxR.toFixed(6));
            payload.radiusSpread = Number((maxR - minR).toFixed(6));
        }

        console.debug('[ThreeMapRenderer transition]', payload);

        if (transitionCurve >= 0.999) {
            const radiusSpread = (maxR > -Infinity && minR < Infinity) ? (maxR - minR) : 0;
            if (minZ > -0.95 || maxZ < 0.95 || radiusSpread > 0.03) {
                console.warn('[ThreeMapRenderer transition anomaly]', payload);
            }
        }
    }

    updateSurfaceGeometry(camera, coverage, curveProgress) {
        if (!this.surfaceGeometry || !this.baseUvs) {
            return;
        }

        const viewWidth = this.canvasWidth / Math.max(camera.cellSize, 0.0001);
        const viewHeight = this.canvasHeight / Math.max(camera.cellSize, 0.0001);
        if (
            this.lastCurveProgress !== null &&
            Math.abs(this.lastCurveProgress - curveProgress) < 0.0005 &&
            Math.abs(this.lastViewWidth - viewWidth) < 0.0005 &&
            Math.abs(this.lastViewHeight - viewHeight) < 0.0005 &&
            Math.abs(this.lastCoverageU - coverage.u) < 0.0005 &&
            Math.abs(this.lastCoverageV - coverage.v) < 0.0005
        ) {
            return;
        }

        const positionAttr = this.surfaceGeometry.attributes.position;
        const positions = positionAttr.array;
        const radiusFromWidth = viewWidth / Math.max(coverage.u * Math.PI * 2, 0.0001);
        const radiusFromHeight = viewHeight / Math.max(coverage.v * Math.PI, 0.0001);
        const radius = Math.max(radiusFromWidth, radiusFromHeight, 0.0001);

        for (let i = 0; i < positions.length; i += 3) {
            const uvIndex = (i / 3) * 2;
            const u = this.baseUvs[uvIndex];
            const v = this.baseUvs[uvIndex + 1];

            const flatX = (u - 0.5) * viewWidth;
            const flatY = (0.5 - v) * viewHeight;

            const lon = (u * Math.PI * 2) - Math.PI;
            const lat = (0.5 - v) * Math.PI;
            const spherePoint = MapProjection.unitSphereFromLatLon(lat, lon);
            const sphereX = spherePoint.x * radius;
            const sphereY = spherePoint.y * radius;
            const sphereZ = (spherePoint.z * radius) - radius;

            positions[i] = flatX + ((sphereX - flatX) * curveProgress);
            positions[i + 1] = flatY + ((sphereY - flatY) * curveProgress);
            positions[i + 2] = sphereZ * curveProgress;
        }

        positionAttr.needsUpdate = true;
        this.surfaceGeometry.computeVertexNormals();
        this.surfaceGeometry.computeBoundingSphere();
        this.lastCurveProgress = curveProgress;
        this.lastViewWidth = viewWidth;
        this.lastViewHeight = viewHeight;
        this.lastCoverageU = coverage.u;
        this.lastCoverageV = coverage.v;
    }

    syncCamera(camera, coverage, curveProgress) {
        const viewHeight = this.canvasHeight / Math.max(camera.cellSize, 0.0001);
        const fov = 24;
        const halfFovRadians = (fov * Math.PI) / 360;
        const planeDistance = (viewHeight * 0.5) / Math.tan(halfFovRadians);
        const radiusFromWidth = (this.canvasWidth / Math.max(camera.cellSize, 0.0001)) / Math.max(coverage.u * Math.PI * 2, 0.0001);
        const radiusFromHeight = viewHeight / Math.max(coverage.v * Math.PI, 0.0001);
        const radius = Math.max(radiusFromWidth, radiusFromHeight, 0.0001);
        const sphereDistance = (radius / Math.sin(halfFovRadians)) + radius;
        const distance = planeDistance + ((sphereDistance - planeDistance) * curveProgress);
        const lookAtZ = -radius * curveProgress;

        this.camera3d.fov = fov;
        this.camera3d.aspect = this.canvasWidth / Math.max(this.canvasHeight, 1);
        this.camera3d.position.set(0, 0, distance);
        this.camera3d.lookAt(0, 0, lookAtZ);
        this.camera3d.updateProjectionMatrix();
    }

    renderTransitionPatch(ctx, camera, snapshotCanvas) {
        if (!this.ensureSnapshotTexture(snapshotCanvas)) {
            return false;
        }

        const imageAspect = this.textureWidth / Math.max(this.textureHeight, 1);
        const transitionCurveRaw = this.getTransitionCurve(camera.cellSize);
        const transitionCurve = transitionCurveRaw >= 0.96 ? 1 : transitionCurveRaw;
        this.updateTransitionGeometry(transitionCurve, imageAspect);
        this.syncTransitionCamera(transitionCurve, imageAspect, camera.cellSize);
        this.logTransitionDiagnostics(camera, transitionCurveRaw, transitionCurve, imageAspect);
        this.renderer.render(this.scene, this.camera3d);
        ctx.drawImage(this.renderCanvas, 0, 0, this.renderCanvas.width, this.renderCanvas.height, 0, 0, this.canvasWidth, this.canvasHeight);
        return true;
    }

    renderWorldSurface(ctx, grid, camera, renderOptions = {}) {
        const showRegionDebug = !!renderOptions.showRegionDebug;
        const terrainOnly = !!renderOptions.terrainOnly;
        const textureMode = terrainOnly ? 'terrain_only' : 'dynamic';
        if (this.surfaceMesh) {
            this.surfaceMesh.position.set(0, 0, 0);
        }
        this.lastGridWidth = grid.width;
        this.lastGridHeight = grid.height;

        const curveProgress = this.getCurveProgress(camera.cellSize);
        if (!this.hasInitialViewSync) {
            this.syncViewFromCamera(camera, grid.width, grid.height);
            this.hasInitialViewSync = true;
        } else if (this.isInteractive(camera.cellSize)) {
            this.updateInteractiveView();
        } else {
            this.syncViewFromCamera(camera, grid.width, grid.height);
        }

        const coverage = this.getCoverageForCellSize(camera.cellSize, grid.width, grid.height);
        if (this.shouldRebuildWorldTexture(camera.cellSize, curveProgress, showRegionDebug, textureMode)) {
            this.rebuildWorldTexture(grid, camera.cellSize, curveProgress, showRegionDebug, textureMode);
        }
        if (this.isInteractive(camera.cellSize)) {
            this.updateTextureWindowFromView(coverage);
        } else {
            this.updateTextureWindowFromCamera(camera, grid.width, grid.height, coverage);
        }

        this.updateSurfaceGeometry(camera, coverage, curveProgress);
        this.syncCamera(camera, coverage, curveProgress);
        this.updateDebugMetrics(camera, grid.width, grid.height, coverage, curveProgress);
        this.renderer.render(this.scene, this.camera3d);
        ctx.drawImage(this.renderCanvas, 0, 0, this.renderCanvas.width, this.renderCanvas.height, 0, 0, this.canvasWidth, this.canvasHeight);
        return true;
    }

    getSurfaceIntersection(screenX, screenY) {
        if (!this.isReady() || !this.raycaster || !this.ndcPointer) {
            return null;
        }

        this.ndcPointer.set(
            (screenX / Math.max(this.canvasWidth, 1)) * 2 - 1,
            -((screenY / Math.max(this.canvasHeight, 1)) * 2 - 1)
        );
        this.raycaster.setFromCamera(this.ndcPointer, this.camera3d);
        const hits = this.raycaster.intersectObject(this.surfaceMesh, false);
        if (!hits || hits.length === 0 || !hits[0].uv) {
            return null;
        }
        return hits[0];
    }

    screenToGrid(screenX, screenY, gridWidth, gridHeight) {
        const hit = this.getSurfaceIntersection(screenX, screenY);
        if (!hit) {
            return null;
        }

        const fullTextureU = MapProjection.wrapUnitInterval(this.currentOffset.u + (hit.uv.x * this.currentCoverage.u));
        const repeatFactor = (Math.abs(this.currentCoverage.u - 1) < 0.0001 && Math.abs(this.currentOffset.u) < 0.0001) ? 1 : this.globeTileRepeats;
        const fullU = MapProjection.wrapUnitInterval(fullTextureU * repeatFactor);
        const fullV = MapProjection.clamp(this.currentOffset.v + ((1 - hit.uv.y) * this.currentCoverage.v), 0, 0.999999);
        return {
            x: Math.floor(fullU * gridWidth),
            y: Math.floor(fullV * gridHeight),
            surfaceX: hit.uv.x * this.canvasWidth,
            surfaceY: (1 - hit.uv.y) * this.canvasHeight,
            uv: { x: hit.uv.x, y: hit.uv.y },
            fullU,
            fullV
        };
    }

    getDiagnostics(camera) {
        const state = this.getRenderState(camera.cellSize);
        const thresholds = this.getStateThresholds();
        const projection = this.lastProjectionMetrics;
        return {
            state,
            textureMode: state === ThreeMapRenderer.RENDER_STATES.GLOBE_3D ? 'terrain_only' : 'dynamic',
            tileRepeats: this.globeTileRepeats,
            polarFade: this.globePolarFade,
            curveProgress: this.getCurveProgress(camera.cellSize),
            transitionCurve: this.getTransitionCurve(camera.cellSize),
            coverageU: this.currentCoverage.u,
            coverageV: this.currentCoverage.v,
            worldCoverageU: projection ? projection.worldCoverageU : (this.currentCoverage.u * this.globeTileRepeats),
            worldCoverageV: projection ? projection.worldCoverageV : this.currentCoverage.v,
            viewLon: this.viewLon,
            viewLat: this.viewLat,
            targetViewLon: this.targetViewLon,
            targetViewLat: this.targetViewLat,
            interactive: this.isInteractive(camera.cellSize),
            cellSize: camera.cellSize,
            projection: projection ? {
                visibleWidthCells: projection.visibleWidthCells,
                visibleHeightCells: projection.visibleHeightCells,
                projectedCellWidthPx: projection.projectedCellWidthPx,
                projectedCellHeightPx: projection.projectedCellHeightPx,
                projectedCellRatio: projection.projectedCellRatio,
                ratioError: projection.ratioError,
                radiusSkew: projection.radiusSkew
            } : null,
            continuity: projection ? {
                focusGrid: projection.focusGrid,
                cameraCenterGrid: projection.cameraCenterGrid,
                deltaGridX: projection.focusGrid.x - projection.cameraCenterGrid.x,
                deltaGridY: projection.focusGrid.y - projection.cameraCenterGrid.y,
                lonError: projection.lonError,
                latError: projection.latError
            } : null,
            seam: projection ? {
                windowStartU: projection.windowStartU,
                windowEndU: projection.windowEndU,
                crossesSeam: projection.seamCrosses
            } : null,
            zoom: {
                minCellSize: Tuning.CAMERA_MIN_CELL_SIZE || 1.25,
                zoomOutHeadroom: camera.cellSize - (Tuning.CAMERA_MIN_CELL_SIZE || 1.25),
                transitionEnter: thresholds.transitionEnter,
                globeEnter: thresholds.globeEnter
            },
            warnings: projection ? projection.warnings : []
        };
    }

    isReady() {

        return this.threeReady && !!this.renderer && !!this.surfaceMesh;
    }

    shouldUseFlatFallback(cellSize) {
        return this.getRenderState(cellSize) === ThreeMapRenderer.RENDER_STATES.GRID_2D;
    }

    render(ctx, grid, camera, showRegionDebugOrOptions = false) {
        this.ensureThreeReady();
        const state = this.updateRenderState(camera.cellSize);
        if (!this.isReady() || state === ThreeMapRenderer.RENDER_STATES.GRID_2D) {
            return { rendered: false, state };
        }

        let options = null;
        let showRegionDebug = false;
        if (typeof showRegionDebugOrOptions === 'object' && showRegionDebugOrOptions !== null) {
            options = showRegionDebugOrOptions;
            showRegionDebug = !!options.showRegionDebug;
        } else {
            showRegionDebug = !!showRegionDebugOrOptions;
        }

        if (state === ThreeMapRenderer.RENDER_STATES.TRANSITION_PATCH) {
            if (this.isInteractive(camera.cellSize)) {
                this.updateInteractiveView();
            } else {
                this.syncViewFromCamera(camera, grid.width, grid.height);
            }

            const snapshotCanvas = options && options.snapshotCanvas ? options.snapshotCanvas : null;
            if (snapshotCanvas) {
                return {
                    rendered: this.renderTransitionPatch(ctx, camera, snapshotCanvas),
                    state
                };
            }
        }

        return {
            rendered: this.renderWorldSurface(ctx, grid, camera, {
                showRegionDebug,
                terrainOnly: state === ThreeMapRenderer.RENDER_STATES.GLOBE_3D
            }),
            state
        };
    }
}


if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThreeMapRenderer };
}
