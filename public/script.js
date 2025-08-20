// Cold Email Generator - Main JavaScript File

class ColdEmailGenerator {
    constructor() {
        this.currentTab = 'generator';
        this.templates = this.loadTemplates();
        this.history = this.loadHistory();
        this.lastGeneratedEmails = [];
        this.maxLabs = 5;
        this.labCount = 1;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTemplatesList();
        this.loadHistoryList();
        this.updateLabControls();
        this.updateRemoveButtons();
        this.showMessage('Welcome! Fill out the form to generate your cold emails.', 'info');
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Form submission
        document.getElementById('emailForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateEmail();
        });

        // Template management
        document.getElementById('saveTemplateBtn').addEventListener('click', () => {
            this.saveTemplate();
        });

        document.getElementById('clearTemplatesBtn').addEventListener('click', () => {
            this.clearAllTemplates();
        });

        // History management
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearAllHistory();
        });

        // Lab management
        document.getElementById('addLabBtn').addEventListener('click', () => {
            this.addLabWebsite();
        });

        // Batch actions
        document.getElementById('copyAllBtn').addEventListener('click', () => {
            this.copyAllEmails();
        });

        document.getElementById('saveAllBtn').addEventListener('click', () => {
            this.saveAllToHistory();
        });

        // Email result actions (legacy - keep for backward compatibility)
        const copyEmailBtn = document.getElementById('copyEmailBtn');
        if (copyEmailBtn) {
            copyEmailBtn.addEventListener('click', () => {
                this.copyEmail();
            });
        }

        const saveHistoryBtn = document.getElementById('saveHistoryBtn');
        if (saveHistoryBtn) {
            saveHistoryBtn.addEventListener('click', () => {
                this.saveToHistory();
            });
        }
    }

    // Lab Management Methods
    addLabWebsite() {
        if (this.labCount >= this.maxLabs) {
            this.showMessage(`Maximum ${this.maxLabs} labs allowed`, 'error');
            return;
        }

        this.labCount++;
        const container = document.getElementById('labWebsitesContainer');

        const labGroup = document.createElement('div');
        labGroup.className = 'lab-website-group';
        labGroup.innerHTML = `
            <label for="lab_website_${this.labCount}">Lab Website ${this.labCount} *</label>
            <div class="input-group">
                <input type="url" id="lab_website_${this.labCount}" name="lab_website_${this.labCount}" required
                       placeholder="https://example.com/lab">
                <button type="button" class="btn btn-danger btn-small remove-lab">×</button>
            </div>
        `;

        container.appendChild(labGroup);

        // Add event listener to remove button
        const removeBtn = labGroup.querySelector('.remove-lab');
        removeBtn.addEventListener('click', () => {
            this.removeLabWebsite(labGroup);
        });

        this.updateLabControls();
        this.updateRemoveButtons();
    }

    removeLabWebsite(labGroup) {
        labGroup.remove();
        this.labCount--;
        this.renumberLabWebsites();
        this.updateLabControls();
        this.updateRemoveButtons();
    }

    renumberLabWebsites() {
        const labGroups = document.querySelectorAll('.lab-website-group');
        labGroups.forEach((group, index) => {
            const number = index + 1;
            const label = group.querySelector('label');
            const input = group.querySelector('input');

            label.textContent = `Lab Website ${number} *`;
            label.setAttribute('for', `lab_website_${number}`);
            input.id = `lab_website_${number}`;
            input.name = `lab_website_${number}`;
        });
        this.labCount = labGroups.length;
    }

    updateLabControls() {
        const addBtn = document.getElementById('addLabBtn');
        const labCount = document.querySelector('.lab-count');

        addBtn.disabled = this.labCount >= this.maxLabs;
        labCount.textContent = `${this.labCount} / ${this.maxLabs} labs`;
    }

    updateRemoveButtons() {
        const removeButtons = document.querySelectorAll('.remove-lab');
        removeButtons.forEach(btn => {
            btn.style.display = this.labCount > 1 ? 'flex' : 'none';
        });
    }

    getLabWebsites() {
        const websites = [];
        for (let i = 1; i <= this.labCount; i++) {
            const input = document.getElementById(`lab_website_${i}`);
            if (input && input.value.trim()) {
                websites.push({
                    url: input.value.trim(),
                    index: i
                });
            }
        }
        return websites;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Refresh lists when switching to templates or history
        if (tabName === 'templates') {
            this.loadTemplatesList();
        } else if (tabName === 'history') {
            this.loadHistoryList();
        }
    }

    async generateEmail() {
        const personalData = this.getPersonalInfoData();
        const labWebsites = this.getLabWebsites();

        // Validate personal information
        const requiredPersonalFields = ['name', 'school', 'grade', 'major', 'academic_background'];
        const missingPersonalFields = requiredPersonalFields.filter(field => !personalData[field]);

        if (missingPersonalFields.length > 0) {
            this.showMessage(`Please fill in all required personal information: ${missingPersonalFields.join(', ')}`, 'error');
            return;
        }

        // Validate lab websites
        if (labWebsites.length === 0) {
            this.showMessage('Please add at least one lab website', 'error');
            return;
        }

        // Remove duplicates
        const uniqueWebsites = this.removeDuplicateWebsites(labWebsites);
        if (uniqueWebsites.length !== labWebsites.length) {
            this.showMessage(`Removed ${labWebsites.length - uniqueWebsites.length} duplicate lab website(s)`, 'info');
        }

        // Show loading indicator
        this.showLoading(true, uniqueWebsites.length);
        this.hideEmailResults();

        try {
            this.lastGeneratedEmails = [];
            const results = [];

            // Generate emails for each lab
            for (let i = 0; i < uniqueWebsites.length; i++) {
                const lab = uniqueWebsites[i];
                this.updateProgress(i + 1, uniqueWebsites.length, lab.url);

                try {
                    const formData = {
                        ...personalData,
                        lab_website: lab.url
                    };

                    const response = await fetch('/api/generate-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData)
                    });

                    const result = await response.json();

                    if (result.success) {
                        const emailResult = {
                            labUrl: lab.url,
                            email: result.email,
                            status: 'success',
                            timestamp: new Date().toISOString(),
                            formData: formData
                        };
                        results.push(emailResult);
                        this.lastGeneratedEmails.push(emailResult);
                    } else {
                        throw new Error(result.error || 'Failed to generate email');
                    }
                } catch (error) {
                    console.error(`Error generating email for ${lab.url}:`, error);
                    const emailResult = {
                        labUrl: lab.url,
                        email: null,
                        status: 'error',
                        error: error.message,
                        timestamp: new Date().toISOString(),
                        formData: { ...personalData, lab_website: lab.url }
                    };
                    results.push(emailResult);
                }
            }

            // Display results
            this.displayEmailResults(results);

            const successCount = results.filter(r => r.status === 'success').length;
            const errorCount = results.filter(r => r.status === 'error').length;

            if (errorCount === 0) {
                this.showMessage(`All ${successCount} emails generated successfully!`, 'success');
            } else if (successCount === 0) {
                this.showMessage(`Failed to generate all emails`, 'error');
            } else {
                this.showMessage(`Generated ${successCount} emails successfully, ${errorCount} failed`, 'warning');
            }

        } catch (error) {
            console.error('Error in batch email generation:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    removeDuplicateWebsites(websites) {
        const seen = new Set();
        return websites.filter(lab => {
            const normalizedUrl = this.normalizeUrl(lab.url);
            if (seen.has(normalizedUrl)) {
                return false;
            }
            seen.add(normalizedUrl);
            return true;
        });
    }

    normalizeUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.toLowerCase() + urlObj.pathname.toLowerCase();
        } catch {
            return url.toLowerCase();
        }
    }

    updateProgress(current, total, currentLab) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressFill && progressText) {
            const percentage = (current / total) * 100;
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `Generating email ${current} of ${total} for ${this.shortenUrl(currentLab)}...`;
        }
    }

    shortenUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return url.length > 30 ? url.substring(0, 30) + '...' : url;
        }
    }

    getFormData() {
        const form = document.getElementById('emailForm');
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            data[key] = value.trim();
        }

        return data;
    }

    getPersonalInfoData() {
        const form = document.getElementById('emailForm');
        const formData = new FormData(form);
        const data = {};

        // Only include personal information fields (exclude lab_website)
        const personalInfoFields = ['name', 'school', 'grade', 'major', 'academic_background', 'research_experience', 'skill', 'interest_area'];

        for (let [key, value] of formData.entries()) {
            if (personalInfoFields.includes(key)) {
                data[key] = value.trim();
            }
        }

        return data;
    }

    displayEmailResults(results) {
        const resultsContainer = document.getElementById('emailResults');
        const resultsList = document.getElementById('emailResultsList');
        const resultsTitle = document.getElementById('resultsTitle');

        // Update title
        const successCount = results.filter(r => r.status === 'success').length;
        resultsTitle.textContent = `Generated Emails (${successCount}/${results.length} successful)`;

        // Clear previous results
        resultsList.innerHTML = '';

        // Create result items
        results.forEach((result, index) => {
            const resultItem = this.createEmailResultItem(result, index);
            resultsList.appendChild(resultItem);
        });

        // Show results container
        resultsContainer.classList.remove('hidden');
    }

    createEmailResultItem(result, index) {
        const item = document.createElement('div');
        item.className = 'email-result-item';

        const statusClass = result.status === 'success' ? 'status-success' : 'status-error';
        const statusText = result.status === 'success' ? 'Success' : 'Failed';
        const statusIcon = result.status === 'success' ? '✅' : '❌';

        item.innerHTML = `
            <div class="email-result-header">
                <div class="lab-info">
                    <span class="lab-icon">🧪</span>
                    <span class="lab-url">${this.escapeHtml(result.labUrl)}</span>
                </div>
                <span class="email-status ${statusClass}">${statusIcon} ${statusText}</span>
            </div>
            <div class="email-result-content">
                ${result.status === 'success'
                    ? `<pre>${this.escapeHtml(result.email)}</pre>`
                    : `<p class="error-message">Error: ${this.escapeHtml(result.error)}</p>`
                }
            </div>
            <div class="email-result-actions">
                ${result.status === 'success'
                    ? `<button class="btn btn-primary btn-small copy-single-btn" data-index="${index}">Copy</button>
                       <button class="btn btn-secondary btn-small save-single-btn" data-index="${index}">Save to History</button>`
                    : `<button class="btn btn-secondary btn-small retry-btn" data-index="${index}">Retry</button>`
                }
            </div>
        `;

        // Add event listeners
        if (result.status === 'success') {
            const copyBtn = item.querySelector('.copy-single-btn');
            const saveBtn = item.querySelector('.save-single-btn');

            copyBtn.addEventListener('click', () => this.copySingleEmail(index));
            saveBtn.addEventListener('click', () => this.saveSingleToHistory(index));
        } else {
            const retryBtn = item.querySelector('.retry-btn');
            retryBtn.addEventListener('click', () => this.retrySingleEmail(index));
        }

        return item;
    }

    displayEmailResult(email) {
        // Legacy method - keep for backward compatibility
        const emailText = document.getElementById('emailText');
        const emailResult = document.getElementById('emailResult');

        if (emailText && emailResult) {
            emailText.textContent = email;
            emailResult.classList.remove('hidden');
        }

        // Store the generated email for saving to history
        this.lastGeneratedEmail = {
            email: email,
            formData: this.getFormData(),
            timestamp: new Date().toISOString()
        };
    }

    showLoading(show, totalLabs = 1) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const loadingText = document.getElementById('loadingText');
        const progressInfo = document.getElementById('progressInfo');

        if (show) {
            loadingIndicator.classList.remove('hidden');
            if (totalLabs > 1) {
                loadingText.textContent = `Generating emails for ${totalLabs} labs...`;
                progressInfo.classList.remove('hidden');
            } else {
                loadingText.textContent = 'Generating your email...';
                progressInfo.classList.add('hidden');
            }
        } else {
            loadingIndicator.classList.add('hidden');
            progressInfo.classList.add('hidden');
        }
    }

    hideEmailResults() {
        const emailResults = document.getElementById('emailResults');
        const emailResult = document.getElementById('emailResult');

        if (emailResults) emailResults.classList.add('hidden');
        if (emailResult) emailResult.classList.add('hidden');
    }

    // Batch Operations
    copyAllEmails() {
        const successfulEmails = this.lastGeneratedEmails.filter(result => result.status === 'success');
        if (successfulEmails.length === 0) {
            this.showMessage('No successful emails to copy', 'error');
            return;
        }

        const allEmailsText = successfulEmails.map(result => {
            return `=== Email for ${result.labUrl} ===\n\n${result.email}\n\n`;
        }).join('\n');

        navigator.clipboard.writeText(allEmailsText).then(() => {
            this.showMessage(`Copied ${successfulEmails.length} emails to clipboard!`, 'success');
        }).catch(err => {
            console.error('Failed to copy emails:', err);
            this.showMessage('Failed to copy emails to clipboard', 'error');
        });
    }

    saveAllToHistory() {
        const successfulEmails = this.lastGeneratedEmails.filter(result => result.status === 'success');
        if (successfulEmails.length === 0) {
            this.showMessage('No successful emails to save', 'error');
            return;
        }

        try {
            successfulEmails.forEach(result => {
                const historyItem = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    email: result.email,
                    formData: result.formData,
                    timestamp: result.timestamp,
                    labUrl: result.labUrl
                };
                this.history.unshift(historyItem);
            });

            this.saveHistory();
            this.showMessage(`Saved ${successfulEmails.length} emails to history!`, 'success');

            // Update history list if currently viewing history tab
            if (this.currentTab === 'history') {
                this.loadHistoryList();
            }
        } catch (error) {
            console.error('Error saving to history:', error);
            this.showMessage('Failed to save emails to history', 'error');
        }
    }

    copySingleEmail(index) {
        const result = this.lastGeneratedEmails[index];
        if (result && result.status === 'success') {
            navigator.clipboard.writeText(result.email).then(() => {
                this.showMessage('Email copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Failed to copy email:', err);
                this.showMessage('Failed to copy email to clipboard', 'error');
            });
        }
    }

    saveSingleToHistory(index) {
        const result = this.lastGeneratedEmails[index];
        if (result && result.status === 'success') {
            try {
                const historyItem = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    email: result.email,
                    formData: result.formData,
                    timestamp: result.timestamp,
                    labUrl: result.labUrl
                };

                this.history.unshift(historyItem);
                this.saveHistory();
                this.showMessage('Email saved to history!', 'success');

                // Update history list if currently viewing history tab
                if (this.currentTab === 'history') {
                    this.loadHistoryList();
                }
            } catch (error) {
                console.error('Error saving to history:', error);
                this.showMessage('Failed to save email to history', 'error');
            }
        }
    }

    async retrySingleEmail(index) {
        const result = this.lastGeneratedEmails[index];
        if (!result) return;

        // Update UI to show loading for this specific item
        const resultItem = document.querySelectorAll('.email-result-item')[index];
        const statusElement = resultItem.querySelector('.email-status');
        const contentElement = resultItem.querySelector('.email-result-content');
        const actionsElement = resultItem.querySelector('.email-result-actions');

        statusElement.className = 'email-status status-loading';
        statusElement.innerHTML = '🔄 Retrying...';
        contentElement.innerHTML = '<p>Retrying email generation...</p>';
        actionsElement.innerHTML = '';

        try {
            const response = await fetch('/api/generate-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(result.formData)
            });

            const apiResult = await response.json();

            if (apiResult.success) {
                // Update the result in memory
                this.lastGeneratedEmails[index] = {
                    ...result,
                    email: apiResult.email,
                    status: 'success',
                    timestamp: new Date().toISOString()
                };

                // Update UI
                statusElement.className = 'email-status status-success';
                statusElement.innerHTML = '✅ Success';
                contentElement.innerHTML = `<pre>${this.escapeHtml(apiResult.email)}</pre>`;
                actionsElement.innerHTML = `
                    <button class="btn btn-primary btn-small copy-single-btn" data-index="${index}">Copy</button>
                    <button class="btn btn-secondary btn-small save-single-btn" data-index="${index}">Save to History</button>
                `;

                // Re-add event listeners
                const copyBtn = actionsElement.querySelector('.copy-single-btn');
                const saveBtn = actionsElement.querySelector('.save-single-btn');
                copyBtn.addEventListener('click', () => this.copySingleEmail(index));
                saveBtn.addEventListener('click', () => this.saveSingleToHistory(index));

                this.showMessage('Email generated successfully!', 'success');
            } else {
                throw new Error(apiResult.error || 'Failed to generate email');
            }
        } catch (error) {
            console.error('Error retrying email generation:', error);

            // Update UI to show error
            statusElement.className = 'email-status status-error';
            statusElement.innerHTML = '❌ Failed';
            contentElement.innerHTML = `<p class="error-message">Error: ${this.escapeHtml(error.message)}</p>`;
            actionsElement.innerHTML = `<button class="btn btn-secondary btn-small retry-btn" data-index="${index}">Retry</button>`;

            // Re-add retry event listener
            const retryBtn = actionsElement.querySelector('.retry-btn');
            retryBtn.addEventListener('click', () => this.retrySingleEmail(index));

            this.showMessage(`Retry failed: ${error.message}`, 'error');
        }
    }

    copyEmail() {
        const emailText = document.getElementById('emailText').textContent;
        navigator.clipboard.writeText(emailText).then(() => {
            this.showMessage('Email copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy email:', err);
            this.showMessage('Failed to copy email to clipboard', 'error');
        });
    }

    saveToHistory() {
        if (!this.lastGeneratedEmail) {
            this.showMessage('No email to save', 'error');
            return;
        }

        const historyItem = {
            id: Date.now().toString(),
            ...this.lastGeneratedEmail
        };

        this.history.unshift(historyItem);
        this.saveHistory();
        this.showMessage('Email saved to history!', 'success');
        
        // Update history list if currently viewing history tab
        if (this.currentTab === 'history') {
            this.loadHistoryList();
        }
    }

    saveTemplate() {
        const personalInfoData = this.getPersonalInfoData();
        const templateName = prompt('Enter a name for this personal information:');

        if (!templateName) {
            return;
        }

        if (templateName.trim() === '') {
            this.showMessage('Personal information name cannot be empty', 'error');
            return;
        }

        const template = {
            id: Date.now().toString(),
            name: templateName.trim(),
            data: personalInfoData,
            created: new Date().toISOString()
        };

        this.templates.push(template);
        this.saveTemplates();
        this.showMessage(`Personal information "${templateName}" saved successfully!`, 'success');

        // Update templates list if currently viewing templates tab
        if (this.currentTab === 'templates') {
            this.loadTemplatesList();
        }
    }

    loadTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) {
            this.showMessage('Template not found', 'error');
            return;
        }

        // Fill form with template data
        const form = document.getElementById('emailForm');
        Object.keys(template.data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = template.data[key] || '';
            }
        });

        // Switch to generator tab
        this.switchTab('generator');
        this.showMessage(`Template "${template.name}" loaded successfully!`, 'success');
    }

    deleteTemplate(templateId) {
        if (!confirm('Are you sure you want to delete this template?')) {
            return;
        }

        this.templates = this.templates.filter(t => t.id !== templateId);
        this.saveTemplates();
        this.loadTemplatesList();
        this.showMessage('Personal information deleted successfully!', 'success');
    }

    deleteHistoryItem(historyId) {
        if (!confirm('Are you sure you want to delete this history item?')) {
            return;
        }

        this.history = this.history.filter(h => h.id !== historyId);
        this.saveHistory();
        this.loadHistoryList();
        this.showMessage('History item deleted successfully!', 'success');
    }

    clearAllTemplates() {
        if (!confirm('Are you sure you want to delete all templates? This action cannot be undone.')) {
            return;
        }

        this.templates = [];
        this.saveTemplates();
        this.loadTemplatesList();
        this.showMessage('All personal information cleared successfully!', 'success');
    }

    clearAllHistory() {
        if (!confirm('Are you sure you want to delete all history? This action cannot be undone.')) {
            return;
        }

        this.history = [];
        this.saveHistory();
        this.loadHistoryList();
        this.showMessage('All history cleared successfully!', 'success');
    }

    // Local Storage Methods
    loadTemplates() {
        try {
            const templates = localStorage.getItem('coldEmailTemplates');
            return templates ? JSON.parse(templates) : [];
        } catch (error) {
            console.error('Error loading templates:', error);
            return [];
        }
    }

    saveTemplates() {
        try {
            localStorage.setItem('coldEmailTemplates', JSON.stringify(this.templates));
        } catch (error) {
            console.error('Error saving templates:', error);
            this.showMessage('Failed to save template', 'error');
        }
    }

    loadHistory() {
        try {
            const history = localStorage.getItem('coldEmailHistory');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    saveHistory() {
        try {
            // Keep only the last 50 history items to prevent storage overflow
            if (this.history.length > 50) {
                this.history = this.history.slice(0, 50);
            }
            localStorage.setItem('coldEmailHistory', JSON.stringify(this.history));
        } catch (error) {
            console.error('Error saving history:', error);
            this.showMessage('Failed to save to history', 'error');
        }
    }

    // UI Rendering Methods
    loadTemplatesList() {
        const templatesList = document.getElementById('templatesList');

        if (this.templates.length === 0) {
            templatesList.innerHTML = `
                <div class="empty-state">
                    <h4>No Personal Information Saved</h4>
                    <p>Save your first personal information by filling out the form and clicking "Save Personal Information"</p>
                </div>
            `;
            return;
        }

        templatesList.innerHTML = this.templates.map(template => `
            <div class="template-item">
                <div class="template-header">
                    <div class="template-name">${this.escapeHtml(template.name)}</div>
                    <div class="template-actions">
                        <button class="btn btn-primary btn-small" onclick="app.loadTemplate('${template.id}')">
                            Load
                        </button>
                        <button class="btn btn-danger btn-small" onclick="app.deleteTemplate('${template.id}')">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="template-info">
                    <p><strong>Name:</strong> ${this.escapeHtml(template.data.name || 'N/A')}</p>
                    <p><strong>School:</strong> ${this.escapeHtml(template.data.school || 'N/A')}</p>
                    <p><strong>Major:</strong> ${this.escapeHtml(template.data.major || 'N/A')}</p>
                    <p><strong>Created:</strong> ${this.formatDate(template.created)}</p>
                </div>
            </div>
        `).join('');
    }

    loadHistoryList() {
        const historyList = document.getElementById('historyList');

        if (this.history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <h4>No History Available</h4>
                    <p>Generate your first email to see it appear in history</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <div class="history-header-item">
                    <div class="history-date">${this.formatDate(item.timestamp)}</div>
                    <div class="history-actions">
                        <button class="btn btn-secondary btn-small" onclick="app.copyHistoryEmail('${item.id}')">
                            Copy
                        </button>
                        <button class="btn btn-primary btn-small" onclick="app.loadHistoryTemplate('${item.id}')">
                            Load Data
                        </button>
                        <button class="btn btn-danger btn-small" onclick="app.deleteHistoryItem('${item.id}')">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="history-preview">
                    <p><strong>For:</strong> ${this.escapeHtml(item.formData.name || 'N/A')} - ${this.escapeHtml(item.formData.school || 'N/A')}</p>
                    <p><strong>Lab:</strong> ${this.escapeHtml(item.formData.lab_website || 'N/A')}</p>
                    <p><strong>Email Preview:</strong> ${this.escapeHtml(item.email.substring(0, 100))}...</p>
                </div>
            </div>
        `).join('');
    }

    copyHistoryEmail(historyId) {
        const historyItem = this.history.find(h => h.id === historyId);
        if (!historyItem) {
            this.showMessage('History item not found', 'error');
            return;
        }

        navigator.clipboard.writeText(historyItem.email).then(() => {
            this.showMessage('Email copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy email:', err);
            this.showMessage('Failed to copy email to clipboard', 'error');
        });
    }

    loadHistoryTemplate(historyId) {
        const historyItem = this.history.find(h => h.id === historyId);
        if (!historyItem) {
            this.showMessage('History item not found', 'error');
            return;
        }

        // Fill form with history data
        const form = document.getElementById('emailForm');
        Object.keys(historyItem.formData).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = historyItem.formData[key] || '';
            }
        });

        // Switch to generator tab
        this.switchTab('generator');
        this.showMessage('Form data loaded from history!', 'success');
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // Insert at the top of the current tab content
        const activeTab = document.querySelector('.tab-content.active');
        activeTab.insertBefore(messageDiv, activeTab.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // Utility Methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ColdEmailGenerator();
});
