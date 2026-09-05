# Portfolio

Private repository. Deployed to **[maisbilto.pages.dev](https://maisbilto.pages.dev)**
on every push to `main`.

Hand-written HTML, CSS and JavaScript. No framework, no dependencies, no build step —
what is in this folder is what gets served.

## Running it locally

Serve the folder over HTTP rather than opening `index.html` from disk:

```bash
python -m http.server 8000
```

Then <http://localhost:8000>.

The contact form DOES work locally — it posts to Web3Forms' API, not to this server.
To exercise the failure path instead, block the request in devtools or go offline; the
form should keep every character you typed and show its rose error line.

## Structure

```
index.html          the whole page — five sections in one document
css/base.css        design tokens, reset, base elements
css/main.css        layout and components
js/main.js          scroll tracking, section observer, rail, certificate gallery,
                    contact form
assets/img/certs/   certificate images
projects/           per-project case study pages
```

## Things that will bite you later

**Layout rests on one assumption.** On desktop each section is exactly one viewport
tall and scroll-snap moves between them. Below `60rem` wide, or under `30rem` tall,
that cannot hold — snapping is switched off and sections stack at natural height.
Anything that assumes "one section = one screen" has to work under both.

**Sizing is fluid.** `html` has `font-size: clamp(13px, 1.15vh + 0.25vw + 1px, 22px)`
and nearly everything is in `rem`, so the interface scales with the viewport rather
than only reflowing. Note that `rem` inside a media query resolves against the browser's
initial 16px, not against this — which is why there is no feedback loop.

**Card state is driven by custom properties, not by colour rules.** `data-status` on
`.hc-wrap` sets `--st`, `--st-hi`, `--st-glow`, `--seg`, `--beam`, `--thumb`, `--lift`,
and everything downstream reads those. If a status stops working, look for a later rule
that re-declares one of those properties directly — a duplicate selector further down
the file silently wins, and it is invisible in both the diff and the browser.

**Colour means something.** Rose is in progress, teal is complete, slate is scheduled.
Hover brightens a card's *own* colour via `--st-hi`; it never borrows another status's.

**`[hidden]` loses.** The UA rule `[hidden]{display:none}` is the weakest in the cascade,
so any element you hide with `.hidden = true` also needs an explicit
`.thing[hidden]{display:none}` if it has a `display` of its own. This has already bitten
`.lb-nav` and `.sent`.

**`<use>` has a shadow tree.** Document CSS cannot select inside it — only inherited
properties like `color` cross the boundary. That is why `#corner` and `#rosette` are
coloured with `currentColor`, and why the confirmation ring is inline SVG rather than a
`<use>`: its two strokes are animated separately.

**A horizontal scroller is a vertical one too.** Setting `overflow-x: auto` forces
`overflow-y` to compute to `auto` — CSS will not let one axis scroll while the other
stays visible. So any vertical overflow inside a horizontal row turns it into a
vertical scroll container that swallows the page scroll. The Work slider had exactly
18px of it, from the card glow hanging below the card, and a swipe over the cards
would not scroll the page. **Test: `scrollHeight` must equal `clientHeight` on every
horizontal scroller.**

**`clip-path` clips an outline and a box-shadow, not just the paint.** Every chamfered
control here had no visible keyboard focus ring at all, because the global one is drawn
outside the box. Focus styles on those elements have to be drawn on the inside.

**A filled animation beats a normal declaration at any specificity.** Elements carrying
`data-anim` run `rise` with `animation-fill-mode: forwards`, which holds `transform:none`
and `opacity:1` afterwards. No selector will out-rank that; the animation has to be
switched off for that element.

**`scrollIntoView` scrolls every scrollable ancestor**, not just the one you meant. On a
phone that includes the document, so it drags the page. Set `scrollLeft` on the element
you actually want to move.

**A percentage in `flex-basis` resolves against the content box** — after the container's
own padding has narrowed it. Combining percentage padding with a percentage basis makes
the two compound, and the item comes out about half the size you asked for.

**`pointer-events: none` does not affect the tab order.** Hiding a card from the mouse
leaves its links reachable by keyboard. Use `tabindex="-1"` on the descendants, not
`inert` — `inert` also blocks clicks, and clicking an off-centre card is how it is
brought forward.

**The visible certificate count is in two places.** `VISIBLE` in `js/main.js` must match
`.certs .cert:nth-of-type(n+6)` in `main.css`.

**Six certificates are redacted.** The TVTC-issued ones had a national ID number printed
on them. Any new certificate from that source needs the same treatment before it goes in
`assets/img/certs/`.

**Reduced motion is handled in two places.** CSS for animations, and `matchMedia` in
`main.js` for scrolling — a `behavior` passed to `scrollTo()` cannot be overridden by a
stylesheet.

**Verify layout changes by rendering, not by reasoning.** Check more than one viewport
*width*, not just device pixel ratios — a 1px border lands differently on a fractional
layout position, which is why the form fields use a 2px border. And when comparing
before/after screenshots, render the same version twice first to see what two identical
runs differ by.

## Deploy

**Cloudflare Pages**, connected to this repo. Framework preset `None`, build command
empty, build output directory `/`. Every push to `main` deploys; 500 builds a month.

Moved off Netlify on 2026-09-05. Netlify charges **15 credits per production deploy**
against a 300/month free allowance — 20 deploys a month — and a single day of iterating
used all of them. Deploy previews there were free; production deploys were not.

**The contact form is Web3Forms**, not Netlify Forms, which only works on Netlify.
The form posts to `https://api.web3forms.com/submit` with an `access_key` in the body.
That key is a public identifier, visible in the page source; it routes mail to the
destination inbox and cannot read submissions or change the account. The honeypot field
is `botcheck` and must stay `display:none`. Free tier is 250 submissions a month.

## Open items

- [ ] `projects/infinity-loaner.html` is empty; three `href="#"` links in Work point at nothing
- [ ] Aurora Fleet Program still has a placeholder description
- [ ] Real PDI screenshots for Infinity Loaner and KSA Tourism
- [ ] CV download button — the PDF carries a phone number and home city, decide first
- [ ] Two ServiceNow AI course certificates not yet added
- [ ] Test on a real phone, not just emulated viewports
