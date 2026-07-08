const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.SERVER_PORT || process.env.PORT || '3000', 10);

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    console.log('Requisição:', req.url);

    let filePath = req.url.split('?')[0];
    
    if (filePath === '/' || filePath === '') {
        filePath = '/index.html';
    }

    const fullPath = path.join(__dirname, filePath);
    const ext = path.extname(fullPath);
    const contentType = mimeTypes[ext] || 'text/plain; charset=utf-8';

    fs.readFile(fullPath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Arquivo não encontrado');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('Free Agents rodando na porta ' + PORT);
});
