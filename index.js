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

// Ton vrai lien Linkvertise
const LINKVERTISE_KEY_LINK = 'https://link-center.net/7819524/2IXzAq35ia7o';

client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    client.user.setActivity('Faltao Hub | !setup', { type: 3 });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply({ content: "❌ Tu n'as pas les permissions nécessaires pour utiliser cette commande.", flags: MessageFlags.Ephemeral });
        }

        await message.delete().catch(() => {});

        const embed = new EmbedBuilder()
            .setTitle('⚡ Faltao Hub — Control Panel')
            .setDescription('Bienvenue sur le panneau de contrôle officiel de **Faltao Hub**.\n\nChoisis une option ci-dessous :\n• **Obtenir une Clé (24h)** : Valide ton accès gratuit via Linkvertise.\n• **Obtenir le Script** : Copie le loadstring à lancer dans ton exécuteur.')
            .setColor(0x9B59B6)
            .setFooter({ text: 'Faltao Hub • Système de clé sécurisé' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('get_key_link')
                .setLabel('Obtenir une Clé (24h)')
                .setStyle(ButtonStyle.Success)
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

    if (interaction.customId === 'get_key_link') {
        await interaction.reply({
            content: `🔑 **Voici ton lien unique pour obtenir ta clé d'accès (valable 24h) :**\n${LINKVERTISE_KEY_LINK}\n\n*Passe les étapes sur le lien pour récupérer ta clé !*`,
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
