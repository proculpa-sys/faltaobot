-- ====================================================
-- FALTAO HUB — SCRIPT ROBLOX SYNCHRONISÉ AVEC LE SITE
-- ====================================================

local CoreGui = game:GetService("CoreGui")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- TON LIEN LINKVERTISE (qui mène vers ton site web)
local LinkvertiseURL = "https://link-center.net/7819524/2IXzAq35ia7o"

-- Fonction identique à celle de ton site web pour calculer la clé du jour
local function getDailyKey()
    local date = os.date("!*t")
    local rawString = string.format("FaltaoSecretKey_%d_%d_%d", date.year, date.month, date.day)
    
    local hash = 0
    for i = 1, #rawString do
        hash = (hash * 31 + string.byte(rawString, i)) % 100000000
    end
    
    -- Format en minuscules pour matcher exactement avec ton site web
    return string.format("faltao_%08x", hash)
end

local correctKey = getDailyKey()

-- Création de l'interface graphique (GUI) de la clé
local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "FaltaoKeySystem"
ScreenGui.Parent = CoreGui

if syn and syn.protect_gui then
    syn.protect_gui(ScreenGui)
elseif protectgui then
    protectgui(ScreenGui)
end

local MainFrame = Instance.new("Frame")
MainFrame.Name = "MainFrame"
MainFrame.Parent = ScreenGui
MainFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
MainFrame.BorderSizePixel = 0
MainFrame.Position = UDim2.new(0.5, -175, 0.5, -110)
MainFrame.Size = UDim2.new(0, 350, 0, 220)
MainFrame.Active = true
MainFrame.Draggable = true

local UICorner = Instance.new("UICorner")
UICorner.CornerRadius = UDim.new(0, 8)
UICorner.Parent = MainFrame

local Title = Instance.new("TextLabel")
Title.Parent = MainFrame
Title.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
Title.Size = UDim2.new(1, 0, 0, 45)
Title.Font = Enum.Font.SourceSansBold
Title.Text = "⚡ Faltao Hub — Key System"
Title.TextColor3 = Color3.fromRGB(255, 255, 255)
Title.TextSize = 18

local TitleCorner = Instance.new("UICorner")
TitleCorner.CornerRadius = UDim.new(0, 8)
TitleCorner.Parent = Title

-- Bouton pour copier le lien Linkvertise
local GetKeyBtn = Instance.new("TextButton")
GetKeyBtn.Parent = MainFrame
GetKeyBtn.BackgroundColor3 = Color3.fromRGB(46, 204, 113)
GetKeyBtn.Position = UDim2.new(0.05, 0, 0.30, 0)
GetKeyBtn.Size = UDim2.new(0.9, 0, 0, 35)
GetKeyBtn.Font = Enum.Font.SourceSansBold
GetKeyBtn.Text = "🔗 Copier le lien Linkvertise"
GetKeyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
GetKeyBtn.TextSize = 14

local BtnCorner1 = Instance.new("UICorner")
BtnCorner1.CornerRadius = UDim.new(0, 6)
BtnCorner1.Parent = GetKeyBtn

-- Boîte de texte pour entrer la clé
local TextBox = Instance.new("TextBox")
TextBox.Parent = MainFrame
TextBox.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
TextBox.Position = UDim2.new(0.05, 0, 0.52, 0)
TextBox.Size = UDim2.new(0.9, 0, 0, 35)
TextBox.Font = Enum.Font.SourceSans
TextBox.PlaceholderText = "Colle la clé du site ici..."
TextBox.Text = ""
TextBox.TextColor3 = Color3.fromRGB(255, 255, 255)
TextBox.TextSize = 14

local BoxCorner = Instance.new("UICorner")
BoxCorner.CornerRadius = UDim.new(0, 6)
BoxCorner.Parent = TextBox

-- Bouton de validation
local SubmitBtn = Instance.new("TextButton")
SubmitBtn.Parent = MainFrame
SubmitBtn.BackgroundColor3 = Color3.fromRGB(52, 152, 219)
SubmitBtn.Position = UDim2.new(0.05, 0, 0.74, 0)
SubmitBtn.Size = UDim2.new(0.9, 0, 0, 40)
SubmitBtn.Font = Enum.Font.SourceSansBold
SubmitBtn.Text = "Valider la clé"
SubmitBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
SubmitBtn.TextSize = 16

local BtnCorner2 = Instance.new("UICorner")
BtnCorner2.CornerRadius = UDim.new(0, 6)
BtnCorner2.Parent = SubmitBtn

-- Action : Copier le lien Linkvertise
GetKeyBtn.MouseButton1Click:Connect(function()
    pcall(function()
        setclipboard(LinkvertiseURL)
    end)
    GetKeyBtn.Text = "✅ Lien copié dans le presse-papier !"
    task.wait(2)
    GetKeyBtn.Text = "🔗 Copier le lien Linkvertise"
end)

-- Action : Vérifier la clé entrée
SubmitBtn.MouseButton1Click:Connect(function()
    if TextBox.Text == correctKey then
        ScreenGui:Destroy()
        
        print("Clé valide ! Lancement du Faltao Hub...")
        
        -- ====================================================
        -- TON INTERFACE / HUB PRINCIPAL SE LANCE ICI
        -- ====================================================
        local HubGui = Instance.new("ScreenGui")
        HubGui.Parent = CoreGui
        
        local MainHub = Instance.new("Frame")
        MainHub.Parent = HubGui
        MainHub.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
        MainHub.Position = UDim2.new(0.5, -200, 0.5, -150)
        MainHub.Size = UDim2.new(0, 400, 0, 300)
        MainHub.Draggable = true
        MainHub.Active = true
        
        local HubTitle = Instance.new("TextLabel")
        HubTitle.Parent = MainHub
        HubTitle.Size = UDim2.new(1, 0, 0, 40)
        HubTitle.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
        HubTitle.Text = "Faltao Hub — Chargé avec succès ✅"
        HubTitle.TextColor3 = Color3.fromRGB(255, 255, 255)
        HubTitle.Font = Enum.Font.SourceSansBold
        HubTitle.TextSize = 16
    else
        SubmitBtn.Text = "❌ Clé incorrecte !"
        SubmitBtn.BackgroundColor3 = Color3.fromRGB(231, 76, 60)
        task.wait(1.5)
        SubmitBtn.Text = "Valider la clé"
        SubmitBtn.BackgroundColor3 = Color3.fromRGB(52, 152, 219)
    end
end)
