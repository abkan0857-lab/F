// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const contactLink = document.getElementById('contact-link');
const promoVideo = document.getElementById('promo-video');
const balanceAmount = document.getElementById('balance-amount');
const topUpBtn = document.getElementById('top-up-btn');
const topUpModal = document.getElementById('top-up-modal');
const closeTopupModal = document.getElementById('close-topup-modal');
const topupAmount = document.getElementById('topup-amount');
const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
const paymentInfo = document.getElementById('payment-info');
const confirmTopup = document.getElementById('confirm-topup');
const targetInput = document.getElementById('target-input');
const initiateBtn = document.getElementById('initiate-btn');
const progressSection = document.getElementById('progress-section');
const progressBar = document.getElementById('progress-bar');
const progressMessages = document.getElementById('progress-messages');
const resultsSection = document.getElementById('results-section');
const resultEmail = document.getElementById('result-email');
const resultPassword = document.getElementById('result-password');
const resultMethod = document.getElementById('result-method');
const resultGame = document.getElementById('result-game');
const showPasswordBtn = document.getElementById('show-password-btn');
const passwordModal = document.getElementById('password-modal');
const passwordModalText = document.getElementById('password-modal-text');
const cancelPassword = document.getElementById('cancel-password');
const confirmPasswordBtn = document.getElementById('confirm-password');

// Game and Login Method Data
const games = [
    { id: 'freefire', name: 'Free Fire', icon: 'cpu' },
    { id: 'mlbb', name: 'Mobile Legends', icon: 'zap' },
    { id: 'cod', name: 'Call of Duty', icon: 'target' },
    { id: 'pubg', name: 'PUBG', icon: 'crosshair' },
    { id: 'honorofkings', name: 'Honor of Kings', icon: 'award' },
    { id: 'roblox', name: 'Roblox', icon: 'box' },
    { id: 'deltaforce', name: 'Delta Force', icon: 'shield' },
    { id: 'efootball', name: 'eFootball', icon: 'flag' },
    { id: 'bloodstrike', name: 'Blood Strike', icon: 'droplet' },
    { id: 'arenabreakout', name: 'Arena Breakout', icon: 'map' },
    { id: 'hotelhideaway', name: 'Hotel Hideaway', icon: 'home' },
    { id: 'amongus', name: 'Among Us', icon: 'users' }
];

const loginMethods = [
    { id: 'google', name: 'Google', icon: 'mail' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook' },
    { id: 'garena', name: 'Garena', icon: 'globe' },
    { id: 'konami', name: 'Konami', icon: 'key' },
    { id: 'infinite', name: 'Infinite', icon: 'infinity' },
    { id: 'twitter', name: 'Twitter', icon: 'twitter' },
    { id: 'moonton', name: 'Moonton', icon: 'moon' },
    { id: 'apple', name: 'Apple', icon: 'apple' }
];

// App State
let state = {
    balance: 0,
    selectedGame: null,
    selectedMethod: null,
    selectedTime: null,
    passwordVisible: false,
    passwordAttempts: 0,
    currentPassword: '',
    currentEmail: '',
    isProcessing: false
};

// Initialize the app
function init() {
    // Set video source from config
    promoVideo.src = CONFIG.VIDEO_URL;
    
    // Set contact link
    contactLink.href = CONFIG.CONTACT_URL;
    
    // Load balance from localStorage or set default
    state.balance = parseInt(localStorage.getItem('balance')) || 0;
    updateBalanceDisplay();
    
    // Populate games
    const gameContainer = document.querySelector('#app-container .grid-cols-3:nth-of-type(1)');
    games.forEach(game => {
        const gameBtn = document.createElement('button');
        gameBtn.className = 'game-card bg-gray-700 rounded-lg p-2 flex flex-col items-center hover:bg-gray-600 transition-colors';
        gameBtn.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-violet-900/30 flex items-center justify-center text-violet-400 mb-1">
                <i data-feather="${game.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-xs text-center">${game.name}</span>
        `;
        gameBtn.addEventListener('click', () => selectGame(game.id));
        gameContainer.appendChild(gameBtn);
    });
    
    // Populate login methods
    const methodContainer = document.querySelector('#app-container .grid-cols-6');
    loginMethods.forEach(method => {
        const methodBtn = document.createElement('button');
        methodBtn.className = 'method-card bg-gray-700 rounded-lg p-2 flex flex-col items-center hover:bg-gray-600 transition-colors';
        methodBtn.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-violet-900/30 flex items-center justify-center text-violet-400 mb-1">
                <i data-feather="${method.icon}" class="w-5 h-5"></i>
            </div>
            <span class="text-xs text-center">${method.method}</span>
        `;
        methodBtn.addEventListener('click', () => selectMethod(method.id));
        methodContainer.appendChild(methodBtn);
    });
    
    // Set up event listeners
    setupEventListeners();
    // Transition to login screen after 3 seconds if video doesn't load
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    }, 3000);

    // Also try to play video and transition if it loads
    promoVideo.onended = () => {
        loadingScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    };
// Initialize feather icons
    feather.replace();
}

// Set up event listeners
function setupEventListeners() {
    // Login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Validate credentials
        const isValid = CREDENTIALS.some(cred => 
            cred.username === username && cred.password === password
        );
        
        if (isValid) {
            loginScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
        } else {
            alert('Invalid username or password');
        }
    });
    
    // Top up button
    topUpBtn.addEventListener('click', () => {
        topUpModal.classList.remove('hidden');
    });
    
    // Close top up modal
    closeTopupModal.addEventListener('click', () => {
        topUpModal.classList.add('hidden');
        resetPaymentInfo();
    });
    
    // Payment method selection
    paymentMethodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const method = btn.dataset.method;
            showPaymentInfo(method);
        });
    });
    
    // Confirm top up
    confirmTopup.addEventListener('click', () => {
        const amount = parseInt(topupAmount.value);
        if (amount >= CONFIG.MIN_TOPUP) {
            state.balance += amount;
            updateBalanceDisplay();
            localStorage.setItem('balance', state.balance.toString());
            topUpModal.classList.add('hidden');
            resetPaymentInfo();
            alert(`Successfully topped up Rp ${amount.toLocaleString()}`);
        } else {
            alert(`Minimum top up is Rp ${CONFIG.MIN_TOPUP.toLocaleString()}`);
        }
    });
    
    // Time selection
    document.querySelectorAll('input[name="time-option"]').forEach(input => {
        input.addEventListener('change', (e) => {
            state.selectedTime = e.target.value;
            checkInitiateButton();
        });
    });
    
    // Target input validation
    targetInput.addEventListener('input', () => {
        checkInitiateButton();
    });
    
    // Initiate hacking process
    initiateBtn.addEventListener('click', startHackingProcess);
    
    // Show password button
    showPasswordBtn.addEventListener('click', handleShowPassword);
    
    // Password modal buttons
    cancelPassword.addEventListener('click', () => {
        passwordModal.classList.add('hidden');
    });
    
    confirmPasswordBtn.addEventListener('click', () => {
        handlePasswordPayment();
    });
}

// Game and method selection
function selectGame(gameId) {
    state.selectedGame = games.find(g => g.id === gameId).name;
    checkInitiateButton();
    // Update UI to show selected game
    document.querySelectorAll('.game-card').forEach(card => {
        if (card.querySelector('span').textContent === state.selectedGame) {
            card.classList.add('glow', 'border-violet-500');
        } else {
            card.classList.remove('glow', 'border-violet-500');
        }
    });
}

function selectMethod(methodId) {
    state.selectedMethod = loginMethods.find(m => m.id === methodId).name;
    checkInitiateButton();
    // Update UI to show selected method
    document.querySelectorAll('.method-card').forEach(card => {
        if (card.querySelector('span').textContent === state.selectedMethod) {
            card.classList.add('glow', 'border-violet-500');
        } else {
            card.classList.remove('glow', 'border-violet-500');
        }
    });
}

// Check if initiate button should be enabled
function checkInitiateButton() {
    const hasTarget = targetInput.value.trim() !== '';
    const hasGame = state.selectedGame !== null;
    const hasMethod = state.selectedMethod !== null;
    const hasTime = state.selectedTime !== null;
    
    initiateBtn.disabled = !(hasTarget && hasGame && hasMethod && hasTime);
}

// Update balance display
function updateBalanceDisplay() {
    balanceAmount.textContent = state.balance.toLocaleString();
}

// Show payment information
function showPaymentInfo(method) {
    // Hide all payment info first
    document.querySelectorAll('#payment-info > div').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Show selected method
    document.getElementById(`${method}-info`).classList.remove('hidden');
    paymentInfo.classList.remove('hidden');
}

// Reset payment information
function resetPaymentInfo() {
    paymentInfo.classList.add('hidden');
    document.querySelectorAll('#payment-info > div').forEach(el => {
        el.classList.add('hidden');
    });
}

// Start hacking process
function startHackingProcess() {
    if (state.isProcessing) return;
    
    const cost = state.selectedTime === '1h' ? CONFIG.PRICE_1H : CONFIG.PRICE_7H;
    
    if (state.balance >= cost) {
        state.balance -= cost;
        updateBalanceDisplay();
        localStorage.setItem('balance', state.balance.toString());
        
        // Generate fake results
        const username = targetInput.value.trim();
        const domain = ['@gmail.com', '@yahoo.com', '@hotmail.com'][Math.floor(Math.random() * 3)];
        state.currentEmail = username + domain;
        state.currentPassword = generateRandomPassword();
        
        // Show processing section
        progressSection.classList.remove('hidden');
        initiateBtn.disabled = true;
        state.isProcessing = true;
        
        // Start progress animation
        simulateProgress();
    } else {
        alert('Insufficient balance. Please top up.');
    }
}

// Simulate progress
function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            processComplete();
        }
        
        progressBar.style.width = `${progress}%`;
        
        // Add random progress messages
        if (Math.random() > 0.7) {
            addProgressMessage();
        }
    }, 500);
}

// Add progress message
function addProgressMessage() {
    const messages = [
        "Analyzing account patterns...",
        "Bypassing security protocols...",
        "Establishing connection to target...",
        "Decrypting login credentials...",
        "Mapping account vectors...",
        "Initiating heuristic simulation...",
        "Prioritizing high-value targets...",
        "Compiling access pathways...",
        "Finalizing data extraction...",
        "Verifying account details..."
    ];
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    const messageEl = document.createElement('div');
    messageEl.className = 'progress-message text-sm';
    messageEl.innerHTML = `<span class="progress-time">[${timeStr}]</span>${message}`;
    
    progressMessages.appendChild(messageEl);
    progressMessages.scrollTop = progressMessages.scrollHeight;
}

// Process complete
function processComplete() {
    state.isProcessing = false;
    
    // Show results
    progressSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    // Display results
    resultEmail.textContent = state.currentEmail;
    resultMethod.textContent = state.selectedMethod;
    resultGame.textContent = state.selectedGame;
    
    // Reset selections
    state.selectedGame = null;
    state.selectedMethod = null;
    state.selectedTime = null;
    targetInput.value = '';
    checkInitiateButton();
}

// Handle show password
function handleShowPassword() {
    if (state.passwordVisible) {
        // Hide password
        resultPassword.textContent = '••••••••';
        state.passwordVisible = false;
        showPasswordBtn.innerHTML = '<i data-feather="eye" class="w-5 h-5"></i>';
        feather.replace();
    } else {
        // Show payment modal based on attempts
        state.passwordAttempts++;
        
        if (state.passwordAttempts === 1) {
            passwordModalText.textContent = "Please pay Rp 30,000 for account security fee. If not paid, the account will be canceled.";
            passwordModal.classList.remove('hidden');
        } else if (state.passwordAttempts === 2) {
            passwordModalText.textContent = "Please pay Rp 50,000 for admin and server fees. If not paid, the account will be suspended.";
            passwordModal.classList.remove('hidden');
        } else {
            passwordModalText.textContent = "No payment history found. Please make the payment again. If already paid, Rp 50,000 will be refunded.";
            passwordModal.classList.remove('hidden');
        }
    }
}

// Handle password payment
function handlePasswordPayment() {
    const cost = state.passwordAttempts === 1 ? 30000 : 50000;
    
    if (state.balance >= cost) {
        state.balance -= cost;
        updateBalanceDisplay();
        localStorage.setItem('balance', state.balance.toString());
        
        // Show password
        resultPassword.textContent = state.currentPassword;
        state.passwordVisible = true;
        showPasswordBtn.innerHTML = '<i data-feather="eye-off" class="w-5 h-5"></i>';
        feather.replace();
        
        passwordModal.classList.add('hidden');
    } else {
        alert('Insufficient balance. Please top up.');
        passwordModal.classList.add('hidden');
    }
}

// Generate random password
function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
    // Initialize the app when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Try to play video but don't wait for it
        promoVideo.play().catch(() => {
            console.log('Video autoplay failed, continuing to login');
        });
        init();
    });
