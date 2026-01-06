const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { URL } = require('node:url');

const PORT = process.env.PORT || 5000;

// Разрешённые источники (фронт)
const ALLOWED_ORIGINS = [
    'https://kvarnado.ru',            // боевой фронт
    'http://localhost:3000',          // локальная разработка
    'http://127.0.0.1:3000',          // локальная разработка по IP
    'http://kvarnado-2025.test'      // тестовый локальный домен OpenServer
];

const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;

    // Настройка CORS
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight запрос
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/apartments' && req.method === 'GET') {
        try {
            const buildingId = url.searchParams.get('building_id');

            const data = await readFileData();
            let apartments = JSON.parse(data);

            if (buildingId) {
                apartments = apartments.filter(
                    item => item.building_id === buildingId
                );
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(apartments));
        } catch (e) {
            console.error(e);
            res.writeHead(500);
            return res.end('Server error');
        }
    }

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log('Server running on ' + PORT);
});

async function readFileData() {
    const filePath = path.join(__dirname, 'files', 'mergerApartList.json');
    return await fs.readFile(filePath, 'utf8');
}
