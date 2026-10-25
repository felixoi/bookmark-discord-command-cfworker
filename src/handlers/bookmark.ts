import {
  $channels$_$messages,
  $guilds$_,
  $users$me$channels,
  makeActionRow,
  makeEmbed,
  makeEmbedAuthor,
  makeEmbedField,
  makeMessageCommand,
} from "discord-hono";
import type { APIDMChannel, APIMessage } from "discord-api-types/v10";
import { factory } from "../init.ts";
import { CANNOT_SEND_MESSAGES_TO_USER, errorCode } from "../lib/discord.ts";
import { component_delete_bookmark } from "./delete-bookmark.ts";

// Discord rejects embed field values longer than this
const MAX_FIELD_LENGTH = 1024;

function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function makeBookmark(message: APIMessage, guildId: string, serverName: string) {
  const { author } = message;
  const timestamp = Math.floor(new Date(message.timestamp).getTime() / 1000);
  const link = `https://discord.com/channels/${guildId}/${message.channel_id}/${message.id}`;
  const attachments = message.attachments.map((a) => `[${a.filename}](${a.url})`).join("\n");

  const embedAuthor = makeEmbedAuthor(`${author.global_name ?? author.username} (@${author.username})`);
  let embed = makeEmbed()
    .author(author.avatar ? embedAuthor.icon_url(`https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png`) : embedAuthor)
    .color(0xd83c3e)
    .title(`On ${serverName} at <t:${timestamp}>`)
    .fields([
      ...(attachments ? [makeEmbedField("Attachments", truncate(attachments, MAX_FIELD_LENGTH))] : []),
      makeEmbedField("Message Link", link),
    ]);
  if (message.content) embed = embed.description(message.content);

  return { embeds: [embed], components: [makeActionRow([component_delete_bookmark.component])] };
}

export const command_bookmark = factory.command(
  // Context 0 is guild only: bookmarks link to a server message
  makeMessageCommand("Bookmark").contexts([0]),
  (c) => {
    const { member, guild_id } = c.interaction;
    const message = c.ref.messages?.[c.ref.target_id];
    if (!member || !guild_id || !message) {
      return c.flags("EPHEMERAL").res("Bookmarks only work for messages on a server.");
    }

    return c.flags("EPHEMERAL").resDefer(async (c) => {
      const dmResponse = await c.rest("POST", $users$me$channels, [], { recipient_id: member.user.id });
      if (!dmResponse.ok) {
        const code = await errorCode(dmResponse);
        console.error(`[bookmark] Creating DM channel with ${member.user.id} failed: ${code}`);
        await c.followup(`Something went wrong! (Code ${code})`);
        return;
      }
      const dmChannel = await dmResponse.json() as APIDMChannel;

      // The bot is not necessarily a member of the server the command was used on
      const guildResponse = await c.rest("GET", $guilds$_, [guild_id]);
      const serverName = guildResponse.ok ? (await guildResponse.json()).name : "Unknown server";

      const sendResponse = await c.rest("POST", $channels$_$messages, [dmChannel.id], makeBookmark(message, guild_id, serverName));
      if (!sendResponse.ok) {
        const code = await errorCode(sendResponse);
        // Discord answers with 403 instead of the JSON error code when the user blocked the bot
        if (code === CANNOT_SEND_MESSAGES_TO_USER || code === 403) {
          await c.followup("It seems like I can't send you DMs! Check your privacy settings for this server or open up a DM with me manually.");
          return;
        }
        console.error(`[bookmark] Sending bookmark to ${member.user.id} failed: ${code}`);
        await c.followup(`Something went wrong! (Code ${code})`);
        return;
      }

      await c.followup("The message was successfully bookmarked into your DMs!");
    });
  },
);
