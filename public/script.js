document.addEventListener("DOMContentLoaded", () => {
    const chatWindow = document.getElementById("chat-window");
    const clearBtn = document.getElementById("chat-clear-btn");
    const themeBtn = document.getElementById("chat-theme-btn");
    const themeIcon = document.getElementById("chat-theme-icon");
    const sendBtn = document.getElementById("chat-send-btn");
    const chatInput = document.getElementById("chat-input");
    const messagesBox = document.getElementById("chat-messages");
    const typingIndicator = document.getElementById("chat-typing-indicator");
    const chipBtns = document.querySelectorAll(".chip-btn");

    // Əgər script serverin öz daxilindədirsə sadəcə endpoint bəs edir
    const API_URL = "/api/chat"; 

    let isCooldown = false;
    const COOLDOWN_DURATION = 10; 
    let isDarkMode = localStorage.getItem("kinoflix_chat_theme") === "dark";

    // --- 1. KEŞ YADDAŞINDAN MESAJLARI YÜKLƏMƏ ---
    function loadChatHistory() {
        messagesBox.innerHTML = "";
        const history = JSON.parse(localStorage.getItem("kinoflix_chat_history")) || [];
        
        if (history.length === 0) {
            addMessage("Salam! Mən KINOFLIX AI assistentiyəm. Sizə hansı janrda film tapmaqda kömək edim? 🍿", "bot-message", false);
        } else {
            history.forEach(msg => {
                addMessage(msg.text, msg.className, false);
            });
        }
    }

    // --- 2. TEMA IDARƏETMƏSİ ---
    function applyTheme(dark) {
        if (dark) {
            chatWindow.classList.remove("light-mode");
            chatWindow.classList.add("dark-mode");
            themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.22" x2="5.64" y2="17.78"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
        } else {
            chatWindow.classList.remove("dark-mode");
            chatWindow.classList.add("light-mode");
            themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        }
        localStorage.setItem("kinoflix_chat_theme", dark ? "dark" : "light");
    }
    
    applyTheme(isDarkMode);

    themeBtn.addEventListener("click", () => {
        isDarkMode = !isDarkMode;
        applyTheme(isDarkMode);
    });

    // --- 3. TARİXÇƏNİ TƏMİZLƏMƏ ---
    clearBtn.addEventListener("click", () => {
        if (confirm("Söhbət tarixçəsini təmizləmək istəyirsiniz?")) {
            localStorage.removeItem("kinoflix_chat_history");
            loadChatHistory();
        }
    });

    // --- 4. MESAJ GÖNDƏRMƏ ---
    async function sendMessage() {
        if (isCooldown) return;

        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, "user-message", true);
        chatInput.value = "";

        typingIndicator.classList.remove("indicator-hidden");
        messagesBox.scrollTop = messagesBox.scrollHeight;

        startCooldown();

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();
            
            typingIndicator.classList.add("indicator-hidden");
            addMessage(data.reply, "bot-message", true);

        } catch (error) {
            typingIndicator.classList.add("indicator-hidden");
            addMessage("Xəta yarandı. Bağlantını yoxlayın. 😅", "bot-message", false);
        }
    }

    // --- 5. COOLDOWN ---
    function startCooldown() {
        isCooldown = true;
        let timeLeft = COOLDOWN_DURATION;
        const originalContent = sendBtn.innerHTML;

        sendBtn.disabled = true;
        sendBtn.style.opacity = "0.6";

        const timer = setInterval(() => {
            timeLeft--;
            sendBtn.innerText = timeLeft + "s";

            if (timeLeft <= 0) {
                clearInterval(timer);
                isCooldown = false;
                sendBtn.disabled = false;
                sendBtn.style.opacity = "1";
                sendBtn.innerHTML = originalContent;
            }
        }, 1000);
    }

    // --- 6. DOM-A ƏLAVƏ ETMƏ VƏ LOKAL YADDAŞ ---
    function addMessage(text, className, saveToHistory = true) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const msgDiv = document.createElement("div");
        msgDiv.className = `chat-message ${className}`;
        
        msgDiv.innerHTML = `
            <p style="margin:0; padding:0;">${text}</p>
            <span style="display:block; font-size:8px; margin-top:4px; opacity:0.4; text-align:right;">${timeStr}</span>
        `;
        
        messagesBox.appendChild(msgDiv);
        messagesBox.scrollTop = messagesBox.scrollHeight; 

        if (saveToHistory) {
            const history = JSON.parse(localStorage.getItem("kinoflix_chat_history")) || [];
            history.push({ text, className });
            localStorage.setItem("kinoflix_chat_history", JSON.stringify(history));
        }
    }

    chipBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            chatInput.value = btn.getAttribute("data-text");
            chatInput.focus();
        });
    });

    sendBtn.addEventListener("click", sendMessage);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    loadChatHistory();
});
