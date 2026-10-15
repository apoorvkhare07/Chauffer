export type ProviderReply = Record<string, unknown>;
export interface OtpProvider {
  beforeSend?(): void;
  initialize(widgetId: string, token: string): Promise<void>;
  send(identifier: string): Promise<ProviderReply>;
  verify(requestId: string, code: string): Promise<ProviderReply>;
}
export function normalizePhone(phone: string) {
  const value = phone.replace(/\D/g, "");
  if (!/^[6-9]\d{9}$/.test(value))
    throw new Error("Enter a valid 10-digit Indian mobile number.");
  return value;
}
export function providerValue(reply: ProviderReply, kind: "request" | "token") {
  if (reply.type !== "success")
    throw new Error(
      "Phone verification did not go through. Check the code or request a new one.",
    );
  const value =
    kind === "request"
      ? (reply.reqId ?? reply.requestId ?? reply.message)
      : (reply["access-token"] ?? reply.message);
  if (
    typeof value !== "string" ||
    !value ||
    value.length > (kind === "request" ? 200 : 8192)
  )
    throw new Error(
      "The phone provider returned an incomplete response. Request a new code.",
    );
  return value;
}
// Kept separate from native APIs so the proof chain can be tested without SMS.
export async function finishPhoneSignIn(
  id: string,
  token: string,
  backendVerify: (id: string, token: string) => Promise<string>,
  signIn: (proof: { challenge: string; secret: string }) => Promise<unknown>,
  isActive = () => true,
) {
  if (!isActive()) return;
  const secret = await backendVerify(id, token);
  if (!isActive()) return;
  if (!secret)
    throw new Error("Phone verification expired. Request a new code.");
  await signIn({ challenge: id, secret });
}
