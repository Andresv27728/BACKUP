import { readUsersDb, writeUsersDb } from '../lib/database.js';

const begCommand = {
  name: "beg",
  category: "economia",
  description: "Mendiga por algunas monedas. A veces la gente es generosa.",
  aliases: ["mendigar"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa `reg`." }, { quoted: msg });
    }

    const lastBeg = user.lastBeg || 0;
    const now = Date.now();

    if (now - lastBeg < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastBeg);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `La gente se cansa de verte mendigar. Vuelve en ${minutesLeft}m.` }, { quoted: msg });
    }

    user.lastBeg = now;

    const amountGained = Math.floor(Math.random() * 50) + 1; // Gana entre 1 y 50 monedas
    user.coins += amountGained;

    writeUsersDb(usersDb);

    const messages = [
        `Un buen samaritano te ha dado *${amountGained} monedas*.`,
        `Después de mucho suplicar, alguien te lanzó *${amountGained} monedas*.`,
        `"Toma, cómprate algo bonito", te dicen mientras te dan *${amountGained} monedas*.`
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await sock.sendMessage(msg.key.remoteJid, { text: `🙏 *Mendigando...*\n\n${randomMessage}` }, { quoted: msg });
  }
};

export default begCommand;
