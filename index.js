const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('FaltaoBot HWID System en ligne !');
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
const DB_FILE = './keys.json';

// Charger ou initialiser la base de données locale des clés et expirations
let keyDatabase = {};
if (fs.existsSync(DB_FILE)) {
    try {
        keyDatabase = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        keyDatabase = {};
    }
}

function saveDatabase() {
    fs.writeFileSync(DB_FILE, JSON.stringify(keyDatabase, null, 2));
}

// Générer une clé unique liée au HWID et au timestamp d'expiration (24h)
function generateHWIDKey(hwid) {
    const rawString = `FaltaoSecure_${hwid}_${Math.floor(Date.now() / (1000 * 60 * 60 * 24))}`;
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
        hash = (hash * 31 + rawString.charCodeAt(i)) % 100000000;
    }
    return `faltao_${hwid.slice(0, 4)}_${hash.toString(16).toLowerCase().padStart(8, '0')}`;
}

// Vérification périodique (toutes les minutes) pour retirer les rôles expirés (24h glissantes)
function startExpirationChecker() {
    setInterval(async () => {
        const now = Date.now();
        const guild = client.guilds.cache.first();
        if (!guild) return;

        let updated = false;
        for (const [userId, data] of Object.entries(keyDatabase)) {
            if (now >= data.expiresAt) {
                try {
                    const member = await guild.members.fetch(userId).catch(() => null);
                    if (member) {
                        const role = guild.roles.cache.get(KEY_ROLE_ID);
                        if (role && member.roles.cache.has(KEY_ROLE_ID)) {
                            await member.roles.remove(role);
                            console.log(`Rôle retiré automatiquement pour ${member.user.tag} (24h écoulées).`);
                        }
                    }
                } catch (e) {
                    console.error("Erreur lors du retrait du rôle expiré :", e);
                }
                delete keyDatabase[userId];
                updated = true;
            }
        }
        if (updated) saveDatabase();
    }, 60000); // Vérifie chaque minute
}

client.on('ready', () => {
    console.log(`Bot connecté : ${client.user.tag}`);
    startExpirationChecker();
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        if (!message.member.permissions.has('Administrator')) return;
        await message.delete().catch(() => {});

        const embed = new EmbedBuilder()
            .setTitle('⚡ Faltao Hub — Système de Clé HWID')
            .setDescription('**Comment obtenir ta clé unique (liée à ton PC) ?**\n\n1️⃣ Clique sur **Lien Linkvertise** pour passer les pubs.\n2️⃣ Récupère ton HWID depuis ton exécuteur en jeu.\n3️⃣ Clique sur **Générer ma Clé HWID** et entre ton code !\n4️⃣ Ton rôle sera actif pour exactement **24 heures**.')
            .setColor(0x9B59B6);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_link').setLabel('Lien Linkvertise').setStyle(ButtonStyle.Success).setEmoji('🔗'),
            new ButtonBuilder().setCustomId('open_hwid_modal').setLabel('Générer ma Clé HWID').setStyle(ButtonStyle.Primary).setEmoji('🔑'),
            new ButtonBuilder().setCustomId('get_script').setLabel('Obtenir le Script').setStyle(ButtonStyle.Secondary).setEmoji('📜')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'get_link') {
            await interaction.reply({
                content: `🔗 **Passe par ce lien Linkvertise :**\n${LINKVERTISE_URL}`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Ouvre une petite fenêtre modale pour que l'utilisateur colle son HWID
        if (interaction.customId === 'open_hwid_modal') {
            const modal = new ModalBuilder()
                .setCustomId('hwid_modal')
                .setTitle('Génération de Clé HWID');

            const hwidInput = new TextInputBuilder()
                .setCustomId('hwid_input')
                .setLabel("Colle ton HWID (fourni par ton script)")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: client_id_ou_hwid_unique')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(hwidInput));
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'get_script') {
            const scriptCode = `loadstring(game:HttpGet("https://raw.githubusercontent.com/proculpa-sys/faltaobot/refs/heads/main/script.lua"))()`;
            await interaction.reply({
                content: `📜 **Voici le script :**\n\`\`\`lua\n${scriptCode}\n\`\`\``,
                flags: MessageFlags.Ephemeral
            });
        }
    }

    // Réception du HWID envoyé via la fenêtre modale
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'hwid_modal') {
            const hwid = interaction.fields.getTextInputValue('hwid_input').trim();
            const userId = interaction.user.id;
            const now = Date.now();
            const expiresAt = now + (24 * 60 * 60 * 1000); // Durée exacte de 24h glissantes

            // Génère la clé unique pour ce HWID
            const userKey = generateHWIDKey(hwid);

            // Enregistre en base de données locale
            keyDatabase[userId] = {
                hwid: hwid,
                key: userKey,
                expiresAt: expiresAt
            };
            saveDatabase();

            // Attribue le rôle d'accès
            const role = interaction.guild.roles.cache.get(KEY_ROLE_ID);
            if (role) {
                await interaction.member.roles.add(role).catch(() => {});
            }

            await interaction.reply({
                content: `✅ **Clé générée avec succès !**\n\n🔑 Ta clé unique : \`${userKey}\`\n💻 HWID associé : \`${hwid}\`\n⏳ **Validité :** 24 heures (Expire le <t:${Math.floor(expiresAt / 1000)}:R>).\n\n*Garde-la précieusement, elle ne fonctionne que sur ton PC !*`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
});

client.login(TOKEN);
