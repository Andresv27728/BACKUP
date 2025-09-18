import { readUsersDb, writeUsersDb } from '../lib/database.js';

const INITIAL_COINS = 1000;
const INITIAL_HP = 100;
const INITIAL_LEVEL = 1;

const registerCommand = {
  name: "reg",
  category: "general",
  description: "Te registra en el sistema de RPG del bot. Uso: reg <nombre>.<edad>",
  aliases: ["registrar", "register"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();

    if (usersDb[senderId]) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Ya estás registrado." }, { quoted: msg });
    }

    const input = args.join(' ');
    if (!input.includes('.')) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Formato incorrecto. Uso: `reg <nombre>.<edad>`\nEjemplo: `reg Jules.25`" }, { quoted: msg });
    }

    const [name, ageStr] = input.split('.');
    const age = parseInt(ageStr, 10);

    if (!name || isNaN(age) || age < 10 || age > 90) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un nombre válido y una edad entre 10 y 90 años." }, { quoted: msg });
    }

    // Inicialización de datos del usuario con estadísticas RPG
    usersDb[senderId] = {
      name: name.trim(),
      age: age,
      registeredAt: new Date().toISOString(),
      coins: INITIAL_COINS,
      warnings: 0,

      // Atributos RPG
      hp: INITIAL_HP,
      maxHp: INITIAL_HP,
      xp: 0,
      level: INITIAL_LEVEL,
      strength: 5,
      defense: 5,
      speed: 5,

      // Cooldowns de acciones RPG
      lastHeal: 0,
      lastAdventure: 0,
      lastQuest: 0,
      lastTrain: 0,
      lastDungeon: 0,
      lastCrime: 0, // Mover de 'crime.js' para consistencia
      lastWork: 0, // Mover de 'work.js' para consistencia
      lastFish: 0, // Mover de 'fish.js' para consistencia
      lastBeg: 0, // Cooldown para mendigar

      // Economía
      bank: 0,

      // Inventario y Equipamiento
      inventory: {
        potions: 1,
        wood: 0,
        stone: 0,
        iron: 0,
        diamonds: 0
      },
      equipment: {
        weapon: null,
        armor: null,
        shield: null
      },
      effects: {} // Para almacenar efectos temporales (ej. poción de suerte)
    };

    writeUsersDb(usersDb);

    const successMessage = `*✅ Registro Exitoso en el Mundo RPG ✅*\n\n` +
                           `*Aventurero:* ${name.trim()}\n` +
                           `*Edad:* ${age}\n` +
                           `*Nivel:* ${INITIAL_LEVEL}\n` +
                           `*HP:* ${INITIAL_HP}/${INITIAL_HP}\n` +
                           `*Monedas Iniciales:* ${INITIAL_COINS} coins\n\n` +
                           `¡Tu aventura comienza ahora! Usa el comando \`stats\` para ver tus atributos.`;

    await sock.sendMessage(msg.key.remoteJid, { text: successMessage }, { quoted: msg });
  }
};

export default registerCommand;
