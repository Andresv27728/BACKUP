import { readUsersDb, writeUsersDb } from '../lib/database.js';

const healCommand = {
  name: "heal",
  category: "rpg",
  description: "Usa una poción para recuperar HP o descansa para curarte lentamente.",
  aliases: ["curar"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    if (user.hp >= user.maxHp) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Ya tienes toda tu vida." }, { quoted: msg });
    }

    // Curar con poción
    if (args[0] === 'potion') {
        if (!user.inventory.potions || user.inventory.potions < 1) {
            return sock.sendMessage(msg.key.remoteJid, { text: "No tienes pociones. Encuéntralas en tus aventuras o cómpralas en la tienda." }, { quoted: msg });
        }

        user.inventory.potions--;
        const healAmount = Math.floor(user.maxHp * 0.5); // Cura el 50% de la vida máxima
        user.hp = Math.min(user.maxHp, user.hp + healAmount);

        writeUsersDb(usersDb);
        return sock.sendMessage(msg.key.remoteJid, { text: `Usaste una poción y recuperaste *${healAmount} HP*. Ahora tienes ${user.hp}/${user.maxHp} HP.` }, { quoted: msg });
    }

    // Curar con descanso (cooldown)
    const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutos
    const lastHeal = user.lastHeal || 0;
    const now = Date.now();

    if (now - lastHeal < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastHeal);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Necesitas descansar más. Podrás curarte de nuevo en ${minutesLeft}m.` }, { quoted: msg });
    }

    user.lastHeal = now;
    const healAmount = Math.floor(user.maxHp * 0.2); // Cura el 20%
    user.hp = Math.min(user.maxHp, user.hp + healAmount);

    writeUsersDb(usersDb);
    await sock.sendMessage(msg.key.remoteJid, { text: `Descansaste junto a una fogata y recuperaste *${healAmount} HP*. Ahora tienes ${user.hp}/${user.maxHp} HP.` }, { quoted: msg });
  }
};

export default healCommand;
