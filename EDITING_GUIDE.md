# Guide to Editing Website Elements

This guide shows you where to find and edit different UI elements on the FlowState AI website.

## 📁 File Structure Overview

```
src/
├── index.html              # Main HTML & loading screen styles
├── js/
│   ├── main.js             # Main app logic & initialization
│   ├── ui/
│   │   ├── LogoDisplay.js  # Logo element (bottom-right)
│   │   └── MoodDisplay.js  # Mood display panel (bottom-left)
│   ├── gui/
│   │   └── GuiManager.js   # Control panel (top-right)
│   └── expression/
│       └── ExpressionManager.js  # Camera video feed (top-left)
```

---

## 🎨 UI Elements & Where to Edit Them

### 1. **Loading Screen**
**File:** `src/index.html` (lines 8-54)

**What it controls:**
- Loading spinner animation
- "Initializing..." text
- Background gradient
- Loading screen styles

**Example edits:**
```html
<!-- Change loading text -->
<div class="loading-text">Your Custom Text</div>

<!-- Change background color -->
background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);

<!-- Change spinner size -->
.loader {
    width: 80px;  /* Change from 60px */
    height: 80px; /* Change from 60px */
}
```

---

### 2. **Logo (Bottom-Right Corner)**
**File:** `src/js/ui/LogoDisplay.js`

**What it controls:**
- Logo image
- Position (bottom-right)
- Size (120px width)
- Opacity & hover effects

**Key properties to edit:**
```javascript
// Line 23-33: Logo styling
this.logoElement.style.cssText = `
    position: fixed;
    bottom: 20px;      // Distance from bottom
    right: 20px;       // Distance from right
    width: 120px;      // Logo width
    height: auto;      // Auto height
    z-index: 1000;     // Layer order
    opacity: 0.9;      // Default opacity
    transition: opacity 0.3s ease-in-out;
    pointer-events: none;
`;
```

**To change logo image:**
- Replace `static/logo.png` with your image
- Or update path in `src/js/main.js` line 135

---

### 3. **Mood Display Panel (Bottom-Left)**
**File:** `src/js/ui/MoodDisplay.js`

**What it controls:**
- Mood display box (shows current emotion)
- YouTube video container
- Position, colors, fonts, sizes

**Key sections:**

**Panel Container (lines 25-41):**
```javascript
this.displayElement.style.cssText = `
    position: fixed;
    bottom: 20px;           // Distance from bottom
    left: 20px;            // Distance from left
    background: rgba(0, 0, 0, 0.85);  // Background color
    color: white;          // Text color
    padding: 20px;        // Inner spacing
    border-radius: 12px;   // Rounded corners
    width: 360px;          // Panel width
    backdrop-filter: blur(10px);  // Glass effect
`;
```

**Mood Text (lines 49-65):**
```javascript
// Label text
moodLabel.textContent = 'Current Mood';  // Change label

// Mood display styling
this.moodElement.style.cssText = `
    font-size: 28px;       // Text size
    font-weight: bold;     // Bold text
    color: #fff;          // Text color
`;
```

**Mood Colors (lines 98-104):**
```javascript
const moodConfig = {
    'happy': { emoji: '😊', color: '#FFD700', text: 'Happy' },
    'sad': { emoji: '😢', color: '#6495ED', text: 'Sad' },
    // Add/edit mood colors here
};
```

---

### 4. **Control Panel (Top-Right)**
**File:** `src/js/gui/GuiManager.js`

**What it controls:**
- Color sliders (Red, Green, Blue)
- Bloom effect controls (Threshold, Strength, Radius)
- Visual effect selector (Icosahedron/Particles)
- Upload Audio button
- Microphone toggle button
- Camera toggle button

**Note:** This uses `lil-gui` library. To customize:
- Modify button text in `_setupMicInputControl()` and `_setupCameraInputControl()`
- Change slider ranges in `_setupColorControls()` and `_setupBloomControls()`

---

### 5. **Camera Video Feed (Top-Left)**
**File:** `src/js/expression/ExpressionManager.js` (lines 105-116)

**What it controls:**
- Camera preview window
- Position, size, styling

**Key properties:**
```javascript
this.videoElement.style.cssText = `
    position: fixed;
    top: 20px;            // Distance from top
    left: 20px;           // Distance from left
    width: 200px;         // Video width
    height: 150px;        // Video height
    z-index: 1000;        // Layer order
    background-color: black;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
`;
```

---

### 6. **Page Title**
**File:** `src/index.html` (line 7)

```html
<title>3D Audio Visualizer</title>  <!-- Change browser tab title -->
```

---

## 🎨 Common Customizations

### Change Colors
- **Background:** Edit `src/index.html` line 21
- **Text colors:** Edit respective UI component files
- **Mood colors:** Edit `src/js/ui/MoodDisplay.js` lines 98-104

### Change Fonts
- **Loading text:** `src/index.html` line 52
- **Mood display:** `src/js/ui/MoodDisplay.js` line 33

### Change Positions
- **Logo:** `src/js/ui/LogoDisplay.js` lines 25-26
- **Mood panel:** `src/js/ui/MoodDisplay.js` lines 27-28
- **Camera:** `src/js/expression/ExpressionManager.js` lines 107-108

### Change Sizes
- **Logo:** `src/js/ui/LogoDisplay.js` line 27
- **Mood panel:** `src/js/ui/MoodDisplay.js` line 34
- **Camera:** `src/js/expression/ExpressionManager.js` lines 109-110

---

## 🔧 Quick Edit Examples

### Example 1: Change Logo Size
Edit `src/js/ui/LogoDisplay.js` line 27:
```javascript
width: 200px;  // Change from 120px
```

### Example 2: Change Mood Panel Background
Edit `src/js/ui/MoodDisplay.js` line 29:
```javascript
background: rgba(50, 50, 50, 0.9);  // Darker gray background
```

### Example 3: Hide Camera Feed
Edit `src/js/expression/ExpressionManager.js` line 117:
```javascript
// Comment out or remove this line:
// document.body.appendChild(this.videoElement);
```

### Example 4: Change Loading Text
Edit `src/index.html` line 60:
```html
<div class="loading-text">Loading FlowState...</div>
```

---

## 🚀 After Making Changes

1. **Save your files**
2. **Test locally:** The dev server auto-reloads (`npm start`)
3. **Build for production:** `npm run build`
4. **Deploy:** `vercel --prod --yes`

---

## 📝 Tips

- **CSS values:** Most styling uses inline CSS via `style.cssText`
- **Colors:** Use hex (`#FFD700`) or rgba (`rgba(0, 0, 0, 0.85)`)
- **Positions:** Use `fixed` positioning with `top`, `bottom`, `left`, `right`
- **Z-index:** Higher numbers appear on top (logo: 1000, mood: 999, camera: 1000)

---

## 🆘 Need Help?

- Check browser console for errors
- Use browser DevTools to inspect elements
- Test changes locally before deploying

