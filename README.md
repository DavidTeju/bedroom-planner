# Bedroom planner

A planner for Femi's San Francisco bedroom, built from his own measurements. Inches throughout.

- **Live:** https://bedroom.davidteju.dev (3D) and https://bedroom.davidteju.dev/plan.html (2D)
- **3D view** (`site/index.html`): a three.js scene with modelled furniture. Drag a piece to move
  it, Shift-drag to raise or lower it, R rotates, arrow keys nudge, click a door to open it, and
  the toolbar switches between the 3D, top, wall and standing-inside views.
- **2D plan** (`site/plan.html`): floor plan plus the four walls seen from inside.

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
layouts and the bench.

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
