// Builds n8n-mcp.mcpb, the one-click Claude Desktop extension.
// The extension ships its production dependencies, so they are installed in a
// staging folder to keep dev dependencies (TypeScript, Vitest) out of it.
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const staging = join(root, "build", "mcpb");
const run = (command, cwd = root) => execSync(command, { cwd, stdio: "inherit" });

run("npm run build");
rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });
for (const file of ["manifest.json", "package.json", "package-lock.json", ".mcpbignore", "dist"]) {
  cpSync(join(root, file), join(staging, file), { recursive: true });
}
run("npm ci --omit=dev --no-audit --no-fund", staging);
run(`npx -y @anthropic-ai/mcpb@2 pack "${staging}" "${join(root, "n8n-mcp.mcpb")}"`);
