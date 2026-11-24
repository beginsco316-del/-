import { cpSync, mkdirSync, readdirSync } from "node:fs";
mkdirSync(".photo-functions", { recursive: true });
cpSync("photo-api.mjs", ".photo-functions/photo-api.mjs");
mkdirSync("public", { recursive: true });
for (const name of ["admin", "data", "project-assets", ...readdirSync(".").filter((entry) =>
  /\.(html|css|jpe?g|png)$/i.test(entry) || entry === "CNAME" ||
  ["script.js", "photo-publisher.mjs"].includes(entry))]) {
  cpSync(name, "public/" + name, { recursive: true });
}
