import { createServer } from "node:http";
import { URL } from "node:url";

import {
  getBookPayload,
  getGraphPayload,
  getInsightsPayload,
  getSearchPayload,
  getSourceAtlasEntryPayload,
  getSourceAtlasPayload,
} from "@/server/payloads";

const port = Number(process.env.CULTURAL_VEIN_BACKEND_PORT ?? 4318);

function sendJson(
  response: import("node:http").ServerResponse,
  statusCode: number,
  payload: unknown,
) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
  });
  response.end(JSON.stringify(payload));
}

const server = createServer((request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: "Missing request url" });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
  const pathname = url.pathname;

  if (pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "cultural-vein-backend",
      routes: [
        "/graph",
        "/books/:slug",
        "/insights",
        "/source-atlas",
        "/source-atlas/:id",
        "/search?q=关键词",
      ],
    });
    return;
  }

  if (pathname === "/graph") {
    sendJson(response, 200, getGraphPayload());
    return;
  }

  if (pathname === "/insights") {
    sendJson(response, 200, getInsightsPayload());
    return;
  }

  if (pathname === "/source-atlas") {
    const limitValue = url.searchParams.get("limit");
    const limit = limitValue ? Number(limitValue) : null;

    sendJson(
      response,
      200,
      getSourceAtlasPayload({
        q: url.searchParams.get("q") ?? undefined,
        era: url.searchParams.get("era"),
        theme: url.searchParams.get("theme"),
        limit: Number.isFinite(limit) ? limit : null,
      }),
    );
    return;
  }

  const matchedSourceAtlas = pathname.match(/^\/source-atlas\/([^/]+)$/);
  if (matchedSourceAtlas) {
    const payload = getSourceAtlasEntryPayload(decodeURIComponent(matchedSourceAtlas[1] ?? ""));

    if (!payload) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    sendJson(response, 200, payload);
    return;
  }

  if (pathname === "/search") {
    sendJson(response, 200, getSearchPayload(url.searchParams.get("q") ?? ""));
    return;
  }

  const matchedBook = pathname.match(/^\/books\/([^/]+)$/);
  if (matchedBook) {
    const payload = getBookPayload(decodeURIComponent(matchedBook[1] ?? ""));

    if (!payload) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    sendJson(response, 200, payload);
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`cultural-vein backend listening on http://localhost:${port}`);
});
