const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const userText = req.body.text;

    if (!userText || userText.trim() === '') {
        return res.status(400).json({ error: "Mətn daxil edilməyib." });
    }

    if (!GEMINI_API_KEY) {
        console.error("XƏTA: GEMINI_API_KEY mühit dəyişəni təyin edilməyib!");
        return res.json({ 
            reply: "Server xətası: GEMINI_API_KEY mühit dəyişəni (Environment Variable) tapılmadı." 
        });
    }

    // Google Gemini 2.0 Flash rəsmi API endpoint-i
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

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
                            text: `Sən KINOFLIX saytının rəsmi, nəzakətli və kinoman AI assistentisən.

ƏSAS QAYDALAR:
1. Cavabları HƏMİŞƏ səlis, təbii və axıcı Azərbaycan dilində ver. Şəkilçiləri və grammatikanı dürüst tətbiq et.
2. "KINOFLIX-ə xoş gəldiniz!" ifadəsini yalnız istifadəçi ilk dəfə "Salam" dedikdə işlət. Növbəti suallarda təkrar etmə.
3. Brendin adı "KINOFLIX"-dir. Yönlük halında "KINOFLIX-ə" yaz.
4. İstifadəçiyə nəzakətlə "Siz" deyə müraciət et.`
                        }
                    ]
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: userText }]
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Gemini API Xətası [Status ${response.status}]:`, JSON.stringify(data));
            return res.json({ 
                reply: `Gemini Xətası (${response.status}): ${data.error?.message || "Xəta baş verdi"}` 
            });
        }

        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content?.parts?.[0]?.text) {
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda aktivdir.`));
