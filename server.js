const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// SƏRT DİL MƏHDUDİYYƏTİ VƏ TƏLİMAT
const SYSTEM_INSTRUCTION = `CRITICAL REQUIREMENT: You MUST answer strictly and ONLY in the Azerbaijani language. Never use English words, phrases, or mixed languages.

Sən KINOFLIX saytının rəsmi və nəzakətli kinoman AI assistentisən.

QƏTİ QAYDALAR:
1. CAVAB DİLİ: Bütün cavabları İSTİSNASIZ OLARAQ tam, səlis və təbii Azərbaycan dilində yaz.
2. BREND ADI: Saytın adı "KINOFLIX"-dir. Yönlük halında həmişə "KINOFLIX-ə" yaz (Əsla "KINOFLIX-dən" yazma).
3. SALAMLAŞMA: "KINOFLIX-ə xoş gəldiniz!" cümləsini YALNIZ istifadəçi ilk dəfə "salam" verdikdə işlət. Başqa suallarda bu cümləni təkrar etmə.
4. MÜRACİƏT: İstifadəçiyə nəzakətlə "Siz" deyə müraciət et.`;

// MÜHƏRRİK 1: Groq API (Ən yaxşı Azərbaycan dili modellərini prioritet seçir)
async function tryGroqProvider(userText) {
    if (!GROQ_API_KEY) return null;

    try {
        const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { "Authorization": `Bearer ${GROQ_API_KEY}` }
        });
        
        if (!modelsRes.ok) return null;
        const modelsData = await modelsRes.json();
        
        const validModels = modelsData.data?.filter(m => 
            !m.id.includes("whisper") && 
            !m.id.includes("vision") && 
            !m.id.includes("safetensors") &&
            !m.id.includes("guard")
        ).map(m => m.id) || [];

        if (validModels.length === 0) return null;

        // Dili ən yaxşı bilən modellərə prioritet veririk
        const preferredModel = validModels.find(id => id.includes("llama-3.3") || id.includes("70b")) ||
                               validModels.find(id => id.includes("gemma2") || id.includes("llama-3.1")) ||
                               validModels[0];

        const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: preferredModel,
                messages: [
                    { role: "system", content: SYSTEM_INSTRUCTION },
                    { role: "user", content: userText }
                ],
                temperature: 0.5, // Dili qarışdırmaması üçün yaradıcılıq dərəcəsini sabitləyirik
                max_tokens: 1024
            })
        });

        if (!chatRes.ok) return null;
        const chatData = await chatRes.json();
        return chatData.choices?.[0]?.message?.content || null;

    } catch (e) {
        console.warn("Groq xətası, ehtiyat kanala keçilir:", e.message);
        return null;
    }
}

// MÜHƏRRİK 2: Pollinations AI (Strict Prompting)
async function tryPollinationsProvider(userText) {
    try {
        const prompt = `${SYSTEM_INSTRUCTION}\n\nİstifadəçinin sualı: ${userText}\n\nCavab (YALNIZ Azərbaycan dilində):`;
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&cache=false`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/plain'
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

    let reply = await tryGroqProvider(userText);

    if (!reply) {
        reply = await tryPollinationsProvider(userText);
    }

    if (reply) {
        return res.json({ reply });
    } else {
        return res.json({ reply: "Sistem hazırda cavab hazırlaya bilmədi, xahiş edirik bir az sonra yenidən cəhd edin." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`KINOFLIX Server ${PORT} portunda aktivdir.`));
