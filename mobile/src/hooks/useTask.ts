import { useEffect, useRef, useState } from "react";
import { ConvexError } from "convex/values";
export function errorText(error: unknown) {
  if (error instanceof ConvexError && typeof error.data === "string")
    return error.data;
  if (error instanceof Error) {
    // Convex stack traces may contain request metadata; only show the useful message.
    const server = error.message.match(
      /Uncaught (?:Error|ConvexError): ([^\n]+)/,
    );
    if (server) return server[1];
    if (!error.message.startsWith("[CONVEX") && error.message.length < 240)
      return error.message;
  }
  return "This could not finish. Your input is still here. Check your connection and try again.";
}
export function useTask() {
  const locked = useRef(false),
    mounted = useRef(true);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function run<T>(work: () => Promise<T>, done?: (value: T) => void) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const value = await work();
      if (mounted.current) done?.(value);
    } catch (e) {
      if (mounted.current) setError(errorText(e));
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return { busy, error, run, clearError: () => setError("") };
}
