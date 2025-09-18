import { readUsersDb, writeUsersDb, checkLevelUp } from '../lib/database.js';

const chopCommand = {
  name: "chop",
  category: "rpg",
  description: "Tala árboles para conseguir madera.",
  aliases: ["talar", "cortar"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const COOLDOWN_MS = 8 * 60 * 1000; // 8 minutos

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    const lastChop = user.lastChop || 0;
    const now = Date.now();

    if (now - lastChop < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastChop);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Necesitas afilar tu hacha. Espera ${minutesLeft}m.` }, { quoted: msg });
    }

    user.lastChop = now;

    const xpGained = Math.floor(Math.random() * 20) + 10; // 10-30 XP
    user.xp += xpGained;

    const woodGained = Math.floor(Math.random() * 8) + 2; // 2-10 de madera
    user.inventory.wood = (user.inventory.wood || 0) + woodGained;

    let message = `Ganaste *${xpGained} XP* y recogiste *${woodGained} de madera*.`;

    const levelUpMessage = checkLevelUp(user);
    writeUsersDb(usersDb);

    let fullMessage = `🪓 *Talando Árboles...*\n\n${message}`;
    if (levelUpMessage) {
      fullMessage += `\n\n${levelUpMessage}`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: fullMessage }, { quoted: msg });
  }
};

export default chopCommand;
