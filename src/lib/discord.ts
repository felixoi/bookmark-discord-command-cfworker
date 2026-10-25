// JSON error codes: https://discord.com/developers/docs/topics/opcodes-and-status-codes#json
export const CANNOT_SEND_MESSAGES_TO_USER = 50007;

/** Reads the JSON error code from a failed Discord API response, falling back to the HTTP status. */
export async function errorCode(response: { status: number; json(): Promise<unknown> }): Promise<number> {
  const body = await response.json().catch(() => null) as { code?: number } | null;
  return body?.code ?? response.status;
}
