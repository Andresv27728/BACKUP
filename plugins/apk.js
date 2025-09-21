import axios from 'axios';
import config from '../config.js';

const apkCommand = {
  name: "apk",
  category: "descargas",
  description: "Busca y descarga un archivo APK.",

  async execute({ sock, msg, args }) {
    const text = args.join(" ");
    const pref = config.prefix || ".";

    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ *Uso incorrecto.*\n✳️ *Ejemplo:* \`${pref}${this.name} whatsapp\``
      }, { quoted: msg });
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: "⏳ Buscando APK..." }, { quoted: msg });

    try {
      const apiUrl = `https://api.neoxr.eu/api/apk?q=${encodeURIComponent(text)}&no=1&apikey=russellxz`;
      const response = await axios.get(apiUrl);
      const { data } = response;

      if (!data.status || !data.data || !data.file?.url) {
        throw new Error("No se pudo obtener información del APK.");
      }

      const apkInfo = data.data;
      const apkFile = data.file;

      // Verificar el tamaño del archivo antes de descargar
      const sizeStr = apkInfo.size;
      const sizeValue = parseFloat(sizeStr);
      const isMB = sizeStr.toLowerCase().includes('mb');
      const sizeMB = isMB ? sizeValue : sizeValue / 1024; // Convertir KB a MB si es necesario

      if (sizeMB > 300) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `❌ El APK pesa ${sizeMB.toFixed(2)}MB y excede el límite de 300MB.`
        }, { quoted: msg, edit: waitingMsg.key });
      }

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ APK encontrado. Descargando *${apkInfo.name}* (${apkInfo.size})...` }, { edit: waitingMsg.key });

      const fileBuffer = (await axios.get(apkFile.url, { responseType: 'arraybuffer' })).data;

      const caption = `📱 *Nombre:* ${apkInfo.name}\n` +
        `𖠁 *Tamaño:* ${apkInfo.size}\n` +
        `𖠁 *Rating:* ${apkInfo.rating}\n` +
        `𖠁 *Instalaciones:* ${apkInfo.installs}\n` +
        `𖠁 *Desarrollador:* ${apkInfo.developer}\n` +
        `𖠁 *Categoría:* ${apkInfo.category}\n` +
        `𖠁 *Versión:* ${apkInfo.version}\n` +
        `𖠁 *Actualizado:* ${apkInfo.updated}\n` +
        `𖠁 *Requisitos:* ${apkInfo.requirements}\n` +
        `𖠁 *ID:* ${apkInfo.id}`;

      // Enviar imagen con info
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: apkInfo.thumbnail },
        caption,
        mimetype: "image/jpeg"
      }, { quoted: msg });

      // Enviar el APK
      await sock.sendMessage(msg.key.remoteJid, {
        document: fileBuffer,
        mimetype: "application/vnd.android.package-archive",
        fileName: apkFile.filename
      }, { quoted: msg });

    } catch (err) {
      console.error("❌ Error en comando APK:", err.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *Error al procesar la solicitud:*\n_${err.message}_\n\n🔹 Inténtalo más tarde.`
      }, { quoted: msg, edit: waitingMsg.key });
    }
  }
};

export default apkCommand;
