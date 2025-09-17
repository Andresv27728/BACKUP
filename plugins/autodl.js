import { readSettingsDb, writeSettingsDb } from '../lib/database.js';

const autodlCommand = {
  name: "autodl",
  category: "grupos",
  description: "Activa o desactiva la descarga automática de videos en este grupo.",

  async execute({ sock, msg, args }) {
    const from = msg.key.remoteJid;
    const option = args[0]?.toLowerCase();

    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(from, { text: "Este comando solo se puede usar en grupos." }, { quoted: msg });
    }

    if (option !== 'on' && option !== 'off') {
      return sock.sendMessage(from, { text: "Por favor, usa 'on' para activar o 'off' para desactivar.\n\nEjemplo: `autodl on`" }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(from);
      const senderId = msg.key.participant || msg.key.remoteJid;
      const senderIsAdmin = metadata.participants.find(p => p.id === senderId)?.admin;

      if (!senderIsAdmin) {
        return sock.sendMessage(from, { text: "No tienes permisos de administrador para usar este comando." }, { quoted: msg });
      }

      const settings = readSettingsDb();
      if (!settings[from]) {
        settings[from] = {};
      }

      const isEnabling = option === 'on';
      settings[from].autoDl = isEnabling;
      writeSettingsDb(settings);

      const status = isEnabling ? "activado" : "desactivado";
      await sock.sendMessage(from, { text: `✅ La descarga automática de videos se ha ${status} en este grupo.` }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando autodl:", error);
      await sock.sendMessage(from, { text: "Ocurrió un error al configurar la descarga automática." }, { quoted: msg });
    }
  }
};

export default autodlCommand;
