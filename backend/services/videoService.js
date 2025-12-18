import Mux from '@mux/mux-node';
import dotenv from 'dotenv';

dotenv.config();

const { video: muxVideo } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_SECRET_KEY
});

export const deleteMuxAsset = async (assetId) => {
  if (!assetId) return false;

  try {
    await muxVideo.assets.delete(assetId);
    return true;
  } catch (err) {
    // rethrow to let callers decide how to handle/log
    throw err;
  }
};

export default {
  deleteMuxAsset
};
