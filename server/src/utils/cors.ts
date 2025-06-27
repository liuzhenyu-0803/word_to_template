import { CORS_CONFIG } from '../config/constants';

export const setCorsHeaders = (res: any) => {
  res.setHeader('Access-Control-Allow-Origin', CORS_CONFIG.allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods);
  res.setHeader('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders);
};