# TeaTime — UX spec

## Onboarding v2.1
Source: Figma `Uk1zH52TS6WFucHkYVFKJY`, section `13871:2156` ("ONBOARDING v2.1").
v2.1 replaces the earlier welcome screen: no welcome, no name, no family screen. The family group is created when the person signs in.

Three journeys plus the detail screens they share:
- **A · The TV is in front of you.** TV QR → Sign in → Photo access → Moments found (Send now) → Home, moments arriving → Home, all in.
- **B · From an ad or the store.** Sign in → Photo access → Moments found (Keep these) → Which TV → TV in front of me / TV somewhere else → Set-up message → Home, waiting → Home, connected.
- **D · Signed in, skipped everything.** Empty Home → share with "+" → "Shared. Now connect a TV" → Home, waiting for a TV → TV connected, invite your family.

All 34 frames in the section are built, except the old TV QR screen (kept in Figma only as "current design" for comparison).

### Screen map
| Route | Screen | Goes to |
|---|---|---|
| `#tv` | TV · Scan to send photos | QR → A1. "Start from an ad instead" → B1 |
| `#a1` / `#b1` | Sign in (A1 / B1 copy) | Apple → Apple sheet · Google → Google sheet · Phone number → C1 |
| sheet | Apple system sheet | Share / Hide My Email · Continue with Face ID → "Signing in with Apple…" → photo prompt. Swipe down, tap outside or Esc → back with nothing shown |
| sheet | Google account sheet | Any account → "Signing in with Google…" → photo prompt. Same close rules |
| `#c1` | C1 · Mobile number | Send code (enabled at 9+ digits) → C2. Back → sign in |
| `#c2` | C2 · Enter the code | 6 boxes on one code field (SMS autofill works). Continue at 6 digits → C3. "Send again" clears and confirms with a toast |
| `#c3` | C3 · Your name | Continue (first name needed) → photo prompt. Name appears on Home |
| `#a2` / `#b-a2` | Photo access (system prompt) | Allow → A3 / B2 · Limit Access or Don't Allow → limited screen |
| `#photos-off` | We can't see your photos yet | Allow photo access → A3 / B2 · Pick photos myself → picker · Skip → D1 |
| `#a3` / `#b2` | 128 photos | Send now → A4 / Keep these → B3 · "+120" → All 128 · Choose my own → picker · Skip → D1 |
| `#all-photos` | All 128 photos | All ticked; tap to leave out; button counts what's left ("Send 127 photos" / "Keep 127 photos") → A4 / B3. Back discards changes |
| `#picker` | Choose my own · picker | Tap to number photos (max 10, toast past that); preview shows the last tapped; Next · N → New moment. X → where it was opened from |
| `#moment` | New moment | Caption optional. Share → A6 (path A) · B3 (path B) · D3 (from D1/D4 "+") · same Home (from any other Home "+") |
| `#a4` | Home, moments arriving | Pill counts up to the chosen total, then → A5 |
| `#a5` | Home, all in, TV named | End of path A |
| `#a6` | Home after "Choose my own" | Shows the person's own moment (first photo, count, caption or "Add a caption") |
| `#b3` | Where should they play? | Row 1 → B4 · row 2 → B5 · Later → B7 (path B) / D4 (row D) |
| `#b4` | Open TeaTime on the TV | Scan the TV's code → A4 (path B) / D5 (row D) · Later as B3 |
| `#b5` | Add another TV | Send set-up → B6 |
| `#b6` | Send this to Mum | Share message → B7 (path B) / D4 waiting for that TV (row D) |
| `#b7` → `#b8` | Waiting for Mum's TV → connected | After 5 s; push notification slides in |
| `#d1` | Home, nothing shared yet | Share a moment / "+" → picker · "No TV yet" → B3 |
| `#d3` | Shared. Now connect a TV | Sheet over D4. Connect a TV → B3 · swipe down, tap outside or Esc → D4 |
| `#d4` | Home, waiting for a TV | Pill and "No TV yet" → B3. If a set-up message was sent: "Waiting for Mum's TV", then D5 after 5 s |
| `#d5` | TV connected, invite your family | Invite → share sheet with the family code |

### Scenarios
| Scenario | Behaviour |
|---|---|
| Phone | Screens fill the phone. Status bar and home indicator are the OS's; content respects safe-area insets. |
| Desktop / review | Phone shown as a 375×812 device. On wide screens a side list jumps to any screen, grouped by row. |
| Refresh / switch away and back | Each screen has its own URL; path, phone number, name, picked photos, caption and B5 details are kept for the session, so a refresh lands in the same place with nothing lost. |
| Shared screens | The app remembers the journey (A, B or D), so sign-in, the photo prompt, Which TV and the set-up message each continue the right way. |
| Sign-in fails | Offline when signing in → toast "Couldn't sign in with Apple/Google. Try again."; buttons are ready again. |
| Closing a system sheet | Returns to sign in with nothing shown (per design note). |
| Name left empty (B5) | Wording falls back: "Send the set-up", "Waiting for their TV". |
| Different TV picked (B5) | Step 1 of the message names that TV's store. |
| Sharing (set-up, invite) | Phone share sheet. Closing it keeps you where you are. Where sharing isn't available the text is copied and a toast says so. |
| Picker over 10 | Toast "Up to 10 photos or videos per moment" (Figma Toast default). |
| Outside v2.1 | Feed actions, nav tabs, albums, camera, switching group, "Got a code from family?" → toast "Not in this build yet: …". |
| Slow network | Dark background from first paint. Photos load only when their screen opens; tiles keep their size. |
| Keyboard / screen reader | Each screen moves focus to its heading, forms to their first field. Sheets close with Esc. Visible focus ring. |
| Reduced motion | Sheets, notification and press feedback don't animate. |

### Colour options (temporary, for the client to choose)
Source: Figma `13960:30674` ("CTA colour options"). The original pink-orange palette has been removed, leaving four options. Only buttons, links and selected states change; the background stays the same except in option 2.

| # | Option | Primary button | Text buttons / links | Selected (ticks, badges, chips) | Brand moments ("+", avatar ring) |
|---|---|---|---|---|---|
| 1 | Brand gradient (default) | Magenta → gold, white label | Gold | Magenta → gold | Magenta → gold |
| 2 | Strong blue | #2F6BFF, white label | White / links #5B8CFF | Blue | Magenta → gold. Background #0E0C12, softer glow |
| 3 | Analogous | Violet → pink, white label | White / links pink | Violet → pink | Violet → pink |
| 4 | Logo gold | #F2B53B, dark label #1A1226 | Gold | Gold, dark tick | Magenta → gold |

All four share the same secondary button (thin white outline) and disabled button (grey fill, faded label).

| Scenario | Behaviour |
|---|---|
| Switching | Phone: round swatch tab on the left edge. Wide screen: "Colour N · name" pill bottom-right, outside the phone. Opens a list of the four options; tapping one applies it instantly, closes the list and shows a toast. |
| Sharing one option | The page address carries `?palette=N`, so a copied link opens on that option (e.g. `…/teatime-onboarding/?palette=3#a1`). |
| Coming back | This browser remembers the last pick. A link with `?palette=` wins. |
| Closing the list | Tap outside or Esc; focus returns to the switcher. Arrow keys move between options. |
| No flash | The option is applied before the page draws. |

**When the client picks:** copy that option's values into `:root` in `styles.css`, then delete the other `[data-palette]` blocks, the switcher styles, the "Colour options" block in `app.js` and the head script in `index.html`. Or go back to the old palette with the `before-palettes` tag.

### Shortcuts and choices to confirm
- A known Apple / Google account or phone number would go straight to Home; this build treats every sign-in as new.
- B4's "Scan the TV's code" skips the camera (A0, not drawn in this section).
- B7 → B8 and D4 → D5 run on a 5 s timer to show the moment the other TV joins.
- D2 ("New moment — from +") is the same New moment screen, as the design note says.
- D4 is built from the Home layer under D3's sheet.
- Path B's All-128 button says "Keep N photos" to match B2's "Keep these"; the design shows "Send".
- B5's "Their TV" options (Google TV, Android TV, Amazon Fire TV, Apple TV) are placeholders.
- Family code `482917` in the invite is a placeholder.

### Open questions (from the Figma section)
Family group at sign-in or at TV claim, and its name · which entry comes first · app not installed after the scan · are bulk moments free, and when to ask for a subscription · bulk moments in the feed or in a "year" collection · typing a code on the TV vs "nothing typed on the TV" · "What TV is it?" when the sender doesn't know · second family member joining · care rooms · Samsung / LG "not supported yet" · photo date vs upload time on the TV · smart titles · the word on screen: photos, moments or stories.

### Asset note
The eight photos are the original Figma exports (~2 MB each, ~16 MB total). Fine for review; they need compressing before real users load them on mobile data.
