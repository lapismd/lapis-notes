# Web icon artwork

`app-icon.png` is the Web-owned raster input for PWA icon generation. Its bytes
were copied unchanged from `packages/desktop-deno/build/icon.png` at Notes
revision `5ffb33c152404b6880debd1b5fd70762121d6196` during legacy host retirement.
The SHA-256 is
`89c801232c2ddbc6dae9cf386a9dd49fcf9151551f59fd3b68901133a5e3ffa2`.

The frozen host keeps its separate historical copy until its removal slice.
Web generation uses this local artwork and the API-owned `lapis-logo.svg`.
The cold generator regression compares all seven outputs with the frozen hashes in
`pwa-icon-sha256.json` and the existing public icons without providing a frozen desktop host.
