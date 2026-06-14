const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// GitHub Models rəsmi məlumatları
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

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Dünyanın ən ağıllı mini modeli, tam pulsuz və şəbəkə xətasız
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

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            const aiResponse = data.choices[0].message.content;
            return res.json({ reply: aiResponse });
        } else {
            console.error("GitHub-dan gözlənilməz cavab:", data);
            return res.json({ reply: "Sistem hazırda cavab hazırlaya bilmədi." });
        }

    } catch (error) {
        console.error("Sistem xətası:", error);
        return res.json({ reply: `Xəta baş verdi: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda aktivdir.`));
