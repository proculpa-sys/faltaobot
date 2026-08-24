const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'proculpa-sys';
const REPO_NAME = 'faltaobot';
const FILE_PATH = 'keys.txt';

// Génère une clé unique au format FALTAO-XXXX-XXXX
function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let p1 = '', p2 = '';
    for (let i = 0; i < 4; i++) p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 4; i++) p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    return `FALTAO-${p1}-${p2}`;
}

// Ajoute la clé dans keys.txt via l'API GitHub
async function addKeyToGithub(key) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const headers = {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'FaltaoBot'
    };

    try {
        const res = await fetch(url, { headers });
        let sha = null;
        let currentContent = '';

        if (res.ok) {
            const data = await res.json();
            sha = data.sha;
            currentContent = Buffer.from(data.content, 'base64').toString('utf-8');
        }

        const newContent = currentContent.trim() + '\n' + key + '\n';
        const encodedContent = Buffer.from(newContent, 'utf-8').toString('base64');

        const putRes = await fetch(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                message: `Ajout de la clé ${key}`,
                content: encodedContent,
                sha: sha || undefined
            })
        });

        return putRes.ok;
    } catch (err) {
        console.error(err);
        return false;
    }
}

client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
});

// Commande !setup pour envoyer le panneau à boutons
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        if (!message.member.permissions.has('Administrator')) return;

        await message.delete().catch(() => {});

        const embed = new EmbedBuilder()
            .setTitle('Faltao Hub — Control Panel')
            .setDescription('Clique sur les boutons ci-dessous pour générer ta clé d\'accès ou récupérer le script Roblox.')
            .setColor(0x9B59B6)
            .setFooter({ text: 'Faltao Hub • Système de Clé Automatique' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('get_key_btn')
                .setLabel('Obtenir une Clé')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🔑'),
            new ButtonBuilder()
                .setCustomId('get_script_btn')
                .setLabel('Obtenir le Script')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📜')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// Gestion des clics sur les boutons
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'get_key_btn') {
        await interaction.deferReply({ ephemeral: true });

        const key = generateKey();
        const success = await addKeyToGithub(key);

        if (success) {
            await interaction.followup({
                content: `Voici ta clé d'accès unique : \`${key}\`\n\nCopie-colle la dans le menu du script sur Roblox !`,
                ephemeral: true
            });
        } else {
            await interaction.followup({
                content: 'Erreur lors de l\'ajout de la clé sur GitHub. Vérifie tes variables sur Render.',
                ephemeral: true
            });
        }
    }

    if (interaction.customId === 'get_script_btn') {
        const scriptCode = `loadstring(game:HttpGet("https://raw.githubusercontent.com/proculpa-sys/faltaobot/refs/heads/main/script.lua"))()`;
        await interaction.reply({
            content: `Voici le script à exécuter dans ton exécuteur Roblox :\n\`\`\`lua\n${scriptCode}\n\`\`\``,
            ephemeral: true
        });
    }
});

client.login(TOKEN);
