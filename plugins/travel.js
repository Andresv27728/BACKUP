import { readUsersDb, writeUsersDb } from '../lib/database.js';

const locations = {
    'forest': { name: "Bosque Tenebroso", cost: 100, minLevel: 5 },
    'mountains': { name: "Montañas Heladas", cost: 300, minLevel: 10 },
    'castle': { name: "Castillo del Rey Demonio", cost: 1000, minLevel: 20 }
};

const travelCommand = {
  name: "travel",
  category: "rpg",
  description: "Viaja a nuevas y peligrosas localizaciones. Uso: `travel list` o `travel <lugar>`",
  aliases: ["viajar"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    if (!user.location) {
        user.location = 'village'; // Ubicación inicial
    }

    const destinationName = args[0];

    if (!destinationName || destinationName === 'list') {
        let travelList = "*✈️ Destinos Disponibles ✈️*\n\n";
        for (const key in locations) {
            const loc = locations[key];
            travelList += `*${loc.name}* (\`${key}\`)\n_Costo: ${loc.cost} monedas, Nivel Mín: ${loc.minLevel}_\n\n`;
        }
        travelList += `Tu ubicación actual es: *${user.location}*`;
        return sock.sendMessage(msg.key.remoteJid, { text: travelList }, { quoted: msg });
    }

    const destination = locations[destinationName];
    if (!destination) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Ese destino no existe." }, { quoted: msg });
    }

    if (user.location === destinationName) {
        return sock.sendMessage(msg.key.remoteJid, { text: `Ya te encuentras en ${destination.name}.` }, { quoted: msg });
    }

    if (user.level < destination.minLevel) {
        return sock.sendMessage(msg.key.remoteJid, { text: `Necesitas ser nivel ${destination.minLevel} para viajar a ${destination.name}.` }, { quoted: msg });
    }

    if (user.coins < destination.cost) {
        return sock.sendMessage(msg.key.remoteJid, { text: `Necesitas ${destination.cost} monedas para el viaje.` }, { quoted: msg });
    }

    user.coins -= destination.cost;
    user.location = destinationName;

    writeUsersDb(usersDb);
    await sock.sendMessage(msg.key.remoteJid, { text: `Pagaste ${destination.cost} monedas y viajaste a *${destination.name}*. ¡Nuevas aventuras te esperan!` }, { quoted: msg });
  }
};

export default travelCommand;
