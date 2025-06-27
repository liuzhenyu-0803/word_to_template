import { spawn } from 'child_process';
import http from 'http';
import { setCorsHeaders } from '../utils/cors';

export const handleStartProcess = (req: http.IncomingMessage, res: http.ServerResponse) => {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            const { command, args } = JSON.parse(body);
            const child = spawn(command, args, { stdio: 'inherit' });
            
            child.on('error', (err) => {
                console.error('子进程启动失败:', err);
                setCorsHeaders(res);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            });
            
            child.on('exit', (code) => {
                console.log(`子进程退出，代码 ${code}`);
            });
            
            setCorsHeaders(res);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                message: '子进程启动成功',
                pid: child.pid
            }));
        } catch (err) {
            setCorsHeaders(res);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '无效的请求体' }));
        }
    });
};