import { readUsersDb, writeUsersDb, checkLevelUp } from '../lib/database.js';

// Lista de misiones simples
const quests = [
    { id: 1, name: "Recolección de Hierbas", description: "Un alquimista necesita 10 de madera. Tráelos para una recompensa.", required: { wood: 10 }, reward: { xp: 100, coins: 200 } },
    { id: 2, name: "Control de Plagas", description: "Derrota a 5 slimes imaginarios en el campo.", reward: { xp: 50, coins: 100 } },
    { id: 3, name: "El Pedido del Herrero", description: "El herrero necesita 5 de hierro para forjar una nueva espada.", required: { iron: 5 }, reward: { xp: 200, coins: 400 } }
];

const questCommand = {
  name: "quest",
  category: "rpg",
  description: "Acepta y completa misiones para obtener recompensas. Uso: `quest list` o `quest start <id>`",
  aliases: ["mision"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    const subCommand = args[0];

    if (subCommand === 'list') {
        let questList = "*📜 Lista de Misiones Disponibles 📜*\n\n";
        quests.forEach(q => {
            questList += `*ID:${q.id} - ${q.name}*\n_${q.description}_\n\n`;
        });
        return sock.sendMessage(msg.key.remoteJid, { text: questList }, { quoted: msg });
    }

    if (subCommand === 'start') {
        const questId = parseInt(args[1], 10);
        const quest = quests.find(q => q.id === questId);

        if (!quest) {
            return sock.sendMessage(msg.key.remoteJid, { text: "No se encontró una misión con ese ID." }, { quoted: msg });
        }

        // Lógica para completar la misión
        if (quest.required) {
            for (const item in quest.required) {
                if ((user.inventory[item] || 0) < quest.required[item]) {
                    return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes recursos. Necesitas ${quest.required[item]} de ${item}.` }, { quoted: msg });
                }
            }
            // Si tiene los recursos, los consume
            for (const item in quest.required) {
                user.inventory[item] -= quest.required[item];
            }
        }

        // Dar recompensa
        user.xp += quest.reward.xp;
        user.coins += quest.reward.coins;

        let message = `*✅ Misión Completada: ${quest.name} ✅*\n\n` +
                      `Recibiste *${quest.reward.xp} XP* y *${quest.reward.coins} monedas*.`;

        const levelUpMessage = checkLevelUp(user);
        writeUsersDb(usersDb);

        if (levelUpMessage) {
            message += `\n\n${levelUpMessage}`;
        }

        return sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg });
    }

    return sock.sendMessage(msg.key.remoteJid, { text: "Comando de misión no válido. Usa `quest list` o `quest start <id>`." }, { quoted: msg });
  }
};

export default questCommand;
