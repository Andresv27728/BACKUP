import { downloadArtistMedia } from '../lib/artistDownloader.js';
import config from '../config.js';

// Estado de descarga específico para el comando 'artista'
const downloadingState = { isDownloading: false };

const artistaCommand = {
  name: "artista",
  category: "descargas",
  description: "Descarga las 50 canciones más populares de un artista y las envía una por una.",

  async execute({ sock, msg, args }) {
    await downloadArtistMedia({
      sock,
      msg,
      args,
      commandName: this.name,
      downloadingState,
      apiConfig: config.api.adonix,
      format: 'audio'
    });
  }
};

export default artistaCommand;
