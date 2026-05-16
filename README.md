# CRISP

A small Three.js web app that puts three crisp cans into a browser viewer: BBQ, French Onion, and Paprika. Built for the 3D Applications module, University of Sussex (2025/26).

## Run

There is no build step. Serve the folder over a static server and open `index.html`.

```bash
python -m http.server 8000
# or
npx http-server -p 8000
```

Then visit http://localhost:8000/

Opening `index.html` directly with `file://` will not work. ES module imports need an `http(s)://` origin.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Gallery. 3D viewer with flavour selector, view toggles, lighting and camera presets. |
| `about.html` | Project description, model notes, statement of originality, references. |
| `sitemap.html` | Full site map. |
| `submission.html` | Submission metadata and declaration. |

## Stack

- Three.js r160 via CDN import map. No bundler.
- GSAP 3 for camera and spin animations.
- HTML5, CSS3, ES modules.
- Google Fonts: Playfair Display and Inter.

## 3D models

The three cans live in `models/` as `.glb` files. They are loaded at runtime with Three.js GLTFLoader. After loading, each model is centered and scaled to a fixed target height so all three cans appear the same size in the viewer regardless of how they were exported.

- `models/can_bbq.glb`
- `models/can_french.glb`
- `models/can_paprika.glb`

The original Blender source files live in `blender_files/`.

## Model credits

The can base meshes were sourced from Sketchfab and adapted in Blender. New flavour textures were applied and the geometry was cleaned up for the viewer. See `about.html` for the full reference list.

## Controls

- Drag to rotate. Scroll to zoom. Right-drag to pan.
- Flavour: BBQ, French Onion, Paprika.
- View: Wireframe toggle, Auto-rotate toggle, Spin (one-shot full turn).
- Light: Ambient, Key, Rim. Each toggles a separate light group.
- Camera: Front, Top, Side, Reset. Eased with GSAP.

## File structure

```
.
├── index.html
├── about.html
├── sitemap.html
├── submission.html
├── README.md
├── css/
│   └── style.css
├── js/
│   └── main.js
├── models/
│   ├── can_bbq.glb
│   ├── can_french.glb
│   └── can_paprika.glb
└── blender_files/
    ├── can_bbq.blend
    ├── can_french.blend
    └── can_paprika.blend
```

## Declaration of originality

The brand, copy, layout, CSS, JavaScript and 3D scene composition are original to this submission. The can base meshes were sourced from Sketchfab and adapted in Blender. Third-party libraries are credited on the About page. No assets from the lab brand exercises were carried over.

## Licence

Submitted as coursework. Not licensed for redistribution.
