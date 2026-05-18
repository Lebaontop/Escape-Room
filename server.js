const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// تشغيل الملفات الموجودة في المجلد
app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('مخترق جديد متصل بنظام SOLAR');

    socket.on('disconnect', () => {
        console.log('مخترق غادر النظام');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`
    ==========================================
    🚀 نظام SOLAR_OS يعمل الآن بنجاح!
    🔗 الرابط: http://localhost:${PORT}
    ==========================================
    `);
});