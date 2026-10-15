# Bedroom planner

A planner for Femi's San Francisco bedroom, built from his own measurements. Inches throughout.

- **Live:** https://bedroom.davidteju.dev (3D) and https://bedroom.davidteju.dev/plan.html (2D)
- **Layout links:** https://bedroom.davidteju.dev/window/, `/corner/` and `/centred/` each open
  one layout and have their own link preview. The link icon beside each ready-made layout in the sidebar copies them.
- **3D view** (`site/index.html`): a three.js scene with modelled furniture. Drag a piece to move
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
- **Palette, Clay and indigo** (`THEME` in `core.js`): the walls stay cream, because the room is
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
  (`throwRoom` in `core.js`).
- **Femi's photographs** hang in every frame except the topo map: 19 of his own shots from 2024 to
  2026, picked from his Photos library (`PRINTS` in `core.js`, files in `site/prints/`). Each is a
  1600 px copy with no location or camera data, cropped to fill its frame the way a print shop
  would. In 3D the photos are lightly pixelated (4 pixels per inch, the same in every frame) and
  posterized to 18 levels per channel, to sit in the flat-shaded room; the 2D wall views show them
  plain. A frame can hold one photo or a grid (`photos` on the item). The Selected panel's **Photo**
  menu swaps which one a frame shows.
- **Gear:** every ready-made layout hangs Femi's snowboard upright on a wall rack, bindings on,
  with his boots on a tray under it. A board's model lies flat instead when it is wider than tall.
  The furniture list also offers a leaning ladder shelf, which the window layout uses on the
  in-push, and a bean bag modelled as one sagging fabric sack with a sat-in seat.
- **On a phone** the 3D page is a viewer: the layouts are tabs, there is no editing panel, a drag
  turns the room and a tap names a piece. A screen at most 760 px wide or 500 px tall counts
  as a phone. Editing needs a wider screen.
- **2D plan** (`site/plan.html`): floor plan plus the four walls seen from inside.
  **Light map, lamps only** overlays the lighting estimate.

## Lighting estimate

Femi doesn't use ceiling lights, so `lightReport()` in `core.js` estimates lux with only the
lamps on, on a face-up plane 30 in off the floor, plus each bed reading spot (10 in in from an
open edge, 14 in from the head, 8 in above the mattress). Direct light follows the inverse-square
and cosine laws from each bulb, with each shade sending a set share downward and solid furniture
casting shadows. Light bounced off the room is added evenly, treating the room as an integrating
sphere with 50% average reflectance and 85% luminaire efficiency. The floor lamp and sconces
assume Femi's Tapo L535E smart bulb (1100 lm, E26), and so do his BÖJA and Mika; only
the PELARBOJ, which has a built-in LED, is a guess. The targets in the
tests are 300 lux at each reading spot and a 50 lux room average. It is an estimate for
comparing layouts, not a photometric survey.

Both pages share `site/core.js` and `site/core.css`: the measured room, the ready-made layouts,
saved state, the collision and door-swing rules, and the sidebar. They read and write the same
`localStorage` entry, so an edit in one tab shows up in the other. Saved plans live only in the
browser that made them; use **Export JSON** and **Import JSON** to move them.

The 3D page loads three.js 0.170.0 from cdn.jsdelivr.net, so it needs a connection. The 2D page
works offline.

Bench height, door and window heights and all IKEA dimensions are unverified.

## Develop

```bash
npm run serve
```

Then open http://127.0.0.1:4731. The pages use relative paths, so opening `site/index.html`
straight from disk also works, but a browser may keep that copy's saved layout separate from the
served one.

```bash
npm test
```

The tests load `site/core.js` in Node and cover the facing and rotation rules, the ready-made
layouts, the bench and the lighting estimate.

## Link previews

`site/window/index.html` and its siblings hold each layout's preview tags and forward to
`/?layout=window`, which opens that layout once and then clears the address. The pictures in
`site/og/` are 1200 × 630 captures of `?shot`, a mode that shows only the room. After changing a
layout, retake them with the server running:

```bash
for slug in window corner centred; do
  profile=$(mktemp -d)
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --user-data-dir="$profile" \
    --use-mock-keychain --password-store=basic --no-first-run --enable-unsafe-swiftshader --use-angle=swiftshader \
    --hide-scrollbars --window-size=1200,630 --virtual-time-budget=15000 \
    --screenshot="site/og/$slug.png" "http://127.0.0.1:4731/?layout=$slug&shot"
  trash "$profile"
done
```

`robots.txt` allows only the link pages and pictures, because some preview fetchers obey it;
the `X-Robots-Tag: noindex` header still keeps everything out of search results.

## Deploy

```bash
npm run deploy
```

`deploy/deploy.sh` refuses uncommitted changes. It ships the committed `site/` to
`/srv/bedroom-planner/releases/<sha>` on the `projects` VPS, repoints
`/srv/bedroom-planner/current` at it, records the commit in `/srv/bedroom-planner/DEPLOYED_SHA`,
and checks that the pages load over HTTPS. To roll back, repoint `current` at an earlier release.

nginx serves `current` as static files. The vhost is [deploy/nginx.conf](deploy/nginx.conf),
installed as `/etc/nginx/sites-available/bedroom-planner` and tracked in the
[projects-vps](https://github.com/DavidTeju/projects-vps) repository. The certificate comes from
Let's Encrypt using the webroot challenge at `/var/www/html`, renewed by the VPS's certbot cron.
DNS for `bedroom.davidteju.dev` is an A record to `82.29.152.139` in the Squarespace Domains
dashboard.
