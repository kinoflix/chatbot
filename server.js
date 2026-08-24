const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// 24 Avqust 2026 tarixinə ən stabil və aktiv modellərin siyahısı
// Sistem sırayla bu modelləri yoxlayacaq. Birinci xəta versə, ikincini işə salacaq.
const ACTIVE_MODELS = [
    "gemma2-9b-it",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768"
];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const userText = req.body.text;

    if (!userText || userText.trim() === '') {
        return res.status(400).json({ error: "Mətn daxil edilməyib." });
    }

    if (!GROQ_API_KEY) {
        return res.json({ reply: "Server xətası: GROQ_API_KEY mühit dəyişəni tapılmadı." });
    }

    const systemInstruction = `Sən KINOFLIX saytının rəsmi və kinoman AI assistentisən.

QƏTİ VƏ MÜTLƏQ QAYDALAR:
1. DİL: Azərbaycan dilində səlis, təbii və qrammatik cəhətdən düzgün cavab ver. Şablon və robotik ifadələr işlətmə.
2. BREND ADI: Saytın adı KINOFLIX-dir. Yönlük halında həmişə "KINOFLIX-ə" yaz (Əsla "KINOFLIX-dən" yazma).
3. SALAMLAŞMA: "KINOFLIX-ə xoş gəldiniz!" cümləsini YALNIZ istifadəçi ilk dəfə "salam" verəndə işlət. Başqa hallarda təkrarlama.`;

    let aiResponse = null;
    let lastError = null;

    // Fallback mexanizmi: Bütün modelləri sırayla yoxlayır
    for (const currentModel of ACTIVE_MODELS) {
        try {
            console.log(`Groq API-yə ${currentModel} modeli ilə sorğu göndərilir...`);
            
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: currentModel,
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: userText }
                    ],
                    temperature: 0.6, // Azərbaycan dilində daha məntiqli və stabil cavablar üçün 0.6 idealdır
                    max_tokens: 1024,
                    top_p: 0.9
                })
            });

            const data = await response.json();

            // Əgər model ləğv edilibsə (404) və ya başqa xəta varsa, növbəti modelə keç
            if (!response.ok) {
                console.warn(`XƏBƏRDARLIQ: ${currentModel} işləmədi. Xəta: ${data.error?.message}`);
                lastError = data.error?.message;
                continue; // Dövrü davam etdir, növbəti modeli sınasın
            }

            // Cavab uğurla alındısa, nəticəni yadda saxla və dövrdən çıx
            if (data.choices && data.choices.length > 0) {
                aiResponse = data.choices[0].message.content;
                break; 
            }

        } catch (error) {
            console.warn(`Sistem xətası (${currentModel}):`, error.message);
            lastError = error.message;
            continue;
        }
    }

    // Əgər heç bir model işləmədisə
    if (!aiResponse) {
        console.error("KRİTİK XƏTA: Bütün modellər sıradan çıxıb. Son xəta:", lastError);
        return res.json({ 
            reply: `Bağışlayın, hazırda KINOFLIX AI sistemində yenilənmə gedir. (Texniki xəta: ${lastError || "Bilinməyən xəta"})` 
        });
    }

    // Uğurlu cavabı istifadəçiyə qaytar
    return res.json({ reply: aiResponse });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`KINOFLIX Server ${PORT} portunda aktivdir.`));
