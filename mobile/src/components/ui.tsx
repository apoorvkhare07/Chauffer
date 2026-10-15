import React, { type PropsWithChildren } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";
export const colors = {
  blue: "#2950B8",
  ink: "#242a38",
  muted: "#646e80",
  canvas: "#f7f8fa",
  white: "#ffffff",
  soft: "#e9eefa",
  line: "#dfe4ef",
  error: "#a12d3b",
};
export function Copy({ style, ...props }: TextProps) {
  return <Text {...props} style={[s.copy, style]} />;
}
export function Title({ children }: PropsWithChildren) {
  return (
    <Copy accessibilityRole="header" style={s.title}>
      {children}
    </Copy>
  );
}
export function Heading({ children }: PropsWithChildren) {
  return (
    <Copy accessibilityRole="header" style={s.heading}>
      {children}
    </Copy>
  );
}
export function Muted({ children }: PropsWithChildren) {
  return <Copy style={s.muted}>{children}</Copy>;
}
export function Brand() {
  return (
    <View accessibilityLabel="chauffer" style={s.brand}>
      <Svg width={34} height={34} viewBox="0 0 44 44" fill="none">
        <Path
          d="M12 16H32L35 38H9L12 16ZM16 16V12A6 6 0 0 1 28 12V16"
          stroke={colors.blue}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M22 22V34M16.804 25L27.196 31M16.804 31L27.196 25"
          stroke={colors.blue}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
      <Copy style={s.wordmark}>
        chauffer<Copy style={[s.wordmark, { color: colors.blue }]}>.</Copy>
      </Copy>
    </View>
  );
}
export function Screen({ children }: PropsWithChildren) {
  return (
    <View style={s.fill}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        contentContainerStyle={s.screen}
        contentInsetAdjustmentBehavior="automatic"
      >
        {children}
      </ScrollView>
    </View>
  );
}
export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Row({ children }: PropsWithChildren) {
  return <View style={s.row}>{children}</View>;
}
export function Button({
  label,
  onPress,
  disabled,
  secondary,
  danger,
  busy,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        danger && { backgroundColor: "#fff0f1" },
        (disabled || busy) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {busy && (
        <ActivityIndicator color={secondary ? colors.blue : colors.white} />
      )}
      <Copy
        style={[
          s.buttonText,
          secondary && { color: colors.blue },
          danger && { color: colors.error },
        ]}
      >
        {label}
      </Copy>
    </Pressable>
  );
}
export function Chip({
  label,
  onPress,
  selected,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityState={{ selected, disabled }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={[
        s.chip,
        selected && s.chipSelected,
        disabled && { opacity: 0.55 },
      ]}
    >
      <Copy style={[s.chipText, selected && { color: colors.white }]}>
        {label}
      </Copy>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={s.field}>
      <Copy style={s.label}>{label}</Copy>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 100, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Notice({
  children,
  error = false,
}: PropsWithChildren<{ error?: boolean }>) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[s.notice, error && { backgroundColor: "#fff0f1" }]}
    >
      <Copy style={error ? { color: colors.error } : undefined}>
        {children}
      </Copy>
    </View>
  );
}
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={s.loading}>
      <ActivityIndicator color={colors.blue} />
      <Muted>{label}</Muted>
    </View>
  );
}
export function Empty({
  title,
  text,
  children,
}: PropsWithChildren<{ title: string; text: string }>) {
  return (
    <Card>
      <Heading>{title}</Heading>
      <Muted>{text}</Muted>
      {children}
    </Card>
  );
}
export const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.canvas },
  screen: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
    flexGrow: 1,
  },
  copy: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.2,
  },
  heading: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  brand: { flexDirection: "row", alignItems: "center", gap: 7 },
  wordmark: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -1,
  },
  card: {
    backgroundColor: colors.white,
    padding: 18,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  button: {
    minHeight: 48,
    backgroundColor: colors.blue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondary: { backgroundColor: colors.soft },
  buttonText: { color: colors.white, fontFamily: "Inter_600SemiBold" },
  chip: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.blue, borderColor: colors.blue },
  chipText: { fontSize: 14, lineHeight: 20 },
  field: { gap: 7 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 21 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 13,
    minHeight: 50,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
    color: colors.ink,
  },
  notice: { borderRadius: 15, padding: 15, backgroundColor: colors.soft },
  loading: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
});
