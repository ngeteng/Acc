const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Mengirim pesan ke chat Telegram yang ditentukan.
 * @param {string} message Pesan yang ingin dikirim.
 */
async function sendMessage(message) {
    if (!BOT_TOKEN || !CHAT_ID) {
        console.warn("⚠️ Variabel Telegram (BOT_TOKEN atau CHAT_ID) tidak diatur. Pesan tidak dikirim.");
        return;
    }

    // URL API Telegram untuk mengirim pesan
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown' // Kita bisa pakai format Markdown seperti *bold* dan _italic_
        });
        console.log(" Laporan Telegram terkirim!");
    } catch (error) {
        console.error("❌ Gagal mengirim laporan Telegram:", error.response ? error.response.data : error.message);
    }
}

// Ekspor fungsi agar bisa digunakan di file lain
module.exports = { sendMessage };
