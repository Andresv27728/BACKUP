import { readUsersDb, writeUsersDb } from '../lib/database.js';

const pets = {
    'wolf': { name: "Lobo", attack: 5, price: 5000 },
    'bear': { name: "Oso", defense: 5, price: 7000 },
    'eagle': { name: "Águila", speed: 5, price: 6000 }
};

const petCommand = {
  name: "pet",
  category: "rpg",
  description: "Gestiona tu mascota. Uso: `pet shop`, `pet buy <nombre>`, `pet release`",
  aliases: ["mascota"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    const subCommand = args[0];

    if (subCommand === 'shop') {
        let shopList = "*🐾 Tienda de Mascotas 🐾*\n\n";
        for (const key in pets) {
            const pet = pets[key];
            shopList += `*${pet.name}* (\`${key}\`)\n_Precio: ${pet.price} monedas_\n\n`;
        }
        return sock.sendMessage(msg.key.remoteJid, { text: shopList }, { quoted: msg });
    }

    if (subCommand === 'buy') {
        const petName = args[1];
        const pet = pets[petName];
        if (!pet) {
            return sock.sendMessage(msg.key.remoteJid, { text: "Esa mascota no está disponible." }, { quoted: msg });
        }
        if (user.pet) {
            return sock.sendMessage(msg.key.remoteJid, { text: "Ya tienes una mascota. Libérala primero si quieres una nueva." }, { quoted: msg });
        }
        if (user.coins < pet.price) {
            return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes monedas. Necesitas ${pet.price}.` }, { quoted: msg });
        }
        user.coins -= pet.price;
        user.pet = { name: pet.name, attack: pet.attack || 0, defense: pet.defense || 0, speed: pet.speed || 0 };
        writeUsersDb(usersDb);
        return sock.sendMessage(msg.key.remoteJid, { text: `¡Felicidades! Has comprado un ${pet.name}. Te acompañará en tus aventuras.` }, { quoted: msg });
    }

    if (subCommand === 'release') {
        if (!user.pet) {
            return sock.sendMessage(msg.key.remoteJid, { text: "No tienes una mascota que liberar." }, { quoted: msg });
        }
        const petName = user.pet.name;
        user.pet = null;
        writeUsersDb(usersDb);
        return sock.sendMessage(msg.key.remoteJid, { text: `Has liberado a tu ${petName}. Ahora es libre.` }, { quoted: msg });
    }

    if (user.pet) {
        return sock.sendMessage(msg.key.remoteJid, { text: `Tu mascota actual es un *${user.pet.name}*.` }, { quoted: msg });
    } else {
        return sock.sendMessage(msg.key.remoteJid, { text: "No tienes ninguna mascota. Visita la tienda de mascotas con `pet shop`." }, { quoted: msg });
    }
  }
};

export default petCommand;
