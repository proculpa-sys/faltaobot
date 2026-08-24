const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const http = require('http');

// Serveur HTTP léger pour garder le bot éveillé sur Render
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('FaltaoBot est en ligne et opérationnel !');
}).listen(PORT, () => {
    console.log(`Serveur Web actif sur le port ${PORT}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;

// TON LIEN LINKVERTISE FIXE
const LINKVERTISE_URL = 'https://link-center.net/7819524/2IXzAq35ia7o';

// ID de ton rôle "Accès Clé" sur Discord (mets l'ID exact de ton rôle ici)
const KEY_ROLE_ID = 'MET_TON_ID_DE_ROLE_ICI';

// Fonction pour calculer la clé quotidienne
function getDailyKey() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    
    const rawString = `FaltaoSecretKey_${year}_${month}_${day}`;
    
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
        hash = (hash * 31 + rawString.charCodeAt(i)) % 100000000;
    }
    
    return `faltao_${hash.toString(16).toLowerCase().padStart(8, '0')}`;
}

// Fonction pour planifier le reset à minuit UTC
function scheduleMidnightReset() {
    const now = new Date();
    const night = new Date(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1, // Le lendemain à 00h00 UTC
        0, 0, 0
    );
    const timeToMidnight = night.getTime() - now.getTime();

    setTimeout(async () => {
        await resetAllRoles();
        // Relance le timer pour le jour d'après
        scheduleMidnightReset();
    }, timeToMidnight);
}

// Fonction pour retirer le rôle à tous les membres du serveur
async function resetAllRoles() {
    try {
        const guild = client.guilds.cache.first(); // Récupère ton serveur
        if (!guild) return;
        
        await guild.members.fetch(); // Charge tous les membres en cache
        const role = guild.roles.cache.get(KEY_ROLE_ID);
        if (!role) return;

        console.log("Minuit atteint : Retrait automatique du rôle d'accès pour tout le monde...");
        for (const member of role.members.values()) {
            await member.roles.remove(role).catch(() => {});
        }
        console.log("Reset des rôles terminé avec succès !");
    } catch (error) {
        console.error("Erreur lors du reset des rôles à minuit :", error);
    }
}

client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    client.user.setActivity('Faltao Hub | !setup', { type: 3 });
    scheduleMidnightReset(); // Lance le compte à rebours pour minuit
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply({ content: "❌ Tu n'as pas les permissions nécessaires.", flags: MessageFlags.Ephemeral });
        }

        await message.delete().catch(() => {});

        const embed = new EmbedBuilder()
            .setTitle('⚡ Faltao Hub — Key System')
            .setDescription('Bienvenue sur le système de clé de **Faltao Hub**.\n\n**Étapes :**\n1️⃣ Clique sur **Lien Linkvertise** et passe les étapes.\n2️⃣ Une fois validé, obtiens ton rôle d\'accès.\n3️⃣ Clique sur **Clé du Jour** pour récupérer ta clé valide !')
            .setColor(0x9B59B6)
            .setFooter({ text: 'Faltao Hub • Sécurité anti-bypass' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('get_link')
                .setLabel('Lien Linkvertise')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🔗'),
            new ButtonBuilder()
                .setCustomId('get_key')
                .setLabel('Clé du Jour')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔑'),
            new ButtonBuilder()
                .setCustomId('get_script')
                .setLabel('Obtenir le Script')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📜')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'get_link') {
        await interaction.reply({
            content: `🔗 **Passe par ce lien Linkvertise pour débloquer ton accès :**\n${LINKVERTISE_URL}\n\n*(Ensuite, assure-toi d'avoir ton rôle d'accès sur le serveur pour récupérer la clé !)*`,
            flags: MessageFlags.Ephemeral
        });
    }

    if (interaction.customId === 'get_key') {
        // Vérifie si l'utilisateur a le rôle requis
        if (!interaction.member.roles.cache.has(KEY_ROLE_ID)) {
            return interaction.reply({
                content: `❌ **Accès refusé !** Tu n'as pas le rôle requis pour obtenir la clé.\n👉 Passe d'abord par ton lien Linkvertise pour valider ton accès.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const todaysKey = getDailyKey();
        await interaction.reply({
            content: `🔑 **Voici ta clé du jour :** \`${todaysKey}\`\n*Bon jeu sur Faltao Hub !*`,
            flags: MessageFlags.Ephemeral
        });
    }

    if (interaction.customId === 'get_script') {
        const scriptCode = `loadstring(game:HttpGet("https://raw.githubusercontent.com/proculpa-sys/faltaobot/refs/heads/main/script.lua"))()`;
        await interaction.reply({
            content: `📜 **Voici le script complet à coller dans ton exécuteur :**\n\`\`\`lua\n${scriptCode}\n\`\`\``,
            flags: MessageFlags.Ephemeral
        });
    }
});

client.login(TOKEN);
