-- Système de clé sécurisé par HWID et par jour (Faltao Hub)

local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- Fonction pour obtenir un HWID unique et stable basé sur l'exécuteur
local function getHWID()
    local success, hwid = pcall(function()
        return game:GetService("RbxAnalyticsService"):GetClientId()
    end)
    if not success or not hwid then
        hwid = tostring(player.UserId) -- Fallback de sécurité si l'exécuteur ne supporte pas
    end
    return hwid
end

-- Fonction pour calculer la clé valide pour CE HWID et CEJOUR précis
local function getExpectedKey()
    local now = os.date("!*t") -- Utilise l'UTC pour être synchro avec le bot
    local rawString = "FaltaoSecretKey_" .. now.year .. "_" .. now.month .. "_" .. now.day .. "_" .. getHWID()
    
    -- Hash simple de la chaîne HWID + Date
    local hash = 0
    for i = 1, #rawString do
        hash = (hash * 31 + string.byte(rawString, i)) % 100000000
    end
    return string.format("faltao_%x", hash)
end

-- Ici tu fais ta propre interface graphique (UI) avec une zone de texte pour la clé
-- Exemple simplifié de vérification quand le joueur valide sa clé :
local function verifyAndExecute(userEnteredKey)
    local correctKey = getExpectedKey()
    
    if userEnteredKey == correctKey then
        print("✅ Clé valide ! Lancement du script...")
        -- ➔ MET TON SCRIPT DE JEU ICI ➔
    else
        warn("❌ Clé invalide ou expirée pour ce PC !")
    end
end
