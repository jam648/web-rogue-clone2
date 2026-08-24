/*
 * message.c
 *
 * This source herein may be modified and/or distributed by anybody who
 * so desires, with the following restrictions:
 *    1.)  No portion of this notice shall be removed.
 *    2.)  Credit shall not be taken for the creation of this source.
 *    3.)  This code is not to be traded, sold, or used for personal
 *         gain or profit.
 *
 */

#include <stdio.h>
#include <string.h>
#include <curses.h>

#include "rogue.h"
#include "message.h"
#include "display.h"
#include "init.h"
#include "machdep.h"
#include "move.h"
#include "object.h"
#include "pack.h"

#define	CTRL(c)	((c) & 037)

char msg_line[256] = "";
short msg_col = 0;
boolean msg_cleared = 1;
char hunger_str[32] = "";

extern boolean cant_int, did_int, interrupted, save_is_interactive;
extern short add_strength;
extern short cur_level;

void
message(char *msg, boolean intrpt)
{
    char clean_msg[256];
    int idx = 0;

    if (!save_is_interactive || !msg) {
	return;
    }
    if (intrpt) {
	interrupted = 1;
    }
    cant_int = 1;

    // Sanitize message: replace \n or \r with space so it never wraps to Row 1
    while (*msg && idx < (int)sizeof(clean_msg) - 1) {
	if (*msg == '\n' || *msg == '\r') {
	    clean_msg[idx++] = ' ';
	} else {
	    clean_msg[idx++] = *msg;
	}
	msg++;
    }
    clean_msg[idx] = '\0';

    if (!msg_cleared) {
	mvaddstr_rogue(MIN_ROW - 1, msg_col, mesg[11]);
	refresh();
	wait_for_ack();
	check_message();
    }
    (void) strcpy(msg_line, clean_msg);
    mvaddstr_rogue(MIN_ROW - 1, 0, clean_msg);
    addch_rogue(' ');
    refresh();
    msg_cleared = 0;
    msg_col = utf8width(clean_msg) + 1;
    if (msg_col > 60) {
        msg_col = 60;
    }

    cant_int = 0;
    if (did_int) {
	did_int = 0;
	onintr(0);		/* 「0」に意味はないが警告除去のために値を入れる。onintr関数を見直す必要がある。 */
    }
}

void
remessage(void)
{
    if (msg_line[0]) {
	message(msg_line, 0);
    }
}

void
check_message(void)
{
    if (msg_cleared) {
	return;
    }
    move(MIN_ROW - 1, 0);
    clrtoeol();
    refresh();
    msg_cleared = 1;
}

int
get_direction(void)
{
    int dir;

    message(mesg[55], 0);
    while (!is_direction(dir = rgetchar())) {
	sound_bell();
    }
    check_message();
    return dir;
}

int
get_input_line(char *prompt, char *insert, char *buf, char *if_cancelled,
	       boolean add_blank, boolean do_echo)
{
    int n;

    n = do_input_line(1, 0, 0, prompt, insert,
		      buf, if_cancelled, add_blank, do_echo, 0);
    return ((n < 0) ? 0 : n);
}

int
input_line(int row, int col, char *insert, char *buf, int ch)
{
    return do_input_line(0, row, col, "", insert, buf, "", 0, 1, ch);
}

int
do_input_line(boolean is_msg, int row, int col, char *prompt, char *insert,
	      char *buf, char *if_cancelled, boolean add_blank,
	      boolean do_echo, int first_ch)
{
    int ch;
    short i = 0, prompt_w = 0;
    char kanji[MAX_TITLE_LENGTH + 4];
    memset(kanji, 0, sizeof(kanji));
    memset(buf, 0, MAX_TITLE_LENGTH + 4);

    if (is_msg) {
	message(prompt, 0);
	prompt_w = utf8width(prompt) + 1;
	row = MIN_ROW - 1;
	col = 0;
    } else {
	mvaddstr_rogue(row, col, prompt);
	prompt_w = utf8width(prompt);
    }

    if (insert && insert[0]) {
	strncpy(buf, insert, MAX_TITLE_LENGTH - 1);
	i = strlen(buf);
	int k = 0;
	while (k < i) {
	    unsigned char uc = (unsigned char)buf[k];
	    int len = 1;
	    if ((uc & 0xE0) == 0xC0) len = 2;
	    else if ((uc & 0xF0) == 0xE0) len = 3;
	    else if ((uc & 0xF8) == 0xF0) len = 4;
	    for (int b = 0; b < len && k + b < i; b++) {
		kanji[k + b] = len;
	    }
	    k += len;
	}
	if (do_echo) {
	    move(row, col + prompt_w);
	    clrtoeol();
	    addstr_rogue(buf);
	}
	refresh();
    }

    for (;;) {
	if (first_ch) {
	    ch = first_ch;
	    first_ch = 0;
	} else {
	    ch = rgetchar();
	}

	if (ch == '\r' || ch == '\n') {
	    break;
	}
	if (ch == CANCEL || ch == 0o33) {
	    if (if_cancelled && if_cancelled[0]) {
		strcpy(buf, if_cancelled);
	    } else {
		buf[0] = '\0';
	    }
	    if (is_msg) {
		check_message();
	    }
	    return -1;
	}

	if ((ch == '\b' || ch == 127) && (i > 0)) {
	    int klen = kanji[i - 1] ? kanji[i - 1] : 1;
	    if (klen > i) klen = i;
	    for (int b = 0; b < klen; b++) {
		kanji[i - 1 - b] = 0;
	    }
	    i -= klen;
	    buf[i] = '\0';
	    if (do_echo) {
		move(row, col + prompt_w);
		clrtoeol();
		addstr_rogue(buf);
	    }
	} else if (ch >= ' ' && ch <= '~') {
	    if ((ch != ' ') || (i > 0)) {
		if (i < MAX_TITLE_LENGTH - 4) {
		    buf[i] = (char)ch;
		    kanji[i] = 0;
		    i++;
		    buf[i] = '\0';
		    if (do_echo) {
			move(row, col + prompt_w);
			clrtoeol();
			addstr_rogue(buf);
		    }
		}
	    }
	} else if ((unsigned char)ch >= 0xC0) {
	    unsigned char uc = (unsigned char)ch;
	    int mblen = 1;
	    if ((uc & 0xE0) == 0xC0) mblen = 2;
	    else if ((uc & 0xF0) == 0xE0) mblen = 3;
	    else if ((uc & 0xF8) == 0xF0) mblen = 4;

	    if (i + mblen < MAX_TITLE_LENGTH - 4) {
		buf[i] = (char)uc;
		kanji[i] = mblen;
		for (int b = 1; b < mblen; b++) {
		    buf[i + b] = (char)rgetchar();
		    kanji[i + b] = mblen;
		}
		i += mblen;
		buf[i] = '\0';
		if (do_echo) {
		    move(row, col + prompt_w);
		    clrtoeol();
		    addstr_rogue(buf);
		}
	    }
	}
	refresh();
    }

    if (is_msg) {
	check_message();
    }

    while ((i > 0) && (buf[i - 1] == ' ') && (kanji[i - 1] == 0)) {
	i--;
    }
    if (add_blank && i > 0 && i < MAX_TITLE_LENGTH - 2) {
	buf[i++] = ' ';
    }
    buf[i] = '\0';
    return (int)strlen(buf);
}

int
rgetchar(void)
{
    int ch;

    for (;;) {
	ch = getch();

	switch (ch) {
	case '\022':
	    wrefresh(curscr);
	    break;
#if !defined( ORIGINAL )
	    /*
	     * can't use X for save_screen purpose
	     * because 2nd byte of kanji might be an 'X'!
	     */
	case CTRL('D'):
#else /* ORIGINAL */
	case 'X':
#endif /* ORIGINAL */
	    save_screen();
	    break;
	default:
	    return ch;
	}
    }
}

/*
Level: 99 Gold: 999999 Hp: 999(999) Str: 99(99) Arm: 99 Exp: 21/10000000 Hungry
階: 99 金塊: 999999 体力: 999(999) 強さ: 99(99) 守備: 99 経験: 21/10000000 空腹
0    5    1    5    2    5    3    5    4    5    5    5    6    5    7    5
*/

void
print_stats(int stat_mask)
{
    (void)stat_mask;
    char buf[256];
    int row = ROGUE_LINES - 1;

    if (rogue.gold > MAX_GOLD) {
        rogue.gold = MAX_GOLD;
    }
    if (rogue.hp_max > MAX_HP) {
        rogue.hp_current -= (rogue.hp_max - MAX_HP);
        rogue.hp_max = MAX_HP;
    }
    if (rogue.str_max > MAX_STRENGTH) {
        rogue.str_current -= (rogue.str_max - MAX_STRENGTH);
        rogue.str_max = MAX_STRENGTH;
    }
    if (rogue.armor && (rogue.armor->d_enchant > MAX_ARMOR)) {
        rogue.armor->d_enchant = MAX_ARMOR;
    }

#if defined( JAPAN )
    snprintf(buf, sizeof(buf),
        "%s%d  %s%ld  %s%d(%d)  %s%d(%d)  %s%d  %s%d/%ld  %s",
        mesg[56], cur_level,
        mesg[57], rogue.gold,
        mesg[58], rogue.hp_current, rogue.hp_max,
        mesg[59], rogue.str_current + add_strength, rogue.str_max,
        mesg[60], get_armor_class(rogue.armor),
        mesg[61], rogue.exp, rogue.exp_points,
        hunger_str);
#else
    snprintf(buf, sizeof(buf),
        "Level: %d  Gold: %ld  Hp: %d(%d)  Str: %d(%d)  Arm: %d  Exp: %d/%ld  %s",
        cur_level,
        rogue.gold,
        rogue.hp_current, rogue.hp_max,
        rogue.str_current + add_strength, rogue.str_max,
        get_armor_class(rogue.armor),
        rogue.exp, rogue.exp_points,
        hunger_str);
#endif

    move(row, 0);
    clrtoeol();
    mvaddstr_rogue(row, 0, buf);
    refresh();
}

void
pad(char *s, short n)
{
    short i;

    for (i = strlen(s); i < n; i++) {
	addch_rogue(' ');
    }
}

void
save_screen(void)
{
    FILE *fp;
    short i, j;
    char buf[ROGUE_COLUMNS + 2];
    boolean found_non_blank;

    if ((fp = fopen("rogue.screen", "w")) != NULL) {
	for (i = 0; i < ROGUE_LINES; i++) {
	    found_non_blank = 0;
	    for (j = (ROGUE_COLUMNS - 1); j >= 0; j--) {
		buf[j] = mvinch_rogue(i, j);
		if (!found_non_blank) {
		    if ((buf[j] != ' ') || (j == 0)) {
			buf[j + ((j == 0) ? 0 : 1)] = 0;
			found_non_blank = 1;
		    }
		}
	    }
	    fputs(buf, fp);
	    putc('\n', fp);
	}
	fclose(fp);
    } else {
	sound_bell();
    }
}

void
sound_bell(void)
{
    putchar(7);
    fflush(stdout);
}

boolean
is_digit(short ch)
{
    return (boolean) ((ch >= '0') && (ch <= '9'));
}

int
r_index(char *str, int ch, boolean last)
{
    int i;

    if (last) {
	for (i = strlen(str) - 1; i >= 0; i--) {
	    if (str[i] == ch) {
		return i;
	    }
	}
    } else {
	for (i = 0; str[i]; i++) {
	    if (str[i] == ch) {
		return i;
	    }
	}
    }
    return -1;
}
//あ
