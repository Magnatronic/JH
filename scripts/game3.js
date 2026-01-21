// ==========================================
// Game 3: Color Collectors - Multiplayer
// ==========================================

class ColorCollectorsGame {
    constructor() {
        this.players = [];
        this.objects = [];
        this.config = {
            numberRange: '1-5',
            timeLimit: 120,
            displayFormat: 'numbers',
            numObjects: 12
        };
        
        this.teamScore = 0;
        this.bestTeamScore = localStorage.getItem('game3BestTeamScore') || 0;
        this.startTime = null;
        this.timerInterval = null;
        this.timeRemaining = 120;
        
        this.audioManager = new AudioManager();
        this.playerColors = ['blue', 'red', 'green', 'yellow'];
        
        // Track button states for join phase
        this.lastButtonStates = {};
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.startJoinPhase();
    }
    
    setupEventListeners() {
        document.getElementById('continueBtn').addEventListener('click', () => {
            this.showScreen('setupScreen');
        });
        
        document.getElementById('backToJoinBtn').addEventListener('click', () => {
            this.showScreen('joinScreen');
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
    
    startJoinPhase() {
        // Poll for gamepad connections
        this.pollGamepads();
        
        // Listen for button presses to join
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.index);
        });
    }
    
    pollGamepads() {
        const gamepads = navigator.getGamepads();
        
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                const gamepad = gamepads[i];
                
                // Track previous button state
                const wasPressed = this.lastButtonStates[i] || false;
                const isPressed = gamepad.buttons[0].pressed;
                
                // Debug logging
                if (isPressed && !wasPressed) {
                    console.log(`[JOIN] Gamepad ${i} pressed A button`);
                    console.log(`[JOIN] Gamepad ID: ${gamepad.id}`);
                    console.log(`[JOIN] Current players:`, this.players.map(p => `P${p.number}(GP${p.gamepadIndex})`));
                }
                
                // Only trigger on button press (not held)
                if (isPressed && !wasPressed) {
                    this.tryJoinPlayer(i);
                }
                
                // Update button state
                this.lastButtonStates[i] = isPressed;
            }
        }
        
        requestAnimationFrame(() => this.pollGamepads());
    }
    
    tryJoinPlayer(gamepadIndex) {
        // Check if player already joined
        const alreadyJoined = this.players.find(p => p.gamepadIndex === gamepadIndex);
        if (alreadyJoined) {
            console.log(`[JOIN] Gamepad ${gamepadIndex} already joined as Player ${alreadyJoined.number}`);
            return;
        }
        
        // Check if we have space for more players
        if (this.players.length >= 4) {
            console.log(`[JOIN] Cannot join - already have 4 players`);
            return;
        }
        
        const playerNumber = this.players.length + 1;
        const color = this.playerColors[this.players.length];
        
        console.log(`[JOIN] ✓ Player ${playerNumber} joined (Gamepad ${gamepadIndex}, Color: ${color})`);
        
        const player = {
            number: playerNumber,
            gamepadIndex: gamepadIndex,
            color: color,
            score: 0,
            inputHandler: new InputHandler(gamepadIndex) // Pass gamepad index to InputHandler
        };
        
        this.players.push(player);
        
        // Update UI
        const slot = document.getElementById(`player${playerNumber}-slot`);
        slot.classList.add('joined');
        slot.querySelector('.status').textContent = '✓ Ready!';
        
        // Play sound
        if (this.audioManager && this.audioManager.playBeep) {
            this.audioManager.playBeep(440 + (playerNumber * 110), 0.1);
        }
        
        // Enable continue button if we have 2+ players
        if (this.players.length >= 2) {
            const continueBtn = document.getElementById('continueBtn');
            continueBtn.disabled = false;
            continueBtn.textContent = `CONTINUE (${this.players.length} players)`;
        }
    }
    
    startGame() {
        // Read config
        this.config.numberRange = document.getElementById('numberRange').value;
        this.config.timeLimit = parseInt(document.getElementById('timeLimit').value);
        this.config.displayFormat = document.getElementById('displayFormat').value;
        this.config.objectsPerPlayer = 3; // Fixed at 3 per player
        
        this.timeRemaining = this.config.timeLimit;
        
        // Switch to gameplay screen
        this.showScreen('gameplayScreen');
        
        // Show HUD
        document.querySelector('.hud').style.display = 'flex';
        
        // Setup game
        this.setupGameplay();
        
        // Start timer
        this.startTimer();
    }
    
    setupGameplay() {
        const gameArea = document.getElementById('gameArea');
        gameArea.innerHTML = '';
        
        // Reset scores
        this.teamScore = 0;
        this.players.forEach(player => {
            player.score = 0;
        });
        
        // Force layout calculation before initializing cursors
        gameArea.offsetHeight; // Trigger reflow
        
        // Create cursors for each player
        this.players.forEach((player, index) => {
            const cursor = document.createElement('div');
            cursor.id = `player${player.number}-cursor`;
            cursor.className = `player-cursor ${player.color}`;
            gameArea.appendChild(cursor);
            
            console.log(`[SETUP] Created cursor for Player ${player.number} (Gamepad ${player.gamepadIndex})`);
            console.log(`[SETUP] Cursor element:`, cursor);
            console.log(`[SETUP] Game area dimensions:`, gameArea.offsetWidth, 'x', gameArea.offsetHeight);
            
            // Calculate starting positions spread out across the screen
            const rect = gameArea.getBoundingClientRect();
            const positions = [
                { x: rect.width * 0.25, y: rect.height * 0.5 },  // Player 1: left-center
                { x: rect.width * 0.75, y: rect.height * 0.5 },  // Player 2: right-center
                { x: rect.width * 0.25, y: rect.height * 0.75 }, // Player 3: left-bottom
                { x: rect.width * 0.75, y: rect.height * 0.75 }  // Player 4: right-bottom
            ];
            const startPos = positions[index];
            
            // Initialize input handler for this player with starting position
            player.inputHandler.init(
                gameArea,
                cursor,
                (collision) => {}, // collision callback (not used, we check manually)
                true, // auto-collect mode
                startPos.x,
                startPos.y
            );
            
            console.log(`[SETUP] Initialized input handler for Player ${player.number}`);
            console.log(`[SETUP] Cursor position: ${player.inputHandler.cursorX}, ${player.inputHandler.cursorY}`);
            
            // Setup collision detection
            player.inputHandler.onMove = (x, y) => {
                this.checkCollisions(player, x, y);
            };
            
            // Show player score
            const scoreElement = document.getElementById(`player${player.number}-score`);
            scoreElement.style.display = 'flex';
            scoreElement.querySelector('.score').textContent = '0';
        });
        
        // Generate initial objects
        this.generateObjects();
        
        // Update HUD
        this.updateHUD();
        
        // Show best score in HUD
        document.getElementById('bestScoreHUD').textContent = this.bestTeamScore;
    }
    
    generateObjects() {
        const range = this.parseNumberRange(this.config.numberRange);
        
        this.objects = [];
        
        // Generate 3 objects per player
        this.players.forEach(player => {
            for (let i = 0; i < this.config.objectsPerPlayer; i++) {
                const value = range[Math.floor(Math.random() * range.length)];
                this.createObject(player.color, value);
            }
        });
    }
    
    createObject(color, value) {
        const gameArea = document.getElementById('gameArea');
        
        // Find a position that doesn't overlap
        let position = this.findValidPosition();
        
        const obj = document.createElement('div');
        obj.className = `color-object ${color}`;
        
        // Display content based on format
        if (this.config.displayFormat === 'dice') {
            obj.innerHTML = this.createDiceDots(value);
        } else {
            obj.textContent = value;
            obj.style.fontSize = '42px';
        }
        
        obj.style.left = position.x + 'px';
        obj.style.top = position.y + 'px';
        
        gameArea.appendChild(obj);
        
        this.objects.push({
            element: obj,
            value: value,
            color: color,
            x: position.x,
            y: position.y,
            width: 80,
            height: 80,
            collected: false
        });
    }
    
    findValidPosition() {
        const gameArea = document.getElementById('gameArea');
        const rect = gameArea.getBoundingClientRect();
        
        let attempts = 0;
        let x, y, valid = false;
        
        while (!valid && attempts < 50) {
            // Use game area relative positioning
            x = Math.random() * (rect.width - 120) + 40;
            y = Math.random() * (rect.height - 120) + 40;
            
            // Check if far enough from existing objects
            valid = true;
            for (const other of this.objects) {
                if (!other.collected) {
                    const dist = Math.sqrt(
                        Math.pow(x - other.x, 2) + Math.pow(y - other.y, 2)
                    );
                    if (dist < 100) {
                        valid = false;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        return { x, y };
    }
    
    checkCollisions(player, cursorX, cursorY) {
        for (const obj of this.objects) {
            if (obj.collected) continue;
            
            // Check if cursor overlaps with object
            const objCenterX = obj.x + obj.width / 2;
            const objCenterY = obj.y + obj.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(cursorX - objCenterX, 2) + Math.pow(cursorY - objCenterY, 2)
            );
            
            // Generous collision for easy gameplay
            // Cursor radius (15px) + Object half-width (40px) + buffer (10px) = 65px
            if (distance < 65) {
                // Check if it's the player's color
                if (obj.color === player.color) {
                    this.collectObject(player, obj);
                    break; // Only collect one object per check
                }
            }
        }
    }
    
    collectObject(player, obj) {
        // Mark as collected immediately
        obj.collected = true;
        
        // Update scores immediately
        player.score += obj.value;
        this.teamScore += obj.value;
        
        // Update HUD immediately
        this.updateHUD();
        
        // Play player-specific audio feedback (different wave types for different "instrument" sounds)
        const playerSounds = {
            'blue': { freq: 440, type: 'sine', duration: 0.15 },      // Pure tone - smooth
            'red': { freq: 330, type: 'triangle', duration: 0.15 },   // Bright tone - sharp
            'green': { freq: 523, type: 'square', duration: 0.12 },   // Electronic - buzzy
            'yellow': { freq: 392, type: 'sawtooth', duration: 0.15 } // Rich tone - full
        };
        const sound = playerSounds[player.color] || playerSounds['blue'];
        
        this.audioManager.playBeep(sound.freq, sound.duration, sound.type);
        
        // Visual feedback with particle effect
        this.audioManager.createParticleExplosion(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            document.getElementById('gameArea')
        );
        
        // Remove element immediately
        obj.element.remove();
        
        // Spawn a new object of the same color immediately
        const range = this.parseNumberRange(this.config.numberRange);
        const newValue = range[Math.floor(Math.random() * range.length)];
        this.createObject(obj.color, newValue);
    }
    
    updateHUD() {
        document.getElementById('teamScore').textContent = this.teamScore;
        
        this.players.forEach(player => {
            const scoreElement = document.getElementById(`player${player.number}-score`);
            scoreElement.querySelector('.score').textContent = player.score;
        });
    }
    
    startTimer() {
        this.startTime = Date.now();
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            document.getElementById('timer').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (this.timeRemaining <= 0) {
                console.log('[TIMER] Time up! Calling endGame()');
                this.endGame();
            }
        }, 1000);
    }
    
    endGame() {
        console.log('[ENDGAME] Called. Team score:', this.teamScore);
        clearInterval(this.timerInterval);
        
        // Hide HUD
        document.querySelector('.hud').style.display = 'none';
        
        // Stop all input handlers
        this.players.forEach(player => {
            if (player.inputHandler.cleanup) {
                player.inputHandler.cleanup();
            }
        });
        
        // Check if new best score
        const isNewBest = this.teamScore > this.bestTeamScore;
        if (isNewBest) {
            this.bestTeamScore = this.teamScore;
            localStorage.setItem('game3BestTeamScore', this.bestTeamScore);
        }
        
        // Show win screen
        this.showScreen('winScreen');
        
        // Show win message
        const winMessage = document.getElementById('winMessage');
        if (isNewBest && this.teamScore > 0) {
            winMessage.textContent = '🎉 NEW BEST SCORE! 🎉';
            winMessage.style.color = '#00ff00';
        } else {
            winMessage.textContent = 'Great Teamwork!';
            winMessage.style.color = '#00ffff';
        }
        
        // Display results
        document.getElementById('finalTeamScore').textContent = this.teamScore;
        document.getElementById('bestTeamScore').textContent = this.bestTeamScore;
        
        const resultsContainer = document.getElementById('playerResults');
        resultsContainer.innerHTML = '';
        
        // Sort players by score
        const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
        
        sortedPlayers.forEach((player, index) => {
            const result = document.createElement('div');
            result.className = `player-result ${player.color}`;
            const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            result.innerHTML = `
                <span class="player-name">${rank} Player ${player.number}</span>
                <span class="score">${player.score}</span>
            `;
            resultsContainer.appendChild(result);
        });
        
        // Celebration
        this.audioManager.playCelebration();
        const message = isNewBest ? 
            `New record! Your team scored ${this.teamScore} points!` :
            `Great teamwork! You scored ${this.teamScore} points!`;
        this.audioManager.speak(message);
        this.audioManager.createConfetti(document.getElementById('confetti'));
    }
    
    resetGame() {
        // Show HUD again
        document.querySelector('.hud').style.display = 'flex';
        
        // Reset to join screen
        this.players = [];
        this.objects = [];
        this.teamScore = 0;
        
        // Reset UI
        for (let i = 1; i <= 4; i++) {
            const slot = document.getElementById(`player${i}-slot`);
            slot.classList.remove('joined');
            slot.querySelector('.status').textContent = 'Press A to join';
            
            const scoreElement = document.getElementById(`player${i}-score`);
            scoreElement.style.display = 'none';
        }
        
        const continueBtn = document.getElementById('continueBtn');
        continueBtn.disabled = true;
        continueBtn.textContent = 'CONTINUE (need 2+ players)';
        
        this.showScreen('joinScreen');
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    parseNumberRange(range) {
        const [min, max] = range.split('-').map(n => parseInt(n));
        const numbers = [];
        for (let i = min; i <= max; i++) {
            numbers.push(i);
        }
        return numbers;
    }
    
    createDiceDots(count) {
        // Reuse the dice patterns from game2
        const patterns = {
            1: '<div style="display: grid; place-items: center; width: 100%; height: 100%;"><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div></div>',
            2: '<div style="display: flex; justify-content: space-between; padding: 15px; height: 100%; flex-direction: column;"><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%; align-self: flex-end;"></div></div>',
            3: '<div style="display: flex; justify-content: space-between; padding: 15px; height: 100%; flex-direction: column;"><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%; align-self: center;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%; align-self: flex-end;"></div></div>',
            4: '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 15px; place-items: center;"><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div></div>',
            5: '<div style="position: relative; width: 100%; height: 100%; padding: 12px;"><div style="position: absolute; top: 12px; left: 12px; width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="position: absolute; top: 12px; right: 12px; width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="position: absolute; bottom: 12px; left: 12px; width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="position: absolute; bottom: 12px; right: 12px; width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div></div>',
            6: '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px;"><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div><div style="width: 14px; height: 14px; background: #000000; border-radius: 50%;"></div></div>'
        };
        
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
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new ColorCollectorsGame();
});
