import * as WebBrowser from "expo-web-browser";
import { trustedMerchantUrl } from "../core/links";
export async function openMerchant(url: string) {
  await WebBrowser.openBrowserAsync(trustedMerchantUrl(url));
}
