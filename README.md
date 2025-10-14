# Asteroids

A simple Asteroids-style game originally written in **Python (Tkinter)** and later ported to **JavaScript (HTML/CSS)** to run directly in a web browser.

---

## 📝 About

I created this project as part of teaching myself Python from scratch.  
It began as an object-oriented Python implementation using Tkinter. After discovering performance bottlenecks, I refactored it into a purely procedural design using dictionaries and standalone functions — which significantly improved performance. Code 100% my own, no AI was used.

Later, to strengthen my JavaScript skills, I ported the game to a browser version using HTML, CSS, and vanilla JavaScript, while adding controller support and extra gameplay features.

---

## 🎮 How to Play

**Controls (both versions)**  
- **E / D / S / F** — Move the ship (Python version uses **W / S / A / D** for movement)
- **Left / Right arrows** — Rotate the ship  
- **Up arrow** — Fire
- **A / Space** — Boost the ship left or right (this gameplay feature not available in Python version)

- You can also connect a game controller and use that to play (web version only.)

---

## 💻 Running the Game

**Python version**
- Open the `python-version/main.py` file in [PyCharm](https://www.jetbrains.com/pycharm/)  
- Click **Run ▶** to start the game  
- ✅ Uses only Python’s standard library (`tkinter`, `math`, `random`) — no external installations needed

**Web version**
- Open `web-version/index.html` in your browser
