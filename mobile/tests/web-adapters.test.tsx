/** @jest-environment jsdom */
import { otpProvider, resetOtpWidget } from "../src/platform/otp.web";
import { choosePhoto, discardPhoto } from "../src/platform/photos.web";
const mockLoad = jest.fn(),
  mockWidget = jest.fn(),
  mockJpeg = jest.fn();
jest.mock("../../app/otpWidget.js", () => ({
  loadOtpWidget: (...args: unknown[]) => mockLoad(...args),
  widgetCall: (...args: unknown[]) => mockWidget(...args),
}));
jest.mock("../../app/photoUpload.js", () => ({
  PHOTO_ACCEPT: "image/jpeg",
  jpegPhoto: (...args: unknown[]) => mockJpeg(...args),
}));
beforeEach(() => {
  jest.clearAllMocks();
  resetOtpWidget();
  mockLoad.mockResolvedValue(undefined);
  document.body.innerHTML = "";
});
test("web OTP checks CAPTCHA before sending and preserves provider argument order", async () => {
  const providerWindow = window as typeof window & {
    isCaptchaVerified?: () => boolean;
  };
  providerWindow.isCaptchaVerified = () => false;
  expect(() => otpProvider.beforeSend?.()).toThrow(
    "Complete the security check",
  );
  expect(mockWidget).not.toHaveBeenCalled();
  await otpProvider.initialize("invented-widget", "invented-public-token");
  await otpProvider.initialize("invented-widget", "invented-public-token");
  expect(mockLoad).toHaveBeenCalledTimes(1);
  resetOtpWidget();
  await otpProvider.initialize("invented-widget", "invented-public-token");
  expect(mockLoad).toHaveBeenCalledTimes(2);
  providerWindow.isCaptchaVerified = () => true;
  otpProvider.beforeSend?.();
  await otpProvider.send("invented-identifier");
  await otpProvider.verify("invented-request", "123456");
  expect(mockWidget.mock.calls).toEqual([
    ["sendOtp", "invented-identifier"],
    ["verifyOtp", "123456", "invented-request"],
  ]);
});
test("cancelled browser picker removes its input and never converts a photo", async () => {
  const pending = choosePhoto();
  const input = document.querySelector("input")!;
  input.dispatchEvent(new Event("cancel"));
  expect(await pending).toBeNull();
  expect(document.querySelector("input")).toBeNull();
  expect(mockJpeg).not.toHaveBeenCalled();
});
test("browser photo preparation stays local and discarding revokes its preview", async () => {
  const jpeg = "/9j/" + "A".repeat(100);
  mockJpeg.mockResolvedValue(jpeg);
  Object.defineProperty(globalThis, "URL", {
    configurable: true,
    value: {
      createObjectURL: jest.fn(() => "blob:invented-preview"),
      revokeObjectURL: jest.fn(),
    },
  });
  const pending = choosePhoto();
  const input = document.querySelector("input")!;
  Object.defineProperty(input, "files", {
    value: [new File(["invented"], "test.jpg", { type: "image/jpeg" })],
  });
  input.dispatchEvent(new Event("change"));
  const photo = await pending;
  expect(photo?.jpegBase64).toBe(jpeg);
  expect(document.querySelector("input")).toBeNull();
  expect(mockWidget).not.toHaveBeenCalled();
  await discardPhoto(photo);
  await discardPhoto(photo);
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
});
