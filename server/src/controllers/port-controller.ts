import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 检查端口是否被占用并杀死占用的进程
 * @param port 端口号
 */
export const checkAndKillPortProcess = async (port: number): Promise<void> => {
  try {
    console.log(`检查端口 ${port} 是否被占用...`);
    
    // 查找占用端口的进程
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    
    if (stdout.trim()) {
      // 解析PID
      const lines = stdout.trim().split('\n');
      const pids = new Set<string>();
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          pids.add(pid);
        }
      });
      
      // 杀死所有占用端口的进程
      for (const pid of pids) {
        try {
          await execAsync(`taskkill /PID ${pid} /F`);
          console.log(`已终止占用端口 ${port} 的进程 PID: ${pid}`);
        } catch (err) {
          console.warn(`终止进程 ${pid} 失败:`, err);
        }
      }
    } else {
      console.log(`端口 ${port} 未被占用`);
    }
  } catch (err) {
    console.log(`端口 ${port} 检查完成`);
  }
};