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
    else if (url.pathname === '/apartments-full' && req.method === 'GET') {
        try {
            let limit = Number(url.searchParams.get('limit')) || 9
            let skip = Number(url.searchParams.get('skip')) || 0
            let rooms = url.searchParams.get('rooms')
            let level = url.searchParams.get('level')
            let minPriceParam = url.searchParams.get('minPrice')   // "1000000"
            let maxPriceParam = url.searchParams.get('maxPrice')   // "3000000"

            const data = await readFileData()
            let apartments = JSON.parse(data)

            let filteredApartments = apartments

            // filteredApartments = apartments.filter(apartment => {
            //     if (!apartment.apart_data) return false

            //     let matches = true

            //     // Фильтр по комнатам
            //     if (rooms) {
            //         const apartRooms = apartment.apart_data.rooms
            //         if (!apartRooms) return false

            //         const roomsLower = rooms.toLowerCase()
            //         const apartRoomsLower = apartRooms.toLowerCase()

            //         if (roomsLower === 'студия') {
            //             matches = matches && (apartRoomsLower === 'студия')
            //         } else {
            //             matches = matches && (Number(extractNumberRooms(apartRooms)) === Number(rooms))
            //         }
            //     }

            //     // Фильтр по уровню
            //     if (level) {
            //         const apartLevel = apartment.apart_data.level
            //         if (!apartLevel) return false

            //         const apartLevelNumber = extractFloat(apartLevel)
            //         const filterLevelNumber = extractFloat(level)
            //         matches = matches && (apartLevelNumber === filterLevelNumber)
            //     }

            //     // 3️⃣ Фильтр по цене
            //     const price = extractPrice(apartment.apart_data.price)
            //     if (minPriceParam) {
            //         matches = matches && (price >= extractPrice(minPriceParam))
            //     }
            //     if (maxPriceParam) {
            //         matches = matches && (price <= extractPrice(maxPriceParam))
            //     }

            //     return matches
            // })

            // ❗ ПАГИНАЦИЯ ТОЛЬКО ПО filteredApartments
            const paginationApartments = filteredApartments.slice(skip, skip + limit)

            const total = filteredApartments.length

            let response = {
                total,
                skip,
                limit,
                totalPages: Math.ceil(total / limit),
                apartments: paginationApartments
            }

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(response))
        }
        catch (e) {
            console.error(e);
            res.writeHead(500);
            return res.end('Server error');
        }
    }
    else {
        res.writeHead(404)
        return res.end('Not found')
    }



});

server.listen(PORT, () => {
    console.log('Server running on ' + PORT);
});

async function readFileData() {
    const filePath = path.join(__dirname, 'files', 'mergerApartList.json');
    return await fs.readFile(filePath, 'utf8');
}

function extractNumberRooms(str) {
    const digits = str.replace(/\D+/g, '');
    return digits ? Number(digits) : null;
}

function extractFloat(str) {
    const match = str.match(/\d+[.,]?\d*/); // цифры, потом точка или запятая, потом цифры (необязательно)
    if (!match) return null;
    return Number(match[0].replace(',', '.')); // заменяем запятую на точку для parseFloat
}

function extractPrice(str) {
    // Убираем все пробелы
    const cleaned = str.replace(/\s+/g, '');

    // Находим первую последовательность цифр, точек или запятых
    const match = cleaned.match(/[\d.,]+/);
    if (!match) return null;

    // Заменяем запятую на точку (для десятичных чисел)
    const numStr = match[0].replace(',', '.');

    return Number(numStr);
}