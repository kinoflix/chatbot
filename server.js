const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Render-də təyin edəcəyimiz API açarı və Groq-un rəsmi linki
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

app.post('/api/chat', async (req, res) => {
    const userText = req.body.text;

    if (!userText) {
        return res.status(400).json({ error: "Mətn daxil edilməyib" });
    }

    try {
        // Heç bir paket yükləmədən birbaşa Groq API-na sorğu göndəririk
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // Tam pulsuz, donmayan, ildırım sürətli model
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
app.listen(PORT, () => console.log(`Server ${PORT} portunda aktivdir.`));
