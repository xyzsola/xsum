document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const aiModelRadios = document.querySelectorAll('input[name="aiModel"]');
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    const apiKeyInput = document.getElementById('apiKey');
    const toggleApiKeyBtn = document.getElementById('toggleApiKey');
    const validateBtn = document.getElementById('validateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    const autoSummaryCheckbox = document.getElementById('autoSummary');
    const saveHistoryCheckbox = document.getElementById('saveHistory');

    // Load current settings
    loadSettings();

    // Event listeners
    toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
    validateBtn.addEventListener('click', validateApiKey);
    saveBtn.addEventListener('click', saveSettings);
    cancelBtn.addEventListener('click', closeSettings);
    resetBtn.addEventListener('click', resetToDefaults);
    
    aiModelRadios.forEach(radio => {
        radio.addEventListener('change', onAiModelChange);
    });
    
    themeRadios.forEach(radio => {
        radio.addEventListener('change', onThemeChange);
    });
    
    apiKeyInput.addEventListener('input', onApiKeyInput);

    async function loadSettings() {
        try {
            const settings = await chrome.storage.sync.get([
                'aiModel', 'apiKey', 'theme', 'autoSummary', 'saveHistory'
            ]);
            
            // Set AI model
            const aiModel = settings.aiModel || 'openai';
            document.querySelector(`input[name="aiModel"][value="${aiModel}"]`).checked = true;
            
            // Set theme
            const theme = settings.theme || 'light';
            document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
            document.body.setAttribute('data-theme', theme);
            
            // Set API key
            if (settings.apiKey) {
                apiKeyInput.value = settings.apiKey;
                updateApiStatus('saved', 'API Key tersimpan');
            }
            
            // Set advanced options
            autoSummaryCheckbox.checked = settings.autoSummary || false;
            saveHistoryCheckbox.checked = settings.saveHistory || false;
            
        } catch (error) {
            console.error('Error loading settings:', error);
            showError('Gagal memuat pengaturan');
        }
    }

    function toggleApiKeyVisibility() {
        const isPassword = apiKeyInput.type === 'password';
        apiKeyInput.type = isPassword ? 'text' : 'password';
        toggleApiKeyBtn.textContent = isPassword ? '🙈' : '👁️';
        toggleApiKeyBtn.title = isPassword ? 'Sembunyikan API Key' : 'Tampilkan API Key';
    }

    async function validateApiKey() {
        const apiKey = apiKeyInput.value.trim();
        const selectedModel = document.querySelector('input[name="aiModel"]:checked').value;
        
        if (!apiKey) {
            showError('Silakan masukkan API key terlebih dahulu');
            return;
        }
        
        showLoading(true);
        updateApiStatus('validating', 'Memvalidasi...');
        
        try {
            const isValid = await testApiKey(apiKey, selectedModel);
            
            if (isValid) {
                updateApiStatus('valid', 'API Key valid ✓');
                showSuccess('API Key berhasil divalidasi!');
            } else {
                updateApiStatus('invalid', 'API Key tidak valid ✗');
                showError('API Key tidak valid atau tidak memiliki akses');
            }
        } catch (error) {
            console.error('Validation error:', error);
            updateApiStatus('error', 'Error validasi');
            showError('Gagal memvalidasi API Key: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    async function testApiKey(apiKey, model) {
        try {
            if (model === 'openai') {
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                return response.ok;
            } else if (model === 'gemini') {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                return response.ok;
            }
            return false;
        } catch (error) {
            console.error('API test error:', error);
            return false;
        }
    }

    async function saveSettings() {
        try {
            const settings = {
                aiModel: document.querySelector('input[name="aiModel"]:checked').value,
                theme: document.querySelector('input[name="theme"]:checked').value,
                apiKey: apiKeyInput.value.trim(),
                autoSummary: autoSummaryCheckbox.checked,
                saveHistory: saveHistoryCheckbox.checked
            };
            
            if (!settings.apiKey) {
                showError('API key harus diisi');
                return;
            }
            
            showLoading(true);
            
            await chrome.storage.sync.set(settings);
            
            showSuccess('Pengaturan berhasil disimpan!');
            
            // Apply theme immediately
            document.body.setAttribute('data-theme', settings.theme);
            
        } catch (error) {
            console.error('Error saving settings:', error);
            showError('Gagal menyimpan pengaturan');
        } finally {
            showLoading(false);
        }
    }

    function closeSettings() {
        window.close();
    }

    async function resetToDefaults() {
        if (confirm('Apakah Anda yakin ingin mereset semua pengaturan ke default?')) {
            try {
                await chrome.storage.sync.clear();
                
                // Reset form
                document.querySelector('input[name="aiModel"][value="openai"]').checked = true;
                document.querySelector('input[name="theme"][value="light"]').checked = true;
                apiKeyInput.value = '';
                autoSummaryCheckbox.checked = false;
                saveHistoryCheckbox.checked = false;
                
                // Reset theme
                document.body.setAttribute('data-theme', 'light');
                
                // Reset API status
                updateApiStatus('none', 'Belum divalidasi');
                
                showSuccess('Pengaturan berhasil direset ke default');
                
            } catch (error) {
                console.error('Error resetting settings:', error);
                showError('Gagal mereset pengaturan');
            }
        }
    }

    function onAiModelChange() {
        // Reset API status when model changes
        updateApiStatus('none', 'Belum divalidasi');
    }

    function onThemeChange() {
        const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
        document.body.setAttribute('data-theme', selectedTheme);
    }

    function onApiKeyInput() {
        // Reset API status when key changes
        if (apiKeyInput.value.trim() === '') {
            updateApiStatus('none', 'Belum divalidasi');
        } else {
            updateApiStatus('changed', 'Perlu validasi');
        }
    }

    function updateApiStatus(status, text) {
        statusText.textContent = text;
        
        const indicators = {
            'none': '⚪',
            'saved': '💾',
            'changed': '⚠️',
            'validating': '⏳',
            'valid': '✅',
            'invalid': '❌',
            'error': '⚠️'
        };
        
        statusIndicator.textContent = indicators[status] || '⚪';
        statusIndicator.className = `status-indicator ${status}`;
    }

    function showLoading(show) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    function showSuccess(message) {
        successMessage.querySelector('.message-text').textContent = message;
        successMessage.style.display = 'flex';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveSettings();
        } else if (e.key === 'Escape') {
            closeSettings();
        }
    });
});