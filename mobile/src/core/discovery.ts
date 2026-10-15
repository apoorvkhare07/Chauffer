import type { Conversation } from "./contracts";
export function discoveryView(current: Conversation) {
  const lastUser = current.messages.findLastIndex(
    (message) => message.role === "user",
  );
  const latest = current.messages.findLast((message) => message.result);
  const fresh =
    !!latest &&
    (current.discoveryStatus === "satisfied" ||
      current.messages.indexOf(latest) > lastUser) &&
    !current.pending;
  return {
    latest,
    fresh,
    replies: current.messages
      .slice(lastUser + 1)
      .filter((message) => message.role === "assistant"),
    canAccept:
      fresh &&
      !!latest.result?.options.length &&
      current.discoveryStatus !== "satisfied",
    choices:
      current.discoveryQuestion?.choices.map((choice) => ({
        label: choice.label,
        text: choice.text,
      })) ?? [],
  };
}
export function requestText(text: string, limit = 1000) {
  const value = text.trim();
  if (!value || value.length > limit)
    throw new Error(
      `Use between 1 and ${limit.toLocaleString("en-IN")} characters.`,
    );
  return value;
}
