// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: "message-channel-polyfill",
        generateBundle(options, bundle) {
          // Add polyfill to the beginning of worker bundle
          const polyfill = `
if (typeof MessageChannel === 'undefined') {
  globalThis.MessageChannel = class MessageChannel {
    constructor() {
      this.port1 = {
        postMessage: (message) => {
          setTimeout(() => {
            if (this.port2.onmessage) {
              this.port2.onmessage({ data: message });
            }
          }, 0);
        },
        onmessage: null,
        start: () => {},
        close: () => {}
      };
      this.port2 = {
        postMessage: (message) => {
          setTimeout(() => {
            if (this.port1.onmessage) {
              this.port1.onmessage({ data: message });
            }
          }, 0);
        },
        onmessage: null,
        start: () => {},
        close: () => {}
      };
    }
  };
}
`;

          for (const fileName in bundle) {
            const file = bundle[fileName];
            if (file.type === "chunk" && file.isEntry) {
              file.code = polyfill + file.code;
            }
          }
        },
      },
    ],
    define: {
      global: "globalThis",
    },
    resolve: {
      alias: {
        // Polyfill for MessageChannel
        "node:async_hooks": "data:text/javascript,export default {}",
      },
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  experimental: {
    session: true,
  },
});
