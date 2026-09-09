import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve(process.argv[2] || ".");
const types = {
  ".ttf": "font/ttf",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const path = resolve(
      root,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    const relative = path.slice(root.length + 1);
    if (
      !path.startsWith(root + sep) ||
      !/^(index\.html|(?:src|static)\/[^.][\w./-]+)$/.test(relative) ||
      relative.split("/").some((p) => p.startsWith(".")) ||
      !["GET", "HEAD"].includes(req.method)
    ) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const content = await readFile(path);
    res.writeHead(200, {
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(Number(process.env.PORT || 4173), "127.0.0.1", () =>
  console.log(`Local: http://localhost:${server.address().port}`),
);
