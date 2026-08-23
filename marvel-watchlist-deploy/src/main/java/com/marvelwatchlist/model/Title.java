package com.marvelwatchlist.model;

/**
 * Immutable representation of a single MCU movie, series, or special.
 * Order fields are baked in at data-authoring time so the recommended
 * viewing sequence never depends on array position.
 */
public final class Title {

    public enum Type {
        MOVIE("Movie"),
        TV_SHOW("TV Show"),
        SPECIAL("Special");

        public final String label;
        Type(String label) { this.label = label; }
    }

    private final String id;          // stable slug, used as the persistence key
    private final int order;          // recommended watch order, 1-based
    private final String name;
    private final int year;
    private final Type type;
    private final String phase;       // e.g. "Phase 1"
    private final String saga;        // e.g. "The Infinity Saga"
    private final String runtime;     // display string, e.g. "2h 6m" or "6 episodes"
    private final String notes;       // short viewing note
    private final int theme;          // 1-6, drives the placeholder poster gradient

    public Title(String id, int order, String name, int year, Type type, String phase,
                 String saga, String runtime, String notes, int theme) {
        this.id = id;
        this.order = order;
        this.name = name;
        this.year = year;
        this.type = type;
        this.phase = phase;
        this.saga = saga;
        this.runtime = runtime;
        this.notes = notes;
        this.theme = theme;
    }

    public String getId() { return id; }
    public int getOrder() { return order; }
    public String getName() { return name; }
    public int getYear() { return year; }
    public Type getType() { return type; }
    public String getPhase() { return phase; }
    public String getSaga() { return saga; }
    public String getRuntime() { return runtime; }
    public String getNotes() { return notes; }
    public int getTheme() { return theme; }

    /** Renders this title as a JSON object literal. No external JSON lib needed. */
    public String toJson() {
        StringBuilder sb = new StringBuilder(256);
        sb.append('{');
        appendStr(sb, "id", id).append(',');
        sb.append("\"order\":").append(order).append(',');
        appendStr(sb, "name", name).append(',');
        sb.append("\"year\":").append(year).append(',');
        appendStr(sb, "type", type.name()).append(',');
        appendStr(sb, "typeLabel", type.label).append(',');
        appendStr(sb, "phase", phase).append(',');
        appendStr(sb, "saga", saga).append(',');
        appendStr(sb, "runtime", runtime).append(',');
        appendStr(sb, "notes", notes).append(',');
        sb.append("\"theme\":").append(theme);
        sb.append('}');
        return sb.toString();
    }

    private static StringBuilder appendStr(StringBuilder sb, String key, String value) {
        sb.append('"').append(key).append("\":\"").append(escape(value)).append('"');
        return sb;
    }

    public static String escape(String s) {
        if (s == null) return "";
        StringBuilder out = new StringBuilder(s.length() + 8);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': out.append("\\\""); break;
                case '\\': out.append("\\\\"); break;
                case '\n': out.append("\\n"); break;
                case '\r': out.append("\\r"); break;
                case '\t': out.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
            }
        }
        return out.toString();
    }
}
