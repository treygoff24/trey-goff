export function formatVisitorMessage(message: string): string {
  const escaped = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<visitor_message>\n${escaped}\n</visitor_message>`
}
