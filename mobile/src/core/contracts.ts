import type { FunctionArgs, FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";
export type Conversation = FunctionReturnType<typeof api.conversations.current>;
export type Message = Conversation["messages"][number];
export type Product = NonNullable<Message["result"]>["options"][number];
export type Garment = FunctionArgs<typeof api.wardrobe.add>["details"];
export type WardrobeItem = FunctionReturnType<typeof api.wardrobe.list>[number];
export type OutfitResult = FunctionReturnType<typeof api.wardrobe.latest>;
export type Preferences = NonNullable<
  FunctionReturnType<typeof api.profiles.get>
>;
export type Style = FunctionReturnType<typeof api.wardrobeMetadata.style>;
export type PhotoDraft = FunctionReturnType<typeof api.wardrobePhoto.analyse>;
