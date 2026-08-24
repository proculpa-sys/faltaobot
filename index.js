const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Fichier de sauvegarde pour les cooldowns HWID (délai de 24h)
const DB_FILE = './database.json';

function loadDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ cooldowns: {}, hwids: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag} !`);
});

// Commande pour envoyer le panneau de gestion (tape !panel sur ton Discord)
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!panel') {
        const embed = new EmbedBuilder()
            .setTitle("🔑 Faltao Hub - Gestion des Clés & HWID")
            .setDescription("Utilise les boutons ci-dessous pour récupérer ta clé du jour ou demander un reset de ton HWID.\n\n*⚠️ Le reset HWID n'est possible qu'une fois toutes les 24h.*")
            .setColor(0x5865F2);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('get_key')
                    .setLabel('🔑 Obtenir / Voir ma Clé')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('reset_hwid')
                    .setLabel('🔄 Reset HWID (24h)')
                    .setStyle(ButtonStyle.Danger)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// Gestion des interactions (Clics sur les boutons)
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const db = loadDatabase();
    const now = Date.now();
    const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

    if (interaction.customId === 'get_key') {
        await interaction.reply({ 
            content: "🔒 Voici ton lien de vérification Linkvertise pour valider ton accès : https://link-center.net/7819524/2IXzAq35ia7o", 
            ephemeral: true 
        });
    } 
    
    else if (interaction.customId === 'reset_hwid') {
        const lastReset = db.cooldowns[userId] || 0;

        if (now - lastReset < COOLDOWN_TIME) {
            const remainingTime = Math.ceil((COOLDOWN_TIME - (now - lastReset)) / (1000 * 60 * 60));
            await interaction.reply({ 
                content: `❌ Tu dois encore patienter environ **${remainingTime} heure(s)** avant de pouvoir demander un nouveau reset HWID.`, 
                ephemeral: true 
            });
        } else {
            db.cooldowns[userId] = now;
            if (db.hwids[userId]) {
                delete db.hwids[userId];
            }
            saveDatabase(db);

            await interaction.reply({ 
                content: "✅ Ton HWID a été réinitialisé avec succès ! Tu peux désormais utiliser ta clé sur ton nouvel appareil.", 
                ephemeral: true 
            });
        }
    }
});

// Connexion sécurisée via les variables d'environnement de Render
client.login(process.env.DISCORD_TOKEN);
