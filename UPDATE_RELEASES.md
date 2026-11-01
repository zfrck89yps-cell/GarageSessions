# Publishing Garage Sessions updates

Keep the GitHub Pages origin, installed manifest identity and `garage-sessions-v1` localStorage key stable. Never clear training data as part of an app update.

For every release that changes app code or bundled assets:

1. Change `CACHE` in `sw.js` to a unique `garage-sessions-` release name. Never reuse a cache name for different app files.
2. Update `GS_BUILD` in `app-updates.js` to identify the installed release.
3. Add new offline app files to `ASSETS` in `sw.js`. Publish all changed files together. The worker itself keeps the stable `sw.js` URL.
4. Run the regression suites and mobile Chrome/WebKit update lifecycle tests. If changing the baseline cache/build labels, update the synthetic release substitutions in `tests/update-browser.cjs` and cache names in `tests/app-updates.cjs` as well.

A waiting worker activates only after the user requests an update. If a workout, cardio guide, editor, picker or dialog is active, activation/reload is deferred until it closes. Before activation and reload, the app saves and verifies the existing database. Closing all app windows also permits the browser's normal waiting-worker activation for the next launch.

The release cache contains the complete HTML/JavaScript bundle. Installation bypasses the HTTP cache and must finish before activation. Failed installation removes only the new partial cache. Activation removes old Garage Sessions asset caches, never localStorage or unrelated caches. External images are fetched normally.

Local browser/PWA storage remains device-specific. Updates are not a substitute for exported backups or cloud synchronisation.
