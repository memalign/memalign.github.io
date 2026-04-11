
if (typeof module !== 'undefined' && module.exports) {
    ({ Tuning } = require('./Tuning.js'));
    ({ MapProjection } = require('./MapProjection.js'));
}

class GlobeRenderer {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.viewLon = 0;
        this.viewLat = 0;
        this.targetViewLon = 0;
        this.targetViewLat = 0;

        this.textureWidth = 0;
        this.textureHeight = 0;
        this.texturePixels = null;

        this.three = null;
        this.scene = null;
        this.camera3d = null;
        this.renderer = null;
        this.globeMesh = null;
        this.globePivot = null;
        this.textureCanvas = null;
        this.textureContext = null;
        this.texture = null;
        this.renderCanvas = null;
        this.shadowMesh = null;
        this.globeGeometry = null;
        this.baseSpherePositions = null;
        this.geometryUvs = null;
        this.currentCurvatureProgress = 1;
        this.currentPatchOpacity = 0;
        this.currentFullGlobeOpacity = 0;
        this.lastAppliedCurvatureProgress = null;
        this.loadError = null;
        this.threeReady = false;
        this.threeLoadPromise = null;

        if (typeof document !== 'undefined') {
            this.ensureThreeReady();
        }
    }

    static getThreeModuleUrl() {
        if (typeof document === 'undefined') {
            return null;
        }

        const script = document.querySelector('script[src$="src/GlobeRenderer.js"]');
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

        this.threeLoadPromise = import(GlobeRenderer.getThreeModuleUrl())
            .then((THREE) => {
                this.initializeThree(THREE);
                this.threeReady = true;
                return THREE;
            })
            .catch((err) => {
                this.loadError = err;
                console.error('Failed to load vendored three.js', err);
                throw err;
            });

        return this.threeLoadPromise;
    }

    initializeThree(THREE) {
        this.three = THREE;
        this.renderCanvas = document.createElement('canvas');
        this.textureCanvas = document.createElement('canvas');
        this.textureContext = this.textureCanvas.getContext('2d');

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

        this.scene = new THREE.Scene();
        this.camera3d = new THREE.PerspectiveCamera(28, this.canvasWidth / this.canvasHeight, 0.01, 100);
        this.camera3d.position.set(0, 0, Tuning.GLOBE_CAMERA_FAR_DISTANCE);

        this.globePivot = new THREE.Group();
        this.scene.add(this.globePivot);

        const geometry = new THREE.SphereGeometry(1, 128, 96);
        this.globeGeometry = geometry;
        this.baseSpherePositions = new Float32Array(geometry.attributes.position.array);
        this.geometryUvs = new Float32Array(geometry.attributes.uv.array);
        this.texture = new THREE.CanvasTexture(this.textureCanvas);
        if ('colorSpace' in this.texture && 'SRGBColorSpace' in THREE) {
            this.texture.colorSpace = THREE.SRGBColorSpace;
        }
        this.texture.wrapS = THREE.RepeatWrapping;
        this.texture.wrapT = THREE.ClampToEdgeWrapping;
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.LinearFilter;

        const material = new THREE.MeshStandardMaterial({
            map: this.texture,
            transparent: true,
            roughness: 1,
            metalness: 0,
        });
        this.globeMesh = new THREE.Mesh(geometry, material);
        this.globePivot.add(this.globeMesh);

        const ambient = new THREE.AmbientLight(0xffffff, 1.15);
        this.scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
        keyLight.position.set(2.5, 1.5, 3.5);
        this.scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x8cbcff, 0.45);
        rimLight.position.set(-2.5, -1.0, 1.5);
        this.scene.add(rimLight);

        const shadowGeometry = new THREE.CircleGeometry(1.05, 64);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
        });
        this.shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.shadowMesh.rotation.x = -Math.PI / 2;
        this.shadowMesh.position.set(0, -1.22, 0);
        this.shadowMesh.scale.set(1.55, 0.58, 1);
        this.scene.add(this.shadowMesh);

        this.resize(this.canvasWidth, this.canvasHeight);
        this.applyViewToScene();
    }

    resize(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        if (this.renderer && this.camera3d) {
            this.renderer.setPixelRatio((typeof window !== 'undefined' && window.devicePixelRatio) || 1);
            this.renderer.setSize(canvasWidth, canvasHeight, false);
            this.camera3d.aspect = canvasWidth / Math.max(1, canvasHeight);
            this.camera3d.updateProjectionMatrix();
        }
    }

    smoothstep(value) {
        const clamped = MapProjection.clamp(value, 0, 1);
        return clamped * clamped * (3 - (2 * clamped));
    }

    getBlendForCellSize(cellSize) {
        const span = Tuning.GLOBE_TRANSITION_START_CELL_SIZE - Tuning.GLOBE_TRANSITION_END_CELL_SIZE;
        if (span <= 0) {
            return cellSize <= Tuning.GLOBE_TRANSITION_END_CELL_SIZE ? 1 : 0;
        }
        return MapProjection.clamp((Tuning.GLOBE_TRANSITION_START_CELL_SIZE - cellSize) / span, 0, 1);
    }

    getSmoothedBlendForCellSize(cellSize) {
        return this.smoothstep(this.getBlendForCellSize(cellSize));
    }

    getZoomProgressForCellSize(cellSize) {
        const span = Tuning.GLOBE_TRANSITION_END_CELL_SIZE - Tuning.CAMERA_MIN_CELL_SIZE;
        if (span <= 0) {
            return cellSize <= Tuning.CAMERA_MIN_CELL_SIZE ? 1 : 0;
        }
        return MapProjection.clamp((Tuning.GLOBE_TRANSITION_END_CELL_SIZE - cellSize) / span, 0, 1);
    }

    getCurvatureProgressForCellSize(cellSize) {
        const span = Tuning.GLOBE_TRANSITION_START_CELL_SIZE - Tuning.GLOBE_TRANSITION_END_CELL_SIZE;
        if (span <= 0) {
            return 1;
        }
        const raw = MapProjection.clamp((Tuning.GLOBE_TRANSITION_START_CELL_SIZE - cellSize) / span, 0, 1);
        return this.smoothstep(raw);
    }

    getRadiusScaleForCellSize(cellSize) {
        const curvatureProgress = this.getCurvatureProgressForCellSize(cellSize);
        return Tuning.GLOBE_TRANSITION_RADIUS_SCALE + ((1 - Tuning.GLOBE_TRANSITION_RADIUS_SCALE) * curvatureProgress);
    }

    getTextureCoverageForCellSize(cellSize, gridWidth, gridHeight) {
        const curvatureProgress = this.getCurvatureProgressForCellSize(cellSize);
        const visibleWidthCells = this.canvasWidth / Math.max(cellSize, 0.0001);
        const visibleHeightCells = this.canvasHeight / Math.max(cellSize, 0.0001);
        const initialCoverage = MapProjection.clamp(
            Math.max(visibleWidthCells / Math.max(1, gridWidth), visibleHeightCells / Math.max(1, gridHeight)),
            0.08,
            1
        );
        const coverage = initialCoverage + ((1 - initialCoverage) * curvatureProgress);
        return { u: coverage, v: coverage };
    }

    getCameraDistanceForCellSize(cellSize) {
        const zoomProgress = this.smoothstep(this.getZoomProgressForCellSize(cellSize));
        const baseDistance = Tuning.GLOBE_CAMERA_SURFACE_DISTANCE + ((Tuning.GLOBE_CAMERA_FAR_DISTANCE - Tuning.GLOBE_CAMERA_SURFACE_DISTANCE) * zoomProgress);
        return baseDistance * this.getRadiusScaleForCellSize(cellSize);
    }

    getCameraFovForCellSize(cellSize) {
        const progress = this.smoothstep(this.getZoomProgressForCellSize(cellSize));
        return Tuning.GLOBE_CAMERA_SURFACE_FOV + ((Tuning.GLOBE_CAMERA_FAR_FOV - Tuning.GLOBE_CAMERA_SURFACE_FOV) * progress);
    }

    isActive(cellSize) {
        return this.getBlendForCellSize(cellSize) > 0.001;
    }

    isInteractive(cellSize) {
        return this.getBlendForCellSize(cellSize) >= 0.6;
    }

    setViewFromGrid(gridX, gridY, gridWidth, gridHeight) {
        const latLon = MapProjection.gridToLatLon(gridX, gridY, gridWidth, gridHeight);
        this.viewLon = latLon.lon;
        this.viewLat = latLon.lat;
        this.targetViewLon = latLon.lon;
        this.targetViewLat = latLon.lat;
        this.applyViewToScene();
    }

    getFocusGrid(gridWidth, gridHeight) {
        return MapProjection.latLonToGrid(this.viewLat, this.viewLon, gridWidth, gridHeight);
    }


    projectLatLonToScreen(lat, lon) {
        if (!this.threeReady || !this.three || !this.camera3d || !this.globePivot) {
            return null;
        }

        this.globePivot.updateMatrixWorld(true);
        const point = MapProjection.unitSphereFromLatLon(lat, lon);
        const vector = new this.three.Vector3(point.x, point.y, point.z);
        vector.applyMatrix4(this.globePivot.matrixWorld);
        vector.project(this.camera3d);

        return {
            x: (vector.x * 0.5 + 0.5) * this.canvasWidth,
            y: (-vector.y * 0.5 + 0.5) * this.canvasHeight,
            z: vector.z
        };
    }

    getProjectionMetrics(gridWidth, gridHeight) {
        if (!this.threeReady || !this.camera3d) {
            return null;
        }

        const focusGrid = this.getFocusGrid(gridWidth, gridHeight);
        const centerLatLon = MapProjection.gridToLatLon(focusGrid.x, focusGrid.y, gridWidth, gridHeight);
        const eastLatLon = MapProjection.gridToLatLon((focusGrid.x + 1) % gridWidth, focusGrid.y, gridWidth, gridHeight);
        const southLatLon = MapProjection.gridToLatLon(focusGrid.x, Math.min(gridHeight - 1, focusGrid.y + 1), gridWidth, gridHeight);
        const centerScreen = this.projectLatLonToScreen(centerLatLon.lat, centerLatLon.lon);
        const eastScreen = this.projectLatLonToScreen(eastLatLon.lat, eastLatLon.lon);
        const southScreen = this.projectLatLonToScreen(southLatLon.lat, southLatLon.lon);

        if (!centerScreen || !eastScreen || !southScreen) {
            return null;
        }

        const projectedCellWidthPx = Math.abs(eastScreen.x - centerScreen.x);
        const projectedCellHeightPx = Math.abs(southScreen.y - centerScreen.y);

        return {
            projectedCellWidthPx,
            projectedCellHeightPx,
            visibleWidthCells: projectedCellWidthPx > 0 ? this.canvasWidth / projectedCellWidthPx : null,
            visibleHeightCells: projectedCellHeightPx > 0 ? this.canvasHeight / projectedCellHeightPx : null,
            focusGrid
        };
    }

    rotateByScreenDelta(deltaX, deltaY) {
        this.targetViewLon = MapProjection.wrapLongitude(this.targetViewLon - (deltaX * Tuning.GLOBE_ROTATION_SENSITIVITY));
        this.targetViewLat = MapProjection.clampLatitude(this.targetViewLat + (deltaY * Tuning.GLOBE_ROTATION_SENSITIVITY));
    }

    update() {
        const lonDelta = MapProjection.wrapLongitude(this.targetViewLon - this.viewLon);
        this.viewLon = MapProjection.wrapLongitude(this.viewLon + (lonDelta * Tuning.GLOBE_LERP_FACTOR));
        this.viewLat += (this.targetViewLat - this.viewLat) * Tuning.GLOBE_LERP_FACTOR;
        this.viewLat = MapProjection.clampLatitude(this.viewLat);
        this.applyViewToScene();
    }

    applyViewToScene() {
        if (!this.globePivot) {
            return;
        }
        this.globePivot.rotation.y = (-this.viewLon) - (Math.PI / 2);
        this.globePivot.rotation.x = this.viewLat;
    }

    rebuildTexture(grid, showRegionDebug = false, coverage = null) {
        const sourceWidth = grid.width;
        const sourceHeight = grid.height;
        const width = sourceWidth * 2;
        const height = sourceHeight;
        const sourcePixels = new Uint8ClampedArray(width * height * 4);
        const pixels = new Uint8ClampedArray(width * height * 4);
        const centerU = MapProjection.wrapUnitInterval((this.viewLon + Math.PI) / (Math.PI * 2));
        const centerV = MapProjection.clamp(((Math.PI / 2) - this.viewLat) / Math.PI, 0, 1);
        const halfCoverageU = coverage ? coverage.u * 0.5 : 0.5;
        const halfCoverageV = coverage ? coverage.v * 0.5 : 0.5;
        let sourceOffset = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const sourceX = Math.floor(x / 2);
                const cell = grid.getCell(sourceX, y);
                const color = this.parseHexColor(cell.getDisplayColor(true));
                sourcePixels[sourceOffset] = color.r;
                sourcePixels[sourceOffset + 1] = color.g;
                sourcePixels[sourceOffset + 2] = color.b;
                sourcePixels[sourceOffset + 3] = 255;
                sourceOffset += 4;
            }
        }

        for (let y = 0; y < height; y++) {
            const v = (y + 0.5) / height;
            const normalizedV = (v - centerV) / Math.max(halfCoverageV, 0.000001);
            for (let x = 0; x < width; x++) {
                const u = (x + 0.5) / width;
                let deltaU = u - centerU;
                if (deltaU > 0.5) {
                    deltaU -= 1;
                } else if (deltaU < -0.5) {
                    deltaU += 1;
                }
                const normalizedU = deltaU / Math.max(halfCoverageU, 0.000001);
                const destOffset = ((y * width) + x) * 4;

                if (Math.abs(normalizedU) <= 1 && Math.abs(normalizedV) <= 1) {
                    const sampleU = (normalizedU + 1) * 0.5;
                    const sampleV = (normalizedV + 1) * 0.5;
                    const sampleX = Math.max(0, Math.min(width - 1, Math.floor(sampleU * (width - 1))));
                    const sampleY = Math.max(0, Math.min(height - 1, Math.floor(sampleV * (height - 1))));
                    const sampleOffset = ((sampleY * width) + sampleX) * 4;
                    pixels[destOffset] = sourcePixels[sampleOffset];
                    pixels[destOffset + 1] = sourcePixels[sampleOffset + 1];
                    pixels[destOffset + 2] = sourcePixels[sampleOffset + 2];
                    pixels[destOffset + 3] = 255;
                } else {
                    pixels[destOffset] = 0;
                    pixels[destOffset + 1] = 0;
                    pixels[destOffset + 2] = 0;
                    pixels[destOffset + 3] = 0;
                }
            }
        }

        this.textureWidth = width;
        this.textureHeight = height;
        this.texturePixels = pixels;

        if (this.textureContext && this.textureCanvas) {
            this.textureCanvas.width = width;
            this.textureCanvas.height = height;
            const imageData = this.textureContext.createImageData(width, height);
            imageData.data.set(pixels);
            this.textureContext.putImageData(imageData, 0, 0);
            if (showRegionDebug) {
                this.drawRegionDebugOverlay(this.textureContext, width, height);
            }
        }

        if (this.texture) {
            this.texture.needsUpdate = true;
        }
    }

    parseHexColor(color) {
        const normalized = color.startsWith('#') ? color.slice(1) : color;
        return {
            r: parseInt(normalized.slice(0, 2), 16),
            g: parseInt(normalized.slice(2, 4), 16),
            b: parseInt(normalized.slice(4, 6), 16)
        };
    }

    getRegionDebugInfo(width, height, regionX, regionY) {
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
                const info = this.getRegionDebugInfo(width, height, regionX, regionY);
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

    applyZoomToScene(cellSize, blend) {
        if (!this.camera3d || !this.globeMesh || !this.globePivot) {
            return;
        }

        const curvatureProgress = this.getCurvatureProgressForCellSize(cellSize);
        const radiusScale = this.getRadiusScaleForCellSize(cellSize);
        const cameraDistance = this.getCameraDistanceForCellSize(cellSize);
        const cameraFov = this.getCameraFovForCellSize(cellSize);
        this.currentCurvatureProgress = curvatureProgress;
        this.currentPatchOpacity = 0;
        this.currentFullGlobeOpacity = blend;
        this.globePivot.scale.set(radiusScale, radiusScale, radiusScale);
        this.camera3d.position.set(0, 0, cameraDistance);
        this.camera3d.fov = cameraFov;
        this.camera3d.updateProjectionMatrix();
        this.globeMesh.material.opacity = this.currentFullGlobeOpacity;
        this.globeMesh.visible = this.currentFullGlobeOpacity > 0.001;

        if (this.shadowMesh) {
            const shadowProgress = this.smoothstep(Math.max(0, this.getZoomProgressForCellSize(cellSize) - 0.25) / 0.75);
            const shadowWidth = 1.55 * radiusScale;
            const shadowHeight = 0.58 * radiusScale;
            this.shadowMesh.material.opacity = 0.16 * shadowProgress * blend;
            this.shadowMesh.scale.set(shadowWidth, shadowHeight, 1);
            this.shadowMesh.position.set(0, -1.22 * radiusScale, 0);
        }
    }

    render(ctx, grid, cellSize, blend, showRegionDebug = false) {
        const clampedBlend = MapProjection.clamp(blend, 0, 1);
        if (clampedBlend <= 0) {
            return;
        }

        this.ensureThreeReady();
        if (!this.threeReady || !this.renderer || !this.globeMesh) {
            return;
        }

        const coverage = this.getTextureCoverageForCellSize(cellSize, grid.width, grid.height);
        this.rebuildTexture(grid, showRegionDebug, coverage);
        this.applyZoomToScene(cellSize, clampedBlend);
        this.renderer.render(this.scene, this.camera3d);
        ctx.save();
        ctx.globalAlpha = clampedBlend;
        ctx.drawImage(this.renderCanvas, 0, 0, this.renderCanvas.width, this.renderCanvas.height, 0, 0, this.canvasWidth, this.canvasHeight);
        ctx.restore();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GlobeRenderer };
}
