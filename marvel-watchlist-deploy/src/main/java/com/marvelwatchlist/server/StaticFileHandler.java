package com.marvelwatchlist.server;

import com.marvelwatchlist.util.HttpUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.*;

/** Serves static assets from a root directory, defaulting to index.html for unknown paths (SPA-friendly). */
public final class StaticFileHandler implements HttpHandler {

    private final Path root;

    public StaticFileHandler(Path root) {
        this.root = root.normalize();
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String requestPath = exchange.getRequestURI().getPath();
        if (requestPath.equals("/")) requestPath = "/index.html";

        Path resolved = root.resolve("." + requestPath).normalize();

        // Prevent path traversal outside the public root.
        if (!resolved.startsWith(root)) {
            exchange.sendResponseHeaders(403, -1);
            return;
        }

        if (!Files.exists(resolved) || Files.isDirectory(resolved)) {
            // SPA fallback so a refresh on a deep link still works.
            resolved = root.resolve("index.html");
        }

        byte[] bytes = Files.readAllBytes(resolved);
        exchange.getResponseHeaders().set("Content-Type", HttpUtil.contentTypeFor(resolved.toString()));
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
