import type { OtpProvider, ProviderReply } from "../core/otp";
// Loaded only when used: missing development-build native modules become a form error.
export const otpProvider: OtpProvider = {
  async initialize(widgetId, token) {
    const { OTPWidget } = await import("@msg91comm/sendotp-react-native");
    await OTPWidget.initializeWidget(widgetId, token);
  },
  async send(identifier) {
    const { OTPWidget } = await import("@msg91comm/sendotp-react-native");
    return (await OTPWidget.sendOTP({ identifier })) as ProviderReply;
  },
  async verify(reqId, otp) {
    const { OTPWidget } = await import("@msg91comm/sendotp-react-native");
    return (await OTPWidget.verifyOTP({ reqId, otp })) as ProviderReply;
  },
};
