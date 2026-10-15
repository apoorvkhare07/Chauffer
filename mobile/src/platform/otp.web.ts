import { loadOtpWidget, widgetCall } from "../../../app/otpWidget.js";
import type { OtpProvider, ProviderReply } from "../core/otp";

let initialization: Promise<void> | undefined;
let widget: string | undefined;
export function resetOtpWidget() {
  initialization = undefined;
  widget = undefined;
}
export const otpProvider: OtpProvider = {
  initialize(widgetId, token) {
    if (!initialization || widget !== widgetId) {
      widget = widgetId;
      initialization = loadOtpWidget({ widgetId, tokenAuth: token }).catch(
        (error) => {
          initialization = undefined;
          throw error;
        },
      );
    }
    return initialization;
  },
  beforeSend() {
    const providerWindow = window as typeof window & {
      isCaptchaVerified?: () => boolean;
    };
    if (!providerWindow.isCaptchaVerified?.())
      throw new Error("Complete the security check, then press Send code.");
  },
  async send(identifier) {
    return (await widgetCall("sendOtp", identifier)) as ProviderReply;
  },
  async verify(requestId, code) {
    return (await widgetCall("verifyOtp", code, requestId)) as ProviderReply;
  },
};
