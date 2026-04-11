if (typeof module !== 'undefined' && module.exports) {
    ({ Tuning } = require('./Tuning.js'));
}

class Camera {
    constructor(canvasWidth, canvasHeight, gridSize, cellSize = 50) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.gridSize = gridSize;

        this.cellSize = cellSize;
        this.targetCellSize = cellSize;

        this.anchorWorldX = 0;
        this.anchorWorldY = 0;
        this.zoomFocusX = canvasWidth / 2;
        this.zoomFocusY = canvasHeight / 2;

        this.minCellSize = Tuning.CAMERA_MIN_CELL_SIZE;
        this.maxCellSize = 150;

        const totalMapSize = gridSize * cellSize;
        this.x = (totalMapSize / 2) - (canvasWidth / 2);
        this.y = (totalMapSize / 2) - (canvasHeight / 2);

        this.targetX = this.x;
        this.targetY = this.y;
        this.lerpFactor = Tuning.CAMERA_LERP_FACTOR;
        this.zoomLerpFactor = Tuning.CAMERA_ZOOM_LERP_FACTOR;

        this.clamp();
    }

    screenToGrid(screenX, screenY) {
        const gridX = Math.floor((screenX + this.x) / this.cellSize);
        const gridY = Math.floor((screenY + this.y) / this.cellSize);
        return { x: gridX, y: gridY };
    }

    getCenterGridPosition() {
        return this.screenToGrid(this.canvasWidth / 2, this.canvasHeight / 2);
    }

    zoom(factor, screenX = this.canvasWidth / 2, screenY = this.canvasHeight / 2) {
        this.zoomFocusX = screenX;
        this.zoomFocusY = screenY;
        this.anchorWorldX = (this.zoomFocusX + this.x) / this.cellSize;
        this.anchorWorldY = (this.zoomFocusY + this.y) / this.cellSize;
        this.targetCellSize = Math.max(this.minCellSize, Math.min(this.maxCellSize, this.targetCellSize * factor));
    }

    move(dx, dy) {
        this.targetCellSize = this.cellSize;
        this.x += dx;
        this.y += dy;
        this.targetX = this.x;
        this.targetY = this.y;
        this.clamp();
    }

    resizeViewport(canvasWidth, canvasHeight) {
        const currentCenterX = this.x + (this.canvasWidth / 2);
        const currentCenterY = this.y + (this.canvasHeight / 2);
        const currentTargetCenterX = this.targetX + (this.canvasWidth / 2);
        const currentTargetCenterY = this.targetY + (this.canvasHeight / 2);

        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.x = currentCenterX - (canvasWidth / 2);
        this.y = currentCenterY - (canvasHeight / 2);
        this.targetX = currentTargetCenterX - (canvasWidth / 2);
        this.targetY = currentTargetCenterY - (canvasHeight / 2);
        this.zoomFocusX = canvasWidth / 2;
        this.zoomFocusY = canvasHeight / 2;

        this.clamp();
        this.clampTarget();
    }

    panBy(dx, dy) {
        this.targetX = this.x + dx;
        this.targetY = this.y + dy;
        this.clampTarget();
    }

    getEdgePanTargetForCell(gridX, gridY, visibleBounds = null) {
        const bounds = visibleBounds || {
            left: 0,
            top: 0,
            right: this.canvasWidth,
            bottom: this.canvasHeight,
        };
        const visibleWidth = bounds.right - bounds.left;
        const visibleHeight = bounds.bottom - bounds.top;

        const cellLeft = gridX * this.cellSize;
        const cellTop = gridY * this.cellSize;
        const cellRight = cellLeft + this.cellSize;
        const cellBottom = cellTop + this.cellSize;
        const cellScreenX = cellLeft - this.x;
        const cellScreenY = cellTop - this.y;
        const cellScreenRight = cellRight - this.x;
        const cellScreenBottom = cellBottom - this.y;
        const threshold = this.cellSize;

        let targetX = this.x;
        let targetY = this.y;

        if ((cellScreenX - bounds.left) < threshold) {
            targetX = cellLeft - (bounds.left + (visibleWidth / 3));
        } else if ((bounds.right - cellScreenRight) < threshold) {
            targetX = cellRight - (bounds.left + ((2 * visibleWidth) / 3));
        }

        if ((cellScreenY - bounds.top) < threshold) {
            targetY = cellTop - (bounds.top + (visibleHeight / 3));
        } else if ((bounds.bottom - cellScreenBottom) < threshold) {
            targetY = cellBottom - (bounds.top + ((2 * visibleHeight) / 3));
        }

        const maxScrollX = Math.max(0, (this.gridSize * this.targetCellSize) - this.canvasWidth);
        const maxScrollY = Math.max(0, (this.gridSize * this.targetCellSize) - this.canvasHeight);

        return {
            targetX: Math.max(0, Math.min(targetX, maxScrollX)),
            targetY: Math.max(0, Math.min(targetY, maxScrollY))
        };
    }

    centerOn(gridX, gridY) {
        this.targetX = (gridX * this.cellSize) + (this.cellSize / 2) - (this.canvasWidth / 2);
        this.targetY = (gridY * this.cellSize) + (this.cellSize / 2) - (this.canvasHeight / 2);
        this.clampTarget();
    }

    update() {
        if (Math.abs(this.x - this.targetX) > 0.01) {
            this.x += (this.targetX - this.x) * this.lerpFactor;
        }
        if (Math.abs(this.y - this.targetY) > 0.01) {
            this.y += (this.targetY - this.y) * this.lerpFactor;
        }

        if (Math.abs(this.cellSize - this.targetCellSize) > 0.01) {
            const previousX = this.x;
            const previousY = this.y;

            this.cellSize += (this.targetCellSize - this.cellSize) * this.zoomLerpFactor;
            this.x = (this.anchorWorldX * this.cellSize) - this.zoomFocusX;
            this.y = (this.anchorWorldY * this.cellSize) - this.zoomFocusY;

            this.targetX += this.x - previousX;
            this.targetY += this.y - previousY;
        }

        this.clamp();
        this.clampTarget();
    }

    clamp() {
        const maxScrollX = Math.max(0, (this.gridSize * this.cellSize) - this.canvasWidth);
        const maxScrollY = Math.max(0, (this.gridSize * this.cellSize) - this.canvasHeight);
        this.x = Math.max(0, Math.min(this.x, maxScrollX));
        this.y = Math.max(0, Math.min(this.y, maxScrollY));
    }

    clampTarget() {
        const maxScrollX = Math.max(0, (this.gridSize * this.targetCellSize) - this.canvasWidth);
        const maxScrollY = Math.max(0, (this.gridSize * this.targetCellSize) - this.canvasHeight);
        this.targetX = Math.max(0, Math.min(this.targetX, maxScrollX));
        this.targetY = Math.max(0, Math.min(this.targetY, maxScrollY));
    }

    getVisibleRange() {
        const startX = Math.floor(this.x / this.cellSize);
        const startY = Math.floor(this.y / this.cellSize);
        const endX = Math.ceil((this.x + this.canvasWidth) / this.cellSize);
        const endY = Math.ceil((this.y + this.canvasHeight) / this.cellSize);

        return {
            startX: Math.max(0, startX),
            startY: Math.max(0, startY),
            endX: Math.min(this.gridSize - 1, endX),
            endY: Math.min(this.gridSize - 1, endY)
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Camera };
}
