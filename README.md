# Educational Learning Games

Two browser-based educational games with comprehensive accessibility features. These games support various input methods including joystick, Xbox controller, adaptive controllers, and switch inputs.

## 🎮 Games

### Game 1: Size Collection Challenge
Learn to recognize size comparisons (larger/smaller, wider/thinner, taller/shorter)

**Features:**
- 5 difficulty levels (1-5)
- Configurable number of objects (3-8)
- Multiple size variations
- Collision or button-select collection modes
- Timer tracking and best time records
- High-contrast visuals with celebratory animations

### Game 2: Count Collection Quest
Practice counting to 3 with progressive or random challenges

**Features:**
- Three game modes: Progressive, Random, and Focused
- Configurable rounds (5, 10, or 15)
- Optional timer with per-round limits
- Visual and audio counting feedback
- Comprehensive stats tracking
- Adaptive difficulty

## 🕹️ Supported Input Methods

- **Joystick**: Smooth X/Y movement + button controls
- **Xbox Controller**: Full gamepad support
- **Adaptive Controllers**: Compatible with specialized accessible controllers
- **Switch Input**: Single button mode for basic interaction
- **Keyboard**: Arrow keys for movement, Space/Enter for selection (fallback)
- **Mouse**: Point-and-click support (for setup and testing)

## ♿ Accessibility Features

- **High Contrast Mode**: WCAG AAA compliant color schemes
- **Large Text**: Minimum 24px for instructional text
- **Audio Feedback**: Positive voice feedback and sound effects
- **Visual Feedback**: Animated responses to all interactions
- **Configurable Controls**: Choose between collision and button-select modes
- **No Negative Feedback**: Gentle, encouraging approach
- **Customizable Difficulty**: Teacher/carer can adjust all settings

## 🚀 Getting Started

### Play Online
Visit the GitHub Pages site: [https://YOUR-USERNAME.github.io/JH/](https://YOUR-USERNAME.github.io/JH/)

### Run Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/JH.git
   cd JH
   ```

2. Open `index.html` in a modern web browser:
   - **Windows**: Double-click `index.html` or drag it to your browser
   - **Mac/Linux**: Open with your preferred browser

3. No build process or dependencies required! Pure HTML/CSS/JavaScript.

### Connect a Controller

1. **Xbox Controller**: Connect via USB or Bluetooth
2. **Adaptive Controller**: Connect and configure through your system settings
3. **Joystick**: Ensure it's recognized by your browser's Gamepad API
4. **Switch**: Configure as a keyboard input or use accessibility software

The games will automatically detect connected controllers!

## 📁 Project Structure

```
JH/
├── index.html              # Home page with game selection
├── game1.html              # Size Collection Challenge
├── game2.html              # Count Collection Quest
├── styles/
│   ├── main.css            # Shared styles
│   ├── game1.css           # Game 1 specific styles
│   └── game2.css           # Game 2 specific styles
├── scripts/
│   ├── inputHandler.js     # Universal input management
│   ├── audioManager.js     # Sound effects and voice feedback
│   ├── game1.js            # Game 1 logic
│   └── game2.js            # Game 2 logic
└── README.md               # This file
```

## 🎨 Customization

### For Teachers/Carers

Both games have setup screens where you can:

**Game 1:**
- Select difficulty level (1-5)
- Choose number of objects and sizes
- Pick size variation types (larger/smaller, wider/thinner, taller/shorter)
- Set collection mode (collide or button)

**Game 2:**
- Choose game mode (Progressive, Random, or Focused)
- Set number of rounds (5, 10, 15)
- Enable/disable timer
- Set time limits per round
- Choose object types

### For Developers

To modify colors, sounds, or game mechanics:

1. **Colors**: Edit CSS variables in `styles/main.css`:
   ```css
   :root {
       --primary-bright: #00ffff;
       --secondary-bright: #ff00ff;
       --accent-yellow: #ffff00;
       /* ... more colors */
   }
   ```

2. **Sounds**: Modify `scripts/audioManager.js` to change frequencies, durations, or add new sound effects

3. **Game Logic**: Edit `scripts/game1.js` or `scripts/game2.js` for gameplay changes

4. **Input Sensitivity**: Adjust in `scripts/inputHandler.js`:
   ```javascript
   this.deadzone = 0.1;      // Joystick deadzone
   this.sensitivity = 5;      // Movement speed
   this.debounceTime = 100;   // Button debounce (ms)
   ```

## 🌐 Deploying to GitHub Pages

1. Create a new repository on GitHub
2. Push this code to your repository
3. Go to Settings > Pages
4. Select "Deploy from a branch"
5. Choose `main` branch and `/` (root) folder
6. Click Save
7. Your site will be live at `https://YOUR-USERNAME.github.io/JH/`

## 🔧 Technical Requirements

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Recommended Specs
- Screen resolution: 1024px width minimum
- Modern browser with Gamepad API support
- Audio output for voice feedback
- 60 FPS capable display

### APIs Used
- **Gamepad API**: For controller input
- **Web Audio API**: For sound effects
- **Web Speech API**: For voice feedback (graceful fallback if unavailable)

## 🎯 Learning Objectives

### Game 1: Size Collection Challenge
- Visual discrimination
- Size comparison understanding
- Spatial awareness
- Fine motor control (cursor movement)
- Decision making

### Game 2: Count Collection Quest
- Number recognition (1-3)
- Counting skills
- Quantity discrimination
- Sequential thinking
- Goal-oriented behavior

## 🐛 Troubleshooting

**Controller not detected:**
- Ensure controller is properly connected
- Try pressing a button to wake it up
- Check browser console for Gamepad API support
- Try a different USB port or Bluetooth pairing

**No audio:**
- Check system volume
- Ensure browser has permission to play audio
- Try clicking on the page first (browsers require user interaction)
- Check if Web Speech API is supported (voice feedback)

**Performance issues:**
- Close other browser tabs
- Update your browser to the latest version
- Try reducing the number of objects in game settings
- Check if hardware acceleration is enabled

**Switch input not working:**
- Configure switch as keyboard input (Space or Enter key)
- Use accessibility software to map switch to button press
- Ensure debounce time is appropriate (adjust in inputHandler.js)

## 📝 License

This project is open source and available for educational use.

## 👥 Credits

Created for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to:
- Report bugs
- Suggest new features
- Improve accessibility
- Add new game modes
- Enhance documentation

## 📧 Support

For questions or support, please open an issue on GitHub.

---

Made with ❤️ for inclusive education
