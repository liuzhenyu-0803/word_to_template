import { initHttpServer } from './services/http-server';
import { initWebSocketServer } from './services/websocket-server';
import { spawn } from 'child_process';
import { CHILD_PROCESS, PORT } from './config/constants';
import { checkAndKillPortProcess } from './controllers/port-controller';

let childProcess: any = null;

// 监听进程退出信号
process.on('SIGINT', () => {
  console.log('收到SIGINT信号，关闭子进程...');
  if (childProcess) {
    childProcess.kill();
  }
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，关闭子进程...');
  if (childProcess) {
    childProcess.kill();
  }
  process.exit();
});

const startServer = async () => {
  try {
    // 检查并清理端口占用
    await checkAndKillPortProcess(PORT);
    
    // 启动HTTP服务
    const httpServer = await initHttpServer();
    initWebSocketServer(httpServer);
    
    // 启动子进程(暂时注释掉，避免test.exe找不到的问题)
    // childProcess = spawn(CHILD_PROCESS, { stdio: 'inherit' });
    //
    // childProcess.on('error', (err) => {
    //   console.error('子进程启动失败:', err);
    // });
    //
    // childProcess.on('exit', (code) => {
    //   console.log(`子进程 ${CHILD_PROCESS} 退出，代码 ${code}`);
    // });
    
    console.log('服务启动完成');
  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
};

startServer();