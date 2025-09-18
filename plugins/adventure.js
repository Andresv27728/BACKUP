import { readUsersDb, writeUsersDb, checkLevelUp } from '../lib/database.js';

const adventureCommand = {
  name: "adventure",
  category: "rpg",
  description: "Embárcate en una aventura para encontrar tesoros y ganar experiencia.",
  aliases: ["aventura"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    const lastAdventure = user.lastAdventure || 0;
    const now = Date.now();

    if (now - lastAdventure < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastAdventure);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Necesitas descansar de tu última aventura. Espera ${minutesLeft}m.` }, { quoted: msg });
    }

    user.lastAdventure = now;

    const xpGained = Math.floor(Math.random() * 100) + 50; // 50-150 XP
    const coinsGained = Math.floor(Math.random() * 200) + 100; // 100-300 coins
    user.xp += xpGained;
    user.coins += coinsGained;

    // Simular una pequeña pérdida de HP
    const hpLost = Math.floor(Math.random() * 15) + 5; // 5-20 HP
    user.hp = Math.max(0, user.hp - hpLost);

    let message = `Te adentraste en una cueva oscura y, tras luchar con algunas arañas, encontraste un cofre.\n\n` +
                  `Ganaste *${xpGained} XP* y *${coinsGained} monedas*.\n` +
                  `Perdiste *${hpLost} HP* en la batalla.`;

    if (user.hp === 0) {
        message += `\n\n*¡Has sido derrotado!* Necesitas curarte para seguir luchando.`;
    }

    const levelUpMessage = checkLevelUp(user);
    writeUsersDb(usersDb);

    let fullMessage = `🌄 *De Aventura...*\n\n${message}`;
    if (levelUpMessage) {
      fullMessage += `\n\n${levelUpMessage}`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: fullMessage }, { quoted: msg });
  }
};

export default adventureCommand;
