import { readUsersDb, writeUsersDb } from '../lib/database.js';

const spells = {
    'fireball': { name: "Bola de Fuego", level: 5, cost: 1000 },
    'icestorm': { name: "Tormenta de Hielo", level: 10, cost: 5000 }
};

const spellbookCommand = {
  name: "spellbook",
  category: "rpg",
  description: "Aprende y gestiona tus hechizos. Uso: `spellbook learn <hechizo>`",
  aliases: ["hechizos", "magia"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    if (!user.inventory.spells) {
        user.inventory.spells = [];
    }

    const subCommand = args[0];
    const spellName = args[1];

    if (subCommand === 'learn') {
        const spell = spells[spellName];
        if (!spell) {
            return sock.sendMessage(msg.key.remoteJid, { text: "Ese hechizo no existe." }, { quoted: msg });
        }
        if (user.level < spell.level) {
            return sock.sendMessage(msg.key.remoteJid, { text: `Necesitas ser nivel ${spell.level} para aprender ${spell.name}.` }, { quoted: msg });
        }
        if (user.coins < spell.cost) {
            return sock.sendMessage(msg.key.remoteJid, { text: `Necesitas ${spell.cost} monedas para aprender este hechizo.` }, { quoted: msg });
        }
        if (user.inventory.spells.includes(spellName)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "Ya conoces este hechizo." }, { quoted: msg });
        }

        user.coins -= spell.cost;
        user.inventory.spells.push(spellName);
        writeUsersDb(usersDb);
        return sock.sendMessage(msg.key.remoteJid, { text: `Has aprendido el hechizo: *${spell.name}*!` }, { quoted: msg });
    }

    let spellList = "*📖 Tu Libro de Hechizos 📖*\n\n";
    if (user.inventory.spells.length > 0) {
        user.inventory.spells.forEach(s => {
            spellList += `- ${spells[s].name}\n`;
        });
    } else {
        spellList += "Aún no has aprendido ningún hechizo.";
    }

    await sock.sendMessage(msg.key.remoteJid, { text: spellList }, { quoted: msg });
  }
};

export default spellbookCommand;
