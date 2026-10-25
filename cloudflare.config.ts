import { bindings, defineConfig, triggers } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
  worker: {
    name: "bookmark-discord-command",
    entrypoint,
    compatibilityDate: "2026-10-01",
    workersDev: false,
    triggers: [
      triggers.fetch({ pattern: "bookmark-discord.felixoi.com/*", zone: "felixoi.com" }),
    ],
    observability: {
      enabled: true,
      traces: { enabled: true },
      issues: { enabled: true },
    },
    env: {
      DISCORD_APPLICATION_ID: bindings.secret(),
      DISCORD_PUBLIC_KEY: bindings.secret(),
      // Bot token for sending DMs, looking up the server name and deleting bookmarks
      DISCORD_TOKEN: bindings.secret(),
    },
  },
});
