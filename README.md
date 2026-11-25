# Logical Bends — a browser MUGEN-style fighting engine

Plain HTML + JavaScript (ES modules, no build step, no dependencies). It reads real
MUGEN 1.0 / WinMUGEN character files (DEF, CNS/ST, CMD, AIR, SFF v1/v2, SND, ACT) and
runs them in a canvas, with its own menus, HUD, stages and an MvC/BlazBlue-style
combo layer on top.

## Run it
Browsers block ES modules from `file://`, so serve the folder over http:

```
python serve.py
```
then open http://localhost:8417. (`serve.py` is `http.server` with caching turned off, so a normal reload always picks up code changes.)

## Layout
| Path | What it is |
|---|---|
| `index.html`, `style.css` | Page shell (one canvas) |
| `js/main.js` | App shell: boot/loading, title, menus, character select, stage select, VS, fight HUD, pause, results, options. Exposes `window.fwDebug` (step the game without rAF, `quickFight(...)`) |
| `js/fight.js` | Match runtime: tick order, hit detection & hit application (`applyHit`), guard, combo counter + auto combo, explods, projectiles, camera, rounds, rendering |
| `js/char.js` | Character runtime: state machine, all state controllers (`exec`), HitDef parsing, helpers, cancel-window combo filter, trigger table (`TRIG`/`TRIGA`) |
| `js/expr.js` | MUGEN trigger expression compiler (tokenizer → closures; int/float typing, redirection like `enemynear,`, `helper(id),`) |
| `js/cns.js` | CNS/ST/CMD parser (statedefs, controllers, commands) |
| `js/input.js` | Keyboard/gamepad, MUGEN command matcher (`CommandBuffer`), key maps |
| `js/chardef.js` | Loads a character folder into a `CharDef` (+ `fightwire.json` profile) |
| `js/sff.js`, `js/air.js`, `js/audio.js` | SFF sprites, AIR animations, SND sounds + WebAudio |
| `js/stages.js` | Procedurally drawn stages |
| `data/common1.cns` | Our own common states (stand/walk/jump/guard/get-hit/etc.) |
| `data/fightfx.*`, `data/common.snd` | Hit sparks and common sounds (from Ikemen GO) |
| `chars/roster.json` | Which character folders appear on the select screen |
| `chars/<name>/fightwire.json` | Per-character profile: def file, palette order, easy-input map (E/Q + direction), combo ranks (light/medium/heavy/launcher state numbers), auto-combo route, move list, AI hook (`aiVar`), files to skip (`skipSt`) |

## Engine notes
- First definition of a statedef wins: cmd → st → st0..st9 → cns → `data/common1.cns`.
- Easy inputs force the character's own CMD command names (see `easy` in the profile), so the character's real `[Statedef -1]` logic still decides if the move can come out.
- Combo system: during a contact window the engine temporarily grants `ctrl` while running `[Statedef -1]` and filters ChangeStates by rank (light < medium < heavy < special < super). Launcher = crouching heavy; jump-cancel → super jump.
- Uniform rules (Options, on by default): every character's normals are scaled to the same damage per strength (from the median of their own HitDefs), get a minimum hitstun/blockstun/hitpause per strength, and life/meter/attack/defence are standardized.
- CPU: characters with their own AI use `ailevel` (DBK) or `aiVar` (sets a var directly, EKFM). Others use the generic bot in `Fight.botThink`.

## Adding a character
1. Drop the MUGEN character folder into `chars/<folder>/`.
2. Add a `fightwire.json` (copy one from another character, then fix the `def`, `easy` command names, `combo.ranks` state numbers).
3. Add the folder name to `chars/roster.json`.

## Controls (P1)
WASD move · L ; ' = X Y Z · , . / = A B C · E + dir = special · Q + dir = super · E+Q = EX · Enter = taunt · Esc = pause.
All keys can be rebound in Options → Controls Setup (saved in the browser). Menus also accept arrows, Enter and Backspace.
P2: arrows · Num 4 5 6 / 1 2 3 · Num 7 / 9 · Num Enter.

## Credits
Dee Bee Kaw and Evil Kung Fu Man by The_None, Uppercut by The_None, Kanae by aokmaniac13 (all via Logical Bends). Buster by Brergrsart. Kung Fu Man by Elecbyte.
Hit sparks/common sounds from Ikemen GO. Character files keep their own readmes.
