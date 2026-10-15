import { load } from "@expo/env";
import { spawn, type ChildProcess } from "node:child_process";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { readConfig } from "../src/core/config";

// Starts existing local data/functions only. Never deploys or creates a database.
process.env.NODE_ENV ||= "development";
load(process.cwd());
const children: ChildProcess[] = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
async function instance(url: string) {
  try {
    const response = await fetch(`${url}/instance_name`, {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}
async function main() {
  const config = readConfig({
    environment: process.env.EXPO_PUBLIC_APP_ENV,
    url: process.env.EXPO_PUBLIC_CONVEX_URL,
    allowLocal: process.env.EXPO_PUBLIC_ALLOW_LOCAL_BACKEND,
  });
  if (
    config.environment !== "development" ||
    !config.local ||
    new URL(config.url).hostname !== "127.0.0.1"
  )
    throw new Error(
      "dev:local requires the explicit development backend at 127.0.0.1.",
    );
  const statePath = process.env.CHAUFFER_LOCAL_STATE_DIR;
  if (!statePath)
    throw new Error(
      "Set CHAUFFER_LOCAL_STATE_DIR in ignored mobile/.env.local to the existing Chauffer local state folder. No new database was created.",
    );
  const state = resolve(statePath);
  const saved = JSON.parse(
    readFileSync(join(state, "config.json"), "utf8"),
  ) as {
    deploymentName: string;
    backendVersion: string;
    instanceSecret: string;
    ports: { cloud: number; site: number };
  };
  if (
    saved.deploymentName !== "local-apoorv_khare-chauffeur" ||
    config.url !== `http://127.0.0.1:${saved.ports.cloud}`
  )
    throw new Error(
      "The local configuration does not match the Chauffer development database.",
    );
  if (
    !existsSync(join(state, "convex_local_backend.sqlite3")) ||
    !saved.instanceSecret ||
    !/^[a-zA-Z0-9._-]+$/.test(saved.backendVersion)
  )
    throw new Error(
      "The existing local database or backend configuration is incomplete.",
    );
  const running = await instance(config.url);
  if (running && running !== saved.deploymentName)
    throw new Error("Another backend is using the selected port.");
  if (!running) {
    const binary = join(
      homedir(),
      ".cache/convex/binaries",
      saved.backendVersion,
      "convex-local-backend",
    );
    if (!existsSync(binary))
      throw new Error(
        "The pinned local Convex binary is missing. Ask the backend owner to restore the local deployment.",
      );
    mkdirSync(".expo", { recursive: true });
    const log = createWriteStream(".expo/local-backend.log", {
      flags: "a",
      mode: 0o600,
    });
    const backend = spawn(
      binary,
      [
        "--interface",
        "127.0.0.1",
        "--port",
        String(saved.ports.cloud),
        "--site-proxy-port",
        String(saved.ports.site),
        "--instance-name",
        saved.deploymentName,
        "--instance-secret",
        saved.instanceSecret,
        "--local-storage",
        join(state, "convex_local_storage"),
        join(state, "convex_local_backend.sqlite3"),
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    children.push(backend);
    backend.stdout?.pipe(log);
    backend.stderr?.pipe(log);
    backend.on("error", () => {
      process.stderr.write(
        "The local backend could not start. Check .expo/local-backend.log locally.\n",
      );
      stop(1);
    });
    backend.on("exit", () => {
      if (!stopping) {
        process.stderr.write("The local backend stopped.\n");
        stop(1);
      }
    });
    let ready = false;
    for (let i = 0; i < 50 && !stopping; i++) {
      if ((await instance(config.url)) === saved.deploymentName) {
        ready = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!ready)
      throw new Error(
        "Local backend did not become ready. No source was deployed.",
      );
  }
  process.stdout.write(
    "Using existing local Chauffer data and functions. No backend deployment.\n",
  );
  const expo = spawn(
    process.execPath,
    [
      // Native Expo manifests use 127.0.0.1; bind localhost to IPv4 as well.
      "--dns-result-order=ipv4first",
      join(process.cwd(), "node_modules/expo/bin/cli"),
      "start",
      "--web",
      "--host",
      "localhost",
      "--port",
      "8083",
    ],
    { stdio: "inherit" },
  );
  children.push(expo);
  expo.on("error", () => {
    process.stderr.write("Expo could not start.\n");
    stop(1);
  });
  expo.on("exit", (code) => stop(code ?? 0));
}
main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Local setup failed."}\n`,
  );
  stop(1);
});
