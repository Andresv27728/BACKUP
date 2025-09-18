import { readUsersDb, writeUsersDb } from '../lib/database.js';

const robCommand = {
  name: "rob",
  category: "economia",
  description: "Intenta robar monedas a otro usuario. El éxito depende de tu nivel y el de la víctima.",
  aliases: ["robar"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const robber = usersDb[senderId];
    const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 horas

    if (!robber) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa `reg`." }, { quoted: msg });
    }

    const lastRob = robber.lastRob || 0;
    const now = Date.now();
    if (now - lastRob < COOLDOWN_MS) {
        const timeLeft = COOLDOWN_MS - (now - lastRob);
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return sock.sendMessage(msg.key.remoteJid, { text: `Debes esperar ${hoursLeft}h y ${minutesLeft}m para volver a robar.` }, { quoted: msg });
    }

    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentionedJid) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Debes mencionar a un usuario para robarle. Ejemplo: `rob @usuario`" }, { quoted: msg });
    }

    const victim = usersDb[mentionedJid];
    if (!victim) {
      return sock.sendMessage(msg.key.remoteJid, { text: "El usuario mencionado no está registrado." }, { quoted: msg });
    }

    if (senderId === mentionedJid) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No puedes robarte a ti mismo." }, { quoted: msg });
    }

    if ((victim.coins || 0) < 100) { // No robar a pobres
        return sock.sendMessage(msg.key.remoteJid, { text: "La víctima es demasiado pobre, no vale la pena el riesgo." }, { quoted: msg });
    }

    robber.lastRob = now;

    // La probabilidad de éxito depende de la diferencia de nivel
    const levelDifference = robber.level - victim.level;
    const successChance = 0.5 + (levelDifference * 0.05); // 50% base, +/- 5% por cada nivel de diferencia
    const finalSuccessChance = Math.max(0.1, Math.min(0.9, successChance)); // Clamp between 10% and 90%

    if (Math.random() < finalSuccessChance) {
      // Éxito
      const maxSteal = victim.coins * 0.25; // Roba hasta el 25%
      const stolenAmount = Math.floor(Math.random() * maxSteal) + 1;

      robber.coins += stolenAmount;
      victim.coins -= stolenAmount;

      const xpGained = Math.floor(stolenAmount / 10); // Gana XP basado en el robo
      robber.xp += xpGained;

      writeUsersDb(usersDb);

      const successMessage = `🚨 *¡Robo exitoso!* 🚨\n\n` +
                             `Le has robado *${stolenAmount.toLocaleString()} monedas* a @${mentionedJid.split('@')[0]}.\n` +
                             `También ganaste *${xpGained} XP*.`;

      await sock.sendMessage(msg.key.remoteJid, { text: successMessage, mentions: [mentionedJid] }, { quoted: msg });

    } else {
      // Fracaso
      const penalty = Math.floor(robber.coins * 0.1); // Pierde 10% de sus monedas
      robber.coins -= penalty;
      writeUsersDb(usersDb);

      const failMessage = `🚓 *¡Te atraparon!* 🚓\n\n` +
                          `Fallaste el robo y perdiste *${penalty.toLocaleString()} monedas* como multa.`;
      await sock.sendMessage(msg.key.remoteJid, { text: failMessage }, { quoted: msg });
    }
  }
};

export default robCommand;
