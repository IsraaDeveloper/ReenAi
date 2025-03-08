document.addEventListener('DOMContentLoaded', () => {
    /*** Authentication ***/
    // Referensi elemen auth
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const githubLoginBtn = document.getElementById('github-login-btn');
    const yahooLoginBtn = document.getElementById('yahoo-login-btn')

    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    const registerConfirmPassword = document.getElementById('register-confirm-password');
    const registerBtn = document.getElementById('register-btn');
    const googleRegisterBtn = document.getElementById('google-register-btn');
    const githubRegisterBtn = document.getElementById('github-register-btn');
    const yahooRegisterBtn = document.getElementById('yahoo-register-btn')

    // Toggle tab antara Login dan Register
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'flex';
        loginForm.style.display = 'none';
    });

    // Login menggunakan email/password
    loginBtn.addEventListener('click', () => {
        const email = loginEmail.value;
        const password = loginPassword.value;
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // onAuthStateChanged akan menangani update UI
            })
            .catch(error => {
                alert(error.message);
            });
    });

    // Register menggunakan email/password
    registerBtn.addEventListener('click', () => {
        const email = registerEmail.value;
        const password = registerPassword.value;
        const confirmPassword = registerConfirmPassword.value;
        if (password !== confirmPassword) {
            alert("Password tidak cocok!");
            return;
        }
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // onAuthStateChanged akan menangani update UI
            })
            .catch(error => {
                alert(error.message);
            });
    });

    // Login/Register dengan Google
    googleLoginBtn.addEventListener('click', googleSignIn);
    googleRegisterBtn.addEventListener('click', googleSignIn);

    function googleSignIn() {
        var provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then((result) => {
                // onAuthStateChanged akan menangani update UI
            })
            .catch(error => {
                alert(error.message);
            });
    }

    // Login/Register dengan GitHub
    githubLoginBtn.addEventListener('click', githubSignIn);
    githubRegisterBtn.addEventListener('click', githubSignIn);

    function githubSignIn() {
        // Inisialisasi provider GitHub
        var provider = new firebase.auth.GithubAuthProvider();

        // (Opsional) Jika Anda ingin meminta scope tambahan, bisa menambahkan:
        // provider.addScope('repo');

        // Tampilkan popup untuk login GitHub
        auth.signInWithPopup(provider)
            .then((result) => {
                // result.credential.accessToken mengandung GitHub access token, jika perlu
                // result.user mengandung info user yang terautentikasi
                console.log("Login GitHub berhasil:", result.user);
                // onAuthStateChanged akan menangani UI selanjutnya
            })
            .catch((error) => {
                // Tangani error
                console.error("Error login GitHub:", error);
                alert(error.message);
            });
    }

    yahooLoginBtn.addEventListener('click', yahooSignIn);
    yahooRegisterBtn.addEventListener('click', yahooSignIn);
    function yahooSignIn() {
        // Buat instance OAuthProvider dengan identifier 'yahoo.com'
        var provider = new firebase.auth.OAuthProvider('yahoo.com');

        // (Opsional) Jika Anda ingin menambahkan scope tertentu, misalnya:
        // provider.addScope('profile');

        // Lakukan sign in menggunakan popup
        auth.signInWithPopup(provider)
            .then((result) => {
                // Login berhasil; result.user berisi data user yang telah login
                console.log("Login Yahoo berhasil:", result.user);
                // onAuthStateChanged akan menangani update UI
            })
            .catch((error) => {
                console.error("Error saat login Yahoo:", error);
                alert(error.message);
            });
    }


    // Auth state listener
    auth.onAuthStateChanged((user) => {
        if (user) {
            userId = user.uid; // update global userId

            // Update foto profil berdasarkan akun Google/GitHub (jika tersedia)
            const profileImg = document.getElementById('profile-img');
            profileImg.src = user.photoURL ? user.photoURL : '/img/profile.png';

            authContainer.style.display = 'none';
            appContainer.style.display = 'flex';
            initializeChat();
        } else {
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    });

    /*** Chat Functionality ***/
    const chatForm = document.getElementById('chat-form');
    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message-input');

    const sidebar = document.querySelector('.sidebar');
    const hideSidebarBtn = document.getElementById('hide-sidebar-btn');
    const showSidebarBtn = document.getElementById('show-sidebar-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatHistory = document.getElementById('chat-history');

    let currentConversationId = null;

    function initializeChat() {
        loadChatHistory().then((conversations) => {
            if (conversations && conversations.length > 0) {
                currentConversationId = conversations[0].id;
                loadConversation(currentConversationId);
            } else {
                createNewChat().then((newConvId) => {
                    loadConversation(newConvId);
                });
            }
            cleanupEmptyConversations(currentConversationId);
        });
    }

    function loadChatHistory() {
        return db.collection("users").doc(userId).collection("conversations")
            .orderBy("createdAt", "desc")
            .get()
            .then((querySnapshot) => {
                let conversations = [];
                chatHistory.innerHTML = "";
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    conversations.push({ id: doc.id, ...data });
                    addChatHistoryItem(data.title, doc.id);
                });
                return conversations;
            })
            .catch((error) => {
                console.error("Error loading conversations: ", error);
            });
    }

    function loadConversation(conversationId) {
        chatBox.innerHTML = "";
        return db.collection("users").doc(userId).collection("conversations")
            .doc(conversationId)
            .collection("messages")
            .orderBy("timestamp", "asc")
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const messageData = doc.data();
                    const content = messageData.role === 'bot'
                        ? marked.parse(messageData.text)
                        : messageData.text;
                    addMessage(content, messageData.role);
                });
                scrollToBottom();
            })
            .catch((error) => {
                console.error("Error loading conversation: ", error);
            });
    }

    async function createNewChat() {
        const docRef = await db.collection("users").doc(userId).collection("conversations")
            .add({
                title: "Percakapan Baru",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        currentConversationId = docRef.id;
        addChatHistoryItem("Percakapan Baru", docRef.id);
        chatBox.innerHTML = "";
        return docRef.id;
    }

    async function cleanupEmptyConversations(activeConvId) {
        const convSnapshot = await db.collection("users").doc(userId).collection("conversations").get();
        convSnapshot.forEach(async (doc) => {
            if (doc.id !== activeConvId) {
                const messagesSnapshot = await db.collection("users")
                    .doc(userId)
                    .collection("conversations")
                    .doc(doc.id)
                    .collection("messages")
                    .get();
                if (messagesSnapshot.empty) {
                    db.collection("users")
                        .doc(userId)
                        .collection("conversations")
                        .doc(doc.id)
                        .delete()
                        .catch(error => console.error("Gagal menghapus percakapan kosong:", error));
                }
            }
        });
    }

    newChatBtn.addEventListener('click', async () => {
        const newConvId = await createNewChat();
        cleanupEmptyConversations(newConvId);
        loadConversation(newConvId);
        loadChatHistory();
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = messageInput.value.trim();
        if (!userMessage) return;

        if (!currentConversationId) {
            currentConversationId = await createNewChat();
        }

        addMessage(userMessage, 'user');
        saveMessage(currentConversationId, {
            role: "user",
            text: userMessage,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        messageInput.value = '';
        scrollToBottom();

        db.collection("users").doc(userId).collection("conversations").doc(currentConversationId)
            .get().then(doc => {
                if (doc.exists && doc.data().title === "Percakapan Baru") {
                    const words = userMessage.split(" ");
                    const newTitle = words.slice(0, Math.min(3, words.length)).join(" ");
                    db.collection("users").doc(userId).collection("conversations").doc(currentConversationId)
                        .update({ title: newTitle })
                        .then(() => loadChatHistory())
                        .catch(err => console.error("Gagal update judul:", err));
                }
            });

        const botMessageElement = addMessage('...', 'bot');

        try {
            const response = await fetch('https://apikey-hci1.vercel.app/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });
            const data = await response.json();

            if (data.error) {
                botMessageElement.innerHTML = data.error;
            } else {
                const botResponseHtml = marked.parse(data.response);
                botMessageElement.innerHTML = botResponseHtml;
                document.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
                saveMessage(currentConversationId, {
                    role: "bot",
                    text: data.response,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            botMessageElement.innerHTML = 'Terjadi kesalahan. Silahkan coba lagi.';
        }
        scrollToBottom();
    });

    function saveMessage(conversationId, messageObj) {
        db.collection("users").doc(userId).collection("conversations")
            .doc(conversationId)
            .collection("messages")
            .add(messageObj)
            .catch((error) => {
                console.error("Error saving message: ", error);
            });
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        if (sender === 'bot') {
            messageDiv.innerHTML = text;
        } else {
            messageDiv.textContent = text;
        }
        chatBox.appendChild(messageDiv);
        return messageDiv;
    }

    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    hideSidebarBtn.addEventListener('click', () => {
        sidebar.style.display = 'none';
        showSidebarBtn.style.display = 'block';
    });

    showSidebarBtn.addEventListener('click', () => {
        sidebar.style.display = 'flex';
        showSidebarBtn.style.display = 'none';
    });

    function addChatHistoryItem(title, conversationId) {
        const existingItem = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (existingItem) {
            existingItem.textContent = title;
            return;
        }
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.textContent = title;
        chatItem.dataset.conversationId = conversationId;
        chatHistory.appendChild(chatItem);

        chatItem.addEventListener('click', () => {
            currentConversationId = conversationId;
            loadConversation(conversationId);
            document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
            chatItem.classList.add('active');
        });
    }

    // Dropdown profile di sudut kanan atas
    const profileContainer = document.getElementById('profile-container');
    const profileDropdown = document.getElementById('profile-dropdown');

    profileContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
        if (!profileContainer.contains(e.target)) {
            profileDropdown.style.display = 'none';
        }
    });

    // Tombol Logout
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                console.log("Logout berhasil");
            })
            .catch((error) => {
                console.error("Gagal logout:", error);
            });
    });

    // Tombol Unduh Aplikasi dan Tentang
    const downloadAppBtn = document.getElementById('download-app-btn');
    const aboutBtn = document.getElementById('about-btn');

    downloadAppBtn.addEventListener('click', () => {
        alert("Fitur ini belum tersedia");
        // Contoh: window.open('/download.html', '_blank');
    });

    aboutBtn.addEventListener('click', () => {
        alert("Fitur ini belum tersedia");
        // Contoh: window.open('/about.html', '_blank');
    });
});
