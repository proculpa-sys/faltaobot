<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Faltao Hub - Générateur de Clé</title>
    <style>
        body { background-color: #121212; color: white; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .box { background: #1e1e1e; padding: 30px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5); width: 380px; }
        h2 { color: #9b59b6; margin-bottom: 10px; }
        p { color: #ccc; font-size: 14px; }
        input { width: 100%; padding: 12px; background: #2c2c2c; border: 1px solid #444; color: white; border-radius: 5px; text-align: center; font-size: 16px; margin: 15px 0; box-sizing: border-box; font-weight: bold; letter-spacing: 1px; }
        button { background: #8e44ad; color: white; border: none; padding: 12px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%; font-size: 15px; }
        button:hover { background: #9b59b6; }
    </style>
</head>
<body>
    <div class="box">
        <h2>🔑 Faltao Hub Key</h2>
        <p>Voici ta clé du jour (Valide 24h) :</p>
        <input type="text" id="keyInput" readonly>
        <button onclick="copyKey()">Copier la clé</button>
    </div>

    <script>
        // Fonction mathématique pour générer la clé du jour synchronisée
        function getDailyKey() {
            const now = new Date();
            const year = now.getUTCFullYear();
            const month = now.getUTCMonth() + 1;
            const day = now.getUTCDate();
            
            const rawString = `FaltaoSecretKey_${year}_${month}_${day}`;
            let hash = 0;
            for (let i = 0; i < rawString.length; i++) {
                hash = (hash * 31 + rawString.charCodeAt(i)) % 100000000;
            }
            return `faltao_${hash.toString(16).toLowerCase().padStart(8, '0')}`;
        }

        // Affiche la clé dans l'input dès le chargement de la page
        const currentKey = getDailyKey();
        document.getElementById("keyInput").value = currentKey;

        function copyKey() {
            const input = document.getElementById("keyInput");
            input.select();
            navigator.clipboard.writeText(input.value);
            alert("Clé copiée ! Tu peux la coller dans le jeu.");
        }
    </script>
</body>
</html>
