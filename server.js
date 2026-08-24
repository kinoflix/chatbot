const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Anlıq aktiv modeli yaddaşda saxlamaq üçün keş (cache)
let cachedModel = null;
let lastModelCheckTime = 0;

// Groq-dan anlıq olaraq ƏN YENİ VƏ AKTİV modeli avtomatik tapır
async function getDynamicActiveModel() {
    // 1 saat ərzində model tapılıbsa, Groq-a təkrar modellər sorğusu göndərmir
    if (cachedModel && (Date.now() - lastModelCheckTime < 60 * 60 * 1000)) {
        return cachedModel;
    }

    try {
        console.log("Groq bazasından anlıq aktiv modellər siyahısı alınır...");
        const response = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { "Authorization": `Bearer ${GROQ_API_KEY}` }
        });

        const data = await response.json();

        if (data && data.data && data.data.length > 0) {
            // Səs və ya vizual modelləri çıxarırıq, yalnız mətn/çat modellərini süzürük
            const chatModels = data.data.filter(m => 
                !m.id.includes("whisper") && 
                !m.id.includes("vision") && 
                !m.id.includes("safetensors")
            );

            if (chatModels.length > 0) {
                // Azərbaycan dili üçün Llama, Gemma və ya siyahıdakı birinci aktiv modeli avtomatik seçir
                const preferredModel = chatModels.find(m => m.id.includes("llama") || m.id.includes("gemma")) || chatModels[0];
                
                cachedModel = preferredModel.id;
                lastModelCheckTime = Date.now();
                console.log(`[AVTOMATİK TƏYİN OLUNDU]: İşlək model -> ${cachedModel}`);
                return cachedModel;
            }
        }
    } catch (error) {
        console.error("Aktiv model siyahısını alarkən xəta:", error.message);
    }

    // Əgər siyahı alınmazsa, ehtiyat standart ID
    return cachedModel || "llama-3.1-8b-instant";
}

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

    try {
        // Groq-dan anlıq 100% aktiv olan modelin ID-sini dinamik olaraq alırıq
        const activeModel = await getDynamicActiveModel();

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: activeModel,
                messages: [
                    {
                        role: "system",
                        content: `Sən KINOFLIX saytının rəsmi və kinoman AI assistentisən.

QƏTİ VƏ MÜTLƏQ QAYDALAR:
1. DİL: Azərbaycan dilində səlis, təbii və qrammatik cəhətdən düzgün cavab ver.
2. BREND ADI: Saytın adı KINOFLIX-dir. Yönlük halında həmişə "KINOFLIX-ə" yaz (Əsla "KINOFLIX-dən" yazma).
3. SALAMLAŞMA: "KINOFLIX-ə xoş gəldiniz!" cümləsini YALNIZ istifadəçi ilk dəfə "salam" verəndə işlət.`
                    },
                    {
                        role: "user",
                        content: userText
                    }
                ],
                temperature: 0.6,
                max_tokens: 1024
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Groq API Xətası:`, data);
            // Model dəyişibsə keş-i sıfırla ki, növbəti sorğuda yenidən avtomatik axtarsın
            cachedModel = null; 
            return res.json({ reply: `Xəta baş verdi: ${data.error?.message || "Bilinməyən xəta"}` });
        }

        return res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error("Sistem xətası:", error);
        cachedModel = null;
        return res.json({ reply: `Sistem xətası: ${error.message}` });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`KINOFLIX Server ${PORT} portunda aktivdir.`));
