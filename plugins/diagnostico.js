import { commands } from '../index.js';
import { performance } from 'perf_hooks';

const diagnosticoCommand = {
  name: "diagnostico",
  category: "propietario",
  description: "Ejecuta una prueba de diagnóstico en todos los comandos para verificar su estado y tiempo de respuesta.",
  aliases: ["diag", "testall"],
  isOwner: true, // Usaremos este flag en el handler si es necesario, o la categoría 'propietario'

  async execute({ sock, msg, isOwner }) {
    // Comprobación de propietario (doble seguridad)
    if (!isOwner) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Este comando es solo para el propietario del bot." }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { text: "Iniciando diagnóstico de comandos... Esto puede tardar un momento." }, { quoted: msg });

    const results = [];
    const totalCommands = commands.size;
    let testedCount = 0;

    for (const [name, command] of commands.entries()) {
      // No probar el comando de diagnóstico a sí mismo
      if (name === 'diagnostico') {
        continue;
      }

      testedCount++;
      const startTime = performance.now();
      let status = '✅ ÉXITO';
      let error = null;

      try {
        // Simular una ejecución con argumentos vacíos
        // Creamos un 'msg' mínimo para evitar errores en comandos que lo usan
        const mockMsg = {
            key: msg.key,
            sender: msg.sender,
            message: { conversation: "" }
        };
        await command.execute({ sock, msg: mockMsg, args: [], commands, isOwner: false });
      } catch (e) {
        status = '❌ FALLO';
        error = e.message;
      }

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      results.push({ name, status, duration, error });
    }

    // Formatear y enviar el informe
    let report = `*🩺 Informe de Diagnóstico de Comandos 🩺*\n\n`;
    report += `Se probaron ${testedCount} de ${totalCommands} comandos.\n\n`;

    results.sort((a, b) => b.duration - a.duration); // Ordenar por duración (más lento primero)

    for (const res of results) {
      report += `*Comando:* \`${res.name}\`\n`;
      report += `*Estado:* ${res.status}\n`;
      report += `*Duración:* ${res.duration} ms\n`;
      if (res.error) {
        report += `*Error:* ${res.error}\n`;
      }
      report += `-----------------------------\n`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: report }, { quoted: msg });
  }
};

export default diagnosticoCommand;
