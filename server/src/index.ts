import { initHttpServer } from './services/http-server';
import { initWebSocketServer } from './services/websocket-server';
import { spawn } from 'child_process';
import { CHILD_PROCESS, PORT } from './config/constants';
import { checkAndKillPortProcess } from './controllers/port-controller';

let childProcess: any = null;

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
        await checkAndKillPortProcess(PORT);

        const httpServer = await initHttpServer();
        initWebSocketServer(httpServer);

        // 以下为子进程启动代码(已注释)
        // 原因：当前环境缺少test.exe可执行文件
        // 如需启用，请确保CHILD_PROCESS路径正确
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