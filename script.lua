-- ====================================================
-- FALTAO HUB — SCRIPT COMPLET & CORRIGÉ
-- ====================================================

local ServiceID = 30317

-- URL de l'API Platoboost pour ce service (avec HWID)
local apiUrl = "https://api.platoboost.com/public/whitelist/" .. ServiceID .. "?hwid=" .. game:GetService("RbxAnalyticsService"):GetClientId()

-- Requête HTTP sécurisée
local success, response = pcall(function()
    return game:HttpGet(apiUrl)
end)

if not success or not response then
    game:GetService("StarterGui"):SetCore("SendNotification", {
        Title = "Faltao Hub — Erreur",
        Text = "Impossible de joindre l'API Platoboost.",
        Duration = 6
    })
    return
end

-- Analyse de la réponse JSON de Platoboost
local HttpService = game:GetService("HttpService")
local decoded

local decodeSuccess = pcall(function()
    decoded = HttpService:JSONDecode(response)
end)

if not decodeSuccess or not decoded then
    game:GetService("StarterGui"):SetCore("SendNotification", {
        Title = "Faltao Hub — Erreur",
        Text = "Erreur de lecture de la réponse.",
        Duration = 6
    })
    return
end

-- Vérification du statut de la clé
if decoded.success == true then
    -- Clé valide / HWID whitelisted : On lance le Hub
    game:GetService("StarterGui"):SetCore("SendNotification", {
        Title = "Faltao Hub",
        Text = "✅ Accès validé ! Chargement du Hub...",
        Duration = 5
    })
    
    print("-----------------------------------------")
    print("Faltao Hub chargé avec succès !")
    print("-----------------------------------------")

    -- ====================================================
    -- TON CODE DE SCRIPT ROBLOX / UI (À METTRE ICI)
    -- ====================================================
    
    local ScreenGui = Instance.new("ScreenGui")
    local MainFrame = Instance.new("Frame")
    local Title = Instance.new("TextLabel")

    ScreenGui.Name = "FaltaoHubUI"
    ScreenGui.Parent = game.CoreGui

    MainFrame.Name = "MainFrame"
    MainFrame.Parent = ScreenGui
    MainFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
    MainFrame.Position = UDim2.new(0.5, -150, 0.5, -100)
    MainFrame.Size = UDim2.new(0, 300, 0, 200)
    MainFrame.Active = true
    MainFrame.Draggable = true

    Title.Name = "Title"
    Title.Parent = MainFrame
    Title.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
    Title.Size = UDim2.new(1, 0, 0, 40)
    Title.Font = Enum.Font.SourceSansBold
    Title.Text = "Faltao Hub — v1.0"
    Title.TextColor3 = Color3.fromRGB(255, 255, 255)
    Title.TextSize = 18

else
    -- Clé manquante ou expirée -> On récupère le lien de clé (.app) et on le copie
    local keyLink = "https://platoboost.app/getkey?id=" .. ServiceID
    
    pcall(function()
        setclipboard(keyLink)
    end)

    game:GetService("StarterGui"):SetCore("SendNotification", {
        Title = "Faltao Hub — Clé requise",
        Text = "Lien de la clé copié dans le presse-papier !",
        Duration = 7
    })
    
    warn("Faltao Hub : Clé requise. Lien : " .. keyLink)
end
