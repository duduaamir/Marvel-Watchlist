package com.marvelwatchlist.server;

import com.marvelwatchlist.data.MarvelData;
import com.marvelwatchlist.data.ProgressStore;
import com.marvelwatchlist.model.Title;
import com.marvelwatchlist.util.HttpUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;

/**
 * Marvel Watchlist - Command Center.
 *
 * Pure JDK implementation (com.sun.net.httpserver) so the whole project
 * runs with `javac` + `java` and nothing else. Static assets live in
 * ./public, progress/schedule persist to ./data/progress.properties.
 */
public final class Main {

    public static void main(String[] args) throws IOException {
        int port = 8080;
        String portEnv = System.getenv("PORT");
        if (portEnv != null && !portEnv.isBlank()) {
            try { port = Integer.parseInt(portEnv); } catch (NumberFormatException ignored) {}
        }
        if (args.length > 0) {
            try { port = Integer.parseInt(args[0]); } catch (NumberFormatException ignored) {}
        }

        Path baseDir = Path.of("").toAbsolutePath();
        Path publicDir = resolvePublicDir(baseDir);
        Path dataFile = baseDir.resolve("data").resolve("progress.properties");

        ProgressStore store = new ProgressStore(dataFile);
        List<Title> titles = MarvelData.all();

  HttpServer server = HttpServer.create(
    new InetSocketAddress("0.0.0.0", port), 0
);
        server.setExecutor(Executors.newFixedThreadPool(8));

        server.createContext("/api/titles", exchange -> handleTitles(exchange, titles));
        server.createContext("/api/state", exchange -> handleState(exchange, titles, store));
        server.createContext("/api/watch", exchange -> handleWatch(exchange, store));
        server.createContext("/api/schedule/clear", exchange -> handleScheduleClear(exchange, store));
        server.createContext("/api/schedule", exchange -> handleSchedule(exchange, store));
        server.createContext("/api/reset", exchange -> handleReset(exchange, store));
        server.createContext("/", new StaticFileHandler(publicDir));

        server.start();
        System.out.println("SERVER STARTED ON 0.0.0.0:" + port);
        System.out.println("==================================================");
        System.out.println("  MARVEL WATCHLIST COMMAND CENTER");
        System.out.println("  Serving " + titles.size() + " titles");
        System.out.println("  http://localhost:" + port);
        System.out.println("  Progress file: " + dataFile);
        System.out.println("==================================================");
    }

    /** Works whether launched from the project root or from a packaged dir containing public/. */
    private static Path resolvePublicDir(Path baseDir) {
        Path direct = baseDir.resolve("public");
        if (java.nio.file.Files.isDirectory(direct)) return direct;
        Path resources = baseDir.resolve("src/main/resources/public");
        if (java.nio.file.Files.isDirectory(resources)) return resources;
        return direct; // fall back; StaticFileHandler will 404 gracefully via SPA path if missing
    }

    // ---------------------------------------------------------------- routes

    private static void handleTitles(HttpExchange exchange, List<Title> titles) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            HttpUtil.sendError(exchange, 405, "GET only");
            return;
        }
        StringBuilder sb = new StringBuilder(titles.size() * 200);
        sb.append('[');
        for (int i = 0; i < titles.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(titles.get(i).toJson());
        }
        sb.append(']');
        HttpUtil.sendJson(exchange, 200, sb.toString());
    }

    private static void handleState(HttpExchange exchange, List<Title> titles, ProgressStore store) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            HttpUtil.sendError(exchange, 405, "GET only");
            return;
        }
        HttpUtil.sendJson(exchange, 200, buildStateJson(titles, store));
    }

    private static void handleWatch(HttpExchange exchange, ProgressStore store) throws IOException {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            HttpUtil.sendError(exchange, 405, "POST only");
            return;
        }
        Map<String, String> form = HttpUtil.parseForm(HttpUtil.readBody(exchange));
        String id = form.get("id");
        if (id == null || id.isBlank()) {
            HttpUtil.sendError(exchange, 400, "Missing id");
            return;
        }
        boolean watched = "true".equalsIgnoreCase(form.getOrDefault("watched", "true"));
        store.setWatched(id, watched);
        HttpUtil.sendJson(exchange, 200, "{\"ok\":true,\"id\":\"" + Title.escape(id) + "\",\"watched\":" + watched + "}");
    }

    private static void handleSchedule(HttpExchange exchange, ProgressStore store) throws IOException {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            HttpUtil.sendError(exchange, 405, "POST only");
            return;
        }
        Map<String, String> form = HttpUtil.parseForm(HttpUtil.readBody(exchange));
        String id = form.get("id");
        if (id == null || id.isBlank()) {
            HttpUtil.sendError(exchange, 400, "Missing id");
            return;
        }
        store.setSchedule(id, form.get("date"), form.get("time"));
        HttpUtil.sendJson(exchange, 200, "{\"ok\":true}");
    }

    private static void handleScheduleClear(HttpExchange exchange, ProgressStore store) throws IOException {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            HttpUtil.sendError(exchange, 405, "POST only");
            return;
        }
        Map<String, String> form = HttpUtil.parseForm(HttpUtil.readBody(exchange));
        String id = form.get("id");
        if (id == null || id.isBlank()) {
            HttpUtil.sendError(exchange, 400, "Missing id");
            return;
        }
        store.clearSchedule(id);
        HttpUtil.sendJson(exchange, 200, "{\"ok\":true}");
    }

    private static void handleReset(HttpExchange exchange, ProgressStore store) throws IOException {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            HttpUtil.sendError(exchange, 405, "POST only");
            return;
        }
        store.resetAll();
        HttpUtil.sendJson(exchange, 200, "{\"ok\":true}");
    }

    private static String buildStateJson(List<Title> titles, ProgressStore store) {
        Set<String> watched = store.watchedIds();
        Map<String, String[]> schedules = store.allSchedules();

        StringBuilder sb = new StringBuilder(1024);
        sb.append("{\"watched\":[");
        boolean first = true;
        for (String id : watched) {
            if (!first) sb.append(',');
            sb.append('"').append(Title.escape(id)).append('"');
            first = false;
        }
        sb.append("],\"schedule\":{");
        first = true;
        for (Map.Entry<String, String[]> e : schedules.entrySet()) {
            if (!first) sb.append(',');
            String[] dt = e.getValue();
            sb.append('"').append(Title.escape(e.getKey())).append("\":{");
            sb.append("\"date\":\"").append(Title.escape(dt[0])).append('"');
            sb.append(",\"time\":\"").append(Title.escape(dt.length > 1 ? dt[1] : "")).append('"');
            sb.append('}');
            first = false;
        }
        sb.append("},\"totalTitles\":").append(titles.size());
        sb.append('}');
        return sb.toString();
    }
}
