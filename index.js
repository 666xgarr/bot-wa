const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');

async function startBot() {
    // Menyimpan sesi login agar tidak perlu scan QR berulang kali
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true // Scan QR ini di WhatsApp -> Linked Devices
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus, mencoba menyambung kembali...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Bot sudah online!');
        }
    });

    // Bagian Logika Respon Chat
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     "";
        
        const command = body.toLowerCase();

        // Logika Perintah
        if (command === '.buy') {
            await sock.sendMessage(from, { text: 'Halo! Silahkan pilih produk yang ingin kamu beli di daftar kami.' });
        } 
        else if (command === '.sl') {
            await sock.sendMessage(from, { text: 'cacicu' });
        }
        else if (command === '.menu') {
            await sock.sendMessage(from, { text: 'Daftar Perintah:\n1. .buy\n2. .sl' });
        }
    });
}

startBot();
