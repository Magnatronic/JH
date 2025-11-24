// ==========================================
// Game 2: Number Collection Challenge
// ==========================================

class NumberCollectionGame {
    constructor() {
        this.config = {
            gameMode: 'findNumber',
            targetNumber: 2,
            compareType: 'biggest',
            numberRange: '1-3',
            numObjects: 6,
            practiceMode: 'practice',
            collectionType: 'collide',
            displayFormat: 'numbers'
        };
        
        this.objects = [];
        this.collectedCount = 0;
        this.totalToCollect = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.bestTime = null;
        this.currentSequence = 1; // For counting up mode
        
        this.inputHandler = new InputHandler();
        this.audioManager = new AudioManager();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUIForMode();
        
        // Initialize target number options based on current range
        const numberRange = document.getElementById('numberRange').value;
        this.updateTargetNumberOptions(numberRange);
    }
    
    setupEventListeners() {
        // Setup screen controls
        document.getElementById('gameMode').addEventListener('change', (e) => {
            this.updateUIForMode();
        });
        
        document.getElementById('numberRange').addEventListener('change', (e) => {
            this.updateTargetNumberOptions(e.target.value);
            this.updateNumObjectsForCountingUp();
        });
        
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('tryAgainBtn').addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    updateTargetNumberOptions(range) {
        const targetSelect = document.getElementById('targetNumber');
        const currentValue = parseInt(targetSelect.value);
        const [min, max] = range.split('-').map(n => parseInt(n));
        
        // Clear existing options
        targetSelect.innerHTML = '';
        
        // Add Random option
        const randomOption = document.createElement('option');
        randomOption.value = 'random';
        randomOption.textContent = 'Random';
        targetSelect.appendChild(randomOption);
        
        // Add options for the selected range
        for (let i = min; i <= max; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            targetSelect.appendChild(option);
        }
        
        // Restore previous selection if still valid, otherwise select middle value
        if (currentValue >= min && currentValue <= max) {
            targetSelect.value = currentValue;
        } else {
            targetSelect.value = Math.ceil((min + max) / 2);
        }
    }
    
    updateUIForMode() {
        const mode = document.getElementById('gameMode').value;
        const targetGroup = document.getElementById('targetNumberGroup');
        const compareGroup = document.getElementById('compareTypeGroup');
        const numObjectsSelect = document.getElementById('numObjects');
        
        // Show/hide appropriate controls based on mode
        if (mode === 'findNumber') {
            targetGroup.style.display = 'block';
            compareGroup.style.display = 'none';
            numObjectsSelect.disabled = false;
        } else if (mode === 'biggestSmallest') {
            targetGroup.style.display = 'none';
            compareGroup.style.display = 'block';
            numObjectsSelect.disabled = false;
        } else if (mode === 'countingUp') {
            targetGroup.style.display = 'none';
            compareGroup.style.display = 'none';
            this.updateNumObjectsForCountingUp();
            numObjectsSelect.disabled = true;
        }
    }
    
    updateNumObjectsForCountingUp() {
        const mode = document.getElementById('gameMode').value;
        if (mode === 'countingUp') {
            const range = document.getElementById('numberRange').value;
            const rangeArray = this.parseNumberRange(range);
            document.getElementById('numObjects').value = rangeArray.length;
        }
    }
    
    startGame() {
        // Read config from UI
        this.config.gameMode = document.getElementById('gameMode').value;
        const targetValue = document.getElementById('targetNumber').value;
        
        // Handle random target number
        if (targetValue === 'random') {
            const range = this.parseNumberRange(document.getElementById('numberRange').value);
            this.config.targetNumber = range[Math.floor(Math.random() * range.length)];
        } else {
            this.config.targetNumber = parseInt(targetValue);
        }
        
        this.config.compareType = document.getElementById('compareType').value;
        this.config.numberRange = document.getElementById('numberRange').value;
        this.config.numObjects = parseInt(document.getElementById('numObjects').value);
        this.config.practiceMode = document.getElementById('practiceMode').value;
        this.config.collectionType = document.getElementById('collectionType').value;
        this.config.displayFormat = document.getElementById('displayFormat').value;
        
        // For counting up mode, override numObjects to match the range
        if (this.config.gameMode === 'countingUp') {
            const range = this.parseNumberRange(this.config.numberRange);
            this.config.numObjects = range.length;
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
        
        // Reset game state
        this.collectedCount = 0;
        this.currentSequence = 1;
        this.startTime = Date.now();
        
        // Generate objects
        this.generateObjects();
        
        // Update HUD
        this.updateHUD();
        
        // Reset input handler position
        this.inputHandler.reset();
        
        // Speak initial instruction
        setTimeout(() => {
            this.audioManager.speak(this.getInstruction());
        }, 500);
    }
    
    getInstruction() {
        const mode = this.config.gameMode;
        
        if (mode === 'findNumber') {
            return `Collect all the ${this.config.targetNumber}'s`;
        } else if (mode === 'biggestSmallest') {
            const type = this.config.compareType === 'biggest' ? 'biggest' : 'smallest';
            return `Collect the ${type} numbers`;
        } else if (mode === 'countingUp') {
            return `Collect the numbers in order, starting from 1`;
        }
    }
    
    generateObjects() {
        this.objects = [];
        const gameArea = document.getElementById('gameArea');
        gameArea.innerHTML = '<div id="cursor" class="cursor"></div>';
        
        const mode = this.config.gameMode;
        const range = this.parseNumberRange(this.config.numberRange);
        const numObjects = this.config.numObjects;
        
        let numberList = [];
        
        if (mode === 'findNumber') {
            // Mix of target number and distractors
            const numTarget = Math.ceil(numObjects / 2);
            const numDistractors = numObjects - numTarget;
            
            for (let i = 0; i < numTarget; i++) {
                numberList.push({ value: this.config.targetNumber, isTarget: true });
            }
            
            for (let i = 0; i < numDistractors; i++) {
                let distractor;
                do {
                    distractor = range[Math.floor(Math.random() * range.length)];
                } while (distractor === this.config.targetNumber);
                numberList.push({ value: distractor, isTarget: false });
            }
            
        } else if (mode === 'biggestSmallest') {
            // Mix of numbers from range
            for (let i = 0; i < numObjects; i++) {
                const value = range[Math.floor(Math.random() * range.length)];
                numberList.push({ value: value, isTarget: false }); // Will determine target during collection
            }
            
        } else if (mode === 'countingUp') {
            // Create one of each number in the range
            for (let i = 0; i < range.length; i++) {
                numberList.push({ 
                    value: range[i], 
                    isTarget: range[i] === this.currentSequence 
                });
            }
        }
        
        // Shuffle
        numberList.sort(() => Math.random() - 0.5);
        
        // Generate positioned objects using game1's exact approach
        this.totalToCollect = 0;
        
        // Player starts at center
        const playerX = window.innerWidth / 2;
        const playerY = window.innerHeight / 2;
        const minDistanceFromPlayer = 150;
        const minDistanceBetweenObjects = 120;
        
        for (let i = 0; i < numberList.length; i++) {
            const num = numberList[i];
            
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
            
            const obj = this.createNumberObject(num, { x, y });
            
            if (num.isTarget) {
                this.totalToCollect++;
            }
            
            this.objects.push(obj);
            gameArea.appendChild(obj.element);
        }
        
        // Update total to collect for biggestSmallest mode
        if (mode === 'biggestSmallest') {
            const values = numberList.map(n => n.value);
            const targetValue = this.config.compareType === 'biggest' ? Math.max(...values) : Math.min(...values);
            this.totalToCollect = values.filter(v => v === targetValue).length;
            // Mark targets
            this.objects.forEach(obj => {
                if (obj.value === targetValue) {
                    obj.isTarget = true;
                }
            });
        } else if (mode === 'countingUp') {
            this.totalToCollect = range.length;
        }
    }
    
    createNumberObject(num, position) {
        const obj = document.createElement('div');
        obj.classList.add('number-object');
        
        const format = num.format || 'digit';
        const value = num.value;
        
        // In dice mode, always use dots
        if (this.config.displayFormat === 'dice') {
            obj.innerHTML = this.createDiceDots(value);
        } else if (format === 'digit') {
            obj.textContent = value;
            obj.style.fontSize = '55px';
        } else if (format === 'dots') {
            obj.innerHTML = this.createDots(value);
            obj.style.fontSize = '28px';
        } else if (format === 'word') {
            const words = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
            obj.textContent = words[value] || value;
            obj.style.fontSize = '35px';
        } else if (format === 'tally') {
            obj.innerHTML = this.createTally(value);
            obj.style.fontSize = '40px';
        }
        
        obj.style.left = position.x + 'px';
        obj.style.top = position.y + 'px';
        
        return {
            element: obj,
            value: value,
            format: format,
            isTarget: num.isTarget,
            x: position.x,
            y: position.y,
            width: 80,
            height: 80,
            collected: false
        };
    }
    
    createDiceDots(count) {
        // Create dice-like dot patterns that fit in 80x80px with consistent 14px dots
        const patterns = {
            1: '<div style="display: grid; place-items: center; width: 100%; height: 100%;"><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div></div>',
            2: '<div style="display: flex; justify-content: space-between; padding: 15px; height: 100%; flex-direction: column;"><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%; align-self: flex-end;"></div></div>',
            3: '<div style="display: flex; justify-content: space-between; padding: 15px; height: 100%; flex-direction: column;"><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%; align-self: center;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%; align-self: flex-end;"></div></div>',
            4: '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 15px; place-items: center;"><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div></div>',
            5: '<div style="position: relative; width: 100%; height: 100%; padding: 12px;"><div style="position: absolute; top: 12px; left: 12px; width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="position: absolute; top: 12px; right: 12px; width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="position: absolute; bottom: 12px; left: 12px; width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="position: absolute; bottom: 12px; right: 12px; width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div></div>',
            6: '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px;"><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div></div>'
        };
        
        // For numbers 7-10, use a grid pattern
        if (count <= 6) {
            return patterns[count];
        } else {
            let html = '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 8px; place-items: center;">';
            for (let i = 0; i < count; i++) {
                html += '<div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div>';
            }
            html += '</div>';
            return html;
        }
    }
    
    createDots(count) {
        let html = '<div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; padding: 20px;">';
        for (let i = 0; i < count; i++) {
            html += '<div style="width: 20px; height: 20px; background: #000000; border-radius: 50%;"></div>';
        }
        html += '</div>';
        return html;
    }
    
    createTally(count) {
        let html = '<div style="display: flex; gap: 5px; padding: 20px;">';
        for (let i = 0; i < count; i++) {
            if (i === 4) {
                html += '<div style="width: 3px; height: 50px; background: #000000; transform: rotate(-45deg); margin: 0 10px;"></div>';
            } else {
                html += '<div style="width: 3px; height: 50px; background: #000000;"></div>';
            }
        }
        html += '</div>';
        return html;
    }
    
    parseNumberRange(range) {
        const [min, max] = range.split('-').map(n => parseInt(n));
        const numbers = [];
        for (let i = min; i <= max; i++) {
            numbers.push(i);
        }
        return numbers;
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
            const objRight = obj.x + obj.width;
            const objTop = obj.y;
            const objBottom = obj.y + obj.height;
            
            // Simple bounding box collision with cursor radius
            const isColliding = (
                cursorX + collisionRadius > objLeft &&
                cursorX - collisionRadius < objRight &&
                cursorY + collisionRadius > objTop &&
                cursorY - collisionRadius < objBottom
            );
            
            if (isColliding) {
                if (requireButton || this.config.collectionType === 'collide') {
                    this.handleInteraction(obj);
                }
                break;
            }
        }
    }
    
    handleInteraction(collision) {
        if (!collision || collision.collected) return;
        
        const mode = this.config.gameMode;
        let isCorrect = false;
        
        if (mode === 'findNumber' || mode === 'numberMatch') {
            isCorrect = collision.isTarget;
        } else if (mode === 'biggestSmallest') {
            isCorrect = collision.isTarget;
        } else if (mode === 'countingUp') {
            isCorrect = collision.value === this.currentSequence;
        }
        
        if (isCorrect) {
            this.collectObject(collision);
        } else {
            // Wrong collection
            if (this.config.practiceMode === 'challenge') {
                this.gameOver();
            } else {
                this.audioManager.playBeep(200, 0.3);
                this.flashScreen('#FF4444');
            }
        }
    }
    
    collectObject(obj) {
        if (obj.collected) return;
        
        obj.collected = true;
        
        // Visual feedback
        const element = obj.element;
        element.classList.add('collected');
        
        // Audio feedback
        this.audioManager.playCollect();
        this.audioManager.speakPositive();
        
        // Particle effect
        this.audioManager.createParticleExplosion(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            document.getElementById('gameArea')
        );
        
        // For counting up mode, increment sequence
        if (this.config.gameMode === 'countingUp') {
            this.currentSequence++;
            // Update instruction
            if (this.currentSequence <= this.totalToCollect) {
                const instruction = `Now collect ${this.currentSequence}`;
                document.getElementById('instruction').textContent = instruction;
                this.audioManager.speak(instruction);
            }
        }
        
        // Remove element after animation
        setTimeout(() => {
            element.remove();
        }, 500);
        
        this.collectedCount++;
        
        // Update score
        document.getElementById('collected').textContent = this.collectedCount;
        
        // Check win condition
        if (this.collectedCount >= this.totalToCollect) {
            setTimeout(() => this.winGame(), 600);
        }
    }
    
    flashScreen(color) {
        const gameArea = document.getElementById('gameArea');
        gameArea.style.backgroundColor = color;
        setTimeout(() => {
            gameArea.style.backgroundColor = '#1a1a2e';
        }, 200);
    }
    
    updateHUD() {
        document.getElementById('instruction').textContent = this.getInstruction();
        document.getElementById('collected').textContent = this.collectedCount;
        document.getElementById('total').textContent = this.totalToCollect;
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('timer').textContent = `${minutes}:${seconds}`;
        }, 1000);
    }
    
    winGame() {
        clearInterval(this.timerInterval);
        
        const finalTime = Date.now() - this.startTime;
        const minutes = Math.floor(finalTime / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((finalTime % 60000) / 1000).toString().padStart(2, '0');
        
        document.getElementById('finalTime').textContent = `${minutes}:${seconds}`;
        
        // Update best time
        if (this.bestTime === null || finalTime < this.bestTime) {
            this.bestTime = finalTime;
            const bestMinutes = Math.floor(this.bestTime / 60000).toString().padStart(2, '0');
            const bestSeconds = Math.floor((this.bestTime % 60000) / 1000).toString().padStart(2, '0');
            document.getElementById('bestTime').textContent = `${bestMinutes}:${bestSeconds}`;
            document.getElementById('bestTimeDisplay').style.display = 'block';
        } else if (this.bestTime !== null) {
            const bestMinutes = Math.floor(this.bestTime / 60000).toString().padStart(2, '0');
            const bestSeconds = Math.floor((this.bestTime % 60000) / 1000).toString().padStart(2, '0');
            document.getElementById('bestTime').textContent = `${bestMinutes}:${bestSeconds}`;
            document.getElementById('bestTimeDisplay').style.display = 'block';
        }
        
        // Switch screens
        this.showScreen('winScreen');
        
        // Celebration
        this.audioManager.playCelebration();
        this.audioManager.speak('Fantastic! You did it!');
        this.audioManager.createConfetti(document.getElementById('confetti'));
    }
    
    gameOver() {
        clearInterval(this.timerInterval);
        
        // Show game over screen
        this.showScreen('gameOverScreen');
    }
    
    resetGame() {
        // Re-select random target if random was chosen
        const targetValue = document.getElementById('targetNumber').value;
        if (targetValue === 'random') {
            const range = this.parseNumberRange(this.config.numberRange);
            this.config.targetNumber = range[Math.floor(Math.random() * range.length)];
        }
        
        this.showScreen('gameplayScreen');
        this.setupGameplay();
        this.startTimer();
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new NumberCollectionGame();
});
