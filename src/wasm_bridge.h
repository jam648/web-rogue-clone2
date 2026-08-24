/*
 * wasm_bridge.h
 * Virtual screen buffer and async I/O bridge for WebAssembly
 */

#ifndef __WASM_BRIDGE_H__
#define __WASM_BRIDGE_H__

#include <stdint.h>

typedef struct {
    uint16_t ch;     /* Character code (ASCII / Unicode) */
    uint8_t color;   /* Rogue color pair index (0..14) */
    uint8_t attr;    /* Attributes (A_REVERSE, etc.) */
} RogueCell;

extern RogueCell rogue_screen[24][80];
extern int cur_row;
extern int cur_col;
extern uint8_t cur_color;
extern uint8_t cur_attr;

void wasm_screen_clear(void);
void wasm_screen_set_char(int y, int x, uint16_t ch, uint8_t color, uint8_t attr);
uint16_t wasm_screen_get_char(int y, int x);
void wasm_screen_clrtoeol(void);
void wasm_screen_refresh(void);
int wasm_getch(void);
void wasm_notify_save(void);
void wasm_notify_game_over(int score, int level, int max_level, long gold, const char *reason);

#endif /* __WASM_BRIDGE_H__ */
