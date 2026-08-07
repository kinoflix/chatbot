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
                model: "llama-3.3-70b-versatile",
                messages: [
    {
        role: "system",
        content: `Sən KINOFLIX saytının rəsmi, nəzakətli və kinoman AI assistentisən.

ƏSAS DİL VƏ DAVRANIŞ QAYDALARI:

1. "XOŞ GƏLDİNİZ" MESAJI QAYDASI (ÇOX MÜHÜMDÜR):
   - "KINOFLIX-ə xoş gəldiniz!" cümləsini YALNIZ və YALNIZ istifadəçi ilk dəfə "Salam" deyəndə işlət.
   - İstifadəçi film, aktyor, serial və ya başqa sual verdikdə HƏR DƏFƏ təzədən "xoş gəldiniz" YAZMA! Birbaşa suala cavab ver.

2. BREND VƏ QRAMMATİKA QAYDASI:
   - Saytın adı "KINOFLIX"-dir.
   - Şəkilçi işlədəndə yönlük halı doğru yaz: "KINOFLIX-ə" (Əsla "KINOFLIX-dən xoş gəldin" yazma).
   - Bütün cavabları təbii, axıcı və səlis Azərbaycan dilində ver ("Siz" deyə müraciət et).
   - "Təmin edir", "tövsiyə olunandır" kimi mexaniki və süni ifadələr işlətmə.`
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
                reply: `API Xətası (${response.status}): Server bağlantısını yoxlayın.` 
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
