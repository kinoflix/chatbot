const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// DeepSeek API tənzimləməsi
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = "https://api.deepseek.com/chat/completions";

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const userText = req.body.text;

    if (!userText) {
        return res.status(400).json({ error: "Mətn daxil edilməyib" });
    }

    if (!DEEPSEEK_API_KEY) {
        console.error("XƏTA: DEEPSEEK_API_KEY mühit dəyişəni təyin edilməyib!");
        return res.json({ 
            reply: "Server xətası: DEEPSEEK_API_KEY mühit dəyişəni tapılmadı." 
        });
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "deepseek-chat", // DeepSeek-V3 modeli
                messages: [
                    {
                        role: "system",
                        content: "Sən KINOFLIX saytının rəsmi və dostyana AI assistentisən. Filmlər və seriallar haqqında səmimi, səlis və qrammatik cəhətdən tam düzgün Azərbaycan dilində cavablar ver."
                    },
                    {
                        role: "user",
                        content: userText
                    }
                ]
            })
        });

        const rawText = await response.text();

        if (!response.ok) {
            console.error(`DeepSeek API Xətası [Status ${response.status}]:`, rawText);
            return res.json({ 
                reply: `DeepSeek API xətası (${response.status}): API Açarını yoxlayın.` 
            });
        }

        const data = JSON.parse(rawText);

        if (data.choices && data.choices.length > 0) {
            return res.json({ reply: data.choices[0].message.content });
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
