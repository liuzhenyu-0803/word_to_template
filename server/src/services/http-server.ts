import express from 'express';
import cors from 'cors';
import {
    handleGetRequest,
    handlePostRequest,
    handleDocumentPost,
    handleDocumentHtmlPost,
    handleTemplatePost
} from '../controllers/http-controller';
import { PORT } from '../config/constants';

export const initHttpServer = () => {
    const app = express();

    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    app.use(express.json());

    app.get('/document_html', handleGetRequest);
    app.get('/elements_htmls', handleGetRequest);
    app.get('/template', handleGetRequest);
    app.get('*', handleGetRequest);

    app.post('/document', ...handleDocumentPost);
    app.post('/document_html', handleDocumentHtmlPost);
    app.post('/template', ...handleTemplatePost);
    app.post('*', handlePostRequest);

    return new Promise<any>((resolve) => {
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`HTTP Server running: http://0.0.0.0:${PORT}`);
            resolve(server);
        });
    });
};