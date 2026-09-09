import { rm, mkdir, cp } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const path of ["index.html", "src", "static"])
  await cp(path, `dist/${path}`, { recursive: true });
console.log(
  "Production static site built in dist/ (no server runtime or dependencies).",
);
