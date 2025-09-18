import { readSettingsDb, writeSettingsDb } from '../lib/database.js';

const autodlCommand = {
  name: "autodl",
  category: "grupo",
  description: "Activa o desactiva la descarga automática de enlaces en este grupo.",
  aliases: ["autodownload"],

  async execute({ sock, msg, args }) {
    const from = msg.key.remoteJid;
    const senderId = msg.sender;
    const subCommand = args[0]?.toLowerCase();

    // 1. Comprobar si es un grupo
    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(from, { text: "Este comando solo se puede usar en grupos." }, { quoted: msg });
    }

    // 2. Comprobar si el usuario es administrador del grupo
    try {
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants;
      const senderInfo = participants.find(p => p.id === senderId);

      if (!senderInfo?.admin) { // 'admin' o 'superadmin'
        return sock.sendMessage(from, { text: "Este comando solo puede ser usado por administradores del grupo." }, { quoted: msg });
      }
    } catch (e) {
      console.error("Error al obtener metadatos del grupo:", e);
      return sock.sendMessage(from, { text: "Ocurrió un error al verificar tus permisos." }, { quoted: msg });
    }

    // 3. Procesar el subcomando (on/off)
    if (subCommand !== 'on' && subCommand !== 'off') {
      return sock.sendMessage(from, { text: "Uso incorrecto. Ejemplo: `autodl on` o `autodl off`." }, { quoted: msg });
    }

    const settingsDb = readSettingsDb();
    const isEnabling = subCommand === 'on';

    // Crear el objeto de ajustes para el grupo si no existe
    if (!settingsDb[from]) {
      settingsDb[from] = {};
    }

    // 4. Actualizar y guardar el ajuste
    settingsDb[from].autodl = isEnabling;
    writeSettingsDb(settingsDb);

    // 5. Enviar mensaje de confirmación
    const status = isEnabling ? "activada" : "desactivada";
    await sock.sendMessage(from, { text: `✅ La descarga automática de enlaces ha sido ${status} en este grupo.` }, { quoted: msg });
  }
};

export default autodlCommand;
