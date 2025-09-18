import { readUsersDb, writeUsersDb } from '../lib/database.js';
import config from '../config.js';

const slotsCommand = {
  name: "slots",
  category: "economia",
  description: "Juega a la máquina tragamonedas y prueba tu suerte. Uso: slots <apuesta>",
  aliases: ["slot", "tragamonedas"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const MIN_BET = 10;

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa `reg`." }, { quoted: msg });
    }

    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet < MIN_BET) {
      return sock.sendMessage(msg.key.remoteJid, { text: `Debes apostar al menos ${MIN_BET} monedas.` }, { quoted: msg });
    }

    if (user.coins < bet) {
      return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes monedas para apostar ${bet}. Saldo actual: ${user.coins}` }, { quoted: msg });
    }

    user.coins -= bet; // Cobrar la apuesta por adelantado

    const emojis = ["🍒", "🍋", "🍊", "🍉", "🍇", "💎", "🔔", " BAR "];
    const results = [
      emojis[Math.floor(Math.random() * emojis.length)],
      emojis[Math.floor(Math.random() * emojis.length)],
      emojis[Math.floor(Math.random() * emojis.length)]
    ];

    const resultString = `\n\n[ ${results.join(" | ")} ]\n\n`;
    let winAmount = 0;

    const [r1, r2, r3] = results;

    if (r1 === "💎" && r2 === "💎" && r3 === "💎") {
      winAmount = bet * 20;
    } else if (r1 === r2 && r2 === r3) {
      winAmount = bet * 10;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      winAmount = bet * 3;
    }

    let message;
    if (winAmount > 0) {
      const tax = Math.floor(winAmount * config.taxRate);
      const netWin = winAmount - tax;
      user.coins += netWin;
      message = `*¡FELICIDADES!* Ganaste *${winAmount.toLocaleString()}* monedas.\n` +
                `Tras un impuesto de *${tax.toLocaleString()}*, recibes *${netWin.toLocaleString()}*.\n`;
    } else {
      message = "¡Mala suerte! Sigue intentándolo.";
    }

    writeUsersDb(usersDb);

    const finalMessage = `🎰 *Tragamonedas* 🎰\n*Apuesta:* ${bet.toLocaleString()}\n${resultString}${message}\n*Saldo final:* ${user.coins.toLocaleString()} monedas.`;
    await sock.sendMessage(msg.key.remoteJid, { text: finalMessage }, { quoted: msg });
  }
};

export default slotsCommand;
