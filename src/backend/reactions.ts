export const SUPPORTED_REACTIONS: readonly string[] = ['❤️'];

export function isValidReaction(reaction: unknown): reaction is string {
  return typeof reaction === 'string' && SUPPORTED_REACTIONS.includes(reaction);
}
