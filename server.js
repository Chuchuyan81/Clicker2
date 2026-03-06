import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
// Измените 'vanilla', на '.', если нужно запустить сервер в корне проекта
const STATIC_PATH = path.join(__dirname, 'vanilla');

const MIME_TYPES = {
    default: 'application/octet-stream',
    html: 'text/html; charset=UTF-8',
    js: 'application/javascript; charset=UTF-8',
    css: 'text/css',
    png: 'image/png',
    jpg: 'image/jpeg',
    gif: 'image/gif',
    ico: 'image/x-icon',
    svg: 'image/svg+xml',
};

const toBool = [() => true, () => false];

const prepareFile = async (url) => {
    const isAsset = url.startsWith('/assets/');
    const rootPath = isAsset ? __dirname : STATIC_PATH;
    const relativePath = isAsset ? url.slice(1) : (url.endsWith('/') ? path.join(url, 'index.html') : url);

    const filePath = path.join(rootPath, relativePath);

    const exists = await fs.promises.access(filePath).then(...toBool);
    const streamPath = exists ? filePath : path.join(STATIC_PATH, 'index.html');
    const ext = path.extname(streamPath).substring(1).toLowerCase();
    const stream = fs.createReadStream(streamPath);
    return { found: exists, ext, stream };
};

http.createServer(async (req, res) => {
    const file = await prepareFile(req.url);
    const statusCode = file.found ? 200 : 404;
    const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
    res.writeHead(statusCode, { 'Content-Type': mimeType });
    file.stream.pipe(res);
    console.log(`${req.method} ${req.url} ${statusCode}`);
}).listen(PORT);

console.log(`Сервер запущен. Откройте в браузере: http://localhost:${PORT}`);
