package com.marvelwatchlist.data;

import com.marvelwatchlist.model.Title;
import com.marvelwatchlist.model.Title.Type;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Single source of truth for the watchlist content.
 *
 * To add a new release, append one more build(...) call at the bottom with
 * the next order number - nothing else in the app needs to change, since
 * the server, the API, and the frontend all read from this list.
 */
public final class MarvelData {

    private static final String INFINITY = "The Infinity Saga";
    private static final String MULTIVERSE = "The Multiverse Saga";

    private static final List<Title> TITLES = build();

    private MarvelData() {}

    public static List<Title> all() {
        return TITLES;
    }

    private static List<Title> build() {
        List<Title> t = new ArrayList<>();
        int o = 0;

        // ---------------- PHASE 1 ----------------
        t.add(new Title("iron-man", ++o, "Iron Man", 2008, Type.MOVIE, "Phase 1", INFINITY,
                "2h 6m", "Where it all begins - Tony Stark builds the suit and the MCU takes its first breath.", 1));
        t.add(new Title("incredible-hulk", ++o, "The Incredible Hulk", 2008, Type.MOVIE, "Phase 1", INFINITY,
                "1h 52m", "Easy to skip, but Ross's arc and the Super-Soldier program echo for years.", 2));
        t.add(new Title("iron-man-2", ++o, "Iron Man 2", 2010, Type.MOVIE, "Phase 1", INFINITY,
                "2h 4m", "Black Widow and S.H.I.E.L.D. step into the light. First real hint of an Avengers Initiative.", 1));
        t.add(new Title("thor", ++o, "Thor", 2011, Type.MOVIE, "Phase 1", INFINITY,
                "1h 54m", "Asgard, the Bifrost, and Loki's turn - the cosmic side of the MCU opens up.", 3));
        t.add(new Title("captain-america-first-avenger", ++o, "Captain America: The First Avenger", 2011, Type.MOVIE, "Phase 1", INFINITY,
                "2h 4m", "The Tesseract's origin. Watch this before Avengers even though it's set decades earlier.", 4));
        t.add(new Title("avengers", ++o, "The Avengers", 2012, Type.MOVIE, "Phase 1", INFINITY,
                "2h 23m", "The team-up that proved shared universes could work. Loki returns with the Chitauri.", 5));

        // ---------------- PHASE 2 ----------------
        t.add(new Title("iron-man-3", ++o, "Iron Man 3", 2013, Type.MOVIE, "Phase 2", INFINITY,
                "2h 10m", "Tony deals with the fallout of New York. The Mandarin twist still splits fans.", 1));
        t.add(new Title("thor-dark-world", ++o, "Thor: The Dark World", 2013, Type.MOVIE, "Phase 2", INFINITY,
                "1h 52m", "The Reality Stone enters play - keep an eye on where it ends up.", 3));
        t.add(new Title("cap-winter-soldier", ++o, "Captain America: The Winter Soldier", 2014, Type.MOVIE, "Phase 2", INFINITY,
                "2h 16m", "S.H.I.E.L.D. falls, HYDRA is exposed. Widely considered one of the MCU's best.", 4));
        t.add(new Title("guardians-vol-1", ++o, "Guardians of the Galaxy", 2014, Type.MOVIE, "Phase 2", INFINITY,
                "2h 1m", "A new corner of the cosmos, and the Infinity Stones become the connective thread.", 6));
        t.add(new Title("avengers-age-of-ultron", ++o, "Avengers: Age of Ultron", 2015, Type.MOVIE, "Phase 2", INFINITY,
                "2h 21m", "Ultron, the Mind Stone, and the birth of Vision and the Sokovia Accords seeds.", 5));
        t.add(new Title("ant-man", ++o, "Ant-Man", 2015, Type.MOVIE, "Phase 2", INFINITY,
                "1h 57m", "A smaller-scale heist movie that quietly sets up the Quantum Realm.", 2));

        // ---------------- PHASE 3 ----------------
        t.add(new Title("civil-war", ++o, "Captain America: Civil War", 2016, Type.MOVIE, "Phase 3", INFINITY,
                "2h 27m", "The Avengers split in two. Also the MCU debut of Spider-Man and Black Panther.", 4));
        t.add(new Title("doctor-strange", ++o, "Doctor Strange", 2016, Type.MOVIE, "Phase 3", INFINITY,
                "1h 55m", "The mystic arts arrive, along with the Time Stone.", 3));
        t.add(new Title("guardians-vol-2", ++o, "Guardians of the Galaxy Vol. 2", 2017, Type.MOVIE, "Phase 3", INFINITY,
                "2h 16m", "Peter Quill meets his father. Big emotional gut-punch of an ending.", 6));
        t.add(new Title("spiderman-homecoming", ++o, "Spider-Man: Homecoming", 2017, Type.MOVIE, "Phase 3", INFINITY,
                "2h 13m", "Peter Parker balances high school with being an Avenger-in-training.", 4));
        t.add(new Title("thor-ragnarok", ++o, "Thor: Ragnarok", 2017, Type.MOVIE, "Phase 3", INFINITY,
                "2h 10m", "Asgard's destruction and a total tonal reinvention for Thor.", 3));
        t.add(new Title("black-panther", ++o, "Black Panther", 2018, Type.MOVIE, "Phase 3", INFINITY,
                "2h 14m", "Wakanda is revealed to the world. Essential before Infinity War.", 6));
        t.add(new Title("infinity-war", ++o, "Avengers: Infinity War", 2018, Type.MOVIE, "Phase 3", INFINITY,
                "2h 29m", "Thanos completes the gauntlet. The snap changes everything.", 5));
        t.add(new Title("ant-man-and-wasp", ++o, "Ant-Man and the Wasp", 2018, Type.MOVIE, "Phase 3", INFINITY,
                "1h 58m", "Set just before the snap - watch the mid-credits scene closely.", 2));
        t.add(new Title("captain-marvel", ++o, "Captain Marvel", 2019, Type.MOVIE, "Phase 3", INFINITY,
                "2h 4m", "Set in the '90s, but positioned here since Fury pages her at the end of Infinity War.", 1));
        t.add(new Title("endgame", ++o, "Avengers: Endgame", 2019, Type.MOVIE, "Phase 3", INFINITY,
                "3h 1m", "The Infinity Saga's finale. Time heist, the final battle, and a changing of the guard.", 5));
        t.add(new Title("far-from-home", ++o, "Spider-Man: Far From Home", 2019, Type.MOVIE, "Phase 3", INFINITY,
                "2h 9m", "Closes out the Infinity Saga and sets the tone for a post-Endgame world.", 4));

        // ---------------- PHASE 4 ----------------
        t.add(new Title("wandavision", ++o, "WandaVision", 2021, Type.TV_SHOW, "Phase 4", MULTIVERSE,
                "9 episodes", "The Multiverse Saga's true opener. Wanda's grief reshapes reality itself.", 3));
        t.add(new Title("falcon-winter-soldier", ++o, "The Falcon and the Winter Soldier", 2021, Type.TV_SHOW, "Phase 4", MULTIVERSE,
                "6 episodes", "The shield passes to a new Captain America.", 4));
        t.add(new Title("loki-s1", ++o, "Loki (Season 1)", 2021, Type.TV_SHOW, "Phase 4", MULTIVERSE,
                "6 episodes", "The TVA, the Sacred Timeline, and the multiverse's true architect: Kang.", 1));
        t.add(new Title("black-widow", ++o, "Black Widow", 2021, Type.MOVIE, "Phase 4", MULTIVERSE,
                "2h 14m", "Set between Civil War and Infinity War - a farewell to Natasha.", 5));
        t.add(new Title("what-if-s1", ++o, "What If...? (Season 1)", 2021, Type.TV_SHOW, "Phase 4", MULTIVERSE,
                "9 episodes", "Animated multiverse detours. Episode 4 and the finale matter most going forward.", 2));
        t.add(new Title("shang-chi", ++o, "Shang-Chi and the Legend of the Ten Rings", 2021, Type.MOVIE, "Phase 4", MULTIVERSE,
                "2h 12m", "Introduces the Ten Rings - watch the mid-credits scene for a multiverse tease.", 6));
        t.add(new Title("eternals", ++o, "Eternals", 2021, Type.MOVIE, "Phase 4", MULTIVERSE,
                "2h 36m", "Cosmic history dating back millions of years, with major implications for Celestials.", 3));
        t.add(new Title("hawkeye", ++o, "Hawkeye", 2021, Type.TV_SHOW, "Phase 4", MULTIVERSE,
                "6 episodes", "Kate Bishop's introduction and Yelena's path toward the Thunderbolts.", 4));
        t.add(new Title("no-way-home", ++o, "Spider-Man: No Way Home", 2021, Type.MOVIE, "Phase 4", MULTIVERSE,
                "2h 28m", "The multiverse breaks wide open. Massive consequences for Phase 5 and beyond.", 4));
        t.add(new Title("moon-knight", ++o, "Moon Knight", 2022, Type.TV_SHOW, "Phase 4", MULTIVERSE,
                "6 episodes", "A more standalone, Egyptian-mythology-flavored detour.", 1));
        t.add(new Title("doctor-strange-multiverse-madness", ++o, "Doctor Strange in the Multiverse of Madness", 2022, Type.MOVIE, "Phase 4", MULTIVERSE,
                "2h 6m", "Direct sequel to WandaVision. The multiverse gets genuinely dangerous.", 3));
        t.add(new Title("ms-marvel", ++o, "Ms. Marvel", 2022, Type.TV_SHOW, "Phase 4", MULTIVERSE,
                "6 episodes", "Kamala Khan's bangle ties directly into mutant and multiverse lore.", 6));
        t.add(new Title("thor-love-thunder", ++o, "Thor: Love and Thunder", 2022, Type.MOVIE, "Phase 4", MULTIVERSE,
                "1h 59m", "Jane Foster becomes the Mighty Thor. Gorr the God Butcher hunts deities.", 3));
        t.add(new Title("she-hulk", ++o, "She-Hulk: Attorney at Law", 2022, Type.TV_SHOW, "Phase 4", MULTIVERSE,
                "9 episodes", "Jennifer Walters, courtroom comedy, and a fourth-wall-breaking finale.", 2));
        t.add(new Title("werewolf-by-night", ++o, "Werewolf by Night", 2022, Type.SPECIAL, "Phase 4", MULTIVERSE,
                "53m", "A gorgeous black-and-white horror special. Totally standalone and easy to slot in.", 5));
        t.add(new Title("wakanda-forever", ++o, "Black Panther: Wakanda Forever", 2022, Type.MOVIE, "Phase 4", MULTIVERSE,
                "2h 41m", "Wakanda mourns T'Challa and meets Namor and Talokan.", 6));
        t.add(new Title("guardians-holiday-special", ++o, "The Guardians of the Galaxy Holiday Special", 2022, Type.SPECIAL, "Phase 4", MULTIVERSE,
                "44m", "A quick, funny bridge into Vol. 3.", 6));

        // ---------------- PHASE 5 ----------------
        t.add(new Title("quantumania", ++o, "Ant-Man and the Wasp: Quantumania", 2023, Type.MOVIE, "Phase 5", MULTIVERSE,
                "2h 5m", "Phase 5 opens in the Quantum Realm as Kang the Conqueror steps forward.", 2));
        t.add(new Title("secret-invasion", ++o, "Secret Invasion", 2023, Type.TV_SHOW, "Phase 5", MULTIVERSE,
                "6 episodes", "Shapeshifting Skrulls infiltrate Earth. Fury returns to center stage.", 1));
        t.add(new Title("guardians-vol-3", ++o, "Guardians of the Galaxy Vol. 3", 2023, Type.MOVIE, "Phase 5", MULTIVERSE,
                "2h 30m", "James Gunn's trilogy closer - the team's most emotional chapter.", 6));
        t.add(new Title("loki-s2", ++o, "Loki (Season 2)", 2023, Type.TV_SHOW, "Phase 5", MULTIVERSE,
                "6 episodes", "The TVA's fate is decided and the branching multiverse is finally set loose.", 1));
        t.add(new Title("the-marvels", ++o, "The Marvels", 2023, Type.MOVIE, "Phase 5", MULTIVERSE,
                "1h 45m", "Carol Danvers, Ms. Marvel, and Monica Rambeau team up across space.", 3));
        t.add(new Title("echo", ++o, "Echo", 2024, Type.TV_SHOW, "Phase 5", MULTIVERSE,
                "5 episodes", "Maya Lopez returns to her roots - a grounded, street-level story.", 4));
        t.add(new Title("agatha-all-along", ++o, "Agatha All Along", 2024, Type.TV_SHOW, "Phase 5", MULTIVERSE,
                "9 episodes", "A WandaVision spin-off following Agatha Harkness down the Witches' Road.", 3));
        t.add(new Title("daredevil-born-again", ++o, "Daredevil: Born Again", 2025, Type.TV_SHOW, "Phase 5", MULTIVERSE,
                "9 episodes", "Matt Murdock and Wilson Fisk collide again in a harder-edged New York story.", 5));
        t.add(new Title("thunderbolts", ++o, "Thunderbolts*", 2025, Type.MOVIE, "Phase 5", MULTIVERSE,
                "2h 6m", "A team of antiheroes becomes the New Avengers - directly feeds into Doomsday.", 5));
        t.add(new Title("ironheart", ++o, "Ironheart", 2025, Type.TV_SHOW, "Phase 5", MULTIVERSE,
                "6 episodes", "Riri Williams builds her own armor and crosses paths with dark magic.", 1));

        // ---------------- PHASE 6 - The road to Doomsday ----------------
        t.add(new Title("fantastic-four-first-steps", ++o, "The Fantastic Four: First Steps", 2025, Type.MOVIE, "Phase 6", MULTIVERSE,
                "1h 55m", "Marvel's first family debuts in a retro-futuristic timeline - and Doctor Doom appears.", 4));
        t.add(new Title("visionquest", ++o, "VisionQuest", 2026, Type.TV_SHOW, "Phase 6", MULTIVERSE,
                "5 episodes", "White Vision, rebuilt and remembering everything, searches for who he is.", 3));
        t.add(new Title("spiderman-brand-new-day", ++o, "Spider-Man: Brand New Day", 2026, Type.MOVIE, "Phase 6", MULTIVERSE,
                "2h 10m", "Peter Parker's next chapter, arriving in the final stretch before Doomsday.", 4));
        t.add(new Title("avengers-doomsday", ++o, "Avengers: Doomsday", 2026, Type.MOVIE, "Phase 6", MULTIVERSE,
                "2h 30m", "Every thread since WandaVision converges. Robert Downey Jr. returns as Doctor Doom.", 5));

        return Collections.unmodifiableList(t);
    }
}
