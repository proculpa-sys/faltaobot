const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, REST, Routes, MessageFlags } = require('discord.js');
const fs = require('fs');
const express = require('express');
const fetch = require('node-fetch'); // Assure-toi de l'installer si besoin ou utilise fetch natif de Node 18+

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration (Mets ton vrai CLIENT_ID, CLIENT_SECRET et le lien de ton app Render)
const CLIENT_ID = process.env.CLIENT_ID || 'TON_CLIENT_ID_DISCORD';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'TON_CLIENT_SECRET_DISCORD';
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://faltaobot.onrender.com/auth/discord/callback';
const GUILD_ID = process.env.GUILD_ID || 'TON_SERVER_ID';
const ROLE_ID = process.env.ROLE_ID || 'ID_DU_ROLE_ACCES_H24';

const DB_FILE = './database.json';

function loadDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ keys: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- PARTIE SERVEUR WEB (Où l'utilisateur arrive après Linkvertise & OAuth2) ---
app.get('/', (req, res) => {
    res.send('<h1>Faltao Hub Key System</h1><p>Veuillez passer par Linkvertise et le bot Discord pour obtenir votre clé.</p>');
});

// Étape de redirection vers Discord OAuth2
app.get('/auth/discord', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`;
    res.redirect(discordAuthUrl);
});

// Callback après autorisation de l'application par l'utilisateur
app.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('❌ Erreur : Code d\'autorisation manquant.');

    try {
        // 1. Échanger le code contre un Token Discord
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) return res.send('❌ Erreur lors de la récupération du token Discord.');

        // 2. Récupérer les infos de l'utilisateur
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userResponse.json();
        const userId = userData.id;

        // 3. Ajouter l'utilisateur sur le serveur et lui donner le rôle d'accès
        await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bot ${process.env.TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ access_token: tokenData.access_token, roles: [ROLE_ID] }),
        });

        // 4. Générer la clé unique valable 24h
        const db = loadDatabase();
        const uniqueKey = `faltao_${userId}_${Math.random().toString(36).substring(2, 10)}`;
        db.keys[userId] = { key: uniqueKey, expires: Date.now() + (24 * 60 * 60 * 1000) };
        saveDatabase(db);

        // 5. Afficher la clé à l'utilisateur sur la page web
        res.send(`
            <html>
            <head><title>Faltao Hub - Clé Validée</title></head>
            <body style="background: #111; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1>✅ Accès autorisé avec succès !</h1>
                <p>Ton rôle <b>Accès H24</b> a été ajouté sur le serveur Discord.</p>
                <p>Voici ta clé unique pour le script (valable 24h) :</p>
                <input type="text" value="${uniqueKey}" readonly style="padding: 10px; width: 300px; text-align: center; font-size: 16px; background: #222; color: #5865F2; border: 1px solid #5865F2; border-radius: 5px;" />
                <p style="margin-top: 20px; color: gray;">Tu peux fermer cette page et retourner sur Discord.</p>
            </body>
            </html>
        `);
    } catch (error) {
        console.error(error);
        res.send('❌ Une erreur interne est survenue lors de la validation.');
    }
});

app.listen(PORT, () => console.log(`Serveur web actif sur le port ${PORT}`));

// --- PARTIE BOT DISCORD ---
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag} !`);
});

// Commande !setup pour envoyer le panneau
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        const embed = new EmbedBuilder()
            .setTitle("⚡ Faltao Hub — Système de Clé HWID & Accès H24")
            .setDescription("Pour obtenir ton script et ta clé d'accès (24h) :\n\n" +
                "1️⃣ Clique sur **Lien Linkvertise** pour passer les pubs.\n" +
                "2️⃣ Connecte-toi via l'application pour recevoir ton rôle **Accès H24**.\n" +
                "3️⃣ Récupère ta clé unique affichée sur le site !\n" +
                "4️⃣ Clique sur **Obtenir le script HWID** pour l'exécuter en jeu.")
            .setColor(0x5865F2);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('🔗 Lien Linkvertise / Obtenir la Clé')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://faltaobot.onrender.com/auth/discord'), // Redirige vers le site d'authentification
                new ButtonBuilder()
                    .setCustomId('get_hwid_script')
                    .setLabel('📋 Obtenir le script HWID')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// Donner le script en jeu
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'get_hwid_script') {
        await interaction.reply({ 
            content: "📋 **Voici le script pour ton exécuteur :**\n```lua\n-- Script Faltao Hub\nprint('Script chargé avec succès !')\n```", 
            flags: MessageFlags.Ephemeral 
        });
    }
});

client.login(process.env.TOKEN);
