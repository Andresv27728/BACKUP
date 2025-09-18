import { readUsersDb, writeUsersDb } from '../lib/database.js';

const bankCommand = {
  name: "bank",
  category: "economia",
  description: "Gestiona tu cuenta bancaria. Uso: `bank`, `bank deposit <cantidad>`, `bank withdraw <cantidad>`",
  aliases: ["banco"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa `reg`." }, { quoted: msg });
    }

    const subCommand = args[0]?.toLowerCase();
    const amountStr = args[1];

    if (!subCommand) {
      // Mostrar balance
      const balanceMessage = `*🏦 Balance Bancario 🏦*\n\n` +
                             `*Cartera:* ${user.coins.toLocaleString()} monedas 🪙\n` +
                             `*Banco:* ${user.bank.toLocaleString()} monedas 💰\n\n` +
                             `Usa \`bank deposit <cantidad>\` o \`bank withdraw <cantidad>\`.`;
      return sock.sendMessage(msg.key.remoteJid, { text: balanceMessage }, { quoted: msg });
    }

    if (subCommand === 'deposit') {
      const amount = parseInt(amountStr, 10);
      if (isNaN(amount) || amount <= 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, introduce una cantidad válida para depositar." }, { quoted: msg });
      }
      if (user.coins < amount) {
        return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes monedas en tu cartera para depositar ${amount.toLocaleString()}.` }, { quoted: msg });
      }
      user.coins -= amount;
      user.bank += amount;
      writeUsersDb(usersDb);
      return sock.sendMessage(msg.key.remoteJid, { text: `✅ Has depositado *${amount.toLocaleString()} monedas* en tu cuenta bancaria.` }, { quoted: msg });
    }

    if (subCommand === 'withdraw') {
      const amount = parseInt(amountStr, 10);
      if (isNaN(amount) || amount <= 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, introduce una cantidad válida para retirar." }, { quoted: msg });
      }
      if (user.bank < amount) {
        return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes monedas en tu banco para retirar ${amount.toLocaleString()}.` }, { quoted: msg });
      }
      user.bank -= amount;
      user.coins += amount;
      writeUsersDb(usersDb);
      return sock.sendMessage(msg.key.remoteJid, { text: `✅ Has retirado *${amount.toLocaleString()} monedas* de tu cuenta bancaria.` }, { quoted: msg });
    }

    return sock.sendMessage(msg.key.remoteJid, { text: "Comando bancario no reconocido. Usa `bank`, `bank deposit` o `bank withdraw`." }, { quoted: msg });
  }
};

export default bankCommand;
