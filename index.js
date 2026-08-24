const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const fs = require('fs');
const express = require('express');

// Mini serveur web pour que Render détecte un port ouvert et ne crash pas
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Serveur web actif sur le port ${PORT}`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

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

client.once('clientReady', () => {
    console.log(`Bot connecté en tant que ${client.user.tag} !`);
});

// Commande !setup pour envoyer le panneau complet (un seul message propre)
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        const embed = new EmbedBuilder()
            .setTitle("⚡ Faltao Hub — Système de Clé HWID")
            .setDescription("Comment obtenir ta clé unique ?\n\n" +
                "1️⃣ **Lien Linkvertise** pour passer les pubs.\n" +
                "2️⃣ Clique sur **Obtenir le script HWID** et exécute-le en jeu.\n" +
                "3️⃣ Clique sur **Générer ma Clé HWID** et colle ton code !\n" +
                "4️⃣ Ton accès sera actif pour **24 heures**.")
            .setColor(0x5865F2);

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Lien Linkvertise')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://link-center.net/7819524/2IXzAq35ia7o'),
                new ButtonBuilder()
                    .setCustomId('get_hwid_script')
                    .setLabel('📋 Obtenir le script HWID')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('gen_hwid_modal')
                    .setLabel('🔑 Générer ma Clé HWID')
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('get_my_hwid')
                    .setLabel('🔍 Voir mon HWID')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('reset_hwid')
                    .setLabel('🔄 Reset HWID (24h)')
                    .setStyle(ButtonStyle.Danger)
            );

        await message.channel.send({ embeds: [embed], components: [row1, row2] });
    }
});

// Gestion des interactions (Boutons et Modals)
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        const userId = interaction.user.id;
        const db = loadDatabase();

        if (interaction.customId === 'get_hwid_script') {
            await interaction.reply({ 
                content: "📋 **Voici le script pour copier ton HWID en jeu :**\n*Exécute ce code dans ton exécuteur Roblox, ton HWID sera automatiquement copié dans ton presse-papier !*\n```lua\n-- Script de récupération HWID pour Faltao Hub\nlocal hwid = gethwid() or syn and syn.request and 'Synapse_HWID' or identifyexecutor and identifyexecutor() or 'Inconnu'\nsetclipboard(tostring(hwid))\nprint('Ton HWID : ' .. tostring(hwid))\n```", 
                flags: MessageFlags.Ephemeral 
            });
        }

        else if (interaction.customId === 'gen_hwid_modal') {
            const modal = new ModalBuilder()
                .setCustomId('hwid_modal_submit')
                .setTitle('Génération de Clé HWID');

            const hwidInput = new TextInputBuilder()
                .setCustomId('hwid_input')
                .setLabel('Colle ton HWID ici :')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: HWID-XXXX-YYYY-ZZZZ')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(hwidInput));
            await interaction.showModal(modal);
        } 
        
        else if (interaction.customId === 'get_my_hwid') {
            const currentHwid = db.hwids[userId];
            if (!currentHwid) {
                await interaction.reply({ content: "❌ Tu n'as aucun HWID enregistré. Clique sur **Générer ma Clé HWID** pour l'ajouter.", flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: `🔍 Ton HWID enregistré actuellement est :\n\`${currentHwid}\``, flags: MessageFlags.Ephemeral });
            }
        }

        else if (interaction.customId === 'reset_hwid') {
            const now = Date.now();
            const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 heures
            const lastReset = db.cooldowns[userId] || 0;

            if (now - lastReset < COOLDOWN_TIME) {
                const remainingTime = Math.ceil((COOLDOWN_TIME - (now - lastReset)) / (1000 * 60 * 60));
                await interaction.reply({ content: `❌ Tu dois encore patienter environ **${remainingTime} heure(s)** avant un nouveau reset HWID.`, flags: MessageFlags.Ephemeral });
            } else {
                db.cooldowns[userId] = now;
                if (db.hwids[userId]) delete db.hwids[userId];
                saveDatabase(db);

                await interaction.reply({ content: "✅ Ton HWID a été réinitialisé avec succès ! Tu peux enregistrer un nouvel appareil.", flags: MessageFlags.Ephemeral });
            }
        }
    } 
    
    else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'hwid_modal_submit') {
            const hwid = interaction.fields.getTextInputValue('hwid_input').trim();
            const userId = interaction.user.id;
            
            if (hwid.length < 5) {
                return await interaction.reply({ content: "❌ **HWID invalide !** Ce code est trop court.", flags: MessageFlags.Ephemeral });
            }

            const db = loadDatabase();

            for (let [storedUserId, storedHwid] of Object.entries(db.hwids)) {
                if (storedHwid === hwid && storedUserId !== userId) {
                    return await interaction.reply({ content: "❌ **Erreur :** Cet HWID est déjà lié à un **autre compte Discord** !", flags: MessageFlags.Ephemeral });
                }
            }

            db.hwids[userId] = hwid;
            saveDatabase(db);

            const uniqueKey = `faltao_${userId}_${Math.random().toString(36).substring(2, 10)}`;

            await interaction.reply({ 
                content: `✅ **Clé générée avec succès !**\n\n🔑 **Ta clé unique :** \`${uniqueKey}\`\n💻 **HWID associé :** \`${hwid}\`\n⏳ **Validité :** 24 heures.\n\n*Garde-la précieusement !*`, 
                flags: MessageFlags.Ephemeral 
            });
        }
    }
});

client.login(process.env.TOKEN);
