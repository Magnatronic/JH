// ==========================================
// Input Handler - Universal input management for joystick, gamepad, keyboard, and switch
// ==========================================

class InputHandler {
    constructor(gamepadIndex = null) {
        this.cursorX = 0;
        this.cursorY = 0;
        this.gameArea = null;
        this.buttonPressed = false;
        this.lastButtonTime = 0;
        this.debounceTime = 100; // 100ms debounce for switch inputs
        
        // Joystick/Gamepad settings
        this.deadzone = 0.1; // 10% deadzone to avoid drift
        this.sensitivity = 5; // Movement speed multiplier
        
        // Callbacks
        this.onMove = null;
        this.onButtonPress = null;
        
        // Gamepad state
        this.gamepadIndex = gamepadIndex;
        this.lastGamepadState = {};
        
        this.setupKeyboard();
        // Only auto-detect gamepad if no specific index provided
        if (gamepadIndex === null) {
            this.setupGamepad();
        }
        this.setupMouse();
        this.update();
    }
    
    init(gameArea, cursor, collisionCallback, autoCollect = true, startX = null, startY = null) {
        this.gameArea = gameArea;
        this.cursor = cursor; // Store cursor element
        
        // Use offsetWidth/offsetHeight for element's internal dimensions
        const width = gameArea.offsetWidth;
        const height = gameArea.offsetHeight;
        
        // Start cursor at specified position or center of game area
        if (startX !== null && startY !== null) {
            this.cursorX = startX;
            this.cursorY = startY;
        } else {
            this.cursorX = width / 2;
            this.cursorY = height - 100; // Near bottom center
        }
        
        this.updateCursorPosition();
        
        // Ensure bounds are clamped after initialization
        this.clampToBounds();
    }
    
    setupKeyboard() {
        const keys = {};
        
        window.addEventListener('keydown', (e) => {
            keys[e.key] = true;
            
            // Space or Enter for button press
            if (e.key === ' ' || e.key === 'Enter') {
                this.triggerButton();
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });
        
        // Arrow key movement
        this.keys = keys;
        setInterval(() => {
            let dx = 0;
            let dy = 0;
            
            if (this.keys['ArrowLeft'] || this.keys['a']) dx -= 5;
            if (this.keys['ArrowRight'] || this.keys['d']) dx += 5;
            if (this.keys['ArrowUp'] || this.keys['w']) dy -= 5;
            if (this.keys['ArrowDown'] || this.keys['s']) dy += 5;
            
            if (dx !== 0 || dy !== 0) {
                this.moveCursor(dx, dy);
            }
        }, 16); // ~60 FPS
    }
    
    setupGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
            this.gamepadIndex = e.gamepad.index;
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected');
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
            }
        });
    }
    
    setupMouse() {
        // Mouse click only - don't follow mouse cursor
        // Let joystick/keyboard control cursor position
        window.addEventListener('click', () => {
            this.triggerButton();
        });
    }
    
    update() {
        // Poll gamepad state
        if (this.gamepadIndex !== null) {
            const gamepad = navigator.getGamepads()[this.gamepadIndex];
            if (gamepad) {
                this.handleGamepad(gamepad);
            }
        }
        
        requestAnimationFrame(() => this.update());
    }
    
    handleGamepad(gamepad) {
        // Left stick for movement (axes 0 and 1)
        const x = gamepad.axes[0];
        const y = gamepad.axes[1];
        
        // Apply deadzone
        const dx = Math.abs(x) > this.deadzone ? x * this.sensitivity : 0;
        const dy = Math.abs(y) > this.deadzone ? y * this.sensitivity : 0;
        
        // Debug logging
        if (!this.moveLogCount) this.moveLogCount = 0;
        if ((dx !== 0 || dy !== 0) && this.moveLogCount < 3) {
            console.log(`[INPUT GP${this.gamepadIndex}] Axes: (${x.toFixed(2)}, ${y.toFixed(2)}) -> Movement: (${dx.toFixed(2)}, ${dy.toFixed(2)})`);
            this.moveLogCount++;
        }
        
        if (dx !== 0 || dy !== 0) {
            this.moveCursor(dx, dy);
        }
        
        // Button presses (any button 0-15)
        for (let i = 0; i < gamepad.buttons.length; i++) {
            const button = gamepad.buttons[i];
            const wasPressed = this.lastGamepadState[i] || false;
            const isPressed = button.pressed;
            
            if (isPressed && !wasPressed) {
                this.triggerButton();
            }
            
            this.lastGamepadState[i] = isPressed;
        }
    }
    
    moveCursor(dx, dy) {
        this.cursorX += dx;
        this.cursorY += dy;
        
        // Always clamp to bounds
        this.clampToBounds();
        
        this.updateCursorPosition();
        
        if (this.onMove) {
            this.onMove(this.cursorX, this.cursorY);
        }
    }
    
    clampToBounds() {
        // Clamp to game area bounds if available, otherwise use window bounds
        if (this.gameArea) {
            // Use offsetWidth/offsetHeight for the element's internal dimensions
            // (getBoundingClientRect gives viewport-relative coordinates which can cause issues)
            const width = this.gameArea.offsetWidth;
            const height = this.gameArea.offsetHeight;
            
            // Debug bounds
            if (!this.boundsLogged) {
                console.log(`[BOUNDS GP${this.gamepadIndex}] Game area size:`, width, 'x', height);
                this.boundsLogged = true;
            }
            
            // Account for cursor size (30px diameter) so it stays fully visible
            const cursorRadius = 15;
            this.cursorX = Math.max(cursorRadius, Math.min(width - cursorRadius, this.cursorX));
            this.cursorY = Math.max(cursorRadius, Math.min(height - cursorRadius, this.cursorY));
        } else {
            // Fallback to window bounds before game area is initialized
            const cursorRadius = 15;
            this.cursorX = Math.max(cursorRadius, Math.min(window.innerWidth - cursorRadius, this.cursorX));
            this.cursorY = Math.max(cursorRadius, Math.min(window.innerHeight - cursorRadius, this.cursorY));
        }
    }
    
    updateCursorPosition() {
        // Use stored cursor element instead of hardcoded ID
        // Also support legacy mode where cursor is looked up by ID
        const cursorElement = this.cursor || document.getElementById('cursor');
        
        if (cursorElement) {
            cursorElement.style.left = this.cursorX + 'px';
            cursorElement.style.top = this.cursorY + 'px';
            
            // Debug: log first few updates
            if (!this.updateCount) this.updateCount = 0;
            if (this.updateCount < 3 && this.cursor) {
                console.log(`[CURSOR] Update #${this.updateCount}: pos(${this.cursorX}, ${this.cursorY}), element:`, cursorElement.id);
                this.updateCount++;
            }
        }
    }
    
    triggerButton() {
        const now = Date.now();
        if (now - this.lastButtonTime < this.debounceTime) {
            return; // Debounce
        }
        
        this.lastButtonTime = now;
        this.buttonPressed = true;
        
        if (this.onButtonPress) {
            this.onButtonPress(this.cursorX, this.cursorY);
        }
        
        // Reset after a frame
        setTimeout(() => {
            this.buttonPressed = false;
        }, 50);
    }
    
    getCursorPosition() {
        return { x: this.cursorX, y: this.cursorY };
    }
    
    isButtonPressed() {
        return this.buttonPressed;
    }
    
    reset() {
        // Reset to center of game area if available, otherwise window center
        if (this.gameArea) {
            this.cursorX = this.gameArea.offsetWidth / 2;
            this.cursorY = this.gameArea.offsetHeight / 2;
        } else {
            this.cursorX = window.innerWidth / 2;
            this.cursorY = window.innerHeight / 2;
        }
        
        // Ensure position is within bounds
        this.clampToBounds();
        this.updateCursorPosition();
    }
}

// Export for use in games
if (typeof window !== 'undefined') {
    window.InputHandler = InputHandler;
}
