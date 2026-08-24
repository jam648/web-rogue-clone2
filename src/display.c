/*
 * display.c
 * Display wrappers connected to the virtual screen buffer
 */

#include <string.h>
#include <stdlib.h>
#include <stdio.h>

#include "rogue.h"
#include "display.h"
#include "wasm_bridge.h"
#include "machdep.h"
#include "message.h"

/*
 * Rogue Colors
 */
enum rogue_colors {
  WHITE = 1,
  RED = 2,
  GREEN = 3,
  YELLOW = 4,
  BLUE = 5,
  MAGENTA = 6,
  CYAN = 7,
  WHITE_REVERSE = 8,
  RED_REVERSE = 9,
  GREEN_REVERSE = 10,
  YELLOW_REVERSE = 11,
  BLUE_REVERSE = 12,
  MAGENTA_REVERSE = 13,
  CYAN_REVERSE = 14
};

static int ch_attr[256];
char *color_str = "cbmyg";
extern boolean use_color;

/*
 * init_color_attr
 */
void init_color_attr(void) {
  char *chx, chy, *chz;
  int i, j, k;
  char color_type[] = "wrgybmcWRGYBMC";
  int colormap_list[5];

  for (i = 0; i < 5 && color_str[i]; i++) {
    j = r_index(color_type, color_str[i], 0);
    if (j >= 0) {
      switch (color_type[j]) {
        default:  colormap_list[i] = 0; break;
        case 'w': colormap_list[i] = WHITE; break;
        case 'r': colormap_list[i] = RED; break;
        case 'g': colormap_list[i] = GREEN; break;
        case 'y': colormap_list[i] = YELLOW; break;
        case 'b': colormap_list[i] = BLUE; break;
        case 'm': colormap_list[i] = MAGENTA; break;
        case 'c': colormap_list[i] = CYAN; break;
        case 'W': colormap_list[i] = WHITE_REVERSE; break;
        case 'R': colormap_list[i] = RED_REVERSE; break;
        case 'G': colormap_list[i] = GREEN_REVERSE; break;
        case 'Y': colormap_list[i] = YELLOW_REVERSE; break;
        case 'B': colormap_list[i] = BLUE_REVERSE; break;
        case 'M': colormap_list[i] = MAGENTA_REVERSE; break;
        case 'C': colormap_list[i] = CYAN_REVERSE; break;
      }
    }
  }

  for (chx = "-|#+"; *chx; chx++) {
    get_colorpair_number((signed)*chx, colormap_list[0]);
  }
  get_colorpair_number((signed)'.', colormap_list[1]);
  for (chy = 'A'; chy <= 'Z'; chy++) {
    get_colorpair_number((signed)chy, colormap_list[2]);
  }
  for (chz = "%!?/=)]^*:,"; *chz; chz++) {
    get_colorpair_number((signed)*chz, colormap_list[3]);
  }
  get_colorpair_number(rogue.fchar, colormap_list[4]);
  if (!use_color) {
    for (k = 0; k < 128; k++) {
      get_colorpair_number(k, 0);
    }
  }
}

int put_colorpair_number(char ch) {
  return ch_attr[(unsigned char)ch];
}

void get_colorpair_number(char ch, int num) {
  ch_attr[(unsigned char)ch] = num;
}

int utf8_next_codepoint(const char **pstr, uint16_t *out_cp, int *out_width) {
  const unsigned char *s = (const unsigned char *)*pstr;
  if (!s || !*s) return 0;

  unsigned char c = *s++;
  uint32_t cp = 0;
  int width = 1;

  if (c < 0x80) {
    cp = c;
    width = 1;
  } else if ((c & 0xE0) == 0xC0) {
    if (!*s) return 0;
    cp = ((c & 0x1F) << 6) | (*s++ & 0x3F);
    width = 2;
  } else if ((c & 0xF0) == 0xE0) {
    if (!*s || !s[1]) return 0;
    cp = ((c & 0x0F) << 12) | ((*s & 0x3F) << 6) | (s[1] & 0x3F);
    s += 2;
    if (cp >= 0xFF61 && cp <= 0xFF9F) {
      width = 1;
    } else {
      width = 2;
    }
  } else if ((c & 0xF8) == 0xF0) {
    if (!*s || !s[1] || !s[2]) return 0;
    cp = ((c & 0x07) << 18) | ((*s & 0x3F) << 12) | ((s[1] & 0x3F) << 6) | (s[2] & 0x3F);
    s += 3;
    width = 2;
  } else {
    cp = c;
    width = 1;
  }

  *pstr = (const char *)s;
  *out_cp = (uint16_t)(cp > 0xFFFF ? '?' : cp);
  *out_width = width;
  return 1;
}

int addch_rogue(const chtype ch) {
  if (cur_row >= 0 && cur_row < 24 && cur_col >= 0 && cur_col < 80) {
    uint8_t color = (uint8_t)put_colorpair_number((char)(ch < 128 ? ch : 0));
    wasm_screen_set_char(cur_row, cur_col, (uint16_t)ch, color, cur_attr);
  }
  cur_col++;
  return 0;
}

int mvaddch_rogue(int y, int x, const chtype ch) {
  cur_row = y;
  cur_col = x;
  return addch_rogue(ch);
}

int addstr_rogue(const char *str) {
  if (!str) return 0;
  uint16_t cp;
  int width;

  while (*str) {
    if (*str == '\n') {
      cur_row++;
      cur_col = 0;
      str++;
    } else if (*str == '\r') {
      cur_col = 0;
      str++;
    } else {
      if (utf8_next_codepoint(&str, &cp, &width)) {
        if (cur_row >= 0 && cur_row < 24 && cur_col >= 0 && cur_col < 80) {
          uint8_t color = (uint8_t)put_colorpair_number((char)(cp < 128 ? cp : 0));
          wasm_screen_set_char(cur_row, cur_col, cp, color, cur_attr);
          if (width == 2 && cur_col + 1 < 80) {
            wasm_screen_set_char(cur_row, cur_col + 1, 0xFFFF, color, cur_attr);
          }
        }
        cur_col += width;
      } else {
        str++;
      }
    }
  }
  return 0;
}

int mvaddstr_rogue(int y, int x, const char *str) {
  cur_row = y;
  cur_col = x;
  return addstr_rogue(str);
}

chtype mvinch_rogue(int y, int x) {
  return (chtype)wasm_screen_get_char(y, x);
}
