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
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;

// Ton vrai lien Linkvertise fixe
const LINKVERTISE_URL = 'https://link-center.net/7819524/2IXzAq35ia7o';

// Fonction pour générer exactement la même clé quotidienne que le script Roblox
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
    
    return `FALTAO-${hash.toString(16).toUpperCase().padStart(8, '0')}`;
}

client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    client.user.setActivity('Faltao Hub | !setup', { type: 3 });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply({ content: "❌ Tu n'as pas les permissions nécessaires.", flags: MessageFlags.Ephemeral });
        }

        await message.delete().catch(() => {});

        const embed = new EmbedBuilder()
            .setTitle('⚡ Faltao Hub — Control Panel')
            .setDescription('Bienvenue sur le panneau de contrôle officiel de **Faltao Hub**.\n\nChoisis une option ci-dessous :\n• **Obtenir le Lien Linkvertise** : Ouvre la page pour passer les étapes.\n• **Obtenir la Clé du Jour** : Affiche la clé valide (générée automatiquement).\n• **Obtenir le Script** : Récupère le loadstring à lancer.')
            .setColor(0x9B59B6)
            .setFooter({ text: 'Faltao Hub • Clé quotidienne automatique' })
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
            content: `🔗 **Voici ton lien Linkvertise :**\n${LINKVERTISE_URL}`,
            flags: MessageFlags.Ephemeral
        });
    }

    if (interaction.customId === 'get_key') {
        const todaysKey = getDailyKey();
        await interaction.reply({
            content: `🔑 **Voici la clé d'aujourd'hui :** \`${todaysKey}\`\n*(Assure-toi d'avoir fait le lien Linkvertise avant !)*`,
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
