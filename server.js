const express = require('express');
const cors = require('cors');
const path = require('path'); // Qovluq yollarını düzgün idarə etmək üçün mütləqdir

const app = express();
app.use(cors());
app.use(express.json());

// 1. Serverə deyirik ki, bütün statik faylları (css, js, şəkillər) "public" qovluğundan oxusun
app.use(express.static(path.join(__dirname, 'public')));

// 2. Ana səhifəyə daxil olduqda "public" qovluğunun içindəki index.html-i ekrana gətir
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Groq-dan aldığın pulsuz API açarı və rəsmi link
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// 3. Çat otağından və ya botdan gələn mesajları qəbul edən əsas API linkimiz
app.post('/api/chat', async (req, res) => {
    const userText = req.body.text;

    if (!userText) {
        return res.status(400).json({ error: "Mətn daxil edilməyib" });
    }

    try {
        // Groq API-na birbaşa fetch sorğusu göndəririk
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // Sürətli və limitsizə yaxın modelimiz
                messages: [
                    {
                        role: "system",
                        content: "Sən KINOFLIX AI assistentsən. Filmlər haqqında səmimi və maraqlı cavablar ver."
                    },
                    {
                        role: "user",
                        content: userText
                    }
                ]
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            const aiResponse = data.choices[0].message.content;
            return res.json({ reply: aiResponse });
        } else {
            console.error("Groq-dan boş cavab gəldi:", data);
            return res.json({ reply: "Model hazırda cavab verə bilmir." });
        }

    } catch (error) {
        console.error("Xəta baş verdi:", error);
        return res.json({ reply: "Sistemdə xəta yarandı. Yenidən yoxlayın." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serverimiz ${PORT} portunda uğurla işləyir.`));
