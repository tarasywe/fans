/** Quick reactions above the composer (Figma order). */
export const QUICK_EMOJIS = ['🔥', '❤️', '😍', '💋', '😡', '😢'] as const;

export type EmojiCategory = { id: string; label: string; icon: string; emojis: readonly string[] };

const split = (value: string) => value.trim().split(/\s+/);

export const EMOJI_CATEGORIES: readonly EmojiCategory[] = [
  {
    id: 'smileys',
    label: 'Smileys',
    icon: '😀',
    emojis: split(
      `😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕`,
    ),
  },
  {
    id: 'gestures',
    label: 'People',
    icon: '👋',
    emojis: split(
      `👋 🤚 🖐️ ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 💪 🦾 👀 👅 👄 💋 🧠 🫶`,
    ),
  },
  {
    id: 'hearts',
    label: 'Hearts',
    icon: '❤️',
    emojis: split(
      `❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 🔥 ✨ 💫 ⭐ 🌟 💯 💥 💢 💦 💤`,
    ),
  },
  {
    id: 'animals',
    label: 'Nature',
    icon: '🐶',
    emojis: split(
      `🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦄 🐝 🦋 🐢 🐍 🐙 🐬 🐳 🌸 🌹 🌺 🌻 🌼 🌷 🌱 🌴 🍀 🍁 🌈 ☀️ 🌙 ⚡ ❄️ 🌊`,
    ),
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍕',
    emojis: split(
      `🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🥑 🍆 🌶️ 🌽 🥕 🥐 🍞 🧀 🍳 🥞 🥓 🍔 🍟 🍕 🌭 🌮 🌯 🍣 🍜 🍩 🍪 🎂 🍰 🍫 🍿 ☕ 🍷 🍸 🍹 🍺 🥂`,
    ),
  },
  {
    id: 'activity',
    label: 'Activity',
    icon: '⚽',
    emojis: split(
      `⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🏓 🏸 🥊 🎯 🎳 🎮 🎲 🎸 🎹 🎤 🎧 🎬 🎨 🏆 🥇 🎁 🎉 🎊 🎈 📸 🎥 📱 💻 💰 💎 🚀 ✈️ 🚗 🏖️ 🏔️`,
    ),
  },
];
