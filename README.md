# HBD My Love — HTML / CSS / JavaScript

Interactive birthday website prototype built with plain HTML, CSS and JavaScript.

## Files

- `index.html` — main page / UI structure
- `styles.css` — all visual styling and animations
- `app.js` — user journey, quiz, candle blow detection, gift box logic, audio and effects
- `docs/` — project specification documents

## Run locally

Because microphone access may be blocked when opening the file directly with `file://`,
run the project through a local web server.

### VS Code Live Server
Open `index.html` with the Live Server extension.

### Python
```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## Git

```bash
git init
git add .
git commit -m "Initial HBD My Love prototype"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

## Notes

- Microphone blow detection uses `navigator.mediaDevices.getUserMedia`.
- Browsers normally require HTTPS for microphone access, except `localhost`.
- Audio starts only after a user interaction because browsers block autoplay.
- No backend is required.
- Quiz questions and gift definitions are currently inside `app.js`.
