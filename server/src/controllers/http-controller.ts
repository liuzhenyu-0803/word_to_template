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

interface Element {
  type: string;
  content: string;
}

export const handleGetRequest = (req: http.IncomingMessage, res: http.ServerResponse) => {
  console.log('GET请求url:', req.url);
  
  if (req.url === '/document') {
    const filePath = path.join(__dirname, '../../document/document.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading document:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无法读取文档' }));
        return;
      }
      setCorsHeaders(res);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/elements') {
    const dirPath = path.join(__dirname, '../../document/document_extract');
    
    // 首先检查目录是否存在
    if (!fs.existsSync(dirPath)) {
      console.error('Directory does not exist:', dirPath);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '目录不存在' }));
      return;
    }

    fs.readdir(dirPath, (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无法读取目录' }));
        return;
      }

      const elements: Element[] = [];
      
      // 使用async IIFE按顺序处理文件
      (async () => {
        try {
          for (const file of files) {
            if (file.startsWith('table_')) {
              const filePath = path.join(dirPath, file);
              try {
                const data = await fs.promises.readFile(filePath, 'utf8');
                elements.push({
                  type: "table",
                  content: data
                });
              } catch (err) {
                console.error('Error reading file:', file, err);
              }
            }
          }
          
          setCorsHeaders(res);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(elements));
        } catch (error) {
          console.error('Error processing files:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '文件处理错误' }));
        }
      })();
    });
  } else {
    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "成功" }));
  }
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