package com.marvelwatchlist.data;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Tracks which titles the user has watched and any scheduled watch
 * sessions. Backed by a flat java.util.Properties file so the whole
 * thing works with zero external dependencies and survives restarts.
 *
 * Key layout in progress.properties:
 *   watched.<id>=true
 *   schedule.<id>.date=2026-01-01
 *   schedule.<id>.time=19:30            (optional)
 */
public final class ProgressStore {

    private final Path file;
    private final Properties props = new Properties();
    private final ReentrantLock lock = new ReentrantLock();

    public ProgressStore(Path file) {
        this.file = file;
        load();
    }

    private void load() {
        lock.lock();
        try {
            if (Files.exists(file)) {
                try (Reader r = new InputStreamReader(Files.newInputStream(file), StandardCharsets.UTF_8)) {
                    props.load(r);
                }
            } else {
                Files.createDirectories(file.getParent());
            }
        } catch (IOException e) {
            System.err.println("[ProgressStore] Could not load " + file + ": " + e.getMessage());
        } finally {
            lock.unlock();
        }
    }

    private void save() {
        lock.lock();
        try {
            Files.createDirectories(file.getParent());
            try (Writer w = new OutputStreamWriter(Files.newOutputStream(file), StandardCharsets.UTF_8)) {
                props.store(w, "Marvel Watchlist - watch progress and schedule. Safe to back up, edit, or delete.");
            }
        } catch (IOException e) {
            System.err.println("[ProgressStore] Could not save " + file + ": " + e.getMessage());
        } finally {
            lock.unlock();
        }
    }

    public boolean isWatched(String id) {
        lock.lock();
        try {
            return "true".equals(props.getProperty("watched." + id));
        } finally {
            lock.unlock();
        }
    }

    public void setWatched(String id, boolean watched) {
        lock.lock();
        try {
            if (watched) {
                props.setProperty("watched." + id, "true");
            } else {
                props.remove("watched." + id);
            }
            save();
        } finally {
            lock.unlock();
        }
    }

    public Set<String> watchedIds() {
        lock.lock();
        try {
            Set<String> out = new HashSet<>();
            for (String key : props.stringPropertyNames()) {
                if (key.startsWith("watched.") && "true".equals(props.getProperty(key))) {
                    out.add(key.substring("watched.".length()));
                }
            }
            return out;
        } finally {
            lock.unlock();
        }
    }

    /** date may be null/blank to clear; time may be null/blank for an all-day plan. */
    public void setSchedule(String id, String date, String time) {
        lock.lock();
        try {
            if (date == null || date.isBlank()) {
                props.remove("schedule." + id + ".date");
                props.remove("schedule." + id + ".time");
            } else {
                props.setProperty("schedule." + id + ".date", date.trim());
                if (time == null || time.isBlank()) {
                    props.remove("schedule." + id + ".time");
                } else {
                    props.setProperty("schedule." + id + ".time", time.trim());
                }
            }
            save();
        } finally {
            lock.unlock();
        }
    }

    public void clearSchedule(String id) {
        setSchedule(id, null, null);
    }

    /** Returns id -> {date, time(nullable)} for every title with a scheduled date. */
    public Map<String, String[]> allSchedules() {
        lock.lock();
        try {
            Map<String, String[]> out = new HashMap<>();
            for (String key : props.stringPropertyNames()) {
                if (key.startsWith("schedule.") && key.endsWith(".date")) {
                    String id = key.substring("schedule.".length(), key.length() - ".date".length());
                    String date = props.getProperty(key);
                    String time = props.getProperty("schedule." + id + ".time", "");
                    out.put(id, new String[]{date, time});
                }
            }
            return out;
        } finally {
            lock.unlock();
        }
    }

    public void resetAll() {
        lock.lock();
        try {
            props.clear();
            save();
        } finally {
            lock.unlock();
        }
    }
}
