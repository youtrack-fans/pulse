import {COUNTRY_CODES} from './country-codes';

const EMOJI: Readonly<Record<string, string>> = {
  'point_right': '👉', 'heart': '❤️', 'white_check_mark': '✅', 'rocket': '🚀', 'calendar': '📆', 'heavy_equals_sign': '🟰',
  'books': '📚', 'eyes': '👀', 'green_heart': '💚', 'grey_question': '❔', 'tada': '🎉', 'left_speech_bubble': '🗨️',
  'handbag': '👜', 'tv': '📺', 'clap': '👏', 'stars': '🌠', 'sparkles': '✨', 'question': '❓', 'yellow_heart': '💛',
  'black_heart': '🖤', 'computer': '💻', 'speech_balloon': '💬', 'slightly_smiling_face': '🙂', 'blue_heart': '💙',
  'fire': '🔥', 'exclamation': '❗', 'bangbang': '‼️', 'arrow_right': '➡️', 'arrow_left': '⬅️', 'gear': '⚙️',
  'bar_chart': '📊', 'document': '📄', 'page_facing_up': '📄', 'writing_hand': '✍️', 'loudspeaker': '📢',
  'heart_hands': '🫶', 'earth_americas': '🌎', 'earth_asia': '🌏', 'sunflower': '🌻', 'purple_heart': '💜',
  'orange_heart': '🧡', 'wave': '👋', 'large_green_circle': '🟢', 'large_purple_circle': '🟣',
  'large_blue_circle': '🔵', 'white_circle': '⚪', 'game_die': '🎲', 'gift': '🎁', 'chart_with_upwards_trend': '📈',
  'date': '📅', 'recycle': '♻️', 'star2': '🌟', 'star': '⭐', 'email': '📧', 'mag_right': '🔎', 'mag': '🔍',
  'sparkling_heart': '💖', 'camera_with_flash': '📸', 'dancer': '💃', 'bulb': '💡', 'christmas_tree': '🎄',
  'zero': '0️⃣', 'one': '1️⃣', 'two': '2️⃣', 'three': '3️⃣', 'four': '4️⃣', 'fallen_leaf': '🍂',
  'first_place_medal': '🥇', 'warning': '⚠️', 'birthday': '🎂', 'car': '🚗', 'smile': '😄', 'pushpin': '📌',
  'round_pushpin': '📍', 'no_entry': '⛔', 'drop_of_blood': '🩸', 'fairy': '🧚', 'female_fairy': '\u{1F9DA}\u200D\u2640\uFE0F',
  'wink': '😉', 'spiral_calendar_pad': '🗓️', 'star-struck': '🤩', 'inbox_tray': '📥', 'moneybag': '💰',
  'grinning': '😀', 'information_source': 'ℹ️', 'info': 'ℹ️', 'people_holding_hands': '\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}',
  'student': '\u{1F9D1}\u200D\u{1F393}', 'message': '💬', 'video_camera': '📹', 'alarm_clock': '⏰', 'rotating_light': '🚨',
  'hearts': '♥️', 'link': '🔗', 'snowflake': '❄️', 'parking': '🅿️', 'security': '🔒', 'busts_in_silhouette': '👥',
  'upside_down_face': '🙃', 'cherry_blossom': '🌸', 'world_map': '🗺️', 'raising_hand': '🙋',
  'classical_building': '🏛️', 'jigsaw': '🧩', 'racing_car': '🏎️', 'studio_microphone': '🎙️', 'dizzy': '💫',
  'art': '🎨', 'youtube': '▶️', 'ledger': '📒', 'bubbles': '🫧', 'lotus': '🪷',
  'speaking_head_in_silhouette': '🗣️', 'first_aid': '🩹',
};

const TRIANGLES: Readonly<Record<string, string>> = {
  'plain_green_triangle_up': '<span style="color:#2e9e5b">▲</span>',
  'plain_green_triangle_down': '<span style="color:#2e9e5b">▼</span>',
  'plain_red_triangle_up': '<span style="color:#d94b3d">▲</span>',
  'plain_red_triangle_down': '<span style="color:#d94b3d">▼</span>',
};

const REGIONAL_INDICATOR_BASE = 0x1f1e6;
const LETTER_A = 'a'.charCodeAt(0);
const ZERO_WIDTH_SPACE = '\u200b';
const SHORTCODE = /(?<![\w/]):\u200b?([a-z][a-z0-9_+-]*)\u200b?:(?![\w/])/gi;

function flag(code: string): string {
  return [...code.toLowerCase()]
    .map(letter => String.fromCodePoint(REGIONAL_INDICATOR_BASE + letter.charCodeAt(0) - LETTER_A))
    .join('');
}

function lookup(name: string): string | undefined {
  const key = name.toLowerCase();
  const known = EMOJI[key] ?? TRIANGLES[key];
  if (known) {
    return known;
  }
  if (COUNTRY_CODES.has(key)) {
    return flag(key);
  }
  const flagName = key.match(/^flag-([a-z]{2})$/);
  return flagName && COUNTRY_CODES.has(flagName[1]) ? flag(flagName[1]) : undefined;
}

export function replaceEmojiShortcodes(text: string): string {
  return text.replace(SHORTCODE, (match, name: string) => {
    const emoji = lookup(name);
    if (emoji) {
      return emoji;
    }
    return match.includes(ZERO_WIDTH_SPACE) ? '' : match;
  });
}
