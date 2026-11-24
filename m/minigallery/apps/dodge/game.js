
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const overlay = document.getElementById("overlay");
const titleElement = document.getElementById("title");
const messageElement = document.getElementById("message");
const startButton = document.getElementById("startButton");

let width, height;
let running = false;
let score = 0;
let highScore = 0;

// Game settings
const settings = {
    obstacleInterval: 1.1,
    obstacleSpeed: 0.38,
    maxSpeed: 0.85
};

// Player
const player = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    width: 38,
    height: 48
};

// Obstacles
let obstacles = [];
let spawnTimer = 0;
let lastTime = 0;
let animationId = null;

// Background stars
let stars = [];

function resize() {
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    width = window.innerWidth;
    height = window.innerHeight;

    player.width = Math.max(32, width * 0.09);
    player.height = player.width * 1.2;

    player.x = Math.min(player.x || width / 2, width);
    player.y = Math.min(player.y || height * 0.78, height);

    player.targetX = player.x;
    player.targetY = player.y;

    createStars();
}

window.addEventListener("resize", resize);

function createStars() {
    stars = [];

    for (let i = 0; i < 90; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.7 + 0.2
        });
    }
}

resize();

// Input
let pointerDown = false;

function movePlayer(e) {
    if (!running) return;

    const rect = canvas.getBoundingClientRect();

    player.targetX = Math.max(
        0,
        Math.min(width, e.clientX - rect.left)
    );

    player.targetY = Math.max(
        0,
        Math.min(height, e.clientY - rect.top)
    );
}

canvas.addEventListener("pointerdown", e => {
    if (!running) return;

    pointerDown = true;
    canvas.setPointerCapture(e.pointerId);
    movePlayer(e);
});

canvas.addEventListener("pointermove", e => {
    if (pointerDown) movePlayer(e);
});

canvas.addEventListener("pointerup", () => {
    pointerDown = false;
});

canvas.addEventListener("pointercancel", () => {
    pointerDown = false;
});

// Airplane polygon
function getPlanePolygon(x, y, size) {
    return [
        [x, y - size],
        [x + size * 0.23, y + size * 0.35],
        [x + size * 0.8, y + size * 0.65],
        [x + size * 0.75, y + size * 0.85],
        [x + size * 0.17, y + size * 0.65],
        [x, y + size],
        [x - size * 0.17, y + size * 0.65],
        [x - size * 0.75, y + size * 0.85],
        [x - size * 0.8, y + size * 0.65],
        [x - size * 0.23, y + size * 0.35]
    ];
}

// Draw airplane
function drawPlane(x, y, size, color = "#ffffff") {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = color;
    ctx.beginPath();

    const polygon = getPlanePolygon(0, 0, size);

    polygon.forEach((point, i) => {
        if (i === 0) {
            ctx.moveTo(point[0], point[1]);
        } else {
            ctx.lineTo(point[0], point[1]);
        }
    });

    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = "#42bfff";
    ctx.beginPath();
    ctx.ellipse(
        0,
        -size * 0.3,
        size * 0.12,
        size * 0.23,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Engines
    ctx.fillStyle = "#ffb52e";
    ctx.fillRect(-size * 0.65, size * 0.72, size * 0.2, size * 0.1);
    ctx.fillRect(size * 0.45, size * 0.72, size * 0.2, size * 0.1);

    ctx.restore();
}

// Collision detection: Polygon vs rectangle
// Uses the Separating Axis Theorem (SAT).
function checkCollision(polygon, rect) {
    const rectangle = [
        [rect.left, rect.top],
        [rect.right, rect.top],
        [rect.right, rect.bottom],
        [rect.left, rect.bottom]
    ];

    const polygons = [polygon, rectangle];

    for (const shape of polygons) {
        for (let i = 0; i < shape.length; i++) {
            const p1 = shape[i];
            const p2 = shape[(i + 1) % shape.length];

            const axis = [
                -(p2[1] - p1[1]),
                p2[0] - p1[0]
            ];

            let minA = Infinity;
            let maxA = -Infinity;
            let minB = Infinity;
            let maxB = -Infinity;

            // Project airplane onto axis
            for (const p of polygon) {
                const projection =
                    p[0] * axis[0] + p[1] * axis[1];

                minA = Math.min(minA, projection);
                maxA = Math.max(maxA, projection);
            }

            // Project obstacle onto axis
            for (const p of rectangle) {
                const projection =
                    p[0] * axis[0] + p[1] * axis[1];

                minB = Math.min(minB, projection);
                maxB = Math.max(maxB, projection);
            }

            // Separating axis means no collision
            if (maxA < minB || maxB < minA) {
                return false;
            }
        }
    }

    return true;
}

// Background
function drawBackground(dt) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);

    gradient.addColorStop(0, "#101d38");
    gradient.addColorStop(0.65, "#24577b");
    gradient.addColorStop(1, "#72a6bb");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Horizon glow
    const glow = ctx.createRadialGradient(
        width / 2, height * 0.23, 0,
        width / 2, height * 0.23, width * 0.7
    );

    glow.addColorStop(0, "rgba(255,220,150,0.3)");
    glow.addColorStop(1, "rgba(255,220,150,0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height * 0.5);

    // Stars
    ctx.fillStyle = "white";

    stars.forEach(star => {
        star.y += star.speed * dt * 60;

        if (star.y > height) {
            star.y = 0;
            star.x = Math.random() * width;
        }

        ctx.globalAlpha = 0.7;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    ctx.globalAlpha = 1;

    // Perspective ground lines
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;

    for (let i = 0; i < 12; i++) {
        const y = height * 0.35 + i * i * 5;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

// Create obstacles
function spawnObstacle() {
    obstacles.push({
        targetX: Math.random() * width,
        targetY: Math.random() * height,
        z: 0,
        w: 45 + Math.random() * 35,
        h: 45 + Math.random() * 35,
        passed: false
    });
}

// Calculate obstacle screen position
function getObstaclePosition(obstacle) {
    const z = obstacle.z;
    const scale = 0.2 + z * 0.8;

    const x = width / 2 +
        (obstacle.targetX - width / 2) * z;

    const y = height * 0.23 +
        (obstacle.targetY - height * 0.23) * z;

    const w = obstacle.w * scale;
    const h = obstacle.h * scale;

    return {
        x,
        y,
        w,
        h,
        left: x - w / 2,
        right: x + w / 2,
        top: y - h / 2,
        bottom: y + h / 2
    };
}

// Draw obstacle
function drawObstacle(obstacle) {
    const pos = getObstaclePosition(obstacle);

    ctx.save();
    ctx.translate(pos.x, pos.y);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(
        -pos.w / 2 + 4,
        -pos.h / 2 + 5,
        pos.w,
        pos.h
    );

    // Obstacle body
    const gradient = ctx.createLinearGradient(
        -pos.w / 2, 0,
        pos.w / 2, 0
    );

    gradient.addColorStop(0, "#b94a30");
    gradient.addColorStop(0.5, "#ff8050");
    gradient.addColorStop(1, "#b94a30");

    ctx.fillStyle = gradient;
    ctx.fillRect(-pos.w / 2, -pos.h / 2, pos.w, pos.h);

    // Border
    ctx.strokeStyle = "#ffc09b";
    ctx.lineWidth = Math.max(1, 2 * (0.2 + obstacle.z * 0.8));
    ctx.strokeRect(-pos.w / 2, -pos.h / 2, pos.w, pos.h);

    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(-pos.w / 2, -pos.h / 2, pos.w, pos.h * 0.2);

    ctx.restore();
}

// Update game
function update(dt) {
    if (!running) return;

    // Smooth player movement
    const smoothing = 1 - Math.pow(0.001, dt);

    player.x += (player.targetX - player.x) * smoothing;
    player.y += (player.targetY - player.y) * smoothing;

    // Difficulty increases with score
    const speed = Math.min(
        settings.obstacleSpeed + score * 0.008,
        settings.maxSpeed
    );

    const interval = Math.max(
        0.55,
        settings.obstacleInterval - score * 0.008
    );

    spawnTimer += dt;

    if (spawnTimer >= interval) {
        spawnTimer = 0;
        spawnObstacle();
    }

    // Actual airplane polygon
    const planeSize = player.width * 0.55;

    const planePolygon = getPlanePolygon(
        player.x,
        player.y,
        planeSize
    );

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];

        obstacle.z += speed * dt;

        const pos = getObstaclePosition(obstacle);

        // COLLISION CHECK ON EVERY FRAME,
        // REGARDLESS OF OBSTACLE DEPTH.
        if (checkCollision(planePolygon, pos)) {
            endGame();
            return;
        }

        // Award point once obstacle passes player
        if (obstacle.z >= 1 && !obstacle.passed) {
            obstacle.passed = true;

            score++;
            scoreElement.textContent = score;
        }

        // Remove obstacle after passing
        if (obstacle.z > 1.15) {
            obstacles.splice(i, 1);
        }
    }
}

// Render everything
function draw() {
    drawBackground(0);

    // Draw distant obstacles first
    obstacles.sort((a, b) => a.z - b.z);

    obstacles.forEach(drawObstacle);

    // Draw airplane
    drawPlane(
        player.x,
        player.y,
        player.width * 0.55
    );
}

// Main loop
function gameLoop(timestamp) {
    if (!running) return;

    const dt = Math.min(
        (timestamp - lastTime) / 1000,
        0.05
    );

    lastTime = timestamp;

    update(dt);

    if (running) {
        draw();
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Start game
function startGame() {
    score = 0;
    obstacles = [];
    spawnTimer = 0;

    scoreElement.textContent = "0";

    player.x = width / 2;
    player.y = height * 0.78;

    player.targetX = player.x;
    player.targetY = player.y;

    pointerDown = false;
    running = true;

    overlay.classList.add("hidden");

    lastTime = performance.now();

    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
    running = false;

    cancelAnimationFrame(animationId);

    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
    }

    titleElement.textContent = "💥 Game Over!";
    messageElement.textContent = `You dodged ${score} obstacles!`;
    startButton.textContent = "PLAY AGAIN";

    overlay.classList.remove("hidden");

    draw();

    drawPlane(
        player.x,
        player.y,
        player.width * 0.55,
        "#ff5555"
    );
}

// Start button
startButton.addEventListener("click", startGame);

// Initial screen
highScoreElement.textContent = "0";

drawBackground(0);

drawPlane(
    width / 2,
    height * 0.78,
    player.width * 0.55
);
