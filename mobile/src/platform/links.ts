import * as WebBrowser from "expo-web-browser";
import { trustedMerchantUrl } from "../core/links";
export async function openMerchant(url: string) {
  await WebBrowser.openBrowserAsync(trustedMerchantUrl(url));
}
export async function openEditorial(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !["vogue.in", "www.vogue.in", "vogue.com", "www.vogue.com"].includes(
      url.hostname,
    )
  )
    throw new Error("This editorial link is unavailable.");
  await WebBrowser.openBrowserAsync(url.href);
}
