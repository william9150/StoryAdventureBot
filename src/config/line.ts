import { Client, middleware } from '@line/bot-sdk';

const config = {
  channelAccessToken: process.env['LINE_CHANNEL_ACCESS_TOKEN'] || '',
  channelSecret: process.env['LINE_CHANNEL_SECRET'] || ''
};

if (!config.channelAccessToken || !config.channelSecret) {
  throw new Error('LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET must be defined');
}

export const lineClient = new Client(config);
export const lineMiddleware = middleware(config);