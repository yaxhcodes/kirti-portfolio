# Kirti Joshi portfolio

The website is in [`golden-hour/`](golden-hour/).

```sh
npm run dev
```

Open `http://localhost:4173`. No installation is required. Use `npm.cmd` in PowerShell if execution policy blocks `npm`.

See `golden-hour/README.md` for customization, verification, and keyboard shortcuts. Personal details live in `golden-hour/dist/profile.js`.

The dock opens independent, resizable windows and magnifies on hover, with no sidebar. Equal-sized personal folders start in a column and snap into free grid slots when moved; their sample contents are editable in `profile.js`. Appearance & sound offers Silver, Sage, Coffee, Ocean, and Rosewood, each with Light and Dark modes, plus glass depth, tint, mute, and greeting replay. The first visit has glass handwriting over the blurred desktop in five languages, including Japanese. The supplied photo appears in About, a desktop profile widget with a glass caption, and the social card; personal content remains editable in `profile.js`. Run `npm run check` for source checks; regression tests are documented in the project README.

Source is maintained in a private GitHub repository. The website can run locally or deploy as static files on Vercel.

## Vercel

Import the repository with Root Directory left at the repository root. The checked-in `vercel.json` selects the Other framework preset, runs `npm run build`, and publishes `golden-hour/dist`. No dependency installation is needed for deployment.

If your existing project uses `golden-hour` as its Root Directory, its own `vercel.json` publishes `dist` with the same build command. The local `npm run dev` server is only for preview and is not the Vercel entry point.

Pushes to the connected production branch trigger a new deployment. If a previous deployment showed 404, redeploy the latest commit so Vercel picks up the output-directory configuration.
