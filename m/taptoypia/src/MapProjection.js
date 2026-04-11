const MapProjection = {
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    wrapUnitInterval(value) {
        let result = value % 1;
        if (result < 0) {
            result += 1;
        }
        return result;
    },

    wrapLongitude(lon) {
        const fullTurn = Math.PI * 2;
        let wrapped = (lon + Math.PI) % fullTurn;
        if (wrapped < 0) {
            wrapped += fullTurn;
        }
        return wrapped - Math.PI;
    },

    clampLatitude(lat) {
        const maxLat = (Math.PI / 2) - 0.000001;
        return this.clamp(lat, -maxLat, maxLat);
    },

    gridToLatLon(gridX, gridY, gridWidth, gridHeight) {
        const u = (gridX + 0.5) / gridWidth;
        const v = (gridY + 0.5) / gridHeight;
        return {
            lon: this.wrapLongitude((u * Math.PI * 2) - Math.PI),
            lat: this.clampLatitude((Math.PI / 2) - (v * Math.PI))
        };
    },

    latLonToGrid(lat, lon, gridWidth, gridHeight) {
        const wrappedLon = this.wrapLongitude(lon);
        const clampedLat = this.clampLatitude(lat);
        const u = this.wrapUnitInterval((wrappedLon + Math.PI) / (Math.PI * 2));
        const v = this.clamp(((Math.PI / 2) - clampedLat) / Math.PI, 0, 0.999999);
        return {
            x: Math.floor(u * gridWidth),
            y: Math.floor(v * gridHeight)
        };
    },

    unitSphereFromLatLon(lat, lon) {
        const cosLat = Math.cos(lat);
        return {
            x: cosLat * Math.sin(lon),
            y: Math.sin(lat),
            z: cosLat * Math.cos(lon)
        };
    },

    latLonFromUnitSphere(x, y, z) {
        return {
            lat: this.clampLatitude(Math.asin(this.clamp(y, -1, 1))),
            lon: this.wrapLongitude(Math.atan2(x, z))
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MapProjection };
}
