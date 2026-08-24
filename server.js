const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const userText = req.body.text;

    if (!userText || userText.trim() === '') {
        return res.status(400).json({ error: "Mətn daxil edilməyib." });
    }

    try {
        // Pollinations AI - Model adından və API Key-dən asılı olmayan daimi sistem
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: `Sən KINOFLIX saytının rəsmi və kinoman AI assistentisən.

QƏTİ VƏ MÜTLƏQ QAYDALAR:
1. DİL: Azərbaycan dilində səlis, təbii və qrammatik cəhətdən düzgün cavab ver.
2. BREND ADI: Saytın adı KINOFLIX-dir. Yönlük halında həmişə "KINOFLIX-ə" yaz (Əsla "KINOFLIX-dən" yazma).
3. SALAMLAŞMA: "KINOFLIX-ə xoş gəldiniz!" cümləsini YALNIZ istifadəçi ilk dəfə "salam" verəndə işlət.`
                    },
                    {
                        role: 'user',
                        content: userText
                    }
                ],
                model: 'openai', // Mərkəzi sistem ən yaxşı aktiv mətni avtomatik seçir
                seed: Math.floor(Math.random() * 1000000)
            })
        });

        if (!response.ok) {
            return res.json({ reply: "Sistemdə müvəqqəti gecikmə var, xahiş edirik bir az sonra yenidən cəhd edin." });
        }

        const aiReply = await response.text();
        
        if (aiReply && aiReply.trim() !== '') {
            return res.json({ reply: aiReply.trim() });
        } else {
            return res.json({ reply: "Cavab hazırlana bilmədi, zəhmət olmasa yenidən yazın." });
        }

    } catch (error) {
        console.error("Sistem xətası:", error.message);
        return res.json({ reply: `Xəta baş verdi: ${error.message}` });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`KINOFLIX Server ${PORT} portunda aktivdir.`));
