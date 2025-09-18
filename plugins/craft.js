import { readUsersDb, writeUsersDb } from '../lib/database.js';

const craftableItems = {
    'sword': { name: "Espada de Hierro", requires: { iron: 10, wood: 5 }, gives: { strength: 5 } },
    'shield': { name: "Escudo de Hierro", requires: { iron: 15 }, gives: { defense: 5 } },
    'adv_potion': { name: "Poción Avanzada", requires: { potions: 3 }, gives: { inventory: { potions: -3, adv_potions: 1 } } }
};

const craftCommand = {
  name: "craft",
  category: "rpg",
  description: "Fabrica objetos y equipamiento usando los recursos de tu inventario. Uso: `craft list` o `craft <item>`",
  aliases: ["fabricar"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    const itemToCraft = args[0];

    if (!itemToCraft || itemToCraft === 'list') {
        let list = "*🛠️ Objetos Fabricables 🛠️*\n\n";
        for (const key in craftableItems) {
            const item = craftableItems[key];
            let reqs = Object.entries(item.requires).map(([k, v]) => `${v} ${k}`).join(', ');
            list += `*${item.name}* (\`${key}\`)\n_Requiere: ${reqs}_\n\n`;
        }
        return sock.sendMessage(msg.key.remoteJid, { text: list }, { quoted: msg });
    }

    const craftData = craftableItems[itemToCraft];
    if (!craftData) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No se encontró ese objeto para fabricar." }, { quoted: msg });
    }

    // Comprobar si tiene los materiales
    for (const material in craftData.requires) {
        if ((user.inventory[material] || 0) < craftData.requires[material]) {
            return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes materiales. Necesitas ${craftData.requires[material]} de ${material}.` }, { quoted: msg });
        }
    }

    // Consumir materiales
    for (const material in craftData.requires) {
        user.inventory[material] -= craftData.requires[material];
    }

    // Dar objeto/stat
    let successMessage = `*¡Has fabricado una ${craftData.name}!*`;
    if (craftData.gives.inventory) {
        // Lógica para añadir/quitar del inventario
    } else { // Asumir que es equipamiento
        user.equipment[itemToCraft] = craftData.gives;
        user.strength += craftData.gives.strength || 0;
        user.defense += craftData.gives.defense || 0;
        successMessage += `\nTu fuerza y defensa han aumentado.`
    }

    writeUsersDb(usersDb);
    await sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
  }
};

export default craftCommand;
