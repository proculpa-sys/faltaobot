const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const GUILD_ID = process.env.GUILD_ID;
const ROLE_ID = process.env.ROLE_ID;

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

// --- PARTIE SERVEUR WEB (Gère le retour de Discord, donne le rôle et affiche la clé) ---
app.get('/', async (req, res) => {
    const code = req.query.code;
    
    if (!code) {
        return res.send(`
            <html>
            <head><title>Faltao Hub - Clé HWID</title></head>
            <body style="background: #111; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1>⚡ Faltao Hub — Générateur de Clé</h1>
                <p>Tu dois passer par Linkvertise pour récupérer ta clé !</p>
            </body>
            </html>
        `);
    }

    try {
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
        if (!tokenData.access_token) {
            return res.send('❌ Erreur : Impossible de récupérer le token Discord.');
        }

        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userResponse.json();
        const userId = userData.id;

        // Attribution automatique du rôle sur ton serveur Discord
        await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}/roles/${ROLE_ID}`, {
            method: 'PUT',
            headers: { Authorization: `Bot ${process.env.TOKEN}` },
        });

        const db = loadDatabase();
        const uniqueKey = `faltao_${userId}_${Math.random().toString(36).substring(2, 10)}`;
        db.keys[userId] = { key: uniqueKey, expires: Date.now() + (24 * 60 * 60 * 1000) };
        saveDatabase(db);

        res.send(`
            <html>
            <head><title>Faltao Hub - Clé Validée</title></head>
            <body style="background: #111; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1 style="color: #43B581;">✅ Accès autorisé avec succès !</h1>
                <p>Ton rôle <b>Accès H24</b> a été ajouté sur Discord.</p>
                <p>Voici ta clé unique (valable 24h) :</p>
                <input type="text" value="${uniqueKey}" readonly style="padding: 12px; width: 350px; text-align: center; font-size: 16px; background: #222; color: #5865F2; border: 2px solid #5865F2; border-radius: 5px; font-weight: bold;" />
                <p style="margin-top: 20px; color: gray;">Copie ta clé et retourne sur Discord !</p>
            </body>
            </html>
        `);
    } catch (error) {
        console.error(error);
        res.send('❌ Erreur lors de la validation.');
    }
});

app.listen(PORT, () => console.log(`Serveur web actif sur le port ${PORT}`));

// --- PARTIE BOT DISCORD ---
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('clientReady', () => {
    console.log(`Bot connecté en tant que ${client.user.tag} !`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        const embed = new EmbedBuilder()
            .setTitle("⚡ Faltao Hub — Système de Clé HWID & Accès H24")
            .setDescription("Pour obtenir ton script et ta clé d'accès (24h) :\n\n" +
                "1️⃣ Clique sur **Lien Linkvertise** pour passer les pubs.\n" +
                "2️⃣ Connecte-toi et autorise l'app pour recevoir ton rôle **Accès H24**.\n" +
                "3️⃣ Récupère ta clé unique !\n" +
                "4️⃣ Clique sur **Obtenir le script HWID** pour l'exécuter en jeu.")
            .setColor(0x5865F2);

        // Bouton Linkvertise pointant directement vers ton vrai lien
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('🔗 Lien Linkvertise')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://link-center.net/7819524/2IXzAq35ia7o'),
                new ButtonBuilder()
                    .setCustomId('get_hwid_script')
                    .setLabel('📋 Obtenir le script HWID')
                    .setStyle(ButtonStyle.Secondary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('generate_key_modal')
                    .setLabel('🔑 Générer ma Clé HWID')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('reset_hwid')
                    .setLabel('🔄 Reset HWID (24h)')
                    .setStyle(ButtonStyle.Danger)
            );

        await message.channel.send({ embeds: [embed], components: [row1, row2] });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'get_hwid_script') {
        const oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify%20guilds.join`;
        
        await interaction.reply({ 
            content: `📋 **Voici le script pour ton exécuteur :**\n\`\`\`lua\n-- Script Faltao Hub HWID\nprint('Script chargé !')\n\`\`\`\n🔗 *Lien d'authentification :* ${oauthUrl}`, 
            flags: MessageFlags.Ephemeral 
        });
    }

    if (interaction.customId === 'generate_key_modal') {
        await interaction.reply({ content: "🔑 Clique sur le bouton **Lien Linkvertise** du message principal pour obtenir ta clé !", flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'reset_hwid') {
        await interaction.reply({ content: "🔄 Ton HWID a bien été réinitialisé pour 24h !", flags: MessageFlags.Ephemeral });
    }
});

client.login(process.env.TOKEN);
