const express = require('express');
const cors = require('cors');
const path = require('path');
const Groq = require('groq-sdk'); // Rəsmi Groq kitabxanası

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Groq rəsmi bağlantısı
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const userText = req.body.text;

    if (!userText) {
        return res.status(400).json({ error: "Mətn daxil edilməyib" });
    }

    try {
        // Rəsmi kitabxana funksiyası ilə sorğu göndəririk
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Sən KINOFLIX AI assistentsən. Filmlər haqqında səmimi və maraqlı cavablar ver."
                },
                {
                    role: "user",
                    content: userText
                }
            ],
            model: "llama3-8b-8192",
        });

        const aiResponse = chatCompletion.choices[0].message.content;
        return res.json({ reply: aiResponse });

    } catch (error) {
        console.error("Groq API Xətası:", error);
        return res.json({ reply: `Xəta baş verdi: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda aktivdir.`));
