// 🔱 Mapa de emojis para las categorías temático de Gura
const categoryEmojis = {
  'general': '🔱',
  'descargas': '🌊',
  'diversion': '🐟',
  'juegos': '🎮',
  'grupos': '👥',
  'propietario': '👑',
  'herramientas': '🛠️',
  'informacion': '📚',
  'sub-bots': '🤖',
  'ia': '🧠',
  'otros': '⚙️'
};

// 🌊 Estilos de bordes temáticos de Gura
const borders = [
  { top: "╭─≈「", mid: "│", bot: "╰≈───≈───≈───≈╯" },
  { top: "╔═▷", mid: "║", bot: "╚═════════════▷" },
  { top: "┌─🦈", mid: "│", bot: "└───────────🦈" },
  { top: "╭┈➤", mid: "│", bot: "╰───────────➤" },
  { top: "┏~～", mid: "┃", bot: "┗~～~～~～~～~～┛" }
];

const menuCommand = {
  name: "menu",
  category: "general",
  description: "Muestra el menú de comandos del bot.",
  aliases: ["help", "menu","menú"],

  async execute({ sock, msg, commands, config }) {
    const categories = {};
    const senderName = msg.pushName || 'Chumbie';

    // 🔀 Elegir un estilo aleatorio
    const border = borders[Math.floor(Math.random() * borders.length)];

    // Agrupar comandos por categoría
    commands.forEach(command => {
      if (!command.category || command.name === 'test') return;
      const category = command.category.toLowerCase();
      if (!categories[category]) categories[category] = [];
      categories[category].push(command);
    });

    // Ordenar categorías
    const sortedCategories = Object.keys(categories).sort();

    // 🔱 --- Construcción del menú ---
    let menuText = `${border.top} *GURA* 🔱』\n`;
    menuText += `${border.mid} Hey, *${senderName}*!\n`;
    menuText += `${border.mid} Bot Name: *${config.botName}*\n`;
    menuText += `${border.mid} By: *${config.ownerName}*\n`;
    menuText += `${border.bot}\n\n`;

    for (const category of sortedCategories) {
      const emoji = categoryEmojis[category] || '🔱';
      menuText += `${border.top} ${emoji} *${category.toUpperCase()}* 』\n`;

      const commandList = categories[category]
        .filter((cmd, index, self) => self.findIndex(c => c.name === cmd.name) === index)
        .map(cmd => `${border.mid} ⤷ ${cmd.name}`)
        .join('\n');

      menuText += `${commandList}\n`;
      menuText += `${border.bot}\n\n`;
    }

    menuText += `${border.top} 🌊 *ATLANTIS* 🌊 』\n`;
    menuText += `${border.mid} Thanks for using me, Chumbie!\n`;
    menuText += `${border.mid} a.\n`;
    menuText += `${border.bot}`;

    await sock.sendMessage(
      msg.key.remoteJid,
      {
        image: { url: 'https://files.catbox.moe/tr0lls.jpg' },
        caption: menuText,
        mimetype: 'image/jpeg'
      },
      { quoted: msg }
    );
  }
};

export default menuCommand;
