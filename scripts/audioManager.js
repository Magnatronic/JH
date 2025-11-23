// ==========================================
// Audio Manager - Handles all sound effects and voice feedback
// ==========================================

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.7;
        
        this.positivePhrases = [
            "Great!",
            "Well done!",
            "Excellent!",
            "Perfect!",
            "You did it!",
            "Wonderful!",
            "Amazing!",
            "Fantastic!",
            "Brilliant!",
            "Awesome!",
            "Super!",
            "Nice one!",
            "Good job!",
            "That's it!",
            "Yes!",
            "Correct!"
        ];
        
        this.countPhrases = ["One!", "Two!", "Three!"];
        
        this.init();
    }
    
    init() {
        // Initialize Web Audio API
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }
    
    // Generate a simple beep tone
    playBeep(frequency = 440, duration = 0.2, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // Play positive feedback sound
    playSuccess() {
        if (!this.enabled) return;
        
        // Play a cheerful ascending tone
        this.playBeep(523.25, 0.1); // C5
        setTimeout(() => this.playBeep(659.25, 0.1), 100); // E5
        setTimeout(() => this.playBeep(783.99, 0.2), 200); // G5
    }
    
    // Play collection sound
    playCollect() {
        if (!this.enabled) return;
        this.playBeep(880, 0.15, 'triangle');
    }
    
    // Play celebration jingle
    playCelebration() {
        if (!this.enabled) return;
        
        const melody = [
            { freq: 523.25, time: 0 },    // C5
            { freq: 659.25, time: 150 },  // E5
            { freq: 783.99, time: 300 },  // G5
            { freq: 1046.5, time: 450 },  // C6
        ];
        
        melody.forEach(note => {
            setTimeout(() => this.playBeep(note.freq, 0.2), note.time);
        });
    }
    
    // Play countdown beep
    playCountdown() {
        if (!this.enabled) return;
        this.playBeep(660, 0.1);
    }
    
    // Play final countdown beep (different tone)
    playCountdownFinal() {
        if (!this.enabled) return;
        this.playBeep(880, 0.3);
    }
    
    // Speak using Web Speech API (if available)
    speak(text, rate = 1.0, pitch = 1.2) {
        if (!this.enabled) return;
        
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = this.volume;
            
            window.speechSynthesis.speak(utterance);
        } else {
            console.log('Speech synthesis not supported. Text:', text);
        }
    }
    
    // Speak positive phrase
    speakPositive() {
        const phrase = this.positivePhrases[Math.floor(Math.random() * this.positivePhrases.length)];
        this.speak(phrase);
    }
    
    // Speak count number
    speakCount(number) {
        if (number >= 1 && number <= 3) {
            this.speak(this.countPhrases[number - 1]);
        }
    }
    
    // Speak custom message
    speakMessage(message) {
        this.speak(message);
    }
    
    // Set volume (0.0 to 1.0)
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    // Enable/disable audio
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    // Create confetti effect
    createConfetti(container) {
        const colors = ['#00ffff', '#ff00ff', '#ffff00', '#ff8800', '#00ff00'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            container.appendChild(confetti);
        }
        
        // Clean up after animation
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
    
    // Create particle explosion effect
    createParticleExplosion(x, y, container) {
        const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'];
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 50 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            
            container.appendChild(particle);
            
            // Remove after animation
            setTimeout(() => {
                particle.remove();
            }, 800);
        }
    }
}

// Export for use in games
if (typeof window !== 'undefined') {
    window.AudioManager = AudioManager;
}
