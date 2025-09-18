import { readUsersDb, writeUsersDb } from '../lib/database.js';

const smithCommand = {
  name: "smith",
  category: "rpg",
  description: "Mejora tu equipamiento en la herrería.",
  aliases: ["herrero", "mejorar"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const itemToUpgrade = args[0]; // 'weapon' o 'armor'
    const UPGRADE_COST_IRON = 10;
    const UPGRADE_COST_COINS = 500;

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    if (!itemToUpgrade || !user.equipment[itemToUpgrade]) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No tienes ese objeto equipado o no especificaste qué mejorar (ej. `smith weapon`)." }, { quoted: msg });
    }

    if ((user.inventory.iron || 0) < UPGRADE_COST_IRON || user.coins < UPGRADE_COST_COINS) {
        return sock.sendMessage(msg.key.remoteJid, { text: `Necesitas ${UPGRADE_COST_IRON} de hierro y ${UPGRADE_COST_COINS} monedas para mejorar.` }, { quoted: msg });
    }

    user.inventory.iron -= UPGRADE_COST_IRON;
    user.coins -= UPGRADE_COST_COINS;

    let improvement = 2; // +2 al stat por mejora
    let message;

    if (itemToUpgrade === 'weapon' && user.equipment.weapon) {
        user.equipment.weapon.strength += improvement;
        user.strength += improvement;
        message = `El herrero ha afilado tu arma. Ganas *+${improvement} de fuerza*.`;
    } else if (itemToUpgrade === 'armor' && user.equipment.armor) {
        user.equipment.armor.defense += improvement;
        user.defense += improvement;
        message = `El herrero ha reforzado tu armadura. Ganas *+${improvement} de defensa*.`;
    } else {
        // Devolver recursos si el item no era mejorable de esta forma
        user.inventory.iron += UPGRADE_COST_IRON;
        user.coins += UPGRADE_COST_COINS;
        return sock.sendMessage(msg.key.remoteJid, { text: "No se pudo mejorar ese objeto." }, { quoted: msg });
    }

    writeUsersDb(usersDb);
    await sock.sendMessage(msg.key.remoteJid, { text: `*🔥 En la Herrería...*\n\n${message}` }, { quoted: msg });
  }
};

export default smithCommand;
