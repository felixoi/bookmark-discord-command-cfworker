import { buttonStyle, makeButton } from "discord-hono";
import { factory } from "../init.ts";
import { errorCode } from "../lib/discord.ts";

const deleteBookmarkButton = makeButton("delete-bookmark", "Delete bookmark", buttonStyle.Danger);

export const component_delete_bookmark = factory.component(
  deleteBookmarkButton,
  // The original response of a button interaction is the message the button is on
  (c) => c.update().resDefer(async (c) => {
    const response = await c.followup();
    if (!response.ok) {
      console.error(`[bookmark] Deleting bookmark ${c.interaction.message.id} failed: ${await errorCode(response)}`);
    }
  }),
);
