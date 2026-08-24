const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const http = require('http');

// Serveur HTTP pour Render
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('FaltaoBot est en ligne !');
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

// CONFIGURATION
const TOKEN = process.env.TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'proculpa-sys';
const REPO_NAME = 'faltaobot';
const FILE_PATH = 'keys.txt';

// Colle ton lien Linkvertise ici
const LINKVERTISE_URL = 'https://linkvertise.com/ton-lien-ici';

async function addKeyToGithub(key) {
    if (!GITHUB_TOKEN) return false;

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
                message: `Activation de la clé ${key}`,
                content: encodedContent,
                sha: sha || undefined
            })
        });

        return putRes.ok;
    } catch (err) {
        console.error('Erreur GitHub API :', err);
        return false;
    }
}

client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
});

// Commande !setup pour envoyer le panneau principal
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        if (!message.member.permissions.has('Administrator')) return;

        await message.delete().catch(() => {});

        const embed = new EmbedBuilder()
            .setTitle('Faltao Hub — Key System')
            .setDescription('Suis les étapes ci-dessous pour activer ton accès 24h :\n\n1️⃣ Clique sur **Obtenir le lien** et passe les étapes Linkvertise.\n2️⃣ Copie la clé reçue et clique sur **Valider ma clé**.\n3️⃣ Récupère ensuite ton script !')
            .setColor(0x9B59B6)
            .setFooter({ text: 'Faltao Hub • Système de Clé 24h' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('get_link_btn')
                .setLabel('Obtenir le lien (Linkvertise)')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔗'),
            new ButtonBuilder()
                .setCustomId('redeem_key_btn')
                .setLabel('Valider ma clé')
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

// Gestion des interactions (Boutons + Modals)
client.on('interactionCreate', async (interaction) => {
    // 1. GESTION DES BOUTONS
    if (interaction.isButton()) {
        if (interaction.customId === 'get_link_btn') {
            await interaction.reply({
                content: `Voici ton lien pour récupérer ta clé (valable 24h) :\n${LINKVERTISE_URL}`,
                flags: MessageFlags.Ephemeral
            });
        }

        if (interaction.customId === 'redeem_key_btn') {
            // Ouverture de la fenêtre pop-up pour saisir la clé
            const modal = new ModalBuilder()
                .setCustomId('key_modal')
                .setTitle('Validation de votre clé');

            const keyInput = new TextInputBuilder()
                .setCustomId('user_key_input')
                .setLabel('Entrez votre clé d\'accès :')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: FALTAO-XXXX-XXXX')
                .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(keyInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
        }

        if (interaction.customId === 'get_script_btn') {
            const scriptCode = `loadstring(game:HttpGet("https://raw.githubusercontent.com/proculpa-sys/faltaobot/refs/heads/main/script.lua"))()`;
            await interaction.reply({
                content: `Voici le script Roblox :\n\`\`\`lua\n${scriptCode}\n\`\`\``,
                flags: MessageFlags.Ephemeral
            });
        }
    }

    // 2. GESTION DU FORMULAIRE POP-UP (MODAL)
    if (interaction.isModalSubmit() && interaction.customId === 'key_modal') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const enteredKey = interaction.fields.getTextInputValue('user_key_input').trim();
        const success = await addKeyToGithub(enteredKey);

        if (success) {
            await interaction.editReply({
                content: `✅ La clé \`${enteredKey}\` a été validée avec succès ! Tu peux maintenant l'utiliser dans Roblox.`
            });
        } else {
            await interaction.editReply({
                content: '⚠️ Erreur lors de l\'enregistrement de la clé. Réessaie ou vérifie ta configuration.'
            });
        }
    }
});

client.login(TOKEN);
