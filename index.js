const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

const TOKEN = 'MET_TON_TOKEN_DISCORD_ICI'; // Mets ton vrai token de bot ici

const app = express();
const PORT = process.env.PORT || 3000;
const KEYS_FILE = path.join(__dirname, 'keys.json');

function loadKeys() {
    if (!fs.existsSync(KEYS_FILE)) {
        fs.writeFileSync(KEYS_FILE, JSON.stringify([]));
    }
    try {
        const data = fs.readFileSync(KEYS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function saveKeys(keys) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// Route API web publique accessible depuis Roblox
app.get('/verify', (req, res) => {
    const userKey = req.query.key;
    console.log(`[API] Vérification demandée pour la clé : "${userKey}"`);

    if (!userKey) return res.send("INVALID");

    const keys = loadKeys();
    const found = keys.find(k => k.key.trim() === userKey.trim());

    if (found) {
        console.log(`[API] Clé valide trouvée !`);
        res.send("VALID");
    } else {
        console.log(`[API] Clé invalide.`);
        res.send("INVALID");
    }
});

app.listen(PORT, () => {
    console.log(`Serveur API actif sur le port ${PORT}`);
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages]
});

client.once('ready', async () => {
    console.log(`Bot connecté : ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('key')
            .setDescription('Génère ta clé pour le script Roblox')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Commandes slash enregistrées sur Render !');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'key') {
        const keys = loadKeys();
        const newKey = "FALTAO-" + Math.random().toString(36).substring(2, 10).toUpperCase();
        
        keys.push({ key: newKey, discordId: interaction.user.id });
        saveKeys(keys);

        try {
            await interaction.user.send(`🔑 **Voici ta clé Roblox :** \`${newKey}\``);
            await interaction.reply({ content: 'Je t\'ai envoyé ta clé en Message Privé ! 📩', ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: `Impossible de t'envoyer un MP. Ouvre tes messages ! Ta clé : \`${newKey}\``, ephemeral: true });
        }
    }
});

client.login(TOKEN);
