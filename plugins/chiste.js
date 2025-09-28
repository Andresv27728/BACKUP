import axios from 'axios';

const chisteCommand = {
  name: "chiste",
  category: "diversion",
  description: "Te cuenta un chiste al azar.",
  aliases: ["joke"],

  async execute({ sock, msg }) {
    try {
      const response = await axios.get('https://v2.jokeapi.dev/joke/Any?lang=es');
      const jokeData = response.data;

      if (jokeData.error) {
        throw new Error('La API de chistes devolvió un error.');
      }

      let jokeText = '';
      if (jokeData.type === 'single') {
        // Chiste de una sola línea
        jokeText = jokeData.joke;
        await sock.sendMessage(msg.key.remoteJid, { text: jokeText }, { quoted: msg });
      } else {
        // Chiste de dos partes (pregunta y respuesta)
        jokeText = `${jokeData.setup}\n\n... ${jokeData.delivery}`;
        await sock.sendMessage(msg.key.remoteJid, { text: jokeText }, { quoted: msg });
      }

    } catch (error) {
      console.error("Error en el comando chiste:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: "No pude encontrar un chiste en este momento, ¡inténtalo de nuevo!" }, { quoted: msg });
    }
  }
};

export default chisteCommand;