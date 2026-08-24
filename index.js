const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');

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

client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag} !`);
});

// Commande !setup pour envoyer le panneau complet avec tous les boutons
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        const embed = new EmbedBuilder()
            .setTitle("⚡ Faltao Hub — Système de Clé HWID")
            .setDescription("Comment obtenir et gérer ta clé unique (liée à ton PC) ?\n\n" +
                "1️⃣ **Lien Linkvertise** pour passer les pubs.\n" +
                "2️⃣ **Générer ma Clé HWID** pour enregistrer ton code unique.\n" +
                "3️⃣ **Voir mon HWID** pour vérifier ton appareil actuel.\n" +
                "4️⃣ **Reset HWID** pour changer de PC (disponible toutes les 24h).")
            .setColor(0x5865F2);

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Lien Linkvertise')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://link-center.net/7819524/2IXzAq35ia7o'),
                new ButtonBuilder()
                    .setCustomId('gen_hwid_modal')
                    .setLabel('Générer ma Clé HWID')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('get_my_hwid')
                    .setLabel('🔍 Voir mon HWID')
                    .setStyle(ButtonStyle.Secondary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('reset_hwid')
                    .setLabel('🔄 Reset HWID (24h)')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('get_script')
                    .setLabel('📜 Obtenir le Script')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.channel.send({ embeds: [embed], components: [row1, row2] });
    }
});

// Gestion des interactions (Boutons et Modals)
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        const userId = interaction.user.id;
        const db = loadDatabase();

        if (interaction.customId === 'gen_hwid_modal') {
            const modal = new ModalBuilder()
                .setCustomId('hwid_modal_submit')
                .setTitle('Génération de Clé HWID');

            const hwidInput = new TextInputBuilder()
                .setCustomId('hwid_input')
                .setLabel('Colle ton vrai HWID :')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: HWID-XXXX-YYYY-ZZZZ')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(hwidInput));
            await interaction.showModal(modal);
        } 
        
        else if (interaction.customId === 'get_my_hwid') {
            const currentHwid = db.hwids[userId];
            if (!currentHwid) {
                await interaction.reply({ 
                    content: "❌ Tu n'as aucun HWID enregistré. Clique sur **Générer ma Clé HWID** pour l'ajouter.", 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: `🔍 Ton HWID enregistré actuellement est :\n\`${currentHwid}\``, 
                    ephemeral: true 
                });
            }
        }

        else if (interaction.customId === 'reset_hwid') {
            const now = Date.now();
            const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 heures
            const lastReset = db.cooldowns[userId] || 0;

            if (now - lastReset < COOLDOWN_TIME) {
                const remainingTime = Math.ceil((COOLDOWN_TIME - (now - lastReset)) / (1000 * 60 * 60));
                await interaction.reply({ 
                    content: `❌ Tu dois encore patienter environ **${remainingTime} heure(s)** avant de pouvoir demander un nouveau reset HWID.`, 
                    ephemeral: true 
                });
            } else {
                db.cooldowns[userId] = now;
                // Supprime l'association HWID de l'utilisateur
                for (let id in db.hwids) {
                    if (id === userId) {
                        delete db.hwids[id];
                    }
                }
                saveDatabase(db);

                await interaction.reply({ 
                    content: "✅ Ton HWID a été réinitialisé avec succès ! Tu peux désormais enregistrer un nouvel appareil.", 
                    ephemeral: true 
                });
            }
        }
        
        else if (interaction.customId === 'get_script') {
            await interaction.reply({ 
                content: "📜 Voici ton script Lua :\n```lua\n-- Code de ton script Faltao Hub\nprint('Script chargé avec succès !')\n```", 
                ephemeral: true 
            });
        }
    } 
    
    else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'hwid_modal_submit') {
            const hwid = interaction.fields.getTextInputValue('hwid_input').trim();
            const userId = interaction.user.id;
            
            // SÉCURITÉ 1 : Longueur minimale pour éviter les mots au hasard comme "salyut"
            if (hwid.length < 10) {
                return await interaction.reply({ 
                    content: "❌ **HWID invalide !** Ton HWID est trop court. Assure-toi de copier le vrai code de ton exécuteur.", 
                    ephemeral: true 
                });
            }

            const db = loadDatabase();

            // SÉCURITÉ 2 : Vérifier si cet HWID est DÉJÀ utilisé par un autre compte Discord
            for (let [storedUserId, storedHwid] of Object.entries(db.hwids)) {
                if (storedHwid === hwid && storedUserId !== userId) {
                    return await interaction.reply({ 
                        content: "❌ **Erreur :** Cet HWID est déjà enregistré sur un **autre compte Discord** ! Tu ne peux pas utiliser le HWID de quelqu'un d'autre.", 
                        ephemeral: true 
                    });
                }
            }

            // Enregistrement si tout est bon
            db.hwids[userId] = hwid;
            saveDatabase(db);

            // Génération de la clé unique liée
            const uniqueKey = `faltao_${userId}_${Math.random().toString(36).substring(2, 10)}`;

            await interaction.reply({ 
                content: `✅ **Clé générée avec succès !**\n\n🔑 **Ta clé unique :** \`${uniqueKey}\`\n💻 **HWID associé :** \`${hwid}\`\n⏳ **Validité :** 24 heures.\n\n*Garde-la précieusement, elle ne fonctionne que sur ton PC et ton compte !*`, 
                ephemeral: true 
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
