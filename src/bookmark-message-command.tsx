import {Button, call, createElement, Embed, Field, Message, MessageCommandHandler, Row, useButton} from "slshx";
import {
    APIDMChannel, RESTGetAPIGuildResult,
    RESTPostAPIChannelMessageJSONBody,
    RESTPostAPICurrentUserCreateDMChannelJSONBody
} from "discord-api-types/v9";

export function bookmarkMessageCommand(): MessageCommandHandler<Env> {
    const buttonId = useButton(async function(interaction, env: Env, ctx) {
        try {
            await call("DELETE", `/channels/${interaction.message.channel_id}/messages/${interaction.message.id}`, {}, {bot: env.BOT_TOKEN})
        } catch (err: any) {
            return <Message ephemeral>
                Something went wrong! (5.({err.code}))
            </Message>;
        }

        return () => {};
    });

    return async (interaction, env, ctx, message) => {
        if(!interaction.member) {
            return <Message ephemeral>
                Something went wrong! (Code 2)
            </Message>;
        }

        const dmCreationParams: RESTPostAPICurrentUserCreateDMChannelJSONBody = {recipient_id: interaction.member.user.id}
        let dmCreationResult: APIDMChannel;

        try {
            dmCreationResult = await call("POST", "/users/@me/channels", dmCreationParams, {bot: env.BOT_TOKEN})
        } catch (err: any) {
            return <Message ephemeral>
                Something went wrong! (3.({err.code}))
            </Message>;
        }

        let serverName: string;
        try {
            const res: RESTGetAPIGuildResult = (await call("GET", `/guilds/${interaction.guild_id}`, null, {bot: env.BOT_TOKEN}))
            serverName = res.name;
        } catch (err) {
            serverName = "Unknown server"
        }

        const author = `${message.author.username}#${message.author.discriminator} (${message.author.id})`
        const iconUrl = message.author.avatar == null ? undefined : `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`
        const title = `On ${serverName} at <t:${Math.floor(new Date(message.timestamp).getTime() / 1000)}>`

        const attachs = message.attachments.map(a => `[${a.filename}](${a.url})`).join("\n")

        const dmMessageParams: RESTPostAPIChannelMessageJSONBody = (
            <Message>
                <Embed author={{ name: author, iconUrl: iconUrl }} color={0xd83c3e} title={title}>
                    {message.content}
                    <Field name="Message Link">
                        https://discordapp.com/channels/{interaction.guild_id}/{message.channel_id}/{message.id}
                    </Field>
                </Embed>
                <Row>
                    <Button id={buttonId} danger>Delete bookmark</Button>
                </Row>
            </Message>
        )

        if(message.attachments.length > 0) {
            dmMessageParams.embeds?.at(0)?.fields?.unshift(<Field name="Attachments">{attachs}</Field>);
        }

        try {
            await call("POST", `/channels/${dmCreationResult.id}/messages`, dmMessageParams, {bot: env.BOT_TOKEN})
        } catch (err: any) {
            if (err.code === 50007 || err.code === 403) {
                return <Message ephemeral>
                    It seems like I can't send you DMs! Check your privacy settings for this server or open up a DM with me manually.
                </Message>;
            }

            return <Message ephemeral>
                Something went wrong! (4.{err.code})
            </Message>;
        }

        return <Message ephemeral>
            The message was successfully bookmarked into your DMs!
        </Message>;
    }
}
