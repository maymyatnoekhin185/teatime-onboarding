# TeaTime — mobile app prototype

A clickable prototype of the TeaTime mobile app, built in plain HTML, CSS and JS from the Figma designs (onboarding v2.1 and the key screens after it). It lets the team and the client tap through every journey on a phone or a computer before the real app is built.

**Live link:** https://maymyatnoekhin185.github.io/teatime-onboarding/

## What's in it
- **Onboarding, seven journeys:** scanned the TV, from an ad, skipped everything, joined with the family PIN, asked to join from the TV's small QR, care community, and after onboarding.
- **Home and tabs:** moments arriving, the TV list, Memories, Families, Profile and Notifications.
- **Locked moments and the paywall:** the first 3 uploads are free. From the 4th, a moment arrives locked, and the paywall (F4) unlocks it.
- **Colours:** Option 3, violet to pink, chosen by the client. Figma source: the Uplift V2 colour styles.

The full screen map, scenarios and intended behaviour are in [UX.md](UX.md).

## Run it locally
You only need Node. There's nothing to install.

```powershell
node dev-server.mjs
```

Then open http://localhost:5173.

## Reviewing
- **Phone:** open the live link. Screens fill the phone.
- **Computer:** the app shows as a 375 × 812 phone. A side list jumps to any screen, and its **"Start as…"** presets open ready-made states, such as two families, a care community or a 4th upload that arrives locked.
- Each screen has its own address (for example `#e2`), so a copied link opens on that screen. A refresh keeps where you were for the session.

## Files
| File | What it is |
|---|---|
| `index.html` | Every screen's markup |
| `app.js` | Router, onboarding flow, session state |
| `home.js` | Home, tabs, families, TVs, moments and the presets |
| `styles.css` | Styles and colour tokens (Option 3) |
| `assets/` | Icons, images and glows exported from Figma |
| `dev-server.mjs` | Local preview server with no dependencies |
| `UX.md` | UX spec: journeys, screen map, scenarios |
| `CLAUDE.md` | Rules shared with the TV repo |
| `reference/` | Earlier prototype kept for reference |

## Sister repo: TV
The TV app is in [teatime-tv](https://github.com/maymyatnoekhin185/teatime-tv). The two apps are paired, so the shared rules must match in both repos. These cover connecting a TV, the 6-digit family PIN, care community TVs, TV states, locked moments, Memories, captions and Australian English. See [CLAUDE.md](CLAUDE.md) for the full list.

## Design source
Figma file `Uk1zH52TS6WFucHkYVFKJY`, page "May - Design Uplift Version 2": sections ONBOARDING v2.1 and OTHER KEY SCREENS.
