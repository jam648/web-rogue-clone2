/*
 * curses.h
 * Lightweight Curses Compatibility Header for WebAssembly
 */

#ifndef __CURSES_COMPAT_H__
#define __CURSES_COMPAT_H__

#include "wasm_bridge.h"
#include "display.h"

#define A_REVERSE 0x01
#define A_CHARTEXT 0xFF
#define COLOR_PAIR(n) (n)
#define CANCEL '\033'

#define COLOR_BLACK 0
#define COLOR_RED 1
#define COLOR_GREEN 2
#define COLOR_YELLOW 3
#define COLOR_BLUE 4
#define COLOR_MAGENTA 5
#define COLOR_CYAN 6
#define COLOR_WHITE 7

typedef void WINDOW;

extern int LINES;
extern int COLS;
extern void *stdscr;
extern void *curscr;

void *initscr(void);
int endwin(void);
int clear(void);
int move(int y, int x);
int refresh(void);
int wrefresh(void *win);
int clrtoeol(void);
int addch(const unsigned char ch);
int mvaddch(int y, int x, const unsigned char ch);
int addstr(const char *str);
int mvaddstr(int y, int x, const char *str);
unsigned char mvinch(int y, int x);
int attrset(int a);
int attron(int a);
int attroff(int a);
int standout(void);
int standend(void);
int raw(void);
int noraw(void);
int crmode(void);
int nocrmode(void);
int noecho(void);
int echo(void);
int nonl(void);
int nl(void);
int start_color(void);
int init_pair(short pair, short f, short b);
int assume_default_colors(int f, int b);
int getch(void);

#define getyx(win, y, x) do { (y) = cur_row; (x) = cur_col; } while(0)

#endif /* __CURSES_COMPAT_H__ */
