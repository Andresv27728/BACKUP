// 🎀 Mapa de emojis para las categorías
const categoryEmojis = {
  '𝗚𝗘𝗡𝗘𝗥𝗔𝗟': '📜',
  '𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗦': '📥',
  '𝗗𝗜𝗩𝗘𝗥𝗦𝗜𝗢𝗡': '🧸',
  '𝗝𝗨𝗘𝗚𝗢𝗦': '🎮',
  '𝗚𝗥𝗨𝗣𝗢𝗦': '👥',
  '𝗣𝗥𝗢𝗣𝗜𝗘𝗧𝗔𝗥𝗜𝗢': '👑',
  '𝗛𝗘𝗥𝗥𝗔𝗠𝗜𝗘𝗡𝗧𝗔𝗦': '🛠️',
  '𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗖𝗜𝗢𝗡': '📚',
  '𝗦𝗨𝗕-𝗕𝗢𝗧𝗦': '🤖',
  '𝗜𝗔': '🧠',
  '𝗢𝗧𝗥𝗢𝗦': '⚙️'
};

// 🎨 30 estilos de bordes decorativos
const borders = [
  { top: "╭═══『", mid: "┃", bot: "╰═══════════════╯" },
  { top: "┏━✦", mid: "┃", bot: "┗━━━━━━━━━━━━━━━┛" },
  { top: "✦━━•", mid: "┃", bot: "•━━━━━━━━━━━━━✦" },
  { top: "◆━❖", mid: "┃", bot: "❖━━━━━━━━━━━━━◆" },
  { top: "◈──", mid: "┃", bot: "──◈" },
  { top: "▣━", mid: "┃", bot: "━▣" },
  { top: "✧━", mid: "┃", bot: "━✧" },
  { top: "⊹⋙", mid: "┃", bot: "⋘⊹" },
  { top: "✪━", mid: "┃", bot: "━✪" },
  { top: "◉━", mid: "┃", bot: "━◉" },
  { top: "✿━", mid: "┃", bot: "━✿" },
  { top: "❖━", mid: "┃", bot: "━❖" },
  { top: "➳━", mid: "┃", bot: "━➳" },
  { top: "☯━", mid: "┃", bot: "━☯" },
  { top: "✦⋆", mid: "┃", bot: "⋆✦" },
  { top: "➸━", mid: "┃", bot: "━➸" },
  { top: "♛━", mid: "┃", bot: "━♛" },
  { top: "★━", mid: "┃", bot: "━★" },
  { top: "♜━", mid: "┃", bot: "━♜" },
  { top: "☠━", mid: "┃", bot: "━☠" },
  { top: "♞━", mid: "┃", bot: "━♞" },
  { top: "➶━", mid: "┃", bot: "━➶" },
  { top: "✩━", mid: "┃", bot: "━✩" },
  { top: "☾━", mid: "┃", bot: "━☽" },
  { top: "✧━", mid: "┃", bot: "━✧" },
  { top: "✦━", mid: "┃", bot: "━✦" },
  { top: "♠━", mid: "┃", bot: "━♠" },
  { top: "♣━", mid: "┃", bot: "━♣" },
  { top: "♥━", mid: "┃", bot: "━♥" },
  { top: "♦━", mid: "┃", bot: "━♦" }
];

const menuCommand = {
  name: "menu",
  category: "general",
  description: "Muestra el menú de comandos del bot.",
  aliases: ["help", "ayuda"],

  async execute({ sock, msg, commands, config }) {
    const categories = {};

    // 🔀 Elegir un estilo aleatorio
    const border = borders[Math.floor(Math.random() * borders.length)];

    // Agrupar comandos por categoría
    commands.forEach(command => {
      if (!command.category || command.name === 'test') return;
      if (!categories[command.category]) categories[command.category] = [];
      categories[command.category].push(command);
    });

    // Ordenar categorías alfabéticamente
    const sortedCategories = Object.keys(categories).sort();

    // 🌸 --- Construcción del menú con decoración aleatoria ---
    let menuText = `${border.top} 🎀 *MENU PRINCIPAL* 🎀 』\n`;
    menuText += `${border.mid} ✨ Hola, *${msg.pushName}*\n`;
    menuText += `${border.mid} ⚙️ Versión: *${config.version || '1.0.0'}*\n`;
    menuText += `${border.mid} 👑 Owner: *${config.ownerName}*\n`;
    menuText += `${border.bot}\n\n`;

    for (const category of sortedCategories) {
      const emoji = categoryEmojis[category] || '✨';
      menuText += `${border.top} ${emoji} *${category.toUpperCase()}* 』\n`;

      const commandList = categories[category]
        .filter((cmd, index, self) => self.findIndex(c => c.name === cmd.name) === index)
        .map(cmd => `${border.mid} ⤷ ${cmd.name}`)
        .join('\n');

      menuText += `${commandList}\n`;
      menuText += `${border.bot}\n\n`;
    }

    menuText += `${border.top} 👑 *CREDITOS* 👑 』\n`;
    menuText += `${border.mid} 💎 Creado por: *${config.ownerName}*\n`;
    menuText += `${border.mid} 🎉 Disfruta de: *BOT DE YO SOY YO*\n`;
    menuText += `${border.bot}`;

    await sock.sendMessage(
      msg.key.remoteJid,
      {
        image: { url: 'https://files.catbox.moe/itgz1x.png' },
        caption: menuText,
        mimetype: 'image/png'
      },
      { quoted: msg }
    );
  }
};

export default menuCommand;
