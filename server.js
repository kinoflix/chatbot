const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Gemini API SDK inisializasiyası
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const userText = req.body.text;

    if (!userText || userText.trim() === '') {
        return res.status(400).json({ error: "Mətn daxil edilməyib." });
    }

    if (!GEMINI_API_KEY) {
        console.error("XƏTA: GEMINI_API_KEY təyin edilməyib!");
        return res.json({ 
            reply: "Server xətası: GEMINI_API_KEY mühit dəyişəni tapılmadı." 
        });
    }

    try {
        // Rəsmi SDK vasitəsilə modelin çağırılması
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: `Sən KINOFLIX saytının rəsmi və dostyana AI assistentisən.

ƏSAS TƏLİMATLAR:
1. Cavabları YALNIZ və YALNIZ səlis, təbii, qrammatik cəhətdən tam düzgün Azərbaycan dilində ver.
2. Əsla hərfən tərcümə olunmuş və ya anlaqsız cümlələr işlətmə.
3. Filmlər, seriallar, aktyorlar və kinematoqrafiya haqqında maraqlı və dəqiq məlumatlar paylaş.`
        });

        const result = await model.generateContent(userText);
        const response = await result.response;
        const aiReply = response.text();

        return res.json({ reply: aiReply });

    } catch (error) {
        console.error("Gemini SDK Xətası:", error);
        return res.json({ 
            reply: `Xəta baş verdi: ${error.message || "API açarını və ya bağlantını yoxlayın."}` 
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda aktivdir.`));
