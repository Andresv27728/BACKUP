import config from '../config.js';

/**
 * Logs a successful download by forwarding the media to a specific log group.
 * @param {object} sock - The Baileys socket instance.
 * @param {object} originalMsg - The original message object that triggered the command.
 * @param {object} sentMediaMsg - The message object of the media that was sent to the user.
 * @param {string} [initialInfo] - Optional initial info text to be sent before the media (for play/play2).
 */
export async function logDownload(sock, originalMsg, sentMediaMsg, initialInfo = '') {
  const logGroupId = config.logGroupId;
  if (!logGroupId) {
    console.log("No se ha configurado un logGroupId en config.js. No se registrará la descarga.");
    return;
  }

  try {
    const requester = originalMsg.sender;
    const requesterName = originalMsg.pushName || 'Usuario Desconocido';
    const command = originalMsg.body?.split(' ')[0] || 'Comando Desconocido';

    // Construir el mensaje de registro
    let logHeaderText = `📥 *Nueva Descarga* 📥\n\n`;
    logHeaderText += `*Usuario:* ${requesterName} (@${requester.split('@')[0]})\n`;
    logHeaderText += `*Comando:* \`${command}\``;

    // Enviar el encabezado del registro
    await sock.sendMessage(logGroupId, {
      text: logHeaderText,
      mentions: [requester]
    });

    // Si hay un mensaje de información inicial (para play/play2), enviarlo también
    if (initialInfo) {
      await sock.sendMessage(logGroupId, { text: initialInfo });
    }

    // Reenviar el mensaje con el medio
    await sock.forwardMessage(logGroupId, sentMediaMsg);

  } catch (e) {
    console.error(`Error al registrar la descarga en el grupo ${logGroupId}:`, e);
    // Opcional: notificar a los propietarios sobre el fallo del registro
    // await sock.sendMessage(config.ownerNumbers[0] + '@s.whatsapp.net', { text: `Fallo al registrar una descarga en el grupo de logs.` });
  }
}
