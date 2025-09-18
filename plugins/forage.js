import { readUsersDb, writeUsersDb, checkLevelUp } from '../lib/database.js';

const forageCommand = {
  name: "forage",
  category: "rpg",
  description: "Busca recursos en el bosque. Puedes encontrar bayas, hierbas o incluso objetos raros.",
  aliases: ["buscar", "recolectar"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    const lastForage = user.lastForage || 0;
    const now = Date.now();

    if (now - lastForage < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastForage);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Debes esperar ${minutesLeft}m para volver a buscar recursos.` }, { quoted: msg });
    }

    user.lastForage = now;

    const xpGained = Math.floor(Math.random() * 15) + 5; // 5-20 XP
    user.xp += xpGained;

    let lootMessage = `Ganaste *${xpGained} XP*.\n`;
    const lootRoll = Math.random();

    if (lootRoll < 0.5) { // 50% chance de poción
      const amount = 1;
      user.inventory.potions = (user.inventory.potions || 0) + amount;
      lootMessage += `Encontraste *${amount} poción(es)*.`;
    } else if (lootRoll < 0.8) { // 30% chance de madera
      const amount = Math.floor(Math.random() * 5) + 1;
      user.inventory.wood = (user.inventory.wood || 0) + amount;
      lootMessage += `Recogiste *${amount} de madera*.`;
    } else { // 20% chance de nada especial
      lootMessage += "No encontraste nada de especial valor esta vez.";
    }

    const levelUpMessage = checkLevelUp(user);
    writeUsersDb(usersDb);

    let fullMessage = `🌲 *Buscando Recursos...*\n\n${lootMessage}`;
    if (levelUpMessage) {
      fullMessage += `\n\n${levelUpMessage}`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: fullMessage }, { quoted: msg });
  }
};

export default forageCommand;
