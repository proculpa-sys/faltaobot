local Library = loadstring(game:HttpGetAsync("https://github.com/ActualMasterOogway/Fluent-Renewed/releases/latest/download/Fluent.luau"))()
local SaveManager = loadstring(game:HttpGetAsync("https://raw.githubusercontent.com/ActualMasterOogway/Fluent-Renewed/master/Addons/SaveManager.luau"))()
local InterfaceManager = loadstring(game:HttpGetAsync("https://raw.githubusercontent.com/ActualMasterOogway/Fluent-Renewed/master/Addons/InterfaceManager.luau"))()

local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- Fonction pour récupérer le HWID unique du joueur
local function getHWID()
    local success, hwid = pcall(function()
        return game:GetService("RbxAnalyticsService"):GetClientId()
    end)
    if not success or not hwid then
        hwid = tostring(player.UserId)
    end
    return hwid
end

-- Fonction pour calculer la clé valide attendue pour ce HWID et ce jour
local function getExpectedKey(hwid)
    local now = os.date("!*t")
    local rawString = "FaltaoSecure_" .. hwid .. "_" .. Math.floor(os.time() / (60 * 60 * 24)) -- Synchronisé sur le jour UTC
    let hash = 0
    for i = 1, #rawString do
        hash = (hash * 31 + string.byte(rawString, i)) % 100000000
    end
    return string.format("faltao_%s_%08x", hwid:sub(1, 4), hash)
end

-- Fonction qui lance le vrai script complet du Hub après la clé valide
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
                            local link = "https://discord.gg/mPfryNY5vA"
                            setclipboard(link)
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
                if Options.MyToggle.Value then
                    applySpeed()
                end
            end
        end
    })

    local Toggle = Tabs.Home:AddToggle("MyToggle", {
        Title = "Enable Speed",
        Default = false
    })

    Toggle:OnChanged(function()
        applySpeed()
    end)

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
                if attackTime then
                    attackTime.Value = 0.35
                end

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

    Tabs.Main:AddSection("Auto Fast Farm")

    local ToggleFastPunch = Tabs.Main:CreateToggle("AutoPunchWithAnim", { Title = "Auto Fast Punch", Default = false })
    ToggleFastPunch:OnChanged(function(state)
        while state and ToggleFastPunch.Value do
            local pl = game.Players.LocalPlayer
            local char = game.Workspace:FindFirstChild(pl.Name)
            local punchTool = pl.Backpack:FindFirstChild("Punch") or (char and char:FindFirstChild("Punch"))

            if punchTool then
                if punchTool.Parent ~= char then
                    punchTool.Parent = char
                    task.wait(0.1)
                end

                local attackTime = punchTool:FindFirstChild("attackTime")
                if attackTime then
                    attackTime.Value = 0
                end

                punchTool:Activate()
            else
                ToggleFastPunch:SetValue(false)
            end
            task.wait()
        end
    end)

    local function createFastToolToggle(name, toolName, valueName)
        local toggle = Tabs.Main:CreateToggle("Fast" .. name, {Title = "Auto Fast " .. name, Default = false})
        toggle:OnChanged(function(state)
            while state and toggle.Value do
                local pl = game.Players.LocalPlayer
                local char = pl.Character
                local tool = pl.Backpack:FindFirstChild(toolName) or (char and char:FindFirstChild(toolName))

                if tool then
                    if tool.Parent ~= char then
                        tool.Parent = char
                        task.wait(0.1)
                    end

                    local val = tool:FindFirstChild(valueName)
                    if val then
                        val.Value = 0
                    end

                    tool:Activate()
                end
                task.wait()
            end
        end)
    end

    createFastToolToggle("Weight", "Weight", "workoutTime")
    createFastToolToggle("Pushups", "Pushups", "pushupTime")
    createFastToolToggle("Situps", "Situps", "situpTime")
    createFastToolToggle("Handstands", "Handstand", "handstandTime")

    Tabs.Main:AddSection("Auto Jungle")

    local jungleBenchToggle = Tabs.Main:CreateToggle("JungleBench", {Title = "Auto Jungle Bench", Default = false})
    jungleBenchToggle:OnChanged(function(State)
        if State then
            task.spawn(function()
                while jungleBenchToggle.Value do
                    game.Players.LocalPlayer.Character:SetPrimaryPartCFrame(CFrame.new(-8629.88086, 64.8842468, 1855.03467))
                    game:GetService("ReplicatedStorage").rEvents.machineInteractRemote:InvokeServer("useMachine", workspace.machinesFolder["Jungle Bench"].interactSeat)
                    task.wait(0.1)
                end
            end)
        end
    end)

    local jungleBarToggle = Tabs.Main:CreateToggle("JungleBar", {Title = "Auto Jungle Bar Lift", Default = false})
    jungleBarToggle:OnChanged(function(State)
        if State then
            task.spawn(function()
                while jungleBarToggle.Value do
                    game.Players.LocalPlayer.Character:SetPrimaryPartCFrame(CFrame.new(-8678.05566, 14.5030098, 2089.25977))
                    game:GetService("ReplicatedStorage").rEvents.machineInteractRemote:InvokeServer("useMachine", workspace.machinesFolder["Jungle Bar Lift"].interactSeat)
                    task.wait(0.1)
                end
            end)
        end
    end)

    local jungleSquatToggle = Tabs.Main:CreateToggle("JungleSquat", {Title = "Auto Jungle Squat", Default = false})
    jungleSquatToggle:OnChanged(function(State)
        if State then
            task.spawn(function()
                while jungleSquatToggle.Value do
                    game.Players.LocalPlayer.Character:SetPrimaryPartCFrame(CFrame.new(-8374.25586, 34.5933418, 2932.44995))
                    game:GetService("ReplicatedStorage").rEvents.machineInteractRemote:InvokeServer("useMachine", workspace.machinesFolder["Jungle Squat"].interactSeat)
                    task.wait(0.1)
                end
            end)
        end
    end)

    Tabs.Main:AddSection("Auto Equip")

    local function createEquipToggle(name, toolName)
        local toggle = Tabs.Main:CreateToggle("Equip" .. name, {Title = "Auto Equip " .. name, Default = false})
        toggle:OnChanged(function(State)
            if State then
                task.spawn(function()
                    while toggle.Value do
                        local pl = game.Players.LocalPlayer
                        local tool = pl.Backpack:FindFirstChild(toolName)
                        if tool and pl.Character then 
                            tool.Parent = pl.Character 
                        end
                        task.wait(0.1)
                    end
                end)
            end
        end)
    end

    createEquipToggle("Weight", "Weight")
    createEquipToggle("Pushups", "Pushups")
    createEquipToggle("Situps", "Situps")
    createEquipToggle("Handstands", "Handstand")

    -- ROCKS TAB
    Tabs.Rocks:AddSection("Auto Punch Rocks")

    local selectrock = ""

    local function punchRock(requiredDurability, rockName)
        getgenv().autoFarm = true
        while getgenv().autoFarm and selectrock == rockName do
            task.wait(0.1)
            local pl = game.Players.LocalPlayer
            if pl:FindFirstChild("Durability") and pl.Durability.Value >= requiredDurability then
                local char = pl.Character
                if char and char:FindFirstChild("LeftHand") and char:FindFirstChild("RightHand") then
                    local punchTool = pl.Backpack:FindFirstChild("Punch") or char:FindFirstChild("Punch")
                    if punchTool then
                        if punchTool.Parent ~= char then
                            punchTool.Parent = char
                        end
                        punchTool:Activate()
                    end

                    for _, v in pairs(game.Workspace.machinesFolder:GetDescendants()) do
                        if v.Name == "neededDurability" and v.Value == requiredDurability then
                            firetouchinterest(v.Parent.Rock, char.RightHand, 0)
                            firetouchinterest(v.Parent.Rock, char.RightHand, 1)
                            firetouchinterest(v.Parent.Rock, char.LeftHand, 0)
                            firetouchinterest(v.Parent.Rock, char.LeftHand, 1)
                        end
                    end
                end
            end
        end
    end

    local jungleToggle = Tabs.Rocks:CreateToggle("JungleRock", {Title = "Auto Punch Jungle Rock (10M)", Default = false})
    jungleToggle:OnChanged(function()
        selectrock = "Ancient Jungle Rock"
        getgenv().autoFarm = Options.JungleRock.Value
        if Options.JungleRock.Value then punchRock(10000000, selectrock) end
    end)

    local kingToggle = Tabs.Rocks:CreateToggle("KingRock", {Title = "Auto Punch Muscle King Rock (5M)", Default = false})
    kingToggle:OnChanged(function()
        selectrock = "Muscle King Gym Rock"
        getgenv().autoFarm = Options.KingRock.Value
        if Options.KingRock.Value then punchRock(5000000, selectrock) end
    end)

    local legendToggle = Tabs.Rocks:CreateToggle("LegendRock", {Title = "Auto Punch Legend Rock (1M)", Default = false})
    legendToggle:OnChanged(function()
        selectrock = "Legend Gym Rock"
        getgenv().autoFarm = Options.LegendRock.Value
        if Options.LegendRock.Value then punchRock(1000000, selectrock) end
    end)

    local infernoToggle = Tabs.Rocks:CreateToggle("InfernoRock", {Title = "Auto Punch Inferno Rock (750K)", Default = false})
    infernoToggle:OnChanged(function()
        selectrock = "Eternal Gym Rock"
        getgenv().autoFarm = Options.InfernoRock.Value
        if Options.InfernoRock.Value then punchRock(750000, selectrock) end
    end)

    local mythToggle = Tabs.Rocks:CreateToggle("MythRock", {Title = "Auto Punch Mythical Rock (400K)", Default = false})
    mythToggle:OnChanged(function()
        selectrock = "Mythical Gym Rock"
        getgenv().autoFarm = Options.MythRock.Value
        if Options.MythRock.Value then punchRock(400000, selectrock) end
    end)

    local frostToggle = Tabs.Rocks:CreateToggle("FrostRock", {Title = "Auto Punch Frost Rock (150K)", Default = false})
    frostToggle:OnChanged(function()
        if Options.FrostRock then
            selectrock = "Frost Gym Rock"
            getgenv().autoFarm = Options.FrostRock.Value
            if Options.FrostRock.Value then punchRock(150050, selectrock) end
        end
    end)

    local tinyToggle = Tabs.Rocks:CreateToggle("TinyRock", {Title = "Auto Punch Tiny Rock (0)", Default = false})
    tinyToggle:OnChanged(function()
        selectrock = "Tiny Island Rock"
        getgenv().autoFarm = Options.TinyRock.Value
        if Options.TinyRock.Value then punchRock(0, selectrock) end
    end)

    -- AUTO HATCH TAB
    Tabs.Hatch:AddSection("Auto Hatch (Normal)")

    local crystalsList = {
        "Blue Crystal", "Green Crystal", "Red Crystal", "Purple Crystal",
        "Yellow Crystal", "Lightning Crystal", "Mythical Crystal", "Inferno Crystal",
        "Legend Crystal", "Muscle King Crystal", "Jungle Crystal", "Battle Crystal"
    }

    local selectedCrystal = crystalsList[1]

    local crystalDropdown = Tabs.Hatch:AddDropdown("CrystalDropdown", {
        Title = "Select Crystal / Egg",
        Values = crystalsList,
        Default = 1,
    })

    crystalDropdown:OnChanged(function(Value)
        selectedCrystal = Value
    end)

    local autoHatchToggle = Tabs.Hatch:CreateToggle("AutoHatchToggle", {Title = "Auto Hatch (1x)", Default = false})
    autoHatchToggle:OnChanged(function(State)
        if State then
            task.spawn(function()
                while autoHatchToggle.Value do
                    if selectedCrystal ~= "" then
                        pcall(function()
                            game:GetService("ReplicatedStorage").rEvents.openCrystalRemote:InvokeServer("openCrystal", selectedCrystal)
                        end)
                    end
                    task.wait(0.5)
                end
            end)
        end
    end)

    local autoHatch3Toggle = Tabs.Hatch:CreateToggle("AutoHatch3Toggle", {Title = "Auto Open 3x Crystals", Default = false})
    autoHatch3Toggle:OnChanged(function(State)
        if State then
            task.spawn(function()
                while autoHatch3Toggle.Value do
                    if selectedCrystal ~= "" then
                        pcall(function()
                            game:GetService("ReplicatedStorage").rEvents.openCrystalRemote:InvokeServer("openCrystal", selectedCrystal, 3)
                        end)
                    end
                    task.wait(0.5)
                end
            end)
        end
    end)

    -- REBIRTH TAB
    local autoRebirthToggle = Tabs.Rebirth:CreateToggle("AutoRebirth", {Title = "Auto Rebirth (Normal)", Default = false})
    autoRebirthToggle:OnChanged(function(State)
        if State then
            task.spawn(function()
                while autoRebirthToggle.Value do
                    game:GetService("ReplicatedStorage"):WaitForChild("rEvents"):WaitForChild("rebirthRemote"):InvokeServer("rebirthRequest")
                    task.wait(0.1)
                end
            end)
        end
    end)

    local autoSize2Toggle = Tabs.Rebirth:CreateToggle("AutoSize2", {Title = "Auto Size 2", Default = false})
    local autoSizeLoop
    autoSize2Toggle:OnChanged(function(State)
        if State then
            autoSizeLoop = task.spawn(function()
                while autoSize2Toggle.Value do
                    game:GetService("ReplicatedStorage").rEvents.changeSpeedSizeRemote:InvokeServer("changeSize", 2)
                    task.wait()
                end
            end)
        else
            if autoSizeLoop then
                task.cancel(autoSizeLoop)
                autoSizeLoop = nil
            end
        end
    end)

    local hideFramesToggle = Tabs.Rebirth:CreateToggle("HideAllFrames", {Title = "Hide All Frames", Default = false})
    hideFramesToggle:OnChanged(function(State)
        local rSto = game:GetService("ReplicatedStorage")
        for _, obj in pairs(rSto:GetChildren()) do
            if obj:IsA("Instance") and obj.Name:match("Frame$") then
                obj.Visible = not State
            end
        end
    end)

    Tabs.Rebirth:AddSection("OP Stuff")

    local fastRebirthsToggle = Tabs.Rebirth:CreateToggle("FastRebirths", {Title = "Fast Rebirths", Default = false})
    fastRebirthsToggle:OnChanged(function(State)
        if State then
            loadstring(game:HttpGet("https://raw.githubusercontent.com/0o0o0o0o0o0o0o0o0o0o0o0o/0o0o0o0o/refs/heads/main/Kk"))()
        end
    end)

    local speedGrindToggle = Tabs.Rebirth:CreateToggle("SpeedGrind", {Title = "Fast Grind (No Rebirth)", Default = false})
    speedGrindToggle:OnChanged(function(State)
        if State then
            for i = 1, 12 do
                task.spawn(function()
                    while speedGrindToggle.Value do
                        game:GetService("Players").LocalPlayer.muscleEvent:FireServer("rep")
                        task.wait(0.083)
                    end
                end)
            end
        end
    end)

    -- TELEPORT TAB
    Tabs.Teleport:AddSection("Islands & Gyms TP")

    Tabs.Teleport:CreateButton({
        Title = "Battle Island (New Update)",
        Callback = function()
            game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(0, 50, 0)
        end
    })

    Tabs.Teleport:CreateButton({
        Title = "Tiny Island",
        Callback = function()
            game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(-31.8626194, 6.0588026, 2087.88672)
        end
    })

    Tabs.Teleport:CreateButton({
        Title = "Starter Island",
        Callback = function()
            game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(226.252472, 8.1526947, 219.366516)
        end
    })

    Tabs.Teleport:CreateButton({
        Title = "Beach",
        Callback = function()
            game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(-365.798309, 44.5082932, -501.618591)
        end
    })

    Tabs.Teleport:CreateButton({
        Title = "Frost Gym",
        Callback = function()
            game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(-2933.47998, 29.6399612, -579.946045)
        end
    })

    Tabs.Teleport:CreateButton({
        Title = "Mythical Gym",
        Callback = function()
            game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(2659.50635, 21.6095238, 934.690613)
        end
    })

    Tabs.Teleport:CreateButton({
        Title = "Eternal Gym",
        Callback = function()
            game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(-7176.19141, 45.394104, -1106.31421)
        end
    })

    Tabs.Teleport:CreateButton({
        Title = "Legend Gym",
        Callback = function()
            game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(4446.91699, 1004.46698, -3983.76074)
        end
    })

    Tabs.Teleport:CreateButton({
        Title = "Muscle King",
        Callback = function()
            game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(-8626, 15, -5730)
        end
    })

    Tabs.Teleport:CreateButton({
        Title = "Jungle Gym",
        Callback = function()
            game.Players.LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(-8137, 28, 2820)
        end
    })

    Tabs.Teleport:AddSection("Auto TP Muscle King")

    local autoTPMuscleKingToggle = Tabs.Teleport:CreateToggle("AutoTPMuscleKing", {Title = "Enable Auto TP to Muscle King", Default = false})
    autoTPMuscleKingToggle:OnChanged(function(State)
        if State then
            task.spawn(function()
                while autoTPMuscleKingToggle.Value do
                    pcall(function()
                        local char = game.Players.LocalPlayer.Character
                        if char and char:FindFirstChild("HumanoidRootPart") then
                            char.HumanoidRootPart.CFrame = CFrame.new(-8626, 15, -5730)
                        end
                    end)
                    task.wait(1)
                end
            end)
        end
    end)

    -- STATUS TAB
    Tabs.Status:AddSection("Stats Gained")

    local function abbreviateNumber(value)
        if value >= 1e15 then
            return string.format("%.1fQa", value / 1e15)
        elseif value >= 1e12 then
            return string.format("%.1fT", value / 1e12)
        elseif value >= 1e9 then
            return string.format("%.1fB", value / 1e9)
        elseif value >= 1e6 then
            return string.format("%.1fM", value / 1e6)
        elseif value >= 1e3 then
            return string.format("%.1fK", value / 1e3)
        else
            return tostring(value)
        end
    end

    local paragraphs = {
        TimeSpent = Tabs.Status:CreateParagraph("TimeSpent", {
            Title = "Time Spent",
            Content = "Time spent in this server: 00:00",
            TitleAlignment = "Middle",
            ContentAlignment = Enum.TextXAlignment.Center
        }),
        StrengthGained = Tabs.Status:CreateParagraph("StrengthGained", {
            Title = "Strength",
            Content = "Strength gained: 0",
            TitleAlignment = "Middle",
            ContentAlignment = Enum.TextXAlignment.Center
        }),
        DurabilityGained = Tabs.Status:CreateParagraph("DurabilityGained", {
            Title = "Durability",
            Content = "Durability gained: 0",
            TitleAlignment = "Middle",
            ContentAlignment = Enum.TextXAlignment.Center
        }),
        AgilityGained = Tabs.Status:CreateParagraph("AgilityGained", {
            Title = "Agility",
            Content = "Agility gained: 0",
            TitleAlignment = "Middle",
            ContentAlignment = Enum.TextXAlignment.Center
        }),
        KillsGained = Tabs.Status:CreateParagraph("KillsGained", {
            Title = "Kills",
            Content = "Kills gained: 0",
            TitleAlignment = "Middle",
            ContentAlignment = Enum.TextXAlignment.Center
        }),
        EvilKarmaGained = Tabs.Status:CreateParagraph("EvilKarmaGained", {
            Title = "Evil Karma",
            Content = "Evil Karma gained: 0",
            TitleAlignment = "Middle",
            ContentAlignment = Enum.TextXAlignment.Center
        }),
        GoodKarmaGained = Tabs.Status:CreateParagraph("GoodKarmaGained", {
            Title = "Good Karma",
            Content = "Good Karma gained: 0",
            TitleAlignment = "Middle",
            ContentAlignment = Enum.TextXAlignment.Center
        })
    }

    local function createMyParagraphStats()
        local pl = game.Players.LocalPlayer
        if not pl then return end

        local leaderstats = pl:WaitForChild("leaderstats")
        local strengthStat = leaderstats:WaitForChild("Strength")
        local durabilityStat = pl:WaitForChild("Durability")
        local agilityStat = pl:WaitForChild("Agility")
        local killsStat = leaderstats:WaitForChild("Kills")
        local evilKarmaStat = pl:WaitForChild("evilKarma")
        local goodKarmaStat = pl:WaitForChild("goodKarma")

        local initialStrength = strengthStat.Value
        local initialDurability = durabilityStat.Value
        local initialAgility = agilityStat.Value
        local initialKills = killsStat.Value
        local initialEvilKarma = evilKarmaStat.Value
        local initialGoodKarma = goodKarmaStat.Value

        local startTime = tick()

        local function updateParagraphs()
            paragraphs.StrengthGained:SetContent("Strength gained: " .. abbreviateNumber(strengthStat.Value - initialStrength))
            paragraphs.DurabilityGained:SetContent("Durability gained: " .. abbreviateNumber(durabilityStat.Value - initialDurability))
            paragraphs.AgilityGained:SetContent("Agility gained: " .. abbreviateNumber(agilityStat.Value - initialAgility))
            paragraphs.KillsGained:SetContent("Kills gained: " .. abbreviateNumber(killsStat.Value - initialKills))
            paragraphs.EvilKarmaGained:SetContent("Evil Karma gained: " .. abbreviateNumber(evilKarmaStat.Value - initialEvilKarma))
            paragraphs.GoodKarmaGained:SetContent("Good Karma gained: " .. abbreviateNumber(goodKarmaStat.Value - initialGoodKarma))
        end

        local function updateTimeSpent()
            local timeSpent = tick() - startTime
            local minutes = math.floor(timeSpent / 60)
            local seconds = math.floor(timeSpent % 60)
            paragraphs.TimeSpent:SetContent(string.format("Time spent in this server: %02d:%02d", minutes, seconds))
        end

        strengthStat.Changed:Connect(updateParagraphs)
        durabilityStat.Changed:Connect(updateParagraphs)
        agilityStat.Changed:Connect(updateParagraphs)
        killsStat.Changed:Connect(updateParagraphs)
        evilKarmaStat.Changed:Connect(updateParagraphs)
        goodKarmaStat.Changed:Connect(updateParagraphs)

        game:GetService("RunService").Heartbeat:Connect(updateTimeSpent)
        updateParagraphs()
    end

    createMyParagraphStats()

    -- MISC TAB
    Tabs.Misc:CreateButton({
        Title = "Permanent Shift Lock",
        Callback = function()
            loadstring(game:HttpGet('https://pastebin.com/raw/CjNsnSDy'))()
        end
    })

    Tabs.Misc:CreateButton({
        Title = "Anti AFK",
        Callback = function()
            loadstring(game:HttpGet("https://raw.githubusercontent.com/evxncodes/mainroblox/main/anti-afk", true))()
        end
    })

    local LockPosToggle = Tabs.Misc:CreateToggle("LockCharPos", {
        Title = "Lock Character Position",
        Default = false
    })

    local RunService = game:GetService("RunService")
    local pl = game.Players.LocalPlayer
    local hrp = nil
    local anchorConn = nil

    LockPosToggle:OnChanged(function(state)
        hrp = pl.Character and pl.Character:FindFirstChild("HumanoidRootPart")

        if state and hrp then
            anchorConn = RunService.Stepped:Connect(function()
                if hrp then
                    hrp.Anchored = true
                end
            end)
        else
            if anchorConn then
                anchorConn:Disconnect()
                anchorConn = nil
            end
            if hrp then
                hrp.Anchored = false
            end
        end
    end)

    pl.CharacterAdded:Connect(function(char)
        hrp = char:WaitForChild("HumanoidRootPart", 5)
        if LockPosToggle.Value and hrp then
            hrp.Anchored = true
        end
    end)

    Tabs.Misc:CreateToggle("DisableTrade", {Title = "Disable Trade", Default = false}):OnChanged(function(state)
        local tradeEvent = game:GetService("ReplicatedStorage").rEvents.tradingEvent
        if state then
            tradeEvent:FireServer("disableTrading")
        else
            tradeEvent:FireServer("enableTrading")
        end
    end)

    Tabs.Misc:CreateToggle("HidePets", {Title = "Hide Pets", Default = false}):OnChanged(function(state)
        local petEvent = game:GetService("ReplicatedStorage").rEvents.showPetsEvent
        if state then
            petEvent:FireServer("hidePets")
        else
            petEvent:FireServer("showPets")
        end
    end)

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

-- ================= FENÊTRE DE LA CLÉ HWID =================
local KeyWindow = Library:CreateWindow{
    Title = "Faltao Hub | Key System",
    SubTitle = "HWID Security Check",
    TabWidth = 160,
    Size = UDim2.fromOffset(500, 360),
    Resize = false,
    Acrylic = true,
    Theme = "Amethyst Dark",
    MinimizeKey = Enum.KeyCode.RightControl
}

local KeyTab = KeyWindow:CreateTab{ Title = "Key", Icon = "key" }
KeyTab:AddSection("Verification HWID & Clé")

local currentHWID = getHWID()

-- Bouton pour copier son propre HWID afin de le coller sur le bot Discord
KeyTab:AddButton({
    Title = "Copier mon HWID",
    Description = "Clique ici pour copier ton identifiant unique pour le Bot Discord.",
    Callback = function()
        setclipboard(currentHWID)
        Library:Notify{
            Title = "HWID Copié",
            Content = "Ton HWID a été copié dans le presse-papier !",
            Duration = 3
        }
    end
})

local inputKey = ""

KeyTab:AddInput("KeyInput", {
    Title = "Colle ta Clé reçue par le Bot",
    Default = "",
    Placeholder = "faltao_xxxx_xxxxxxxx",
    Numeric = false,
    Finished = false,
    Callback = function(Value)
        inputKey = Value
    end
})

KeyTab:AddButton({
    Title = "Submit Key",
    Description = "Valide ta clé générée par le bot Discord.",
    Callback = function()
        local expectedKey = getExpectedKey(currentHWID)
        
        if inputKey == expectedKey then
            Library:Notify{
                Title = "Succès",
                Content = "Clé valide ! Lancement du Faltao Hub...",
                Duration = 2
            }
            KeyWindow:Destroy()
            task.wait(0.3)
            LaunchMainHub()
        else
            Library:Notify{
                Title = "Erreur",
                Content = "Clé invalide ou erronée pour ce PC !",
                Duration = 3
            }
        end
    end
})

KeyWindow:SelectTab(1)
