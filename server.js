const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware tənzimləmələri
app.use(cors());
app.use(express.json());

// Statik faylları (Frontend - index.html, css, js) təqdim etmək üçün
app.use(express.static(path.join(__dirname, 'public')));

// Google Gemini API Açarını mühit dəyişənindən oxuyuruq
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Əsas səhifə yönləndirməsi
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// AI Chat API Endpoint
app.post('/api/chat', async (req, res) => {
    const userText = req.body.text;

    // Daxil edilən mətni yoxlayırıq
    if (!userText || userText.trim() === '') {
        return res.status(400).json({ error: "Mətn daxil edilməyib." });
    }

    // API Key yoxlanışı
    if (!GEMINI_API_KEY) {
        console.error("XƏTA: GEMINI_API_KEY mühit dəyişəni təyin edilməyib!");
        return res.json({ 
            reply: "Server xətası: GEMINI_API_KEY mühit dəyişəni tapılmadı. Zəhmət olmasa hosting panelində əlavə edin." 
        });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [
                        {
                            text: `Sən KINOFLIX saytının rəsmi və dostyana AI assistentisən.

ƏSAS TƏLİMATLAR:
1. Cavabları YALNIZ və YALNIZ səlis, təbii, qrammatik cəhətdən tam düzgün Azərbaycan dilində ver.
2. Əsla hərfən tərcümə olunmuş, lüğəti pozulmuş və ya anlaqsız cümlələr işlətmə.
3. Filmlər, seriallar, aktyorlar və kinematoqrafiya haqqında maraqlı, dəqiq və səmimi məlumatlar paylaş.
4. Qısa, aydın və oxunaqlı cümlələrdən istifadə et.`
                        }
                    ]
                },
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: userText }
                        ]
                    }
                ]
            })
        });

        // Cavab gövdəsini mətn kimi oxuyuruq
        const rawText = await response.text();

        if (!response.ok) {
            console.error(`Gemini API Xətası [Status ${response.status}]:`, rawText);
            return res.json({ 
                reply: `Gemini API xətası (${response.status}): API Açarınızı və ya limitləri yoxlayın.` 
            });
        }

        const data = JSON.parse(rawText);

        // Cavab strukturunun doğruluğunu yoxlayırıq
        if (
            data.candidates && 
            data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0
        ) {
            const aiReply = data.candidates[0].content.parts[0].text;
            return res.json({ reply: aiReply });
        } else {
            return res.json({ reply: "Sistem hazırda cavab hazırlaya bilmədi." });
        }

    } catch (error) {
        console.error("Sistem xətası:", error.message);
        return res.json({ reply: `Xəta baş verdi: ${error.message}` });
    }
});

// Serveri işə salırıq
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda aktivdir.`));
