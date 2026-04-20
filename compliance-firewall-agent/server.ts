/**
 * Hound Shield Custom Server — WebSocket + Next.js
 *
 * This server extends the standard Next.js standalone server with WebSocket
 * support for persistent, low-latency compliance gateway connections.
 *
 * Architecture:
 *   - HTTP requests → Next.js request handler (all existing API routes work as-is)
 *   - WebSocket upgrades on /ws/gateway → Hound Shield WebSocket handler
 *   - WebSocket ping/pong heartbeat for connection health
 *
 * Usage:
 *   NODE_ENV=production node server.ts
 *   # or for development:
 *   npx tsx server.ts
 *
 * This file is only needed when you want WebSocket support. The standard
 * `next start` command works for SSE-only deployments.
 */

import { createServer, type IncomingMessage } from "http";
import { parse } from "node:url";
import next from "next";
import { WebSocketServer } from "ws";
import { handleWebSocketConnection } from "./lib/gateway/ws-handler";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "0.0.0.0";
const port = parseInt(process.env.PORT ?? "3000", 10);

// ---------------------------------------------------------------------------
// Initialize Next.js
// ---------------------------------------------------------------------------

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.prepare().then(() => {
  // Create the HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  // Create the WebSocket server — attach to the same HTTP server
  const wss = new WebSocketServer({
    server,
    path: "/ws/gateway",
    // Per-message compression for bandwidth savings on token streams
    perMessageDeflate: {
      zlibDeflateOptions: { chunkSize: 1024, memLevel: 7, level: 3 },
      zlibInflateOptions: { chunkSize: 10 * 1024 },
      threshold: 128, // Only compress messages > 128 bytes
    },
    // Maximum payload size: 1MB (same as HTTP body limit)
    maxPayload: 1_048_576,
  });

  // Track active connections for metrics
  let activeConnections = 0;

  wss.on("connection", (ws, req: IncomingMessage) => {
    activeConnections++;
    console.log(
      `[ws] New connection (active: ${activeConnections}, path: ${req.url})`
    );

    handleWebSocketConnection(ws, req);

    ws.on("close", () => {
      activeConnections--;
      console.log(`[ws] Connection closed (active: ${activeConnections})`);
    });
  });

  // Handle upgrade requests — this is what enables WebSocket on the same port
  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url ?? "/", true);

    if (pathname === "/ws/gateway") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      // Let Next.js handle other upgrade requests (e.g., HMR in dev mode)
      if (!dev) {
        socket.destroy();
      }
    }
  });

  // Start listening
  server.listen(port, hostname, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    KAELUS AI Compliance Gateway                           ║
║                                                              ║
║   HTTP  → http://${hostname}:${port}                              ║
║   WS    → ws://${hostname}:${port}/ws/gateway                     ║
║   Docs  → http://${hostname}:${port}/docs                         ║
║                                                              ║
║   Mode: ${dev ? "development" : "production "}                                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n[server] Received ${signal}. Shutting down gracefully...`);

    // Close WebSocket connections first
    wss.clients.forEach((client) => {
      client.close(1001, "Server shutting down");
    });

    wss.close(() => {
      console.log("[server] WebSocket server closed.");
      server.close(() => {
        console.log("[server] HTTP server closed.");
        process.exit(0);
      });
    });

    // Force exit after 10 seconds if graceful shutdown stalls
    setTimeout(() => {
      console.error("[server] Forced shutdown after timeout.");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
});
