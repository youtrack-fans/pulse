const REPLY_MARKER_PATTERN = /\s*\[pulse-reply\]:\s*(\d+-\d+)\s*$/;

export function extractReplyMarker(text: string): {text: string; parentCommentId: string | null} {
  const match = text.match(REPLY_MARKER_PATTERN);
  if (!match) {
    return {text, parentCommentId: null};
  }
  return {
    text: text.slice(0, match.index).trimEnd(),
    parentCommentId: match[1],
  };
}

export function appendReplyMarker(text: string, parentCommentId: string): string {
  return `${text.trimEnd()}\n\n[pulse-reply]: ${parentCommentId}`;
}
