# Kirti's desktop portfolio

A responsive, macOS Golden Gate-inspired portfolio for Kirti Joshi, a Senior Software Engineer with 8+ years of experience. Independent dock-launched windows, movable personal folders, restrained liquid glass, Apple-inspired neutral surfaces, graphite text, and system-blue accents.

## Run locally

Requires Node.js 20 or newer. No package installation or build step is needed.

```sh
npm run dev
```

Open `http://localhost:4173`. `dist/` is the complete deployable website.

```sh
npm run check
```

## Personalize

Edit `dist/profile.js` to set `name`, `fullName`, `portrait`, `email`, `linkedin`, and `github`. The supplied photograph is optimized as `assets/kirti-photo.webp` and appears in About, the desktop profile widget, and the social card. About uses a slightly closer crop, centered lower to retain the person and landscape. To replace it, copy a photo into `dist/assets/` and update `portrait`; a failed image returns to the text or placeholder.

Contact currently uses `kirti@example.com` and reserved example-domain profile URLs, marked as sample contact details. Replace these values and set `contactIsDemo: false` for the real version. Empty values hide their contact actions. Use complete HTTPS URLs for social profiles. Experience, project descriptions, and skill groups live in the same file. Demo email addresses are omitted from generated resumes.

After changing profile content, run `npm run prepare:seo`. This refreshes the metadata and the initial About window in the HTML. The desktop adopts this window when JavaScript starts, so the first profile content is readable before scripts run and with JavaScript disabled.

The `personalFolders` array in `profile.js` contains Interests, Reading List, and Snapshots. Their current notes and illustrations are clearly marked as sample content. Replace the entries and set each folder's `sample` flag to `false` when its content is real. Snapshot thumbnails currently use native CSS illustrations, not personal photographs.

Employer and client marks and the LinkedIn/GitHub icons use self-hosted official artwork. [Asset sources](dist/assets/brands/SOURCES.md) records each original URL. Logos retain their colors and sit on a neutral badge so they remain legible in every theme.

The five project previews are clearly labeled illustrative interface studies. The accompanying descriptions and contributions are grounded in the supplied resume; no private client screenshots or invented performance numbers are used.

After updating resume content, regenerate its downloadable PDF. This optional authoring step needs Python and ReportLab; the website itself has no Python dependency.

```sh
python -m pip install reportlab
node scripts/generate-resume.mjs
```

Set `PORTFOLIO_PYTHON` if the Python executable has a different name or path. The resume generator uses the shared professional summary, experience, and skill groups from `profile.js` to produce both PDF and plain-text downloads.

## Interactions

- Each dock icon opens its own window: About, Experience, Selected work, Skills, Contact, Résumé, and Appearance & sound. There is no sidebar.
- Personal folders start in an equal-sized vertical column on the desktop and open independent windows. Their files open readable previews. Drag folders freely; releasing snaps to the nearest free grid slot, keeping clear of other folders and the profile widget. Shift + arrow keys moves between slots and skips occupied positions. Saved freeform layouts migrate to the grid; positions remain bounded above the dock after resizing. View → Arrange folders in a column restores the default layout. Personal windows share the Finder dock indicator and can be restored from their desktop folder, Go menu, or search.
- A compact photo widget sits in the upper-left desktop corner, behind windows. Its frosted glass caption shows Kirti's name and role; activating the widget opens About. It adapts to all ten palette/mode combinations, becomes inert behind open mobile windows, and hides on very short or narrow screens to preserve workspace for folders and the dock.
- Open windows retain their scroll position and work filters. Clicking the dock focuses an existing window instead of recreating it.
- Desktop windows resize from all eight edges/corners. The lower-right handle also supports arrow keys, with Shift for larger steps. Minimum sizes and viewport bounds keep the toolbar and content usable above the dock. Resized dimensions survive minimizing and expand/restore; narrow windows reflow their content using container queries. Phones use fitted windows with resize handles hidden.
- Red closes its window; amber minimizes it into the corresponding dock icon with a Genie animation. The continuous 49-frame curve has smooth acceleration and deceleration, with a narrow tail that holds its taper through the descent. Green expands/restores it. Drag or double-click the toolbar on desktop to move or expand the window. Background windows remain accessible on desktop.
- Desktop hover magnifies dock icons with a damped spring. Neighbors scale and move outward as the dock expands, then return to rest on pointer exit. Geometry is measured on resize rather than on each animation frame. Magnification is disabled on narrow/touch layouts and with reduced motion.
- Dock labels occupy a separate layer above every icon and rise with magnification, so an enlarged icon cannot cover its label. Icons and their parent group sit above the dock's glass rim; hovered and keyboard-focused icons rise above their neighbors.
- Appearance & sound is a utility window and does not replace the current portfolio section in the URL. Refreshing an older `#appearance` link opens About. Links to portfolio sections continue to work.
- A first visit shows “hello”, “नमस्ते”, “bonjour”, “こんにちは”, and “hola” as glass lettering over the blurred desktop, with no panel behind the text. Self-hosted handwriting fonts cover Latin, Devanagari, and Japanese consistently; [font sources and licenses](dist/assets/fonts/SOURCES.md) are included. The sequence takes about 6.4 seconds after a bounded font-loading wait, with Skip intro and Escape support. The visit is remembered before playback, so refreshing does not restart the greeting. Appearance & sound includes Replay without resetting this preference. Reduced-motion visitors go straight to the portfolio; explicit Replay shows a still greeting. If persistent storage is unavailable, session storage remembers the visit; if neither works, the automatic intro is skipped.
- `Command/Ctrl + K` opens search; Up/Down and Enter navigate its results.
- `Command/Ctrl + ,` opens Appearance & sound; `Command/Ctrl + /` opens shortcuts; Escape dismisses dialogs and menus.
- Silver, Sage, Coffee, Ocean, and Rosewood each support independent Light and Dark modes. Palette, mode, glass depth, and tint are saved on the visitor's device. Older Light/Dark/Sage preferences migrate automatically. Color variants live in `dist/themes.js`; shared text and glass rules live in the stylesheet. Tint adds a subtle palette-colored cast independently of frosting intensity. Content panels remain opaque for readability; the profile widget's caption uses translucent glass with mode-specific brightness, and selected text has explicit foreground and background colors. Storage failures leave the interface usable.
- Subtle synthesized click sounds play after activating controls. Mute them from the menu bar or preferences. The mute setting persists on this device. No audio files are downloaded, and audio failure leaves the interface usable.
- On phones, the focused window fills the available workspace while other windows retain their state. Background controls become inert, projects use a single column, and the dock remains reachable.
- Reduced motion removes window and interface animation. Standard browser focus rings, native modal focus handling, and named icon controls support keyboard use.

These shortcuts are handled while the web page has focus. Browser/OS shortcuts outside the page remain subject to the host browser and operating system.

## Structure

```text
dist/
  index.html          Desktop chrome, dialogs, and page metadata
  styles.css          Themes, responsive layouts, and glass styling
  profile.js          Personal details and resume content
  themes.js           Five paired palettes, mode tokens, and preference migration
  views.js            Modular content views and interface studies
  icons.js            Shared SVG icon vocabulary and HTML escaping
  app.js              Dock navigation, search, and UI events
  desktop.js          Independent windows, focus, stacking, and lifecycle
  personal.js         Desktop folders, sample files, and personal previews
  folder-layout.js    Grid snapping, collision avoidance, and saved positions
  brands.js           Official, self-hosted company and social icons
  dock.js             Spring magnification and neighboring icon spacing
  window-manager.js   Per-window Genie animation, dragging, and sizing
  window-resizer.js   Edge/corner/keyboard resizing and viewport bounds
  preferences.js      Shared themes and resilient local storage
  sound.js            On-demand click synthesis and audio fallback
  glass.js            Small generated lens displacement map
  assets/             Self-hosted artwork, favicon, and resume
scripts/
  serve.mjs           Dependency-free local HTTP server
  check.mjs           Syntax, view, link, and asset checks
  generate-resume.*   PDF authoring from shared profile data
```

No third-party scripts, remote fonts, analytics, or network services are needed to run the portfolio. The glass dock uses an SVG `feDisplacementMap` on a small decorative surface; text remains on a separate, undistorted layer. The interface includes an opaque fallback when backdrop filtering is unavailable.

## Search and link previews

The HTML includes a descriptive title and summary, Open Graph and Twitter large-image tags, image dimensions and alt text, and ProfilePage/Person structured data derived from the shared profile. Sample contact links are excluded from structured data. The About content is included in the initial HTML. These changes follow [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) and the [Open Graph specification](https://ogp.me/).

`dist/assets/og-image.png` is the self-hosted 1200×630 social card. It combines the supplied photograph with native typography and shapes in the Silver palette. To regenerate it after changing the name, role, experience, or photo, use Python with Pillow:

```sh
node scripts/generate-social-card.mjs
```

Set `PORTFOLIO_PYTHON` to the Python executable if needed. Then run `npm run build` to update the image URL's content fingerprint, which gives social platforms a fresh image address. The authoring script currently uses Windows Georgia and Segoe UI fonts. It is not required to run the site.

The public production URL is `https://kirti-portfolio-yaxh.vercel.app/`. If the domain changes, update `site.url` in `dist/profile.js` and run `npm run prepare:seo`. This generates the canonical URL, `og:url`, absolute social image URLs, and a sitemap referenced by `robots.txt`; the deployment build also regenerates them. Keep the production page and image publicly accessible so social platforms can fetch their metadata. Previously shared links may retain a cached preview until the platform fetches them again.

## Design references

- [Apple's macOS Golden Gate design](https://www.apple.com/os/macos/): consistent window shapes, integrated sidebars, and restrained Liquid Glass.
- [Aave: Building Glass for the Web](https://aave.com/design/building-glass-for-the-web): a small generated displacement map and crisp content layers inspired the dock lens. This implementation is custom and does not copy Aave's component library.

## Artwork

The photograph was supplied by the user, optimized to WebP, and displayed with a restrained crop. The earlier `dist/assets/glass-flower.webp` artwork is retained as an optional asset and is not displayed. It was created with the built-in imagegen tool, then resized and encoded as WebP. The wallpaper and interface graphics are native CSS/SVG.

Final generation prompt:

> Use case: stylized-concept. Asset type: decorative hero artwork for a refined feminine developer portfolio inspired by macOS Liquid Glass. Primary request: an exquisite abstract translucent glass flower sculpture, a single floating sculptural blossom with five broad softly folded petals made of frosted pearl glass, delicate blush-pink and smoky lilac along the edges, a small warm champagne glass center. Scene/backdrop: completely plain seamless warm off-white ivory background (#f5f3ee), no horizon, tiny diffuse soft shadow below. Composition/framing: square 1024x1024, flower centered, almost front-facing with slight 3D rotation, occupies 65 percent of canvas, generous clean negative space. Style: very high-end minimalist 3D product render, optical glass, gentle light refraction, realistic thick glass edges and soft iridescence, polished but soft. Palette: very desaturated pale rose, pearl white, faint sage, champagne; gentle low contrast. Lighting: diffuse daylight studio, restrained gentle highlights. Constraints: no text, no typography, no hands, no people, no bridge, no extra objects, no saturated colors, no black background, no watermark.

## Source and hosting

Source is maintained in a private GitHub repository at the user's request. `dist/` is the complete static site. Vercel configuration is provided for both the repository root (output `golden-hour/dist`) and this directory (output `dist`). Both run `npm run build` to refresh initial HTML/metadata and check the deliverable, without Python or installed dependencies. The local preview server is not needed on Vercel.

The ignored local `.openai/hosting.json` retains an unused reserved Sites identity. It is excluded from GitHub and is unrelated to the Vercel deployment.

## Verification

`npm run check` validates JavaScript syntax, all seven portfolio views, three personal folders and their entries, navigation, project details, local brand assets, configured links, the experience claim, initial HTML, current metadata, structured data, canonical URL generation, and Open Graph image dimensions.

For regression tests, run `npm ci` in this directory, then `npm test`. LinkeDOM is a development-only dependency; the deployed website has no package dependencies. Tests load the actual app with controlled DOM, geometry, animation, and audio fixtures. They cover the full name, refresh routing, initial HTML, independent windows, retained state, rapid reopen, dragging, constrained edge/corner/keyboard resizing, size restoration, movable folders, restored folder positions, arrangement, personal previews, brand marks, dock magnification and labels, portrait fallback, sample contacts, mobile focus, appearance/sound preferences, search, lean Genie frames, reduced motion, and the empty desktop. The greeting has separate tests for all five languages, persisted dismissal, refresh, replay, skip, Escape, page exit, storage fallback, and timer cleanup. CSS parsing and text-color contrast against each theme's panel color are checked as well.

The current revision could not be visually inspected in the browser because the browser tool denied access to the existing preview tab. These tests do not substitute for a real browser layout or audible sound check. Screenshots from the original sidebar design in `output/qa/` predate this revision. The updated resume PDF was rendered and both pages visually checked; its current renders use the `resume-v2` prefix.
