const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const typingIndicator = document.getElementById('typing-indicator');

// Panel elementləri
const botPanel = document.getElementById('bot-panel');
const toggleBotBtn = document.getElementById('toggle-bot-btn');
const closeBotBtn = document.getElementById('close-bot-btn');

// --- Panelin Açılıb Bağlanma Məntiqi ---
toggleBotBtn.addEventListener('click', () => {
    botPanel.classList.remove('-translate-x-full');
    toggleBotBtn.classList.add('opacity-0', 'pointer-events-none'); // Düyməni gizlət
});

closeBotBtn.addEventListener('click', () => {
    botPanel.classList.add('-translate-x-full');
    toggleBotBtn.classList.remove('opacity-0', 'pointer-events-none'); // Düyməni geri gətir
});

// --- Mesaj Əlavə Etmə ---
function appendMessage(text, sender) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
    
    bubbleWrapper.innerHTML = `
        <div class="message-bubble ${sender === 'user' ? 'user-bubble' : 'ai-bubble'} px-4 py-3 rounded-2xl shadow-sm">
            <p class="text-sm leading-relaxed">${text}</p>
            <span class="block text-[8px] mt-1 opacity-40 text-right">${timeStr}</span>
        </div>
    `;
    
    chatBox.appendChild(bubbleWrapper);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
}

// --- API-ə Mesaj Göndərmə ---
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    userInput.value = '';

    // "Yazır..." İndikatorunu Aktiv Et
    typingIndicator.classList.remove('hidden');
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });

    try {
        const response = await fetch('/api/chat', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text })
        });
        
        const data = await response.json();
        typingIndicator.classList.add('hidden'); // İndikatoru söndür
        
        appendMessage(data.reply, 'ai');
    } catch (e) {
        typingIndicator.classList.add('hidden');
        appendMessage("Xəta baş verdi, internet bağlantısını yoxlayın 😅", 'ai');
    }
}

// Hazır düymələrə basanda mətni daxil etmək üçün
function fillInput(text) {
    userInput.value = text;
    userInput.focus();
}

// Çatı təmizləmək
clearBtn.addEventListener('click', () => {
    if(confirm("Söhbət tarixçəsini təmizləmək istəyirsiniz?")) {
        chatBox.innerHTML = '';
        appendMessage("Salam! Mən KINOFLIX AI assistentiyəm. Sizə hansı janrda film tapmaqda kömək edim? 🍿", 'ai');
    }
});

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });

// İlk açılış mesajı
window.onload = () => {
    if(chatBox.children.length === 0) {
        appendMessage("Salam! Mən KINOFLIX AI assistentiyəm. Sizə hansı janrda film tapmaqda kömək edim? 🍿", 'ai');
    }
};
