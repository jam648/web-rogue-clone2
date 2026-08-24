/*
 * wasm_bridge.c
 * WebAssembly Asyncify I/O and Virtual Screen Buffer Bridge
 */

#include <emscripten.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "wasm_bridge.h"
#include "display.h"
#include "rogue.h"
#include "init.h"
#include "main.h"
#include "level.h"
#include "message.h"
#include "monster.h"
#include "object.h"
#include "play.h"
#include "save.h"
#include "score.h"
#include "trap.h"
#include "mesg_J.h"

char mesg[507][256];

extern char login_name[30];
extern char *nick_name;
extern char *rest_file;
extern short party_room;

RogueCell rogue_screen[24][80];
int cur_row = 0;
int cur_col = 0;
uint8_t cur_color = 0;
uint8_t cur_attr = 0;

int LINES = 24;
int COLS = 80;
void *stdscr = (void *)1;
void *curscr = (void *)1;

/* JavaScript Asynchronous and Synchronous Bridges */

EM_ASYNC_JS(int, js_async_getch, (), {
    if (Module.onAsyncGetch) {
        return await Module.onAsyncGetch();
    }
    return 0;
});

EM_JS(void, js_on_refresh, (), {
    if (Module.onRefresh) {
        Module.onRefresh();
    }
});

EM_JS(void, js_on_auto_save, (), {
    if (Module.onAutoSave) {
        Module.onAutoSave();
    }
});

EM_JS(void, js_on_game_over, (int score, int level, int max_level, long gold, const char* reason), {
    const reasonStr = UTF8ToString(reason);
    if (Module.onGameOver) {
        Module.onGameOver(score, level, max_level, gold, reasonStr);
    }
});

/* Virtual Screen Buffer Operations */

void wasm_screen_clear(void) {
    for (int y = 0; y < 24; y++) {
        for (int x = 0; x < 80; x++) {
            rogue_screen[y][x].ch = ' ';
            rogue_screen[y][x].color = 0;
            rogue_screen[y][x].attr = 0;
        }
    }
    cur_row = 0;
    cur_col = 0;
}

void wasm_screen_set_char(int y, int x, uint16_t ch, uint8_t color, uint8_t attr) {
    if (y >= 0 && y < 24 && x >= 0 && x < 80) {
        rogue_screen[y][x].ch = ch;
        rogue_screen[y][x].color = color;
        rogue_screen[y][x].attr = attr;
    }
}

uint16_t wasm_screen_get_char(int y, int x) {
    if (y >= 0 && y < 24 && x >= 0 && x < 80) {
        return rogue_screen[y][x].ch;
    }
    return ' ';
}

void wasm_screen_clrtoeol(void) {
    if (cur_row >= 0 && cur_row < 24) {
        for (int x = cur_col; x < 80; x++) {
            rogue_screen[cur_row][x].ch = ' ';
            rogue_screen[cur_row][x].color = 0;
            rogue_screen[cur_row][x].attr = 0;
        }
    }
}

void wasm_screen_refresh(void) {
    js_on_refresh();
}

int wasm_getch(void) {
    return js_async_getch();
}

void wasm_notify_save(void) {
    js_on_auto_save();
}

void wasm_notify_game_over(int score, int level, int max_level, long gold, const char *reason) {
    js_on_game_over(score, level, max_level, gold, reason);
}

int read_mesg(char *argv_msgfile) {
    (void)argv_msgfile;
    init_embedded_mesg();
    return 0;
}

void usage(void) {
}

/* Curses Compatibility Layer */

void *initscr(void) {
    wasm_screen_clear();
    return (void *)1;
}

int endwin(void) {
    return 0;
}

int clear(void) {
    wasm_screen_clear();
    return 0;
}

int move(int y, int x) {
    cur_row = y;
    cur_col = x;
    return 0;
}

int refresh(void) {
    wasm_screen_refresh();
    return 0;
}

int wrefresh(void *win) {
    (void)win;
    wasm_screen_refresh();
    return 0;
}

int clrtoeol(void) {
    wasm_screen_clrtoeol();
    return 0;
}

int addch(const unsigned char ch) {
    return addch_rogue((chtype)ch);
}

int mvaddch(int y, int x, const unsigned char ch) {
    return mvaddch_rogue(y, x, (chtype)ch);
}

int addstr(const char *str) {
    return addstr_rogue(str);
}

int mvaddstr(int y, int x, const char *str) {
    return mvaddstr_rogue(y, x, str);
}

unsigned char mvinch(int y, int x) {
    return (unsigned char)(wasm_screen_get_char(y, x) & 0xFF);
}

int attrset(int a) {
    cur_color = (uint8_t)(a & 0xFF);
    return 0;
}

int attron(int a) {
    cur_attr |= (uint8_t)(a & 0xFF);
    return 0;
}

int attroff(int a) {
    cur_attr &= ~(uint8_t)(a & 0xFF);
    return 0;
}

int standout(void) {
    cur_attr |= 0x01;
    return 0;
}

int standend(void) {
    cur_attr &= ~0x01;
    return 0;
}

int raw(void) { return 0; }
int noraw(void) { return 0; }
int crmode(void) { return 0; }
int nocrmode(void) { return 0; }
int noecho(void) { return 0; }
int echo(void) { return 0; }
int nonl(void) { return 0; }
int nl(void) { return 0; }
int start_color(void) { return 0; }
int init_pair(short pair, short f, short b) { (void)pair; (void)f; (void)b; return 0; }
int assume_default_colors(int f, int b) { (void)f; (void)b; return 0; }
int getch(void) { return wasm_getch(); }

/* Exported WebAssembly APIs */

EMSCRIPTEN_KEEPALIVE
RogueCell* wasm_get_screen_buffer(void) {
    return &rogue_screen[0][0];
}

EMSCRIPTEN_KEEPALIVE
int wasm_save_current_game(void) {
    save_into_file("/rogue.save");
    return 1;
}

EMSCRIPTEN_KEEPALIVE
int wasm_start_game(int restore, const char *name) {
    char buf[128];
    int first = 1;

    init_embedded_mesg();
    if (name && *name) {
        strncpy(login_name, name, sizeof(login_name) - 1);
        nick_name = login_name;
    } else {
        strcpy(login_name, "RODNEY");
        nick_name = login_name;
    }

    char *argv[] = { "rogue", NULL };
    if (restore) {
        rest_file = "/rogue.save";
    }

    int res = init(1, argv);
    if (res) {
        /* Restored game */
        first = 0;
        play_level();
    }

    for (;;) {
        clear_level();
        make_level();
        put_objects();
        put_stairs();
        add_traps();
        put_mons();
        put_player(party_room);
        print_stats(STAT_ALL);
        if (first) {
            sprintf(buf, mesg[10], nick_name);
            message(buf, 0);
            first = 0;
        }
        play_level();
        free_stuff(&level_objects);
        free_stuff(&level_monsters);
    }
    return 0;
}
