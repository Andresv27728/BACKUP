import { downloadArtistMedia } from '../lib/artistDownloader.js';
import config from '../config.js';

// Estado de descarga específico para el comando 'artista2'
const downloadingState = { isDownloading: false };

const artista2Command = {
  name: "artista2",
  category: "descargas",
  description: "Descarga los 50 videos más populares de un artista y los envía uno por uno.",

  async execute({ sock, msg, args }) {
    await downloadArtistMedia({
      sock,
      msg,
      args,
      commandName: this.name,
      downloadingState,
      apiConfig: config.api.adonix,
      format: 'video'
    });
  }
};

export default artista2Command;
