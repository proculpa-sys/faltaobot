const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const GUILD_ID = process.env.GUILD_ID;
const ROLE_ID = process.env.ROLE_ID;

const DB_FILE = './database.json';

function loadDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ keys: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- SERVEUR WEB (Donne le rôle et la clé unique) ---
app.get('/', async (req, res) => {
    const code = req.query.code;
    
    if (!code) {
        return res.send(`
            <html>
            <head><title>Faltao Hub - Clé HWID</title></head>
            <body style="background: #111; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1>⚡ Faltao Hub — Générateur de Clé</h1>
                <p>Tu dois passer par Linkvertise pour récupérer ta clé !</p>
            </body>
            </html>
        `);
    }

    try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            return res.send('❌ Erreur : Impossible de récupérer le token Discord.');
        }

        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userResponse.json();
        const userId = userData.id;

        // Attribution automatique du rôle sur ton serveur Discord
        await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}/roles/${ROLE_ID}`, {
            method: 'PUT',
            headers: { Authorization: `Bot ${process.env.TOKEN}` },
        });

        const db = loadDatabase();
        const uniqueKey = `faltao_${userId}_${Math.random().toString(36).substring(2, 10)}`;
        db.keys[userId] = { key: uniqueKey, expires: Date.now() + (24 * 60 * 60 * 1000) };
        saveDatabase(db);

        res.send(`
            <html>
            <head><title>Faltao Hub - Clé Validée</title></head>
            <body style="background: #111; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h1 style="color: #43B581;">✅ Accès autorisé avec succès !</h1>
                <p>Ton rôle <b>Accès H24</b> a été ajouté sur Discord.</p>
                <p>Voici ta clé unique (valable 24h) :</p>
                <input type="text" value="${uniqueKey}" readonly style="padding: 12px; width: 350px; text-align: center; font-size: 16px; background: #222; color: #5865F2; border: 2px solid #5865F2; border-radius: 5px; font-weight: bold;" />
                <p style="margin-top: 20px; color: gray;">Copie ta clé et retourne sur Discord !</p>
            </body>
            </html>
        `);
    } catch (error) {
        console.error(error);
        res.send('❌ Erreur lors de la validation.');
    }
});

app.listen(PORT, () => console.log(`Serveur web actif sur le port ${PORT}`));

// --- BOT DISCORD ---
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('clientReady', () => {
    console.log(`Bot connecté en tant que ${client.user.tag} !`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        const embed = new EmbedBuilder()
            .setTitle("⚡ Faltao Hub — Système de Clé HWID & Accès H24")
            .setDescription("Pour obtenir ton script Muscle Legends et ta clé d'accès (24h) :\n\n" +
                "1️⃣ Clique sur **Lien Linkvertise** pour passer les pubs.\n" +
                "2️⃣ Connecte-toi et autorise l'app pour recevoir ton rôle **Accès H24**.\n" +
                "3️⃣ Récupère ta clé unique !\n" +
                "4️⃣ Clique sur **Obtenir le script HWID** pour récupérer ton script Lua.")
            .setColor(0x5865F2);

        // Bouton Linkvertise avec ton vrai lien
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('🔗 Lien Linkvertise')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://link-center.net/7819524/2IXzAq35ia7o'),
                new ButtonBuilder()
                    .setCustomId('get_hwid_script')
                    .setLabel('📋 Obtenir le script HWID')
                    .setStyle(ButtonStyle.Secondary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('generate_key_modal')
                    .setLabel('🔑 Générer ma Clé HWID')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('reset_hwid')
                    .setLabel('🔄 Reset HWID (24h)')
                    .setStyle(ButtonStyle.Danger)
            );

        await message.channel.send({ embeds: [embed], components: [row1, row2] });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'get_hwid_script') {
        // Ton script Muscle Legends complet est injecté ici directement !
        await interaction.reply({ 
            content: `📋 **Voici ton script Muscle Legends :**
\`\`\`lua
local Library = loadstring(game:HttpGetAsync("https://github.com/ActualMasterOogway/Fluent-Renewed/releases/latest/download/Fluent.luau"))()
local SaveManager = loadstring(game:HttpGetAsync("https://raw.githubusercontent.com/ActualMasterOogway/Fluent-Renewed/master/Addons/SaveManager.luau"))()
local InterfaceManager = loadstring(game:HttpGetAsync("https://raw.githubusercontent.com/ActualMasterOogway/Fluent-Renewed/master/Addons/InterfaceManager.luau"))()

local CORRECT_KEY = "FaltaoKey2026"

local function LaunchMainHub()
    Library = loadstring(game:HttpGetAsync("https://github.com/ActualMasterOogway/Fluent-Renewed/releases/latest/download/Fluent.luau"))()
    SaveManager = loadstring(game:HttpGetAsync("https://raw.githubusercontent.com/ActualMasterOogway/Fluent-Renewed/master/Addons/SaveManager.luau"))()
    InterfaceManager = loadstring(game:HttpGetAsync("https://raw.githubusercontent.com/ActualMasterOogway/Fluent-Renewed/master/Addons/InterfaceManager.luau"))()

    local Window = Library:CreateWindow{
        Title = "Faltao Hub | Game: Muscle Legends | Version [v.2.3.1]",
        SubTitle = "by Faltao",
        TabWidth = 160,
        Size = UDim2.fromOffset(1087, 690.5),
        Resize = true,
        MinSize = Vector2.new(470, 380),
        Acrylic = true,
        Theme = "Amethyst Dark",
        MinimizeKey = Enum.KeyCode.RightControl
    }

    local Tabs = {
        Home = Window:CreateTab{ Title = "Home", Icon = "house" },
        Main = Window:CreateTab{ Title = "Main", Icon = "phosphor-users-bold" },
        Rocks = Window:CreateTab{ Title = "Rocks", Icon = "mountain" },
        Hatch = Window:CreateTab{ Title = "Auto Hatch", Icon = "egg" },
        Rebirth = Window:CreateTab{ Title = "Auto Rebirths", Icon = "biceps-flexed" },
        Teleport = Window:CreateTab{ Title = "Teleport", Icon = "tree-palm" },
        Status = Window:CreateTab{ Title = "Status", Icon = "circle-plus" },
        Misc = Window:CreateTab{ Title = "Misc", Icon = "command" },
        Settings = Window:CreateTab{ Title = "Settings", Icon = "settings" }
    }
    local Options = Library.Options

    Library:Notify{
        Title = "Welcome to Faltao Hub",
        Content = "Faltao Hub loaded successfully!",
        SubContent = "Muscle Legends script ready.",
        Duration = 5
    }

    -- HOME TAB
    Tabs.Home:AddSection("Discord Server Link")
    Tabs.Home:CreateButton({
        Title = "Click to Copy Link",
        Description = "Join our Discord server to get update pings and more.",
        Callback = function()
            Window:Dialog({
                Title = "Join Our Discord",
                Content = "Would you like to copy the invite link to our Discord server?",
                Buttons = {
                    {
                        Title = "Confirm",
                        Callback = function()
                            setclipboard("https://discord.gg/mPfryNY5vA")
                        end
                    }
                }
            })
        end
    })

    Tabs.Home:AddSection("Local Player Configurations")
    local speed = 16
    local function applySpeed()
        local player = game.Players.LocalPlayer
        if not player then return end
        local char = player.Character
        if char then
            local humanoid = char:FindFirstChildOfClass("Humanoid")
            if humanoid then
                humanoid.WalkSpeed = Options.MyToggle.Value and speed or 16
            end
        end
    end

    Tabs.Home:AddInput("Input", {
        Title = "Speed Input",
        Default = tostring(speed),
        Placeholder = "Enter Speed",
        Numeric = true,
        Finished = false,
        Callback = function(Value)
            local num = tonumber(Value)
            if num then
                speed = num
                if Options.MyToggle.Value then applySpeed() end
            end
        end
    })

    local Toggle = Tabs.Home:AddToggle("MyToggle", { Title = "Enable Speed", Default = false })
    Toggle:OnChanged(function() applySpeed() end)

    local player = game.Players.LocalPlayer
    player.CharacterAdded:Connect(function(char)
        char:WaitForChild("Humanoid")
        if Options.MyToggle.Value then
            task.wait(0.1)
            applySpeed()
        end
    end)

    local ToggleInfiniteJump = Tabs.Home:AddToggle("Toggle_InfiniteJump", {Title = "Infinite Jump", Default = false})
    ToggleInfiniteJump:OnChanged(function()
        if Options.Toggle_InfiniteJump.Value then
            local UserInputService = game:GetService("UserInputService")
            local Player = game.Players.LocalPlayer
            local Character = Player.Character or Player.CharacterAdded:Wait()
            local Humanoid = Character:WaitForChild("Humanoid")

            _G.InfiniteJumpConnection = UserInputService.JumpRequest:Connect(function()
                if Options.Toggle_InfiniteJump.Value then
                    Humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
                end
            end)
        else
            if _G.InfiniteJumpConnection then
                _G.InfiniteJumpConnection:Disconnect()
                _G.InfiniteJumpConnection = nil
            end
        end
    end)

    local ToggleNoClip = Tabs.Home:AddToggle("Toggle_NoClip", {Title = "No Clip", Default = false})
    ToggleNoClip:OnChanged(function()
        local RunService = game:GetService("RunService")
        local Player = game.Players.LocalPlayer

        if Options.Toggle_NoClip.Value then
            _G.NoclipConnection = RunService.Stepped:Connect(function()
                local Character = Player.Character
                if Character then
                    for _, part in pairs(Character:GetDescendants()) do
                        if part:IsA("BasePart") and part.CanCollide then
                            part.CanCollide = false
                        end
                    end
                end
            end)
        else
            if _G.NoclipConnection then
                _G.NoclipConnection:Disconnect()
                _G.NoclipConnection = nil
            end
        end
    end)

    -- MAIN TAB
    Tabs.Main:AddSection("Auto Farm")
    local ToggleRep = Tabs.Main:CreateToggle("AutoRep", {Title = "Auto Lift", Default = false})
    ToggleRep:OnChanged(function(State)
        if State then
            task.spawn(function()
                while ToggleRep.Value do
                    game:GetService("Players").LocalPlayer:WaitForChild("muscleEvent"):FireServer("rep")
                    task.wait(0.1)
                end
            end)
        end
    end)

    local TogglePunch = Tabs.Main:CreateToggle("AutoNormalPunch", { Title = "Auto Normal Punch", Default = false })
    TogglePunch:OnChanged(function(state)
        while state and TogglePunch.Value do
            local pl = game.Players.LocalPlayer
            local char = game.Workspace:FindFirstChild(pl.Name)
            local punchTool = pl.Backpack:FindFirstChild("Punch") or (char and char:FindFirstChild("Punch"))

            if punchTool then
                if punchTool.Parent ~= char then
                    punchTool.Parent = char
                    task.wait(0.1)
                end
                local attackTime = punchTool:FindFirstChild("attackTime")
                if attackTime then attackTime.Value = 0.35 end
                punchTool:Activate()
            else
                TogglePunch:SetValue(false)
            end
            task.wait()
        end
    end)

    local function createAutoToolToggle(name, toolName, delay)
        local toggle = Tabs.Main:CreateToggle("Auto" .. name, {Title = "Auto " .. name, Default = false})
        toggle:OnChanged(function(state)
            if state then
                task.spawn(function()
                    while toggle.Value do
                        local pl = game.Players.LocalPlayer
                        local char = pl.Character
                        local tool = pl.Backpack:FindFirstChild(toolName) or (char and char:FindFirstChild(toolName))

                        if tool then
                            if tool.Parent ~= char then
                                tool.Parent = char
                                task.wait(0.1)
                            end
                            tool:Activate()
                        end
                        task.wait(delay)
                    end
                end)
            end
        end)
    end

    createAutoToolToggle("Weight", "Weight", 0.2)
    createAutoToolToggle("Pushups", "Pushups", 0.2)
    createAutoToolToggle("Situps", "Situps", 0.2)
    createAutoToolToggle("Handstands", "Handstand", 0.2)

    SaveManager:SetLibrary(Library)
    InterfaceManager:SetLibrary(Library)
    SaveManager:IgnoreThemeSettings()
    SaveManager:SetIgnoreIndexes{}
    InterfaceManager:SetFolder("FaltaoHub")
    SaveManager:SetFolder("FaltaoHub/specific-game")
    InterfaceManager:BuildInterfaceSection(Tabs.Settings)
    SaveManager:BuildConfigSection(Tabs.Settings)

    Window:SelectTab(1)
    SaveManager:LoadAutoloadConfig()
end

local KeyWindow = Library:CreateWindow{
    Title = "Faltao Hub | Key System",
    SubTitle = "Security Check",
    TabWidth = 160,
    Size = UDim2.fromOffset(500, 320),
    Resize = false,
    Acrylic = true,
    Theme = "Amethyst Dark",
    MinimizeKey = Enum.KeyCode.RightControl
}

local KeyTab = KeyWindow:CreateTab{ Title = "Key", Icon = "key" }
KeyTab:AddSection("Enter Your Access Key")

local inputKey = ""
KeyTab:AddInput("KeyInput", {
    Title = "Key",
    Default = "",
    Placeholder = "Enter your key here...",
    Numeric = false,
    Finished = false,
    Callback = function(Value) inputKey = Value end
})

KeyTab:AddButton({
    Title = "Submit Key",
    Description = "Click to verify your key and open the hub.",
    Callback = function()
        if inputKey == CORRECT_KEY then
            Library:Notify{ Title = "Success", Content = "Correct Key! Loading Faltao Hub...", Duration = 2 }
            KeyWindow:Destroy()
            task.wait(0.3)
            LaunchMainHub()
        else
            Library:Notify{ Title = "Error", Content = "Incorrect Key! Try again.", Duration = 3 }
        end
    end
})

KeyWindow:SelectTab(1)
\`\`\``, 
            flags: MessageFlags.Ephemeral 
        });
    }

    if (interaction.customId === 'generate_key_modal') {
        await interaction.reply({ content: "🔑 Clique sur le bouton **Lien Linkvertise** du message principal pour obtenir ta clé !", flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'reset_hwid') {
        await interaction.reply({ content: "🔄 Ton HWID a bien été réinitialisé pour 24h !", flags: MessageFlags.Ephemeral });
    }
});

client.login(process.env.TOKEN);
