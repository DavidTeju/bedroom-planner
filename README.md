# Bedroom planner

A 2D and 3D planner for one bedroom, built from its measurements: drag furniture around a floor
plan, the four walls and a three.js model of the room, and see what blocks a door, where the light
falls and how each layout looks. Inches throughout.

This copy plans Femi's San Francisco bedroom. Everything about that room lives in
[`rooms/femi.json`](rooms/femi.json) and `public/prints/`, so [planning your own](#plan-your-own-room)
means writing one file.

- **Live:** https://bedroom.davidteju.dev (3D) and https://bedroom.davidteju.dev/plan.html (2D)
- **Layout links:** https://bedroom.davidteju.dev/window/, `/corner/` and `/centred/` each open
  one layout and have their own link preview. The link icon beside each ready-made layout in the sidebar copies them.
- **3D view** (`index.html`, `src/scene.ts`): a three.js scene with modelled furniture. Drag a piece to move
  it, Shift-drag to raise or lower it, R rotates, arrow keys nudge, click a door to open it. Bean
  bags, plants, lamps and rugs can sit at any angle: Shift+R turns one 15°, or type the angle in the
  Selected panel; the rules then use the wall-aligned box that holds it. The
  **View** picker switches between the 3D, top, wall and standing-inside views, and **Show**
  turns on the grid, door swings and names. **Simulate lights**
  turns off daylight and the ceiling fixture and lights each lamp and sconce. Its bulb control sets
  every lamp to a white temperature (2500 to 6500K, the Tapo L535E's range) or any colour, and
  remembers the choice in that browser.
- **Femi's own pieces** are modelled from his photos: the green IKEA VILHATTEN wardrobe
  (38⅝ × 22½ × 74¾, a full door and a short door over two drawers, white knobs), the black-brown
  LACK wall shelf unit beside it as the shoe shelf (11¾ × 11 × 74¾), the grey upholstered bed with a
  channel-tufted headboard under a sage pinch-quilted comforter, his wood nightstand with a cane
  drawer (17 × 17 × 22, estimated from a photo), and the BÖJA woven bamboo egg lamp (8 × 16).
- **Palette, Clay and indigo** (`theme` in the room file): the walls stay cream, because the room is
  rented and Femi can't paint them. Colour comes from what he owns plus a terracotta throw over the
  foot of the bed, an indigo pillow that echoes his Adire hanging, jute rugs and chests painted deep
  olive. The wardrobe is Behr Laurel Garland (N390-6, about #68705C); chests take Cypress Vine (N390-7),
  one step darker on the same strip. His sheets and sleeping pillows are linen; the shams match the sage comforter.
- **Pillows and throw** are shaped cloth rather than boxes. Each pillow is a stuffed shape with a
  seam, corner ears and creases: the linen sleeping pillows stand against the headboard, the
  quilted shams lean on them, and the piped indigo lumbar leans on the shams. The throw is a
  chunky knit folded across the foot. It rolls over the edges, gathers into folds as it hangs and
  ends in a fringe. Past the foot it rests on the bench. It hangs only on sides with at least 6 in
  clear, so it never passes through a wall or a piece of furniture beside the bed
  (`throwRoom` in `src/core.ts`).
- **Femi's photographs** hang in every frame except the topo map: 19 of his own shots from 2024 to
  2026, picked from his Photos library (`prints` in the room file, pictures in `public/prints/`). Each is a
  1600 px copy with no location or camera data, cropped to fill its frame the way a print shop
  would. In 3D each photo is reduced to 7 pixels per inch (the same in every frame) and run through a
  painter's filter (Kuwahara), so it reads as smooth flat strokes with sharp edges and sits in the
  flat-shaded room; the 2D wall views show the photos plain. A frame can hold one photo or a grid (`photos` on the item). The Selected panel's **Photo**
  menu swaps which one a frame shows.
- **Frames** are ornate antique gilt (`giltFrame` in `src/core.ts`, shared by both views): a gilt lip, a
  dark cove, a carved band and a bright bead, then a linen liner around the picture. The moulding
  is 12% of the shorter side, between 1¼ and 4½ in, and frames with a moulding of 2 in or more
  carry corner rosettes. In 3D the carved band is a drawn texture of C-scrolls, leaves and rosettes.
- **Gear:** every ready-made layout hangs Femi's snowboard upright on a wall rack, bindings on,
  with his boots on a tray under it. A board's model lies flat instead when it is wider than tall.
  The furniture list also offers a leaning ladder shelf, which the window layout uses on the
  in-push, and a bean bag modelled as one sagging fabric sack with a sat-in seat.
- **On a phone** the 3D page is a viewer: the layouts are tabs, there is no editing panel, a drag
  turns the room and a tap names a piece. A screen at most 760 px wide or 500 px tall counts
  as a phone. Editing needs a wider screen.
- **2D plan** (`plan.html`, `src/plan2d.ts`): floor plan plus the four walls seen from inside.
  **Light map, lamps only** overlays the lighting estimate.

## Lighting estimate

Femi doesn't use ceiling lights, so `lightReport()` in `src/core.ts` estimates lux with only the
lamps on, on a face-up plane 30 in off the floor, plus each bed reading spot (10 in in from an
open edge, 14 in from the head, 8 in above the mattress). Direct light follows the inverse-square
and cosine laws from each bulb, with each shade sending a set share downward and solid furniture
casting shadows. Light bounced off the room is added evenly, treating the room as an integrating
sphere with 50% average reflectance and 85% luminaire efficiency. The floor lamp and sconces
assume Femi's Tapo L535E smart bulb (1100 lm, E26), and so do his BÖJA and Mika; only
the PELARBOJ, which has a built-in LED, is a guess. The targets in the
tests are 300 lux at each reading spot and a 50 lux room average. It is an estimate for
comparing layouts, not a photometric survey.

Both pages share `src/core.ts` and `src/core.css`: the room from its file, the ready-made layouts,
saved state, the collision and door-swing rules, and the sidebar. They read and write the same
`localStorage` entry, so an edit in one tab shows up in the other. Saved plans live only in the
browser that made them; use **Export JSON** and **Import JSON** to move them.

Bench height, door and window heights and all IKEA dimensions are unverified.

## Develop

TypeScript, built with Vite. Needs Node 24.

```bash
npm install
npm run dev
```

Then open http://127.0.0.1:4731 (the 3D view) or http://127.0.0.1:4731/plan.html (the 2D plan).

```bash
npm test
```

`npm test` type-checks everything with `tsc` (strict, from
[`@davidteju/dev-config`](https://github.com/DavidTeju/dev-config)) and runs the Vitest suite. The
tests load `src/core.ts` and cover the facing, rotation and collision rules, the room file, the
ready-made layouts, the bench, the lighting estimate, the cloth shapes and the painter's filter.
`npm run build` writes the site to `dist/`.

| Path | What it is |
| --- | --- |
| `rooms/femi.json` | The room: size, doors and window, palette, photos and ready-made layouts |
| `src/room.ts` | Picks the room file and checks it, naming the first field that is wrong |
| `src/types.ts` | The shapes of a room, a piece, a plan and a room file |
| `src/core.ts` | Shared by both pages: saved state, geometry, door swings, lighting, the sidebar |
| `src/scene.ts` | The 3D view: furniture models, materials, camera and controls |
| `src/plan2d.ts` | The 2D floor plan and wall views |
| `src/cloth.ts`, `src/kuwahara.ts`, `src/doors.ts` | Pure maths the 3D view uses: pillows and the throw, the painter's filter, door swings |
| `public/` | Served as is: the photos, the link-preview pages and their pictures |

## Plan your own room

1. Copy `rooms/femi.json` to `rooms/<yours>.json` and point the import in `src/room.ts` at it.
2. Measure. `room` is the floor: `W` east to west, `L` north to south, `H` the ceiling, and an
   in-push of `bx` by `by` cut from the north-east corner (0 and 0 for a plain rectangle). Each
   opening sits on a wall (`N`, `E`, `S` or `W`), starts `off` inches along it from the west or
   north end, and swings `in` or `out` from a hinge at its `start` or `end`, or not at all (`none`).
3. List your furniture. In `start` and in each layout, a piece needs a `name`, a `kind` (one of
   the kinds in `src/types.ts`), its north-west corner `x`, `y` and its size `w`, `d`, `h`. Add `z`
   to lift it off the floor and `headSide` to give it a headboard on that side; its colour comes
   from its kind unless you give one.
4. Put your own photos in `public/prints/<key>.jpg`, describe each under `prints`, and name them in
   a frame's `photos`. Without photos, set `prints` to `{}` and drop `photos` from the frames,
   which then show a made-up picture.
5. A layout with a `slug` opens from `/<slug>/`, which needs a small page in `public/<slug>/`
   like the ones here; leave `slug` out otherwise.

The planner refuses a room file with a mistake, and the browser console and `npm test` name the
field, such as `openings[1].wall must be one of N, E, S, W`. Many tests in `tests/core.test.ts`
check this room's own layouts and furniture, so expect those to fail on yours.

## Link previews

`public/window/index.html` and its siblings hold each layout's preview tags and forward to
`/?layout=window`, which opens that layout once and then clears the address. The pictures in
`public/og/` are 1200 × 630 captures of `?shot`, a mode that shows only the room. After changing a
layout, retake them with `npm run dev` running:

```bash
for slug in window corner centred; do
  profile=$(mktemp -d)
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --user-data-dir="$profile" \
    --use-mock-keychain --password-store=basic --no-first-run --enable-unsafe-swiftshader --use-angle=swiftshader \
    --hide-scrollbars --window-size=1200,630 --virtual-time-budget=15000 \
    --screenshot="public/og/$slug.png" "http://127.0.0.1:4731/?layout=$slug&shot"
  trash "$profile"
done
```

`robots.txt` allows only the link pages and pictures, because some preview fetchers obey it;
the `X-Robots-Tag: noindex` header still keeps everything out of search results.

## Deploy

```bash
npm run deploy
```

Every push to `main` runs the [Image workflow](.github/workflows/image.yml): it type-checks and
tests the code, builds the site, makes an image holding only `dist/` (see the
[Dockerfile](Dockerfile)), pushes it to
`ghcr.io/davidteju/bedroom-planner:<sha>`, and stages it on the VPS as `bedroom-planner:next`
through a deploy key that can do nothing else. Nothing goes live on its own.

`deploy/deploy.sh` refuses uncommitted changes and any HEAD that is not `origin/main`. It waits for
the commit's Image run, then runs `deploy-app bedroom-planner promote <sha>` on the VPS, which copies
the site into `/srv/bedroom-planner/site-<sha>`, repoints `/srv/bedroom-planner/current` at it in one
rename, and points `previous` at the copy that was live. Older copies are deleted. It records the
commit in `/srv/bedroom-planner/DEPLOYED_SHA` and checks that the pages and their scripts load over HTTPS. To roll
back, `ssh projects sudo deploy-app bedroom-planner rollback` swaps `current` and `previous`.

nginx serves `current` as static files; the vhost is [deploy/nginx.conf](deploy/nginx.conf). The
certificate comes from Let's Encrypt using the webroot challenge at `/var/www/html`, renewed by the
VPS's certbot cron.

## License

The code is under the [MIT License](LICENSE). The photographs in `public/prints/` and the preview
pictures in `public/og/`, which show them, are Femi's and are not covered by it: all rights
reserved, as [NOTICE](NOTICE) says. Use your own photos when you plan your own room.
