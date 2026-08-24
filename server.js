const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const SYSTEM_INSTRUCTION = `Sən KINOFLIX saytının rəsmi və kinoman AI assistentisən.

QƏTİ VƏ MÜTLƏQ QAYDALAR:
1. DİL: Azərbaycan dilində səlis, təbii və qrammatik cəhətdən düzgün cavab ver.
2. BREND ADI: Saytın adı KINOFLIX-dir. Yönlük halında həmişə "KINOFLIX-ə" yaz.
3. SALAMLAŞMA: "KINOFLIX-ə xoş gəldiniz!" cümləsini YALNIZ istifadəçi ilk dəfə "salam" verəndə işlət.`;

// MÜHƏRRİK 1: Groq API (Dinamik Model Axtarışı)
async function tryGroqProvider(userText) {
    if (!GROQ_API_KEY) return null;

    try {
        // Groq-da həmin saniyə aktiv olan modellərin siyahısını alırıq
        const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { "Authorization": `Bearer ${GROQ_API_KEY}` }
        });
        
        if (!modelsRes.ok) return null;
        const modelsData = await modelsRes.json();
        
        // Mətn modellərini süzürük
        const validModels = modelsData.data?.filter(m => 
            !m.id.includes("whisper") && !m.id.includes("vision") && !m.id.includes("safetensors")
        );

        if (!validModels || validModels.length === 0) return null;
        
        // Bazasında olan ilk aktiv modeli seçir
        const activeModel = validModels[0].id;

        const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: activeModel,
                messages: [
                    { role: "system", content: SYSTEM_INSTRUCTION },
                    { role: "user", content: userText }
                ],
                temperature: 0.6,
                max_tokens: 1024
            })
        });

        if (!chatRes.ok) return null;
        const chatData = await chatRes.json();
        return chatData.choices?.[0]?.message?.content || null;

    } catch (e) {
        console.warn("Groq Mühərriki cavab vermədi, ehtiyat kanala keçilir...");
        return null;
    }
}

// MÜHƏRRİK 2: Pollinations AI (GET Yönləndirməsi + Browser Headers)
async function tryPollinationsProvider(userText) {
    try {
        const prompt = `${SYSTEM_INSTRUCTION}\n\nİstifadəçi: ${userText}`;
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&cache=false`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/plain, text/html'
            }
        });

        if (!response.ok) return null;
        const text = await response.text();
        return text && text.trim() !== '' ? text.trim() : null;
    } catch (e) {
        console.error("Pollinations xətası:", e.message);
        return null;
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const userText = req.body.text;

    if (!userText || userText.trim() === '') {
        return res.status(400).json({ error: "Mətn daxil edilməyib." });
    }

    // 1. Birinci Groq-u dinamik modellə yoxlayır
    let reply = await tryGroqProvider(userText);

    // 2. Groq cavab verməzsə, dərhal Pollinations GET kanalına keçir
    if (!reply) {
        reply = await tryPollinationsProvider(userText);
    }

    // Yekun nəticə
    if (reply) {
        return res.json({ reply });
    } else {
        return res.json({ reply: "KINOFLIX AI hazırda sorğunuzu emal edə bilmədi. Lütfən bir az sonra yenidən cəhd edin." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`KINOFLIX Server ${PORT} portunda aktivdir.`));
