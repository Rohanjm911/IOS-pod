/** Build-time configuration, from Vite's `VITE_*` environment variables. */
export const config = {
  /** Pinned in development by the manifest `key` (web/extension/wxt.config.ts). */
  chromiumExtensionId: import.meta.env.VITE_EXTENSION_ID_CHROMIUM || DEV_EXTENSION_ID,
  /** The extension packages (web/extension: `pnpm package` copies them into public/downloads). */
  extensionChromeUrl: import.meta.env.VITE_EXTENSION_CHROME_URL || '/downloads/bitchord-extension-chrome.zip',
  extensionFirefoxUrl: import.meta.env.VITE_EXTENSION_FIREFOX_URL || '/downloads/bitchord-extension-firefox.zip',
  /** The version the zips above hold, for the "update available" notice. */
  extensionManifestUrl: import.meta.env.VITE_EXTENSION_MANIFEST_URL || '/downloads/extension.json',
  /** BitChord's Listen Together server. */
  partyServerUrl: import.meta.env.VITE_PARTY_SERVER_URL || 'https://bitchord-listen-together.onrender.com',
  /** Optional self-hosted Cloudflare Worker proxy URL for iOS Safari / browsers without the extension. */
  ytProxyUrl: import.meta.env.VITE_YT_PROXY_URL ?? '',
} as const;
