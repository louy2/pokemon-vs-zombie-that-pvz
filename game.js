// ==================== BACKGROUND MUSIC ====================
class MusicPlayer {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.masterGain = null;
        this.scheduledTime = 0;
        this.tempo = 120;
        this.beatDuration = 60 / this.tempo;
        this.loopInterval = null;

        // Music patterns (pentatonic scale for pleasant sound)
        this.bassPattern = [0, 0, 7, 5, 0, 0, 7, 3]; // C, C, G, F, C, C, G, E
        this.melodyPattern = [12, 14, 16, 14, 12, 9, 7, 9]; // Higher octave
        this.baseFreq = 130.81; // C3
    }

    init() {
        if (this.audioContext) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.audioContext.destination);
    }

    noteToFreq(semitones) {
        return this.baseFreq * Math.pow(2, semitones / 12);
    }

    playNote(freq, startTime, duration, type = 'square', gain = 0.3) {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
        gainNode.gain.setValueAtTime(gain, startTime + duration * 0.7);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playDrum(startTime, type = 'kick') {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        if (type === 'kick') {
            osc.frequency.setValueAtTime(150, startTime);
            osc.frequency.exponentialRampToValueAtTime(50, startTime + 0.1);
            gainNode.gain.setValueAtTime(0.5, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        } else if (type === 'hihat') {
            // Use noise-like high frequency
            osc.type = 'square';
            osc.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.1, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
        }

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
    }

    scheduleBar() {
        const currentTime = this.audioContext.currentTime;
        if (this.scheduledTime < currentTime) {
            this.scheduledTime = currentTime;
        }

        for (let i = 0; i < 8; i++) {
            const beatTime = this.scheduledTime + i * this.beatDuration;

            // Bass line
            const bassNote = this.bassPattern[i];
            this.playNote(this.noteToFreq(bassNote), beatTime, this.beatDuration * 0.8, 'triangle', 0.4);

            // Melody (every other beat)
            if (i % 2 === 0) {
                const melodyNote = this.melodyPattern[i];
                this.playNote(this.noteToFreq(melodyNote), beatTime, this.beatDuration * 0.5, 'square', 0.15);
            }

            // Drums
            if (i % 2 === 0) {
                this.playDrum(beatTime, 'kick');
            }
            this.playDrum(beatTime, 'hihat');
        }

        this.scheduledTime += 8 * this.beatDuration;
    }

    start() {
        if (this.isPlaying) return;

        this.init();

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.scheduledTime = this.audioContext.currentTime;

        // Schedule first bar immediately
        this.scheduleBar();

        // Schedule subsequent bars
        this.loopInterval = setInterval(() => {
            if (this.isPlaying) {
                this.scheduleBar();
            }
        }, 8 * this.beatDuration * 1000 * 0.8); // Schedule slightly ahead
    }

    stop() {
        this.isPlaying = false;
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
        return this.isPlaying;
    }

    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = value;
        }
    }
}

// Global music player instance
const musicPlayer = new MusicPlayer();

// ==================== GAME CONFIGURATION ====================
const CONFIG = {
    GRID_ROWS: 5,
    GRID_COLS: 9,
    CELL_WIDTH: 80,
    CELL_HEIGHT: 100,
    CANVAS_PADDING: 10,
    INITIAL_ENERGY: 50,
    ENERGY_DROP_INTERVAL: 10000, // Sky energy drop every 10 seconds
    ENERGY_DROP_AMOUNT: 25,
    ZOMBIE_SPAWN_INTERVAL: 8000,
    MIN_ZOMBIE_SPAWN_INTERVAL: 3000,
    WAVE_DURATION: 60000, // 60 seconds per wave
    MAX_WAVES: 3
};

// ==================== POKEMON DATA ====================
const POKEMON_DATA = {
    pikachu: {
        name: '皮卡丘',
        cost: 100,
        health: 100,
        damage: 20,
        attackSpeed: 1500,
        projectileSpeed: 5,
        icon: '⚡',
        color: '#FFE135',
        projectileColor: '#FFD700',
        type: 'attacker',
        description: '发射电击攻击'
    },
    bulbasaur: {
        name: '妙蛙种子',
        cost: 50,
        health: 80,
        damage: 0,
        energyProduction: 25,
        productionInterval: 5000,
        icon: '🌱',
        color: '#78C850',
        type: 'producer',
        description: '产生能量'
    },
    charmander: {
        name: '小火龙',
        cost: 175,
        health: 100,
        damage: 40,
        attackSpeed: 2000,
        projectileSpeed: 4,
        icon: '🔥',
        color: '#F08030',
        projectileColor: '#FF4500',
        type: 'attacker',
        description: '发射火焰攻击'
    },
    squirtle: {
        name: '杰尼龟',
        cost: 125,
        health: 100,
        damage: 15,
        attackSpeed: 1200,
        projectileSpeed: 6,
        slowEffect: 0.5,
        slowDuration: 2000,
        icon: '💧',
        color: '#6890F0',
        projectileColor: '#00BFFF',
        type: 'attacker',
        description: '发射水枪并减速'
    },
    snorlax: {
        name: '卡比兽',
        cost: 50,
        health: 400,
        damage: 0,
        icon: '😴',
        color: '#A8A878',
        type: 'tank',
        description: '高血量坦克'
    },
    machinegun: {
        name: '机枪手',
        cost: 200,
        health: 80,
        damage: 8,
        attackSpeed: 200, // Very fast attack speed
        projectileSpeed: 10,
        icon: '🔫',
        color: '#505050',
        projectileColor: '#FFD700',
        type: 'attacker',
        description: '超高射速攻击'
    }
};

// ==================== ZOMBIE DATA ====================
const ZOMBIE_DATA = {
    normal: {
        name: '普通僵尸',
        health: 100,
        damage: 20,
        speed: 0.3,
        attackSpeed: 1000,
        color: '#556B2F',
        icon: '🧟'
    },
    cone: {
        name: '路障僵尸',
        health: 200,
        damage: 20,
        speed: 0.3,
        attackSpeed: 1000,
        color: '#8B4513',
        icon: '🧟'
    },
    bucket: {
        name: '铁桶僵尸',
        health: 400,
        damage: 25,
        speed: 0.25,
        attackSpeed: 1000,
        color: '#696969',
        icon: '🧟'
    },
    fast: {
        name: '跑步僵尸',
        health: 80,
        damage: 15,
        speed: 0.6,
        attackSpeed: 800,
        color: '#8B0000',
        icon: '🏃'
    }
};

// ==================== GAME STATE ====================
class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.energy = CONFIG.INITIAL_ENERGY;
        this.wave = 1;
        this.waveStartTime = 0;
        this.isRunning = false;
        this.isGameOver = false;
        this.isVictory = false;
        this.selectedPokemon = null;
        this.grid = Array(CONFIG.GRID_ROWS).fill(null).map(() => Array(CONFIG.GRID_COLS).fill(null));
        this.pokemons = [];
        this.zombies = [];
        this.projectiles = [];
        this.energyOrbs = [];
        this.lastZombieSpawn = 0;
        this.lastEnergyDrop = 0;
        this.zombiesSpawnedThisWave = 0;
        this.zombiesPerWave = [10, 15, 25]; // Zombies per wave
    }
}

// ==================== GAME CLASSES ====================

class Pokemon {
    constructor(type, row, col) {
        const data = POKEMON_DATA[type];
        this.type = type;
        this.name = data.name;
        this.row = row;
        this.col = col;
        this.x = col * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2;
        this.y = row * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2;
        this.health = data.health;
        this.maxHealth = data.health;
        this.damage = data.damage;
        this.attackSpeed = data.attackSpeed || 0;
        this.projectileSpeed = data.projectileSpeed || 0;
        this.icon = data.icon;
        this.color = data.color;
        this.projectileColor = data.projectileColor;
        this.pokemonType = data.type;
        this.lastAttack = 0;
        this.lastProduction = 0;
        this.energyProduction = data.energyProduction || 0;
        this.productionInterval = data.productionInterval || 0;
        this.slowEffect = data.slowEffect || 0;
        this.slowDuration = data.slowDuration || 0;
        this.animationFrame = 0;
        this.isAttacking = false;
    }

    update(now, zombies, projectiles, energyOrbs) {
        this.animationFrame = (this.animationFrame + 0.1) % (Math.PI * 2);

        // Producer type - generate energy
        if (this.pokemonType === 'producer') {
            if (now - this.lastProduction > this.productionInterval) {
                this.lastProduction = now;
                // Create energy orb at pokemon position
                energyOrbs.push(new EnergyOrb(
                    this.x + Math.random() * 30 - 15,
                    this.y - 20,
                    this.energyProduction
                ));
            }
        }

        // Attacker type - shoot projectiles
        if (this.pokemonType === 'attacker') {
            // Check if there's a zombie in this row
            const zombieInRow = zombies.some(z =>
                z.row === this.row && z.x > this.x && z.health > 0
            );

            if (zombieInRow && now - this.lastAttack > this.attackSpeed) {
                this.lastAttack = now;
                this.isAttacking = true;
                setTimeout(() => this.isAttacking = false, 200);

                projectiles.push(new Projectile(
                    this.x + 30,
                    this.y,
                    this.row,
                    this.damage,
                    this.projectileSpeed,
                    this.projectileColor,
                    this.type,
                    this.slowEffect,
                    this.slowDuration
                ));
            }
        }
    }

    draw(ctx) {
        const bounce = Math.sin(this.animationFrame) * 3;
        const scale = this.isAttacking ? 1.2 : 1;

        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 35, 25, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Pokemon body
        ctx.save();
        ctx.translate(this.x, this.y + bounce);
        ctx.scale(scale, scale);

        // Body circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();

        // Darker outline
        ctx.strokeStyle = this.adjustColor(this.color, -30);
        ctx.lineWidth = 3;
        ctx.stroke();

        // Icon
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, 0, 0);

        ctx.restore();

        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = 50;
            const barHeight = 6;
            const barX = this.x - barWidth / 2;
            const barY = this.y - 45;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }
}

class Zombie {
    constructor(type, row, x) {
        const data = ZOMBIE_DATA[type];
        this.type = type;
        this.name = data.name;
        this.row = row;
        this.x = x;
        this.y = row * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2;
        this.health = data.health;
        this.maxHealth = data.health;
        this.damage = data.damage;
        this.baseSpeed = data.speed;
        this.speed = data.speed;
        this.attackSpeed = data.attackSpeed;
        this.color = data.color;
        this.icon = data.icon;
        this.lastAttack = 0;
        this.isAttacking = false;
        this.animationFrame = Math.random() * Math.PI * 2;
        this.slowedUntil = 0;
        this.isFrozen = false;
    }

    update(now, pokemons) {
        this.animationFrame += 0.05;

        // Check slow effect
        if (now > this.slowedUntil) {
            this.speed = this.baseSpeed;
            this.isFrozen = false;
        }

        // Find pokemon to attack in this row
        const pokemonInPath = pokemons.find(p =>
            p.row === this.row &&
            p.x < this.x &&
            p.x > this.x - CONFIG.CELL_WIDTH &&
            p.health > 0
        );

        if (pokemonInPath) {
            // Attack the pokemon
            this.isAttacking = true;
            if (now - this.lastAttack > this.attackSpeed) {
                this.lastAttack = now;
                const isDead = pokemonInPath.takeDamage(this.damage);
                if (isDead) {
                    return { killedPokemon: pokemonInPath };
                }
            }
        } else {
            // Move forward
            this.isAttacking = false;
            this.x -= this.speed;
        }

        return null;
    }

    draw(ctx) {
        const wobble = Math.sin(this.animationFrame) * 5;
        const bounce = Math.abs(Math.sin(this.animationFrame * 2)) * 3;

        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 40, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.x + wobble, this.y - bounce);

        // Body
        ctx.fillStyle = this.isFrozen ? '#87CEEB' : this.color;
        ctx.beginPath();
        ctx.ellipse(0, 10, 22, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = this.isFrozen ? '#B0E0E6' : '#7CB342';
        ctx.beginPath();
        ctx.arc(0, -25, 20, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = this.isFrozen ? '#ADD8E6' : '#FF0000';
        ctx.beginPath();
        ctx.arc(-8, -28, 5, 0, Math.PI * 2);
        ctx.arc(8, -28, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-8, -28, 2, 0, Math.PI * 2);
        ctx.arc(8, -28, 2, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -18, 8, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Arms (animated when attacking)
        ctx.strokeStyle = this.isFrozen ? '#87CEEB' : this.color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';

        const armAngle = this.isAttacking ? Math.sin(this.animationFrame * 4) * 0.5 : 0.3;

        // Left arm
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(-35 - (this.isAttacking ? 10 : 0), -10 + Math.sin(this.animationFrame) * 5);
        ctx.stroke();

        // Right arm
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(35 + (this.isAttacking ? 10 : 0), -10 + Math.cos(this.animationFrame) * 5);
        ctx.stroke();

        // Type indicator (helmet)
        if (this.type === 'cone') {
            ctx.fillStyle = '#FF8C00';
            ctx.beginPath();
            ctx.moveTo(0, -55);
            ctx.lineTo(-15, -35);
            ctx.lineTo(15, -35);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'bucket') {
            ctx.fillStyle = '#A0A0A0';
            ctx.fillRect(-15, -50, 30, 20);
            ctx.strokeStyle = '#707070';
            ctx.strokeRect(-15, -50, 30, 20);
        } else if (this.type === 'fast') {
            // Running pose indicator
            ctx.fillStyle = '#FF4444';
            ctx.font = '12px Arial';
            ctx.fillText('💨', 25, -20);
        }

        ctx.restore();

        // Health bar
        const barWidth = 40;
        const barHeight = 5;
        const barX = this.x - barWidth / 2;
        const barY = this.y - 60;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#F44336';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }

    takeDamage(damage, slowEffect = 0, slowDuration = 0) {
        this.health -= damage;
        if (slowEffect > 0 && slowDuration > 0) {
            this.speed = this.baseSpeed * (1 - slowEffect);
            this.slowedUntil = Date.now() + slowDuration;
            this.isFrozen = true;
        }
        return this.health <= 0;
    }
}

class Projectile {
    constructor(x, y, row, damage, speed, color, sourceType, slowEffect = 0, slowDuration = 0) {
        this.x = x;
        this.y = y;
        this.row = row;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.sourceType = sourceType;
        this.slowEffect = slowEffect;
        this.slowDuration = slowDuration;
        this.radius = 8;
        this.animationFrame = 0;
    }

    update() {
        this.x += this.speed;
        this.animationFrame += 0.3;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Trail effect
        ctx.fillStyle = this.color + '80';
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(-i * 8, 0, this.radius - i * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Type-specific effects
        if (this.sourceType === 'pikachu') {
            // Lightning bolt
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-5, -5);
            ctx.lineTo(0, 0);
            ctx.lineTo(-3, 5);
            ctx.stroke();
        } else if (this.sourceType === 'charmander') {
            // Flame particles
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.arc(Math.sin(this.animationFrame) * 3, Math.cos(this.animationFrame) * 3, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.sourceType === 'squirtle') {
            // Water droplet
            ctx.fillStyle = '#FFFFFF80';
            ctx.beginPath();
            ctx.arc(3, -3, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.sourceType === 'machinegun') {
            // Bullet trail
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Spark effect
            ctx.fillStyle = '#FF0';
            ctx.beginPath();
            ctx.arc(-8, 0, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    isOffScreen(canvasWidth) {
        return this.x > canvasWidth;
    }
}

class EnergyOrb {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.targetY = y + 30;
        this.radius = 18;
        this.animationFrame = 0;
        this.lifetime = 0;
        this.maxLifetime = 8000; // 8 seconds to collect
        this.isCollected = false;
        this.collectAnimation = 0;
    }

    update(deltaTime) {
        this.animationFrame += 0.1;
        this.lifetime += deltaTime;

        // Float down animation
        if (this.y < this.targetY) {
            this.y += 1;
        }

        // Blink when about to disappear
        if (this.lifetime > this.maxLifetime * 0.7) {
            this.blink = Math.sin(this.animationFrame * 5) > 0;
        }

        return this.lifetime >= this.maxLifetime;
    }

    draw(ctx) {
        if (this.blink && Math.sin(this.animationFrame * 10) < 0) return;

        const pulse = Math.sin(this.animationFrame) * 3;

        // Glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius + pulse + 10);
        gradient.addColorStop(0, '#FFD70080');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + pulse + 10, 0, Math.PI * 2);
        ctx.fill();

        // Orb
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = '#FFFFFF80';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 6, 0, Math.PI * 2);
        ctx.fill();

        // Energy symbol
        ctx.fillStyle = '#FFA500';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', this.x, this.y);
    }

    containsPoint(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        return dx * dx + dy * dy <= (this.radius + 10) * (this.radius + 10);
    }
}

// ==================== GAME CLASS ====================

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();

        // Set canvas size
        this.canvas.width = CONFIG.GRID_COLS * CONFIG.CELL_WIDTH;
        this.canvas.height = CONFIG.GRID_ROWS * CONFIG.CELL_HEIGHT;

        this.setupEventListeners();
        this.showOverlay('宝可梦大战僵尸', '使用宝可梦来抵御僵尸的入侵！', '开始游戏');

        // Start game loop
        this.lastTime = 0;
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    setupEventListeners() {
        // Pokemon selection
        document.querySelectorAll('.pokemon-card').forEach(card => {
            card.addEventListener('click', () => this.selectPokemon(card));
        });

        // Canvas click for placing pokemon or collecting energy
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Start button
        document.getElementById('start-button').addEventListener('click', () => this.startGame());

        // Music toggle
        document.getElementById('music-toggle').addEventListener('click', () => {
            const isPlaying = musicPlayer.toggle();
            const btn = document.getElementById('music-toggle');
            btn.textContent = isPlaying ? '🔊' : '🔇';
            btn.classList.toggle('muted', !isPlaying);
        });
    }

    selectPokemon(card) {
        if (!this.state.isRunning) return;

        const pokemon = card.dataset.pokemon;
        const cost = parseInt(card.dataset.cost);

        if (this.state.energy < cost) {
            this.showNotEnoughEnergy();
            return;
        }

        // Toggle selection
        document.querySelectorAll('.pokemon-card').forEach(c => c.classList.remove('selected'));

        if (this.state.selectedPokemon === pokemon) {
            this.state.selectedPokemon = null;
        } else {
            card.classList.add('selected');
            this.state.selectedPokemon = pokemon;
        }
    }

    handleCanvasClick(e) {
        if (!this.state.isRunning) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on energy orb
        for (let i = this.state.energyOrbs.length - 1; i >= 0; i--) {
            const orb = this.state.energyOrbs[i];
            if (orb.containsPoint(x, y)) {
                this.collectEnergy(orb, i);
                return;
            }
        }

        // Place pokemon
        if (this.state.selectedPokemon) {
            const col = Math.floor(x / CONFIG.CELL_WIDTH);
            const row = Math.floor(y / CONFIG.CELL_HEIGHT);

            if (this.canPlacePokemon(row, col)) {
                this.placePokemon(row, col);
            }
        }
    }

    canPlacePokemon(row, col) {
        // Check bounds
        if (row < 0 || row >= CONFIG.GRID_ROWS || col < 0 || col >= CONFIG.GRID_COLS - 1) {
            return false;
        }
        // Check if cell is empty
        return this.state.grid[row][col] === null;
    }

    placePokemon(row, col) {
        const pokemonType = this.state.selectedPokemon;
        const cost = POKEMON_DATA[pokemonType].cost;

        if (this.state.energy < cost) {
            this.showNotEnoughEnergy();
            return;
        }

        this.state.energy -= cost;
        this.updateEnergyDisplay();

        const pokemon = new Pokemon(pokemonType, row, col);
        this.state.grid[row][col] = pokemon;
        this.state.pokemons.push(pokemon);

        // Deselect
        this.state.selectedPokemon = null;
        document.querySelectorAll('.pokemon-card').forEach(c => c.classList.remove('selected'));

        this.updatePokemonCardStates();
    }

    collectEnergy(orb, index) {
        this.state.energy += orb.value;
        this.state.energyOrbs.splice(index, 1);
        this.updateEnergyDisplay();
        this.updatePokemonCardStates();
    }

    showNotEnoughEnergy() {
        const display = document.getElementById('energy-display');
        display.style.animation = 'none';
        display.offsetHeight; // Trigger reflow
        display.style.animation = 'shake 0.5s';
    }

    updateEnergyDisplay() {
        document.getElementById('energy-count').textContent = this.state.energy;
    }

    updatePokemonCardStates() {
        document.querySelectorAll('.pokemon-card').forEach(card => {
            const cost = parseInt(card.dataset.cost);
            if (this.state.energy < cost) {
                card.classList.add('disabled');
            } else {
                card.classList.remove('disabled');
            }
        });
    }

    spawnZombie() {
        const types = ['normal'];

        // Add stronger zombies in later waves
        if (this.state.wave >= 2) {
            types.push('cone', 'fast');
        }
        if (this.state.wave >= 3) {
            types.push('bucket');
        }

        const type = types[Math.floor(Math.random() * types.length)];
        const row = Math.floor(Math.random() * CONFIG.GRID_ROWS);
        const x = this.canvas.width + 50;

        this.state.zombies.push(new Zombie(type, row, x));
        this.state.zombiesSpawnedThisWave++;
    }

    dropEnergy() {
        const x = Math.random() * (this.canvas.width - 100) + 50;
        const y = -20;
        this.state.energyOrbs.push(new EnergyOrb(x, y, CONFIG.ENERGY_DROP_AMOUNT));
    }

    startGame() {
        this.hideOverlay();
        this.state.reset();
        this.state.isRunning = true;
        this.state.waveStartTime = Date.now();
        this.updateEnergyDisplay();
        this.updatePokemonCardStates();
        document.getElementById('wave-number').textContent = this.state.wave;

        // Start background music
        musicPlayer.start();
    }

    showOverlay(title, message, buttonText) {
        document.getElementById('overlay-title').textContent = title;
        document.getElementById('overlay-message').textContent = message;
        document.getElementById('start-button').textContent = buttonText;
        document.getElementById('game-overlay').classList.remove('hidden');
    }

    hideOverlay() {
        document.getElementById('game-overlay').classList.add('hidden');
    }

    gameOver() {
        this.state.isRunning = false;
        this.state.isGameOver = true;
        musicPlayer.stop();
        this.showOverlay('游戏结束！', `僵尸突破了防线！你坚持到了第 ${this.state.wave} 波`, '重新开始');
    }

    victory() {
        this.state.isRunning = false;
        this.state.isVictory = true;
        musicPlayer.stop();
        this.showOverlay('胜利！', '恭喜你成功抵御了所有僵尸的进攻！', '再玩一次');
    }

    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(currentTime, deltaTime);
        this.draw();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(now, deltaTime) {
        if (!this.state.isRunning) return;

        // Spawn zombies
        const spawnInterval = Math.max(
            CONFIG.MIN_ZOMBIE_SPAWN_INTERVAL,
            CONFIG.ZOMBIE_SPAWN_INTERVAL - (this.state.wave - 1) * 1500
        );

        if (now - this.state.lastZombieSpawn > spawnInterval &&
            this.state.zombiesSpawnedThisWave < this.state.zombiesPerWave[this.state.wave - 1]) {
            this.state.lastZombieSpawn = now;
            this.spawnZombie();
        }

        // Drop energy from sky
        if (now - this.state.lastEnergyDrop > CONFIG.ENERGY_DROP_INTERVAL) {
            this.state.lastEnergyDrop = now;
            this.dropEnergy();
        }

        // Update pokemons
        this.state.pokemons.forEach(pokemon => {
            pokemon.update(now, this.state.zombies, this.state.projectiles, this.state.energyOrbs);
        });

        // Update zombies
        for (let i = this.state.zombies.length - 1; i >= 0; i--) {
            const zombie = this.state.zombies[i];
            const result = zombie.update(now, this.state.pokemons);

            // Remove dead pokemon
            if (result && result.killedPokemon) {
                const pokemon = result.killedPokemon;
                this.state.grid[pokemon.row][pokemon.col] = null;
                const index = this.state.pokemons.indexOf(pokemon);
                if (index > -1) {
                    this.state.pokemons.splice(index, 1);
                }
            }

            // Check if zombie reached the left side
            if (zombie.x < 0) {
                this.gameOver();
                return;
            }
        }

        // Update projectiles
        for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.state.projectiles[i];
            projectile.update();

            // Check collision with zombies
            let hit = false;
            for (let j = this.state.zombies.length - 1; j >= 0; j--) {
                const zombie = this.state.zombies[j];
                if (zombie.row === projectile.row &&
                    Math.abs(zombie.x - projectile.x) < 30 &&
                    zombie.health > 0) {

                    const isDead = zombie.takeDamage(
                        projectile.damage,
                        projectile.slowEffect,
                        projectile.slowDuration
                    );

                    if (isDead) {
                        this.state.zombies.splice(j, 1);
                    }
                    hit = true;
                    break;
                }
            }

            // Remove projectile if hit or off screen
            if (hit || projectile.isOffScreen(this.canvas.width)) {
                this.state.projectiles.splice(i, 1);
            }
        }

        // Update energy orbs
        for (let i = this.state.energyOrbs.length - 1; i >= 0; i--) {
            const expired = this.state.energyOrbs[i].update(deltaTime);
            if (expired) {
                this.state.energyOrbs.splice(i, 1);
            }
        }

        // Check wave completion
        if (this.state.zombiesSpawnedThisWave >= this.state.zombiesPerWave[this.state.wave - 1] &&
            this.state.zombies.length === 0) {
            if (this.state.wave >= CONFIG.MAX_WAVES) {
                this.victory();
            } else {
                this.state.wave++;
                this.state.zombiesSpawnedThisWave = 0;
                this.state.waveStartTime = Date.now();
                document.getElementById('wave-number').textContent = this.state.wave;
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grass background
        this.drawBackground();

        // Draw grid
        this.drawGrid();

        // Draw pokemons
        this.state.pokemons.forEach(pokemon => pokemon.draw(this.ctx));

        // Draw zombies
        this.state.zombies.forEach(zombie => zombie.draw(this.ctx));

        // Draw projectiles
        this.state.projectiles.forEach(projectile => projectile.draw(this.ctx));

        // Draw energy orbs
        this.state.energyOrbs.forEach(orb => orb.draw(this.ctx));

        // Draw placement preview
        if (this.state.selectedPokemon && this.state.isRunning) {
            this.drawPlacementPreview();
        }
    }

    drawBackground() {
        for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
            for (let col = 0; col < CONFIG.GRID_COLS; col++) {
                const x = col * CONFIG.CELL_WIDTH;
                const y = row * CONFIG.CELL_HEIGHT;

                // Alternating grass colors
                const isLight = (row + col) % 2 === 0;
                this.ctx.fillStyle = isLight ? '#7EC850' : '#5EAC30';
                this.ctx.fillRect(x, y, CONFIG.CELL_WIDTH, CONFIG.CELL_HEIGHT);

                // Grass details
                this.ctx.fillStyle = isLight ? '#8ED860' : '#6EBC40';
                for (let i = 0; i < 3; i++) {
                    const gx = x + Math.random() * CONFIG.CELL_WIDTH;
                    const gy = y + CONFIG.CELL_HEIGHT - 10 + Math.random() * 10;
                    this.ctx.beginPath();
                    this.ctx.moveTo(gx, gy);
                    this.ctx.lineTo(gx - 2, gy - 8);
                    this.ctx.lineTo(gx + 2, gy - 8);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            }
        }

        // Draw danger zone on the right
        const gradient = this.ctx.createLinearGradient(
            this.canvas.width - CONFIG.CELL_WIDTH, 0,
            this.canvas.width, 0
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(139, 0, 0, 0.3)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.canvas.width - CONFIG.CELL_WIDTH, 0, CONFIG.CELL_WIDTH, this.canvas.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let col = 0; col <= CONFIG.GRID_COLS; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * CONFIG.CELL_WIDTH, 0);
            this.ctx.lineTo(col * CONFIG.CELL_WIDTH, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let row = 0; row <= CONFIG.GRID_ROWS; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * CONFIG.CELL_HEIGHT);
            this.ctx.lineTo(this.canvas.width, row * CONFIG.CELL_HEIGHT);
            this.ctx.stroke();
        }
    }

    drawPlacementPreview() {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = this.lastMouseX || 0;
        const mouseY = this.lastMouseY || 0;

        this.canvas.addEventListener('mousemove', (e) => {
            this.lastMouseX = e.clientX - rect.left;
            this.lastMouseY = e.clientY - rect.top;
        });

        if (mouseX && mouseY) {
            const col = Math.floor(mouseX / CONFIG.CELL_WIDTH);
            const row = Math.floor(mouseY / CONFIG.CELL_HEIGHT);

            if (this.canPlacePokemon(row, col)) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            } else {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            }

            this.ctx.fillRect(
                col * CONFIG.CELL_WIDTH,
                row * CONFIG.CELL_HEIGHT,
                CONFIG.CELL_WIDTH,
                CONFIG.CELL_HEIGHT
            );
        }
    }
}

// ==================== INITIALIZE GAME ====================

// Add shake animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Start the game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
