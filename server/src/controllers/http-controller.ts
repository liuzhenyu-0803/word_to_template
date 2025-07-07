import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendMessage } from './websocket-controller';
import { WS_MESSAGE_TYPE, CLIENT_NAME, DOCUMENT_ROOT } from '../config/constants';

export const handleGetRequest = async (req: Request, res: Response) => {
    console.log('GET请求url:', req.url);
    try {
        if (req.url === '/document_html') {
            const filePath = path.join(__dirname, '../../', DOCUMENT_ROOT, 'document.html');
            try {
                const data = await fs.promises.readFile(filePath, 'utf8');
                res.setHeader('Content-Type', 'text/html');
                res.send(data);
            } catch (err) {
                console.error(`Error reading document: ${filePath}`, err);
                res.status(500).json({ error: `无法读取文档: ${filePath}` });
            }
        } else if (req.url === '/elements_htmls') {
            const dirPath = path.join(__dirname, '../../', DOCUMENT_ROOT, 'document_extract');
            if (!fs.existsSync(dirPath)) {
                console.error('Directory does not exist:', dirPath);
                res.status(404).json({ error: `目录不存在: ${dirPath}` });
                return;
            }
            try {
                const files = await fs.promises.readdir(dirPath);
                interface DocumentElement {
                    type: string;
                    content: string;
                }
                const elements: DocumentElement[] = [];
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
                            console.error(`Error reading file: ${filePath}`, err);
                        }
                    }
                }
                res.json(elements);
            } catch (err) {
                console.error(`Error reading directory: ${dirPath}`, err);
                res.status(500).json({ error: `无法读取目录: ${dirPath}` });
            }
        } else if (req.url === '/template') {
            const filePath = path.join(__dirname, '../../', DOCUMENT_ROOT, 'template.docx');
            try {
                const data = await fs.promises.readFile(filePath);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.send(data);
            } catch (err) {
                console.error(`Error reading template: ${filePath}`, err);
                res.status(500).json({ error: `无法读取模板文件: ${filePath}` });
            }
        } else {
            res.json({ message: "成功" });
        }
    } catch (error) {
        res.status(500).json({ error: '服务器内部错误' });
    }
};

const document_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../', DOCUMENT_ROOT);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'document.docx');
    }
});

const document_multer = multer({ storage: document_storage });

export const handleDocumentPost = [
    document_multer.single('file'),
    (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: '没有上传文件' });
            return;
        }

        console.log('文档上传成功:', req.file);

        res.json({
            message: 'File uploaded successfully',
            file: req.file
        });
    
        sendMessage(CLIENT_NAME.TOOL_CLIENT, {
            type: WS_MESSAGE_TYPE.DOC_PROCESS_START,
            docPath: req.file.path
        });
    }
];

export const handleDocumentHtmlPost = async (req: Request, res: Response) => {
    console.log('POST请求 /document_html');
    console.log('Request headers:', req.headers);
    console.log('Request body type:', typeof req.body);
    console.log('Request body:', req.body);
    console.log('Request body length:', req.body ? req.body.length : 'undefined');

    const filePath = path.join(__dirname, '../../', DOCUMENT_ROOT, 'document.html');
    let htmlContent = '';
    
    htmlContent = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    try {
        await fs.promises.writeFile(filePath, htmlContent, 'utf8');
        console.log('Document HTML saved successfully');
        res.json({
            message: '文档HTML保存成功',
            filePath: filePath,
            contentLength: htmlContent.length
        });
        
        sendMessage(CLIENT_NAME.TOOL_CLIENT, {
            type: WS_MESSAGE_TYPE.DOC_SAVE_START,
            htmlPath: filePath
        });
    } catch (err) {
        console.error('Error writing document:', err);
        res.status(500).json({ error: '无法写入文档' });
    }
};

const template_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../', DOCUMENT_ROOT);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'template.docx');
    }
});

const template_multer = multer({ storage: template_storage });

export const handleTemplatePost = [
    template_multer.single('file'),
    (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: '没有上传文件' });
            return;
        }

        console.log('模板上传成功:', req.file);

        res.json({
            message: 'Template uploaded successfully',
            file: req.file
        });
        
        sendMessage(CLIENT_NAME.WEB_CLIENT, {
            type: WS_MESSAGE_TYPE.DOC_SAVE_COMPLETE
        });
    }
];

export const handlePostRequest = (req: Request, res: Response) => {
    res.json({
        message: 'Received POST data',
        data: req.body
    });
};