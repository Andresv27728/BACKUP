import { readUsersDb, writeUsersDb, checkLevelUp } from '../lib/database.js';

const huntCommand = {
  name: "hunt",
  category: "rpg",
  description: "Caza criaturas en la naturaleza para obtener recompensas.",
  aliases: ["cazar"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutos

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    const lastHunt = user.lastHunt || 0;
    const now = Date.now();

    if (now - lastHunt < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastHunt);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Debes esperar ${minutesLeft}m para volver a cazar.` }, { quoted: msg });
    }

    user.lastHunt = now;

    const xpGained = Math.floor(Math.random() * 30) + 10; // 10-40 XP
    user.xp += xpGained;

    let lootMessage = `Ganaste *${xpGained} XP* por la cacería.\n`;
    const lootRoll = Math.random();

    // Simple loot system based on roll
    if (lootRoll < 0.6) { // 60% chance de monedas
        const coinsGained = Math.floor(Math.random() * 50) + 20; // 20-70 coins
        user.coins += coinsGained;
        lootMessage += `Obtuviste *${coinsGained} monedas* de un jabalí.`;
    } else if (lootRoll < 0.9) { // 30% chance de item
        lootMessage += `Encontraste un objeto raro en un nido de grifos, pero aún no se ha implementado.`;
    } else { // 10% chance de nada
        lootMessage += `El ciervo que perseguías fue más rápido y escapó.`;
    }

    const levelUpMessage = checkLevelUp(user);
    writeUsersDb(usersDb);

    let fullMessage = `🏹 *De Cacería...*\n\n${lootMessage}`;
    if (levelUpMessage) {
      fullMessage += `\n\n${levelUpMessage}`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: fullMessage }, { quoted: msg });
  }
};

export default huntCommand;
