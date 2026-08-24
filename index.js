const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch'); // Assure-toi que node-fetch est installé, ou utilise fetch natif selon ta version de Node

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "proculpa-sys/faltaobot"; // Ton dépôt GitHub

// Enregistrement de la commande slash /key
const commands = [
    new SlashCommandBuilder()
        .setName('key')
        .setDescription('Obtiens ta clé unique pour le Hub Roblox !')
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`Bot connecté : ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Commandes slash enregistrées sur Render !');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'key') {
        await interaction.deferReply({ ephemeral: true });

        // Génération d'une clé unique
        const newKey = "FALTAO-" + Math.random().toString(36).substring(2, 10).toUpperCase();

        try {
            // 1. Récupérer le contenu actuel de keys.txt et son SHA sur GitHub
            const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/keys.txt`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'User-Agent': 'FaltaoBot'
                }
            });
            const getData = await getRes.json();
            const fileSha = getData.sha;
            
            let currentKeys = "";
            if (getData.content) {
                currentKeys = Buffer.from(getData.content, 'base64').toString('utf8');
            }

            // Ajouter la nouvelle clé à la liste (une par ligne)
            const updatedKeys = currentKeys + (currentKeys.endsWith('\n') || currentKeys === '' ? '' : '\n') + newKey + '\n';

            // 2. Mettre à jour le fichier sur GitHub
            await fetch(`https://api.github.com/repos/${REPO}/contents/keys.txt`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'User-Agent': 'FaltaoBot',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Ajout de la clé ${newKey}`,
                    content: Buffer.from(updatedKeys).toString('base64'),
                    sha: fileSha
                })
            });

            await interaction.editReply(`Voici ta clé unique : \`${newKey}\` (Elle a été enregistrée pour ton accès Roblox !`);
        } catch (error) {
            console.error(error);
            await interaction.editReply("Erreur lors de la génération de la clé. Réessaie plus tard.");
        }
    }
});

client.login(TOKEN);

// Petit serveur web pour garder Render actif
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur API actif sur le port ${PORT}`));
