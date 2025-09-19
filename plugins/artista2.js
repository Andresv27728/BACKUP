import { downloadArtistSongs } from '../lib/artistDownloader.js';
import config from '../config.js';

// Estado de descarga específico para el comando 'artista2'
const downloadingState = { isDownloading: false };

const artista2Command = {
  name: "artista2",
  category: "descargas",
  description: "Descarga las 50 canciones más populares de un artista y las envía una por una.",

  async execute({ sock, msg, args }) {
    // Nota: El usuario pidió la API de 'play2', pero esa es para video.
    // Usamos la misma API de audio para cumplir con la intención de descargar "canciones".
    await downloadArtistSongs({
      sock,
      msg,
      args,
      commandName: this.name,
      downloadingState,
      apiConfig: config.api.adonix
    });
  }
};

export default artista2Command;
