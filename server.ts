import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({ level: 'silent' });

let qrCodeData: string | null = null;
let connectionStatus: 'connecting' | 'open' | 'close' | 'qr' = 'connecting';
let lastError: string | null = null;

async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(`Using Baileys v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: true,
        logger,
        browser: ['Nexus-Alpha', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrCodeData = await QRCode.toDataURL(qr);
            connectionStatus = 'qr';
            console.log('Nexus-Alpha: QR Code generated. Scan with your phone.');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            connectionStatus = 'close';
            lastError = lastDisconnect?.error?.message || 'Unknown error';
            if (shouldReconnect) {
                startWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Nexus-Alpha: WhatsApp Connection Secured for:', sock.user?.id);
            connectionStatus = 'open';
            qrCodeData = null;
            lastError = null;
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message) return;

        const sender = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const lowerText = text?.toLowerCase();

        console.log(`[Nexus-Alpha] Message from ${sender} (fromMe: ${fromMe}): ${text}`);

        // If it's from me, we still process it for testing, but we can skip if it's not a command
        if (fromMe && !lowerText?.startsWith('!')) {
            if (lowerText !== 'ping') return;
        }

        if (lowerText === 'ping') {
            await sock.sendMessage(sender!, { text: 'Pong! 🥤 Dr Pepper Bot is active.' });
        } else if (lowerText === '!help') {
            const helpText = `*Nexus-Alpha Command Protocol*
            
Available Commands:
- *ping*: Check bot status
- *!help*: Show this menu
- *!status*: System health check
- *!echo <text>*: Repeat your message`;
            await sock.sendMessage(sender!, { text: helpText });
        } else if (lowerText === '!status') {
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            await sock.sendMessage(sender!, { text: `*System Status:*
- *Uptime:* ${hours}h ${minutes}m
- *Connection:* Secured
- *Protocol:* Nexus-Alpha v1.0.0` });
        } else if (lowerText?.startsWith('!echo ')) {
            const echoText = text?.slice(6);
            await sock.sendMessage(sender!, { text: `*Echo:* ${echoText}` });
        }
    });
}

async function createServer() {
    const app = express();
    const port = 3000;

    // WhatsApp API Endpoints
    app.get('/api/whatsapp/status', (req, res) => {
        res.json({
            status: connectionStatus,
            qr: qrCodeData,
            error: lastError,
            user: sock?.user
        });
    });

    app.post('/api/whatsapp/test-ping', async (req, res) => {
        if (connectionStatus !== 'open' || !sock) {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }
        try {
            const myId = sock.user?.id;
            if (myId) {
                await sock.sendMessage(myId, { text: '🥤 Nexus-Alpha: Internal Test Ping Successful.' });
                res.json({ success: true });
            } else {
                res.status(400).json({ error: 'User ID not found' });
            }
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(port, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${port}`);
        startWhatsApp().catch(err => console.error("Failed to start WhatsApp:", err));
    });
}

createServer();
