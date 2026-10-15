// No native analytics collection in this foundation; never accept private payloads.
export function track(
  _event: "app_opened" | "merchant_opened" | "login_completed",
) {
  /* intentionally empty */
}
