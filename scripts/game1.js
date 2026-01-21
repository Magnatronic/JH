// ==========================================
// Game 1: Size Collection Challenge
// ==========================================

class SizeCollectionGame {
    constructor() {
        this.config = {
            difficulty: 1,
            numObjects: 3,
            numSizes: 2,
            variations: ['larger'],
            gameMode: 'practice',
            collectionType: 'collide'
        };
        
        this.objects = [];
        this.collectedCount = 0;
        this.totalToCollect = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.bestTime = null;
        this.currentVariation = null;
        this.targetSize = null;
        
        this.inputHandler = new InputHandler();
        this.audioManager = new AudioManager();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Setup screen controls
        document.getElementById('difficultyLevel').addEventListener('change', (e) => {
            this.applyDifficultyPreset(parseInt(e.target.value));
        });
        
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        // Controller support for dialog screens
        this.setupControllerForDialogs();
    }
    
    setupControllerForDialogs() {
        let lastButtonState = {};
        
        const pollController = () => {
            const gamepads = navigator.getGamepads();
            
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    const gamepad = gamepads[i];
                    
                    // Check button 0 (A button) for press
                    const wasPressed = lastButtonState[i] || false;
                    const isPressed = gamepad.buttons[0]?.pressed || false;
                    
                    if (isPressed && !wasPressed) {
                        // Check if we're on win screen
                        const winScreen = document.getElementById('winScreen');
                        if (winScreen && winScreen.classList.contains('active')) {
                            this.resetGame();
                        }
                    }
                    
                    lastButtonState[i] = isPressed;
                }
            }
            
            requestAnimationFrame(pollController);
        };
        
        pollController();
    }
    
    applyDifficultyPreset(level) {
        const presets = {
            1: { objects: 3, sizes: 2, variations: ['wider'] },
            2: { objects: 5, sizes: 2, variations: ['larger'] },
            3: { objects: 7, sizes: 3, variations: ['larger', 'wider'] },
            4: { objects: 8, sizes: 3, variations: ['larger', 'wider', 'taller'] },
            5: { objects: 10, sizes: 3, variations: ['larger', 'wider', 'taller'] }
        };
        
        const preset = presets[level];
        document.getElementById('numObjects').value = preset.objects;
        document.getElementById('numSizes').value = preset.sizes;
    }
    
    startGame() {
        // Read configuration
        this.config.difficulty = parseInt(document.getElementById('difficultyLevel').value);
        this.config.numObjects = parseInt(document.getElementById('numObjects').value);
        this.config.numSizes = parseInt(document.getElementById('numSizes').value);
        this.config.gameMode = document.getElementById('gameMode').value;
        this.config.collectionType = document.getElementById('collectionType').value;
        
        // Get selected variations
        this.config.variations = [];
        if (document.getElementById('varLarger').checked) this.config.variations.push('larger');
        if (document.getElementById('varWider').checked) this.config.variations.push('wider');
        if (document.getElementById('varTaller').checked) this.config.variations.push('taller');
        
        if (this.config.variations.length === 0) {
            alert('Please select at least one size variation!');
            return;
        }
        
        // Switch to gameplay screen
        this.showScreen('gameplayScreen');
        
        // Setup game
        this.setupGameplay();
        
        // Start timer
        this.startTimer();
        
        // Setup input handlers
        this.setupInputHandlers();
    }
    
    setupGameplay() {
        const gameArea = document.getElementById('gameArea');
        gameArea.innerHTML = '<div id="cursor" class="cursor"></div>';
        
        // Choose a random variation type
        this.currentVariation = this.config.variations[
            Math.floor(Math.random() * this.config.variations.length)
        ];
        
        // Choose target size (e.g., "large", "small", "wide", "thin", etc.)
        const sizeOptions = this.getSizeOptions(this.currentVariation);
        this.targetSize = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];
        
        // Generate objects
        this.generateObjects();
        
        // Update instruction
        const sizeText = this.targetSize === 'large' ? 'largest' :
                        this.targetSize === 'small' ? 'smallest' :
                        this.targetSize === 'wide' ? 'widest' :
                        this.targetSize === 'thin' ? 'thinnest' :
                        this.targetSize === 'tall' ? 'tallest' :
                        this.targetSize === 'short' ? 'shortest' : this.targetSize;
        
        document.getElementById('instruction').textContent = `Collect the ${sizeText}!`;
        
        // Update score display
        document.getElementById('collected').textContent = '0';
        document.getElementById('total').textContent = this.totalToCollect;
        
        // Initialize input handler with game area for proper bounds
        const cursor = document.getElementById('cursor');
        this.inputHandler.init(
            gameArea,
            cursor,
            (collision) => {}, // collision handled separately in setupInputHandlers
            this.config.collectionType === 'collide'
        );
    }
    
    getSizeOptions(variation) {
        const options = {
            'larger': ['large', 'small'],
            'wider': ['wide', 'thin'],
            'taller': ['tall', 'short']
        };
        return options[variation];
    }
    
    generateObjects() {
        const gameArea = document.getElementById('gameArea');
        const shapes = ['circle', 'square', 'triangle', 'star', 'rectangle'];
        const colors = ['#00ffff', '#ff00ff', '#ffff00', '#ff8800', '#00ff00'];
        
        // Choose one shape for all objects
        const chosenShape = shapes[Math.floor(Math.random() * shapes.length)];
        
        // Generate size values based on variation
        const sizes = this.generateSizes();
        
        this.objects = [];
        this.collectedCount = 0;
        this.totalToCollect = 0;
        
        // Player starts at center
        const playerX = window.innerWidth / 2;
        const playerY = window.innerHeight / 2;
        const minDistanceFromPlayer = 150;
        const minDistanceBetweenObjects = 120;
        
        for (let i = 0; i < this.config.numObjects; i++) {
            const size = sizes[i % sizes.length];
            const isTarget = (size.label === this.targetSize);
            
            if (isTarget) this.totalToCollect++;
            
            // Try to find a non-overlapping position
            let x, y, attempts = 0;
            let tooClose = true;
            
            while (tooClose && attempts < 50) {
                x = Math.random() * (window.innerWidth - 200) + 50;
                y = Math.random() * (window.innerHeight - 350) + 150;
                
                // Check distance from player spawn
                const distFromPlayer = Math.sqrt(
                    Math.pow(x - playerX, 2) + Math.pow(y - playerY, 2)
                );
                
                if (distFromPlayer < minDistanceFromPlayer) {
                    attempts++;
                    continue;
                }
                
                // Check distance from other objects
                tooClose = false;
                for (const other of this.objects) {
                    const distFromOther = Math.sqrt(
                        Math.pow(x - other.x, 2) + Math.pow(y - other.y, 2)
                    );
                    
                    if (distFromOther < minDistanceBetweenObjects) {
                        tooClose = true;
                        break;
                    }
                }
                
                attempts++;
            }
            
            const obj = {
                id: i,
                shape: chosenShape,
                size: size,
                color: colors[i % colors.length],
                isTarget: isTarget,
                collected: false,
                x: x,
                y: y
            };
            
            this.objects.push(obj);
            this.createObjectElement(obj, gameArea);
        }
    }
    
    generateSizes() {
        const variation = this.currentVariation;
        const numSizes = this.config.numSizes;
        const sizes = [];
        
        if (variation === 'larger') {
            // Much bigger size differences (60px to 140px)
            const sizeValues = [60, 100, 140];
            for (let i = 0; i < numSizes; i++) {
                const value = sizeValues[i];
                // Only first is 'small', only last is 'large', middle is 'medium'
                let label;
                if (i === 0) {
                    label = 'small';
                } else if (i === numSizes - 1) {
                    label = 'large';
                } else {
                    label = 'medium';
                }
                sizes.push({
                    label: label,
                    width: value,
                    height: value
                });
            }
        } else if (variation === 'wider') {
            // Much bigger width differences (50px to 150px)
            const widthValues = [50, 100, 150];
            for (let i = 0; i < numSizes; i++) {
                const width = widthValues[i];
                // Only first is 'thin', only last is 'wide', middle is 'medium'
                let label;
                if (i === 0) {
                    label = 'thin';
                } else if (i === numSizes - 1) {
                    label = 'wide';
                } else {
                    label = 'medium';
                }
                sizes.push({
                    label: label,
                    width: width,
                    height: 80
                });
            }
        } else if (variation === 'taller') {
            // Much bigger height differences (50px to 140px)
            const heightValues = [50, 95, 140];
            for (let i = 0; i < numSizes; i++) {
                const height = heightValues[i];
                // Only first is 'short', only last is 'tall', middle is 'medium'
                let label;
                if (i === 0) {
                    label = 'short';
                } else if (i === numSizes - 1) {
                    label = 'tall';
                } else {
                    label = 'medium';
                }
                sizes.push({
                    label: label,
                    width: 80,
                    height: height
                });
            }
        }
        
        return sizes;
    }
    
    createObjectElement(obj, container) {
        const element = document.createElement('div');
        element.className = `game-object object-${obj.shape}`;
        element.id = `object-${obj.id}`;
        element.style.left = obj.x + 'px';
        element.style.top = obj.y + 'px';
        element.style.width = obj.size.width + 'px';
        element.style.height = obj.size.height + 'px';
        element.style.backgroundColor = obj.color;
        
        // Special handling for triangle
        if (obj.shape === 'triangle') {
            element.style.borderLeft = `${obj.size.width / 2}px solid transparent`;
            element.style.borderRight = `${obj.size.width / 2}px solid transparent`;
            element.style.borderBottom = `${obj.size.height}px solid ${obj.color}`;
            element.style.backgroundColor = 'transparent';
        }
        
        container.appendChild(element);
    }
    
    setupInputHandlers() {
        if (this.config.collectionType === 'collide') {
            // Collision detection on cursor move
            this.inputHandler.onMove = (x, y) => {
                this.checkCollisions(x, y);
            };
        } else {
            // Button press to collect
            this.inputHandler.onButtonPress = (x, y) => {
                this.checkCollisions(x, y, true);
            };
        }
    }
    
    checkCollisions(cursorX, cursorY, requireButton = false) {
        const collisionRadius = 20; // Cursor radius
        
        for (const obj of this.objects) {
            if (obj.collected) continue;
            
            // Check if cursor overlaps with object boundaries
            const objLeft = obj.x;
            const objRight = obj.x + obj.size.width;
            const objTop = obj.y;
            const objBottom = obj.y + obj.size.height;
            
            // Simple bounding box collision with cursor radius
            const isColliding = (
                cursorX + collisionRadius > objLeft &&
                cursorX - collisionRadius < objRight &&
                cursorY + collisionRadius > objTop &&
                cursorY - collisionRadius < objBottom
            );
            
            if (isColliding) {
                if (requireButton || this.config.collectionType === 'collide') {
                    this.collectObject(obj);
                }
                break;
            }
        }
    }
    
    collectObject(obj) {
        if (obj.collected) return;
        
        obj.collected = true;
        
        // Only count if it's a target object
        if (obj.isTarget) {
            this.collectedCount++;
            
            // Visual feedback - green flash
            this.flashScreen('#44FF44');
            
            const element = document.getElementById(`object-${obj.id}`);
            element.classList.add('collecting');
            
            // Audio feedback
            this.audioManager.playCollect();
            this.audioManager.speakPositive();
            
            // Particle effect
            this.audioManager.createParticleExplosion(
                obj.x + obj.size.width / 2,
                obj.y + obj.size.height / 2,
                document.getElementById('gameArea')
            );
            
            // Remove element after animation
            setTimeout(() => {
                element.remove();
            }, 500);
            
            // Update score
            document.getElementById('collected').textContent = this.collectedCount;
            
            // Check win condition
            if (this.collectedCount >= this.totalToCollect) {
                setTimeout(() => this.winGame(), 600);
            }
        } else {
            // Collected wrong object
            if (this.config.gameMode === 'challenge') {
                // Challenge mode: game over
                const element = document.getElementById(`object-${obj.id}`);
                element.style.backgroundColor = '#ff0000';
                
                this.flashScreen('#FF4444');
                this.audioManager.playBeep(200, 0.3);
                this.audioManager.speakMessage("Oops! That was the wrong size. Let's try again!");
                
                setTimeout(() => {
                    element.remove();
                    this.gameOver();
                }, 800);
            } else {
                // Practice mode: gentle feedback, object stays
                this.flashScreen('#FF4444');
                this.audioManager.playBeep(200, 0.1);
                obj.collected = false; // Allow trying again
            }
        }
    }
    
    flashScreen(color) {
        const gameArea = document.getElementById('gameArea');
        gameArea.style.backgroundColor = color;
        setTimeout(() => {
            gameArea.style.backgroundColor = '#1a1a2e';
        }, 200);
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            
            document.getElementById('timer').textContent = 
                `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }, 100);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    getElapsedTime() {
        if (!this.startTime) return 0;
        return Date.now() - this.startTime;
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    winGame() {
        this.stopTimer();
        
        const finalTime = this.getElapsedTime();
        
        // Update best time
        if (!this.bestTime || finalTime < this.bestTime) {
            this.bestTime = finalTime;
        }
        
        // Show win screen
        this.showScreen('winScreen');
        
        // Display times
        document.getElementById('finalTime').textContent = this.formatTime(finalTime);
        
        if (this.bestTime && this.bestTime < finalTime) {
            document.getElementById('bestTimeDisplay').style.display = 'block';
            document.getElementById('bestTime').textContent = this.formatTime(this.bestTime);
        }
        
        // Celebration
        this.audioManager.playCelebration();
        this.audioManager.speakMessage("You collected them all! Well done!");
        this.audioManager.createConfetti(document.getElementById('confetti'));
    }
    
    gameOver() {
        this.stopTimer();
        
        // Show win screen but with game over message
        this.showScreen('winScreen');
        
        // Change title and message
        document.querySelector('.win-title').textContent = 'GAME OVER';
        document.querySelector('.win-title').style.color = '#ff8800';
        
        const finalTime = this.getElapsedTime();
        document.getElementById('finalTime').textContent = this.formatTime(finalTime);
        
        // Show collected count
        const statsEl = document.querySelector('.win-stats');
        statsEl.innerHTML = `
            <p class="final-time">You collected: <span id="finalCollected">${this.collectedCount} / ${this.totalToCollect}</span></p>
            <p class="final-time">Time: <span id="finalTime">${this.formatTime(finalTime)}</span></p>
        `;
        
        // Hide best time in game over
        document.getElementById('bestTimeDisplay').style.display = 'none';
    }
    
    resetGame() {
        // Reset win screen styling
        document.querySelector('.win-title').textContent = 'WELL DONE!';
        document.querySelector('.win-title').style.color = '';
        
        this.showScreen('gameplayScreen');
        this.setupGameplay();
        this.startTimer();
        this.setupInputHandlers();
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SizeCollectionGame();
});
