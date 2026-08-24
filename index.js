const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const http = require('http');

const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('FaltaoBot est en ligne !');
}).listen(PORT);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;
const LINKVERTISE_URL = 'https://link-center.net/7819524/2IXzAq35ia7o';
const KEY_ROLE_ID = '1541487216444833792';

// Fonction de calcul de la clé du jour synchronisée
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

// Reset des rôles à minuit UTC
function scheduleMidnightReset() {
    const now = new Date();
    const night = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0);
    setTimeout(async () => {
        await resetAllRoles();
        scheduleMidnightReset();
    }, night.getTime() - now.getTime());
}

async function resetAllRoles() {
    try {
        const guild = client.guilds.cache.first();
        if (!guild) return;
        await guild.members.fetch();
        const role = guild.roles.cache.get(KEY_ROLE_ID);
        if (!role) return;

        for (const member of role.members.values()) {
            await member.roles.remove(role).catch(() => {});
        }
        console.log("Rôles d'accès réinitialisés à minuit !");
    } catch (error) {
        console.error(error);
    }
}

client.on('ready', () => {
    console.log(`Bot connecté : ${client.user.tag}`);
    scheduleMidnightReset();
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        if (!message.member.permissions.has('Administrator')) return;
        await message.delete().catch(() => {});

        const embed = new EmbedBuilder()
            .setTitle('⚡ Faltao Hub — Key System')
            .setDescription('**Comment obtenir ta clé du jour ?**\n\n1️⃣ Clique sur **Lien Linkvertise** pour passer les pubs.\n2️⃣ Sur la page finale, clique sur le bouton pour valider ton accès.\n3️⃣ Reviens ici et clique sur **Clé du Jour** pour récupérer ta clé !')
            .setColor(0x9B59B6);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_link').setLabel('Lien Linkvertise').setStyle(ButtonStyle.Success).setEmoji('🔗'),
            new ButtonBuilder().setCustomId('verify_access').setLabel('Valider mon Accès').setStyle(ButtonStyle.Primary).setEmoji('✅'),
            new ButtonBuilder().setCustomId('get_key').setLabel('Clé du Jour').setStyle(ButtonStyle.Secondary).setEmoji('🔑'),
            new ButtonBuilder().setCustomId('get_script').setLabel('Obtenir le Script').setStyle(ButtonStyle.Danger).setEmoji('📜')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'get_link') {
        await interaction.reply({
            content: `🔗 **Passe par ce lien Linkvertise :**\n${LINKVERTISE_URL}`,
            flags: MessageFlags.Ephemeral
        });
    }

    // NOUVEAU BOUTON DE VALIDATION DIRECTE
    if (interaction.customId === 'verify_access') {
        const role = interaction.guild.roles.cache.get(KEY_ROLE_ID);
        if (role) {
            await interaction.member.roles.add(role).catch(() => {});
            await interaction.reply({
                content: `✅ **Accès validé !** Le rôle t'a été attribué avec succès. Tu peux maintenant cliquer sur **Clé du Jour** !`,
                flags: MessageFlags.Ephemeral
            });
        } else {
            await interaction.reply({
                content: `❌ Erreur de configuration du rôle sur le serveur.`,
                flags: MessageFlags.Ephemeral
            });
        }
    }

    if (interaction.customId === 'get_key') {
        if (!interaction.member.roles.cache.has(KEY_ROLE_ID)) {
            return interaction.reply({
                content: `❌ **Accès refusé !** Clique d'abord sur **Valider mon Accès** après avoir fait ton Linkvertise.`,
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
            content: `📜 **Voici le script :**\n\`\`\`lua\n${scriptCode}\n\`\`\``,
            flags: MessageFlags.Ephemeral
        });
    }
});

client.login(TOKEN);
