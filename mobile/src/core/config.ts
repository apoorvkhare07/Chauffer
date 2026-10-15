export type Environment = "development" | "preview" | "production";
export type RuntimeConfig = {
  environment: Environment;
  url: string;
  namespace: string;
  local: boolean;
};
export function readConfig(input: {
  environment?: string;
  url?: string;
  allowLocal?: string;
}): RuntimeConfig {
  const environment = input.environment;
  if (
    !environment ||
    !["development", "preview", "production"].includes(environment)
  ) {
    throw new Error(
      "Choose development, preview or production in EXPO_PUBLIC_APP_ENV.",
    );
  }
  if (!input.url?.trim())
    throw new Error(
      "Set EXPO_PUBLIC_CONVEX_URL to the agreed development backend, then restart Expo.",
    );
  let url: URL;
  try {
    url = new URL(input.url.trim());
  } catch {
    throw new Error("The Convex backend address is not a valid URL.");
  }
  const local =
    /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(
      url.hostname,
    );
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error(
      "Use only the Convex deployment origin, without credentials or a path.",
    );
  if (
    url.hostname === "rare-chameleon-828.convex.cloud" &&
    environment !== "production"
  )
    throw new Error(
      "Development and preview must not use the production backend.",
    );
  if (local) {
    if (
      environment !== "development" ||
      input.allowLocal !== "true" ||
      !["http:", "https:"].includes(url.protocol)
    )
      throw new Error(
        "Local backends require development mode and EXPO_PUBLIC_ALLOW_LOCAL_BACKEND=true.",
      );
  } else if (
    url.protocol !== "https:" ||
    !/^[a-z0-9-]+\.convex\.cloud$/.test(url.hostname) ||
    url.port
  ) {
    throw new Error("Use an HTTPS Convex .convex.cloud deployment address.");
  }
  return {
    environment: environment as Environment,
    url: url.origin,
    local,
    namespace: `chauffer.${environment}.${url.host.replace(/[^a-z0-9.-]/gi, "_")}`,
  };
}
