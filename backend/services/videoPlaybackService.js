import Video from '../models/video.js';
import VideoDraft from '../models/VideoDraft.js';
import Mux from '@mux/mux-node';
import dotenv from 'dotenv';

dotenv.config();

const mux = new Mux();

const decodePrivateKey = (keySecretBase64) => {
  let keySecret = Buffer.from(keySecretBase64, 'base64').toString('utf-8');

  if (!keySecret.includes('\n')) {
    keySecret = keySecret.replace(/-----BEGIN (RSA )?PRIVATE KEY-----/, '-----BEGIN $1PRIVATE KEY-----\n')
                         .replace(/-----END (RSA )?PRIVATE KEY-----/, '\n-----END $1PRIVATE KEY-----')
                         .replace(/(.{64})/g, '$1\n')
                         .replace(/\n\n/g, '\n');
  }

  return keySecret;
};

export const getPlaybackForVideo = async (videoId) => {
  const video = await Video.findById(videoId);
  if (!video) return null;

  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecretBase64 = process.env.MUX_SIGNING_PRIVATE_KEY;
  if (!keyId || !keySecretBase64) {
    throw new Error('MUX signing credentials not configured');
  }

  const keySecret = decodePrivateKey(keySecretBase64);

  let playbackId = video.playbackId || video.contentUrl || '';
  if (playbackId.startsWith('mux://')) playbackId = playbackId.replace('mux://', '');
  else if (playbackId.includes('mux.com')) {
    const match = playbackId.match(/\/([a-zA-Z0-9]+)\.m3u8/);
    if (match) playbackId = match[1];
  }

  const token = await mux.jwt.signPlaybackId(playbackId, {
    keyId: keyId,
    keySecret: keySecret,
    expiration: '1h',
    type: 'video'
  });

  const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;

  return {
    video,
    playbackId,
    playbackUrl,
    token,
    expiresIn: 3600
  };
};

export const getThumbnailForVideo = async (videoId, params = {}) => {
  const video = await Video.findById(videoId);
  if (!video) return null;

  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecretBase64 = process.env.MUX_SIGNING_PRIVATE_KEY;
  if (!keyId || !keySecretBase64) {
    throw new Error('MUX signing credentials not configured');
  }

  const keySecret = decodePrivateKey(keySecretBase64);

  let playbackId = video.playbackId || video.contentUrl || '';
  if (playbackId.startsWith('mux://')) playbackId = playbackId.replace('mux://', '');
  else if (playbackId.includes('mux.com')) {
    const match = playbackId.match(/\/([a-zA-Z0-9]+)\.m3u8/);
    if (match) playbackId = match[1];
  }

  const token = await mux.jwt.signPlaybackId(playbackId, {
    keyId: keyId,
    keySecret: keySecret,
    expiration: '1h',
    type: 'thumbnail',
    params
  });

  const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?token=${token}`;

  return {
    video,
    thumbnailUrl,
    token,
    expiresIn: 3600
  };
};

export const getPlaybackForDraftVideo = async (videoId) => {
  const video = await VideoDraft.findById(videoId);
  if (!video) return null;

  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecretBase64 = process.env.MUX_SIGNING_PRIVATE_KEY;
  if (!keyId || !keySecretBase64) {
    throw new Error('MUX signing credentials not configured');
  }

  const keySecret = decodePrivateKey(keySecretBase64);

  let playbackId = video.playbackId || video.contentUrl || '';
  if (playbackId.startsWith('mux://')) playbackId = playbackId.replace('mux://', '');
  else if (playbackId.includes('mux.com')) {
    const match = playbackId.match(/\/([a-zA-Z0-9]+)\.m3u8/);
    if (match) playbackId = match[1];
  }

  const token = await mux.jwt.signPlaybackId(playbackId, {
    keyId: keyId,
    keySecret: keySecret,
    expiration: '1h',
    type: 'video'
  });

  const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;

  return {
    video,
    playbackId,
    playbackUrl,
    token,
    expiresIn: 3600
  };
};
