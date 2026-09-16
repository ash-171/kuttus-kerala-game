# Aru's Kerala

A Tsuki Odyssey–style village-life browser game set in Kerala, built with
plain HTML, CSS and JavaScript — no build step, no framework.

**Play it live:** https://ash-171.github.io/kuttus-kerala-game/

## What's in the game

Aru lives in a small Kerala village. Walk him around Home, the Market, the
Village Road and the Beach with the arrow keys (or on-screen controls on a
phone), and travel by canoe/bus to the Backwaters, the Temple and the
Hills.

- **Cultivate** — shake coconut palms and grow bananas (planted right on
  the ground where Aru is standing, growing through real stages from a
  bare hole to a harvestable bunch).
- **Fish** — but only once Aru owns a net, bought with coins earned
  elsewhere. Casting is a timing minigame; catches go into his bag.
- **Trade at the Market** — three separate stalls (tea, general store,
  fish stall), each with its own vendor. Talk to a vendor before the shop
  or sell screen opens.
- **Visit Ammuma** on the Village Road and the temple for a blessing.
- **A bag and a shop** — buy keepsake props, and sell fish/produce for
  coins. Not every attempt at a task succeeds — expect occasional misses.
- Full-body expression changes (from real drawn artwork, not an emoji
  bubble), a day streak bonus, and simple sound effects.

## Running it locally

No build tools needed — it's static files.

```bash
python3 -m http.server 8934
# then open http://localhost:8934/
```

## Project structure

```
index.html       Page structure
style.css        All styling/animation
game.js          All game logic (single IIFE, no dependencies)
manifest.json    Web app manifest (installable, landscape orientation)
assets/          Shipped sprites, backgrounds, props, sound effects
```

The raw source art sheets used to extract the sprites in `assets/` are
kept locally (see `.gitignore`) but aren't tracked in the repo, to keep it
small — everything the game actually loads lives under `assets/`.

## Credits

- Sound effects: [Kenney.nl](https://kenney.nl) "Interface Sounds" (CC0).
- Character, environment and prop art: custom-generated for this project.
