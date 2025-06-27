import http from 'http';
import {
  handleOptionsRequest,
  handleGetRequest,
  handlePostRequest,
  handleFileUpload
} from '../controllers/http-controller';
import { setCorsHeaders } from '../utils/cors';
import { PORT } from '../config/constants';

export const initHttpServer = () => {
  const server = http.createServer((req, res) => {
    setCorsHeaders(res);
    
    if (req.method === 'OPTIONS') {
      return handleOptionsRequest(req, res);
    }
    
    if (req.method === 'GET') {
      return handleGetRequest(req, res);
    }
    
    if (req.method === 'POST') {
      console.log(`POST请求url: ${req.url}`);
      
      if (req.url === '/upload') {
        return handleFileUpload(req, res);
      } else {
        console.log('处理其他POST请求');
        return handlePostRequest(req, res);
      }
    }

    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  });

  return new Promise<http.Server>((resolve) => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`HTTP Server running on port ${PORT}`);
      console.log(`HTTP: http://0.0.0.0:${PORT}`);
      resolve(server);
    });
  });
};