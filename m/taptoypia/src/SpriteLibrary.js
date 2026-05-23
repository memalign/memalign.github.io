const SpriteLibrary = {
    FRAME_INTERVAL_MS: 420,
    DEFAULT_PADDING_RATIO: 0.08,

    CHARACTER_FRAMES: {
        WaterAnimal: ['waterstand0', 'waterstand1'],
        FireAnimal: ['firestand0', 'firestand1'],
        GrassAnimal: ['grassstand0', 'grassstand1'],
        Egg: ['egg0', 'egg1', 'egg2']
    },

    ITEM_FRAMES: {
        'Space Ship': ['rocket'],
        seed: ['seed'],
        carrot: ['carrot'],
        tree: ['tree'],
        wood: ['wood'],
        house: ['house'],
        'Research Center': ['researchcenter0', 'researchcenter1'],
        ore: ['ore'],
        'Communication Tower': ['communicationtower0', 'communicationtower1']
    },

    _canvasCache: {},

    getFrameNamesForCell(cell) {
        if (!cell) {
            return null;
        }

        if (cell.character) {
            return this.CHARACTER_FRAMES[cell.character.type] || null;
        }

        if (cell.item) {
            return this.ITEM_FRAMES[cell.item] || null;
        }

        return null;
    },

    getFrameNamesForName(name) {
        return this.CHARACTER_FRAMES[name] || this.ITEM_FRAMES[name] || null;
    },

    getCurrentFrameName(frameNames, nowMs = null) {
        if (!frameNames || frameNames.length === 0) {
            return null;
        }

        if (frameNames.length === 1) {
            return frameNames[0];
        }

        const now = nowMs ?? ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
        const frameIndex = Math.floor(now / this.FRAME_INTERVAL_MS) % frameNames.length;
        return frameNames[frameIndex];
    },

    getSpriteCanvas(frameName) {
        if (!frameName || typeof document === 'undefined' || typeof PCEImageLibrary === 'undefined') {
            return null;
        }

        if (this._canvasCache[frameName]) {
            return this._canvasCache[frameName];
        }

        const pceImage = PCEImageLibrary.pceImageForName(frameName);
        if (!pceImage || !pceImage.width || !pceImage.height) {
            return null;
        }

        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = pceImage.width;
        spriteCanvas.height = pceImage.height;
        const spriteCtx = spriteCanvas.getContext('2d');
        spriteCtx.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
        pceImage.drawInCanvas(spriteCanvas, 1);
        this._canvasCache[frameName] = spriteCanvas;
        return spriteCanvas;
    },

    drawFrameInRect(targetCtx, frameName, x, y, width, height, options = {}) {
        const spriteCanvas = this.getSpriteCanvas(frameName);
        if (!spriteCanvas) {
            return false;
        }

        const paddingRatio = options.paddingRatio ?? this.DEFAULT_PADDING_RATIO;
        const availableWidth = Math.max(1, width * (1 - (paddingRatio * 2)));
        const availableHeight = Math.max(1, height * (1 - (paddingRatio * 2)));
        const scale = Math.min(availableWidth / spriteCanvas.width, availableHeight / spriteCanvas.height);
        const drawWidth = Math.max(1, spriteCanvas.width * scale);
        const drawHeight = Math.max(1, spriteCanvas.height * scale);
        const drawX = x + ((width - drawWidth) / 2);
        const drawY = y + ((height - drawHeight) / 2);
        const flipHorizontally = !!options.flipHorizontally;

        targetCtx.save();
        targetCtx.imageSmoothingEnabled = false;
        if (flipHorizontally) {
            targetCtx.translate(drawX + drawWidth, drawY);
            targetCtx.scale(-1, 1);
            targetCtx.drawImage(spriteCanvas, 0, 0, drawWidth, drawHeight);
        } else {
            targetCtx.drawImage(spriteCanvas, drawX, drawY, drawWidth, drawHeight);
        }
        targetCtx.restore();
        return true;
    },

    drawCellSprite(targetCtx, cell, x, y, width, height, options = {}) {
        const frameNames = this.getFrameNamesForCell(cell);
        const frameName = this.getCurrentFrameName(frameNames, options.nowMs);
        if (!frameName) {
            return false;
        }

        return this.drawFrameInRect(targetCtx, frameName, x, y, width, height, {
            ...options,
            flipHorizontally: !!(cell.character && cell.character.type !== 'Egg' && cell.character.facingRight)
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpriteLibrary };
}
