import { readUsersDb } from '../lib/database.js';

// --- Elementos de Decoración Aleatorios ---

const greetings = ["¡Hola!", "¡Bienvenido/a!", "¡Qué tal!", "¡Saludos!", "¡Hey!"];
const titles = ["MENÚ PRINCIPAL", "LISTA DE COMANDOS", "CENTRO DE AYUDA", "NAVEGADOR DE FUNCIONES"];
const emojis = ["🎀", "✨", "🌸", "🤖", "⚙️", "💡", "📚", "🎮", "👥", "👑"];
const lineStyles = ["═", "─", "━", "┄", "┅", "┈", "┉", "╍", "╌", "╎"];

const categoryEmojis = {
  'general': '📜', 'descargas': '📥', 'diversion': '🧸', 'juegos': '🎮',
  'grupos': '👥', 'propietario': '👑', 'herramientas': '🛠️', 'informacion': '📚',
  'sub-bots': '🤖', 'ia': '🧠', 'busquedas': '🔎', 'otros': '⚙️'
};

// --- Función para barajar un array (Fisher-Yates) ---
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const menuCommand = {
  name: "menu",
  category: "general",
  description: "Muestra el menú de comandos del bot de forma aleatoria y personalizada.",
  aliases: ["help", "ayuda"],

  async execute({ sock, msg, commands, config }) {
    const senderId = msg.key.participant || msg.key.remoteJid;
    const users = readUsersDb();
    const user = users[senderId] || {};

    // --- Seleccionar elementos aleatorios para esta invocación ---
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];
    const line = lineStyles[Math.floor(Math.random() * lineStyles.length)].repeat(10);
    const topBorder = `╭${line}『`;
    const midBorder = `│`;
    const botBorder = `╰${line}』`;

    // --- Construir Cabecera Personalizada ---
    let menuHeader = `${topBorder} ${randomEmoji()} *${randomTitle}* ${randomEmoji()} 』\n`;
    menuHeader += `${midBorder} ${randomGreeting}, *${user.name || msg.pushName}*!\n`;
    menuHeader += `${midBorder}\n`;
    menuHeader += `${midBorder} 👤 *Usuario:* ${user.name || 'No registrado'}\n`;
    menuHeader += `${midBorder} 🎖️ *Nivel:* ${user.level || 0}\n`;
    menuHeader += `${midBorder} 💰 *Balance:* ${user.balance || 0} monedas\n`;
    menuHeader += `${midBorder} ⚙️ *Versión:* ${config.version || '1.0.0'}\n`;
    menuHeader += `${botBorder}\n\n`;

    // --- Agrupar y barajar categorías ---
    const categories = {};
    commands.forEach(command => {
      if (!command.category || command.name === 'test') return;
      if (!categories[command.category]) categories[command.category] = [];
      categories[command.category].push(command.name);
    });

    const shuffledCategories = shuffleArray(Object.keys(categories));

    // --- Construir Cuerpo del Menú ---
    let menuBody = '';
    for (const category of shuffledCategories) {
      const catEmoji = categoryEmojis[category.toLowerCase()] || '✨';
      const catTitle = category.charAt(0).toUpperCase() + category.slice(1);

      menuBody += `${topBorder} ${catEmoji} *${catTitle}* 』\n`;

      const commandList = categories[category]
        .map(cmd => `${midBorder} › ${cmd}`)
        .join('\n');

      menuBody += `${commandList}\n`;
      menuBody += `${botBorder}\n\n`;
    }

    // --- Construir Pie de Página ---
    let menuFooter = `${topBorder} ${randomEmoji()} *Créditos* ${randomEmoji()} 』\n`;
    menuFooter += `${midBorder} Creado por: *${config.ownerName}*\n`;
    menuFooter += `${midBorder} ¡Disfruta del bot!\n`;
    menuFooter += `${botBorder}`;

    // --- Ensamblar y Enviar Menú ---
    const fullMenuText = menuHeader + menuBody + menuFooter;

    await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: fullMenuText,
        // Opcional: añadir una imagen o video de fondo si se desea
        // image: { url: 'URL_DE_IMAGEN' }
      },
      { quoted: msg }
    );
  }
};

export default menuCommand;
