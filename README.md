# Birthday Cake Slice

A polished browser game that turns the classic swipe-to-slice arcade mechanic into an original birthday-party experience using custom vector-style cakes, simple generated sounds, and responsive canvas gameplay.

## Features

- Original birthday-cake themed arcade game built with HTML5 Canvas
- Pointer Events support for mouse, touch, and stylus input
- Swipe trail and slicing hit detection against cake hit areas
- 12+ distinct cake designs with different frosting, colors, candles, and point values
- Combo system, score popups, and multiplier-based progression
- 3 life system with missed-cake penalties and game-over flow
- Difficulty ramping as score increases
- Local high score persistence using localStorage
- Pause/resume controls and keyboard support
- Generated Web Audio sounds for slicing, misses, combos, and game over
- Responsive mobile-friendly layout

## Run it locally

1. Download or clone the project files.
2. Open `index.html` in a modern web browser.
3. Click the Start Game button and begin slicing.

You can also serve it locally with a tiny static server if preferred:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Files

- `index.html` — main UI shell and game screen layout
- `style.css` — responsive styling and celebration-themed visual design
- `game.js` — game loop, cake spawning, sweeping collision logic, scoring, sound, and UI behavior
- `README.md` — project overview and run instructions

## Notes

This is an original game concept inspired by the broad swipe-slice arcade feel, but it does not use Fruit Ninja artwork, branding, or copyrighted assets. All cakes are custom-drawn in Canvas using simple vector forms.

## Controls

- Pointer or finger swipe to slice cakes
- Space to start or pause/resume
- P to pause or resume
- R to restart from the start/game-over screen

## High score storage

The game stores the best score using `localStorage`, so it persists when the page is refreshed.
