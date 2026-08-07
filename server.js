const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

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
        return res.json({ reply: "Server xətası: GROQ_API_KEY mühit dəyişəni tapılmadı." });
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `Sən KINOFLIX saytının rəsmi və kinoman AI assistentisən.

QƏTİ VƏ MÜTLƏQ QAYDALAR:
1. DİL: Azərbaycan dilində səlis, təbii və qrammatik cəhətdən düzgün cavab ver. Şablon, süni tərcümə, "təmin edir", "təcrübə yaşadır" kimi robotik sözlər İSTİFADƏ ETMƏ.
2. BREND ADI: Saytın adı KINOFLIX-dir. Yönlük halında həmişə "KINOFLIX-ə" yaz (Əsla "KINOFLIX-dən" yazma).
3. SALAMLAŞMA: "KINOFLIX-ə xoş gəldiniz!" cümləsini YALNIZ istifadəçi ilk dəfə "salam" verəndə işlət. İstifadəçi film, aktyor və ya başqa şey soruşanda bu cümləni TƏKRARLAMA, dərhal suala cavab ver.`
                    },
                    {
                        role: "user",
                        content: userText
                    }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Groq Xətası:`, data);
            return res.json({ reply: `Xəta baş verdi: ${data.error?.message || "Bilinməyən xəta"}` });
        }

        return res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error("Sistem xətası:", error);
        return res.json({ reply: `Sistem xətası: ${error.message}` });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda aktivdir.`));
