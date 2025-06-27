import http from 'http';
import { setCorsHeaders } from '../utils/cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendMessage } from './ws-controller';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../document');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

export const handleOptionsRequest = (req: http.IncomingMessage, res: http.ServerResponse) => {
  setCorsHeaders(res);
  res.writeHead(204);
  res.end();
};

export const handleGetRequest = (req: http.IncomingMessage, res: http.ServerResponse) => {
  console.log('GET请求url:', req.url);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: "成功" }));
};

export const handleFileUpload = (req: http.IncomingMessage, res: http.ServerResponse) => {
  console.log('处理上传请求');
  
  // 创建multer中间件处理原生HTTP请求
  const multerMiddleware = upload.single('file');
  const fakeReq = Object.assign(req, {
    body: {},
    files: []
  });
  
  multerMiddleware(fakeReq as any, res as any, (err) => {
    if (err) {
      console.error('Upload error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    } else {
      console.log('File uploaded:', (req as any).file);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'File uploaded successfully',
        file: (req as any).file
      }));

      // 通知WebSocket客户端
      sendMessage('tool_client', {
        type: 1,
        docPath: (req as any).file.path
      });
    }
  });
};

export const handlePostRequest = (req: http.IncomingMessage, res: http.ServerResponse) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Received POST data',
      data: body
    }));
  });
};