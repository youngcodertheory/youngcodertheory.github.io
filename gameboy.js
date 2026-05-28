const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game Configuration
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GAME_SPEED = 6;
const FLOOR_Y = 320;

let isPlaying = true;
let score = 0;

// Player Object
let player = {
    x: 100,
    y: FLOOR_Y - 30,
    size: 30,
    vy: 0,
    isGrounded: false,
    rotation: 0
};

// Obstacles Array (Triangles/Spikes)
// x coordinates are relative to the world map
let obstacles = [
    { x: 600, type: "spike" },
    { x: 900, type: "spike" },
    { x: 1200, type: "double_spike" },
    { x: 1600, type: "spike" },
    { x: 1900, type: "block" },
    { x: 2200, type: "spike" }
];

// Simple clone function to reset the map on death
const initialObstacles = JSON.parse(JSON.stringify(obstacles));

// Input Listeners
function triggerJump() {
    if (player.isGrounded && isPlaying) {
        player.vy = JUMP_FORCE;
        player.isGrounded = false;
    } else if (!isPlaying) {
        resetGame();
    }
}

window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") triggerJump();
});
canvas.addEventListener("mousedown", triggerJump);

function resetGame() {
    player.y = FLOOR_Y - player.size;
    player.vy = 0;
    player.isGrounded = true;
    player.rotation = 0;
    obstacles = JSON.parse(JSON.stringify(initialObstacles)); // Reset spike positions
    score = 0;
    isPlaying = true;
}

// Check AABB vs Triangle Collision
function checkCollision(p, o) {
    // Simple bounding box check for prototype efficiency
    let oWidth = o.type === "double_spike" ? 60 : 30;
    let oHeight = o.type === "block" ? 40 : 30;
    let oY = o.type === "block" ? FLOOR_Y - oHeight : FLOOR_Y - oHeight;

    return (
        p.x < o.x + oWidth &&
        p.x + p.size > o.x &&
        p.y < oY + oHeight &&
        p.y + p.size > oY
    );
}

// Game Loop
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- DRAW BACKGROUND GRID ---
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }

    // --- DRAW FLOOR ---
    ctx.fillStyle = "#0088cc";
    ctx.fillRect(0, FLOOR_Y, canvas.width, canvas.height - FLOOR_Y);
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(0, FLOOR_Y, canvas.width, 4);

    if (isPlaying) {
        // --- PLAYER PHYSICS ---
        player.vy += GRAVITY;
        player.y += player.vy;

        // Floor landing check
        if (player.y >= FLOOR_Y - player.size) {
            player.y = FLOOR_Y - player.size;
            player.vy = 0;
            player.isGrounded = true;
            // Snap rotation to nearest 90 degrees when landing
            player.rotation = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
        } else {
            // Rotate in mid-air
            player.rotation += 0.09;
        }

        score++;
    }

    // --- DRAW PLAYER ---
    ctx.save();
    ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
    ctx.rotate(player.rotation);

    // Neon Cube Body
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(-player.size / 2, -player.size / 2, player.size, player.size);

    // Simple eyes to see direction
    ctx.fillStyle = "#000";
    ctx.fillRect(2, -8, 4, 6);
    ctx.fillRect(10, -8, 4, 6);
    ctx.restore();

    // --- MOVE & DRAW OBSTACLES ---
    obstacles.forEach((obs) => {
        if (isPlaying) {
            obs.x -= GAME_SPEED; // Scroll left
        }

        // Wrap obstacles around to loop the level endlessly
        if (obs.x < -100) {
            obs.x = canvas.width + Math.random() * 300 + 200;
        }

        // Draw Spike
        if (obs.type === "spike") {
            ctx.fillStyle = "#ff0055";
            ctx.beginPath();
            ctx.moveTo(obs.x, FLOOR_Y);
            ctx.lineTo(obs.x + 15, FLOOR_Y - 30);
            ctx.lineTo(obs.x + 30, FLOOR_Y);
            ctx.closePath();
            ctx.fill();
        }
        // Draw Double Spike
        else if (obs.type === "double_spike") {
            ctx.fillStyle = "#ff0055";
            ctx.beginPath();
            ctx.moveTo(obs.x, FLOOR_Y);
            ctx.lineTo(obs.x + 15, FLOOR_Y - 30);
            ctx.lineTo(obs.x + 30, FLOOR_Y);
            ctx.moveTo(obs.x + 30, FLOOR_Y);
            ctx.lineTo(obs.x + 45, FLOOR_Y - 30);
            ctx.lineTo(obs.x + 60, FLOOR_Y);
            ctx.closePath();
            ctx.fill();
        }
        // Draw Block Obstacle
        else if (obs.type === "block") {
            ctx.fillStyle = "#ffaa00";
            ctx.fillRect(obs.x, FLOOR_Y - 40, 40, 40);
            ctx.strokeStyle = "#fff";
            ctx.strokeRect(obs.x, FLOOR_Y - 40, 40, 40);
        }

        // Collision Check
        if (checkCollision(player, obs)) {
            isPlaying = false;
        }
    });

    // --- DRAW UI / SCORE ---
    ctx.fillStyle = "#fff";
    ctx.font = "20px sans-serif";
    ctx.fillText(`SCORE: ${Math.floor(score / 10)}`, 20, 40);

    if (!isPlaying) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff0055";
        ctx.font = "40px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "#fff";
        ctx.font = "20px sans-serif";
        ctx.fillText("Click or Press Space to Restart", canvas.width / 2, canvas.height / 2 + 20);
        ctx.textAlign = "left"; // Reset alignment
    }

    requestAnimationFrame(update);
}

// Start the game loop
update();