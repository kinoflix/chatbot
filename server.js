const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Groq API Key
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const userText = req.body.text;

    if (!userText || userText.trim() === '') {
        return res.status(400).json({ error: "Mətn daxil edilməyib." });
    }

    if (!GROQ_API_KEY) {
        console.error("XƏTA: GROQ_API_KEY mühit dəyişəni təyin edilməyib!");
        return res.json({ 
            reply: "Server xətası: GROQ_API_KEY mühit dəyişəni tapılmadı." 
        });
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Mükəmməl Azərbaycan dili dəstəyi olan 70B modeli
                messages: [
                    {
                        role: "system",
                        content: `Sən KINOFLIX saytının rəsmi və dostyana AI assistentisən.

ƏSAS TƏLİMATLAR:
1. Cavabları YALNIZ və YALNIZ səlis, təbii, qrammatik cəhətdən tam düzgün Azərbaycan dilində ver.
2. Əsla hərfən tərcümə olunmuş və ya anlaqsız cümlələr işlətmə.
3. Filmlər, seriallar, aktyorlar və kinematoqrafiya haqqında maraqlı və dəqiq məlumatlar paylaş.`
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
            console.error(`Groq API Xətası [Status ${response.status}]:`, rawText);
            return res.json({ 
                reply: `API Xətası (${response.status}): Açarınızı yoxlayın.` 
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
