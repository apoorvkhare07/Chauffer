// All people, products and photos here are invented. No provider or backend call.
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { getFunctionName } from "convex/server";
import { api } from "../../convex/_generated/api";
import Discover from "../src/app/(tabs)/index";
import WardrobeEdit from "../src/app/wardrobe-edit";
import SignIn from "../src/app/sign-in";
import Outfits from "../src/app/outfits";
import { createStorage } from "../src/platform/storage";
import type { Conversation } from "../src/core/contracts";

let mockAuthenticated = true;
const mockCalls = jest.fn(),
  mockSignIn = jest.fn(),
  mockRoute = jest.fn(),
  mockPick = jest.fn();
const mockVerifyOtp = jest.fn(),
  mockQueries: Record<string, unknown> = {};
const mockStorage = new Map<string, string>();
jest.mock("convex/react", () => ({
  useConvexAuth: () => ({
    isAuthenticated: mockAuthenticated,
    isLoading: false,
  }),
  useQuery: (fn: Parameters<typeof getFunctionName>[0], args: unknown) =>
    args === "skip"
      ? undefined
      : mockQueries[require("convex/server").getFunctionName(fn)],
  useMutation: (fn: Parameters<typeof getFunctionName>[0]) => (args: unknown) =>
    mockCalls(require("convex/server").getFunctionName(fn), args),
  useAction: (fn: Parameters<typeof getFunctionName>[0]) => (args: unknown) =>
    mockCalls(require("convex/server").getFunctionName(fn), args),
}));
jest.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: mockSignIn }),
}));
jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockRoute(...args),
    replace: (...args: unknown[]) => mockRoute(...args),
    back: (...args: unknown[]) => mockRoute(...args),
  },
  useLocalSearchParams: () => ({}),
}));
jest.mock("../src/providers/Backend", () => ({
  useBackend: () => ({ connected: true }),
  PrivateScreen: ({ children }: React.PropsWithChildren) => children,
  ConfigNotice: () => null,
  ConnectionNotice: () => null,
  deviceStorage: {
    getItem: async (key: string) => mockStorage.get(key),
    setItem: async (key: string, value: string) => {
      mockStorage.set(key, value);
    },
    removeItem: async (key: string) => {
      mockStorage.delete(key);
    },
  },
}));
jest.mock("../src/platform/photos", () => ({
  choosePhoto: (...args: unknown[]) => mockPick(...args),
  discardPhoto: jest.fn(),
  cleanupPhotos: jest.fn(),
}));
jest.mock("../src/platform/otp", () => ({
  otpProvider: {
    initialize: jest.fn(),
    send: async () => ({ type: "success", message: "invented-request" }),
    verify: (...args: unknown[]) => mockVerifyOtp(...args),
  },
}));
jest.mock("expo-secure-store", () => {
  const values = new Map();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
    getItemAsync: jest.fn(async (key) => values.get(key) ?? null),
    setItemAsync: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      values.delete(key);
    }),
  };
});
beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticated = true;
  mockStorage.clear();
  Object.keys(mockQueries).forEach((key) => delete mockQueries[key]);
  mockCalls.mockResolvedValue(null);
  mockSignIn.mockResolvedValue({ signingIn: true });
  mockQueries["savedProducts:list"] = [];
  mockQueries["wardrobe:list"] = [];
});
const product = {
  title: "Invented blue jeans",
  url: "https://www.myntra.com/jeans/invented",
  price: 1999,
  colour: "blue",
  fabric: "unknown",
  observedAt: 1000,
};
function conversation(): Conversation {
  return {
    requirements: { category: "jeans", size: "32", budget: 3000 },
    discoveryStatus: "refining",
    aiEnabled: true,
    pending: false,
    pendingPhase: "idle",
    discoveryQuestion: {
      field: "colour",
      question: "Which colour works for you?",
      choices: [
        {
          label: "Black",
          value: "black",
          text: "Black jeans, keep waist 32 and ₹3,000",
        },
      ],
    },
    messages: [
      {
        id: "invented-message",
        role: "assistant",
        text: "Fictional options",
        result: { options: [product], stores: [], failed: false },
      },
    ],
  };
}

test("discovery sends exact choice once, marks previous picks during waiting, and cancels explicitly", async () => {
  const current = conversation();
  mockQueries["conversations:current"] = current;
  const view = await render(<Discover />);
  await fireEvent.press(screen.getByRole("button", { name: "Black" }));
  expect(mockCalls).toHaveBeenCalledWith("conversations:post", {
    text: "Black jeans, keep waist 32 and ₹3,000",
  });
  mockQueries["conversations:current"] = { ...current, pending: true };
  await view.rerender(<Discover />);
  expect(screen.getByText("Previous picks")).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "These work for me" }),
  ).toBeNull();
  await fireEvent.press(
    screen.getByRole("button", { name: "Stop this request" }),
  );
  expect(mockCalls).toHaveBeenCalledWith("conversations:cancel", {});
  expect(
    mockCalls.mock.calls.filter(([name]) => name === "conversations:post"),
  ).toHaveLength(1);
});
test("a failed send keeps the typed request and never automatically resubmits", async () => {
  mockQueries["conversations:current"] = conversation();
  mockCalls.mockRejectedValue(new Error("Connection lost"));
  const view = await render(<Discover />);
  await fireEvent.changeText(
    screen.getByLabelText("What do you have in mind?"),
    "नीली जीन्स, same budget",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Send request" }));
  expect(screen.getByText("Connection lost")).toBeTruthy();
  expect(screen.getByDisplayValue("नीली जीन्स, same budget")).toBeTruthy();
  await view.rerender(<Discover />);
  expect(mockCalls).toHaveBeenCalledTimes(1);
});
test("save uses actual message ID and URL; it does not accept the shortlist", async () => {
  mockQueries["conversations:current"] = conversation();
  await render(<Discover />);
  await fireEvent.press(screen.getByRole("button", { name: "Save" }));
  expect(mockCalls).toHaveBeenCalledWith("savedProducts:save", {
    messageId: "invented-message",
    url: product.url,
  });
  expect(mockCalls).not.toHaveBeenCalledWith(
    "conversations:post",
    expect.anything(),
  );
});
test("photo selection alone cannot upload; consent, analysis and corrected confirmation are separate", async () => {
  mockPick.mockResolvedValue({
    uri: "file:///invented.jpg",
    jpegBase64: "/9j/AAAA",
    bytes: 6,
  });
  mockCalls.mockImplementation(async (name) =>
    name === "wardrobePhoto:analyse"
      ? {
          id: "invented-draft",
          analysis: {
            details: {
              name: "AI shoes",
              category: "shoes",
              colour: "black",
              attributes: { heel: "flat" },
            },
            uncertainties: ["Material uncertain"],
            brandEvidence: "No label visible",
          },
        }
      : "invented-piece",
  );
  await render(<WardrobeEdit />);
  await fireEvent.press(screen.getByRole("button", { name: "Choose photo" }));
  expect(mockCalls).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "Read clothing details" }),
  ).toBeDisabled();
  await fireEvent(screen.getByRole("switch"), "valueChange", true);
  await fireEvent.press(
    screen.getByRole("button", { name: "Read clothing details" }),
  );
  expect(mockCalls).toHaveBeenCalledWith("wardrobePhoto:analyse", {
    jpegBase64: "/9j/AAAA",
  });
  await fireEvent.press(screen.getByRole("button", { name: "Top / shirt" }));
  expect(screen.queryByLabelText("Heel / sole")).toBeNull();
  await fireEvent.changeText(screen.getByLabelText("Colour"), "blue");
  await fireEvent.press(
    screen.getByRole("button", { name: "Confirm & add to wardrobe" }),
  );
  expect(mockCalls).toHaveBeenCalledWith("wardrobeMetadata:confirm", {
    id: "invented-draft",
    details: expect.objectContaining({
      category: "top",
      colour: "blue",
      attributes: {},
    }),
  });
  await waitFor(() => expect(mockRoute).toHaveBeenCalledWith("/wardrobe"));
});
test("denied camera has recovery and makes no upload", async () => {
  mockPick.mockRejectedValue(
    new Error("Camera access is off. Choose from your photos instead."),
  );
  await render(<WardrobeEdit />);
  await fireEvent.press(screen.getByRole("button", { name: "Take photo" }));
  expect(screen.getByText(/Camera access is off/)).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Enter details myself" }),
  ).toBeTruthy();
  expect(mockCalls).not.toHaveBeenCalled();
});
test("wrong OTP and rejected server proof never create an authenticated session", async () => {
  mockAuthenticated = false;
  mockCalls.mockImplementation(async (name) => {
    if (name === "otp:beginWidget")
      return {
        id: "invented-challenge",
        widgetId: "public-widget",
        tokenAuth: "public-widget-token",
      };
    if (name === "otp:verifyWidget") throw new Error("Verification expired");
    return null;
  });
  mockVerifyOtp.mockResolvedValue({ type: "error", message: "Incorrect OTP" });
  await render(<SignIn />);
  await fireEvent.changeText(
    screen.getByLabelText("Mobile number (+91)"),
    "9999900000",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Send code" }));
  await fireEvent.changeText(screen.getByLabelText("SMS code"), "123456");
  await fireEvent.press(
    screen.getByRole("button", { name: "Verify and continue" }),
  );
  expect(
    screen.getByText(/Phone verification did not go through/),
  ).toBeTruthy();
  expect(mockSignIn).not.toHaveBeenCalled();
  mockVerifyOtp.mockResolvedValue({
    type: "success",
    "access-token": "invented-proof",
  });
  await fireEvent.press(
    screen.getByRole("button", { name: "Verify and continue" }),
  );
  expect(screen.getByText("Verification expired")).toBeTruthy();
  expect(mockSignIn).not.toHaveBeenCalled();
  expect(mockCalls).toHaveBeenCalledWith("otp:verifyWidget", {
    id: "invented-challenge",
    token: "invented-proof",
  });
});
test("stale wardrobe results hide all outfits and advice", async () => {
  mockQueries["wardrobe:latest"] = {
    aiEnabled: true,
    changed: true,
    state: "ready",
    note: "Old note",
    outfits: [{ title: "Stale outfit", reason: "Stale reason", itemIds: [] }],
  };
  await render(<Outfits />);
  expect(screen.getByText(/Ask for fresh outfits/)).toBeTruthy();
  expect(screen.queryByText("Stale outfit")).toBeNull();
  expect(screen.queryByText("Old note")).toBeNull();
});
test("secure adapter restores tokens across instances, separates deployments, and removes on sign-out", async () => {
  const storage = createStorage("development-a"),
    reopened = createStorage("development-a"),
    other = createStorage("preview-b");
  await storage.setItem("refresh-token", "invented-token");
  expect(await reopened.getItem("refresh-token")).toBe("invented-token");
  expect(await other.getItem("refresh-token")).toBeNull();
  await reopened.removeItem("refresh-token");
  expect(await storage.getItem("refresh-token")).toBeNull();
  await waitFor(() =>
    expect(getFunctionName(api.conversations.post)).toBe("conversations:post"),
  );
});
