const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const API_URL = "https://models.inference.ai.azure.com/chat/completions";

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const userText = req.body.text;

    if (!userText) {
        return res.status(400).json({ error: "Mətn daxil edilməyib" });
    }

    // Token yoxlanışı
    if (!GITHUB_TOKEN) {
        console.error("XƏTA: GITHUB_TOKEN serverdə təyin edilməyib!");
        return res.json({ 
            reply: "Server xətası: GITHUB_TOKEN tapılmadı. Zəhmət olmasa hosting/terminal paneldə tokeni təyin edin." 
        });
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Sən KINOFLIX AI assistentsən. Filmlər haqqında səmimi və maraqlı cavablar ver."
                    },
                    {
                        role: "user",
                        content: userText
                    }
                ]
            })
        });

        // 1. Düzgün JSON parse üçün əvvəlcə mətni oxuyuruq
        const rawText = await response.text();

        // 2. HTTP Status 200 deyilsə (401, 403, 429 və s.), konsola dəqiq səbəbi yazırıq
        if (!response.ok) {
            console.error(`GitHub API Xətası [Status ${response.status}]:`, rawText);
            return res.json({ 
                reply: `GitHub API xətası (${response.status}): Tokeniniz səhvdir, vaxtı bitib və ya limit dolub.` 
            });
        }

        // 3. Cavab boşdursa çəkmənin qarşısını alırıq
        if (!rawText) {
            console.error("GitHub API-dən boş cavab gəldi.");
            return res.json({ reply: "API-dən boş cavab gəldi." });
        }

        // 4. Təhlükəsiz şəkildə JSON parse edirik
        const data = JSON.parse(rawText);

        if (data.choices && data.choices.length > 0) {
            const aiResponse = data.choices[0].message.content;
            return res.json({ reply: aiResponse });
        } else {
            return res.json({ reply: "Sistem hazırda cavab hazırlaya bilmədi." });
        }

    } catch (error) {
        console.error("Sistem xətası:", error.message);
        return res.json({ reply: `Xəta baş verdi: ${error.message}` });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda aktivdir.`));
