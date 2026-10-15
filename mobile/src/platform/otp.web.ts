import type { OtpProvider } from "../core/otp";
const unavailable = async (): Promise<never> => {
  throw new Error(
    "Phone verification needs the installed iOS or Android development build. This browser is for checking screens.",
  );
};
export const otpProvider: OtpProvider = {
  initialize: unavailable,
  send: unavailable,
  verify: unavailable,
};
