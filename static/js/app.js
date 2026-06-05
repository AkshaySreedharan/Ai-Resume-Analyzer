// App state variables
let accessToken = null;
let refreshToken = null;
let currentUser = null;
let currentView = 'resumes';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Attempt auto-login using saved tokens
    accessToken = localStorage.getItem('access_token');
    refreshToken = localStorage.getItem('refresh_token');
    
    if (accessToken) {
        checkAuthentication();
    } else {
        showAuthScreen();
    }

    // Set up drag and drop listeners
    setupDragAndDrop();
});

// Authentication Checks
async function checkAuthentication() {
    try {
        const response = await fetch('/api/users/profile/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.username;
            showDashboard();
        } else if (response.status === 401) {
            // Token might be expired, try to refresh
            const refreshed = await attemptTokenRefresh();
            if (refreshed) {
                checkAuthentication();
            } else {
                logout();
            }
        } else {
            logout();
        }
    } catch (err) {
        console.error('Auth check error:', err);
        showAuthScreen();
    }
}

// Token Refresh
async function attemptTokenRefresh() {
    if (!refreshToken) return false;
    try {
        const response = await fetch('/api/token/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
        });
        if (response.ok) {
            const data = await response.json();
            accessToken = data.access;
            localStorage.setItem('access_token', accessToken);
            return true;
        }
    } catch (err) {
        console.error('Refresh token error:', err);
    }
    return false;
}

// Switch auth view login / register
function switchAuthTab(type) {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authError = document.getElementById('auth-error');

    authError.classList.add('hidden');
    authError.textContent = '';

    if (type === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
}

// Show/Hide Containers
function showAuthScreen() {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    
    // Set user metadata
    document.getElementById('user-display-name').textContent = currentUser;
    document.getElementById('avatar-initials').textContent = currentUser.substring(0, 2).toUpperCase();

    // Load initial views data
    loadResumes();
    loadJobs();
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const authError = document.getElementById('auth-error');

    authError.classList.add('hidden');

    try {
        const response = await fetch('/api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        });

        if (response.ok) {
            const data = await response.json();
            accessToken = data.access;
            refreshToken = data.refresh;
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            currentUser = usernameInput.value;
            
            // Reset fields
            usernameInput.value = '';
            passwordInput.value = '';
            
            showDashboard();
        } else {
            const data = await response.json();
            authError.textContent = data.detail || 'Invalid credentials. Please try again.';
            authError.classList.remove('hidden');
        }
    } catch (err) {
        authError.textContent = 'Server communication error. Please try again later.';
        authError.classList.remove('hidden');
    }
}

// Register
async function handleRegister(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('register-username');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const authError = document.getElementById('auth-error');

    authError.classList.add('hidden');

    try {
        const response = await fetch('/api/users/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameInput.value,
                email: emailInput.value,
                password: passwordInput.value
            })
        });

        if (response.ok) {
            // Auto login after success registration
            const loginResponse = await fetch('/api/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: usernameInput.value,
                    password: passwordInput.value
                })
            });

            if (loginResponse.ok) {
                const data = await loginResponse.json();
                accessToken = data.access;
                refreshToken = data.refresh;
                localStorage.setItem('access_token', accessToken);
                localStorage.setItem('refresh_token', refreshToken);
                currentUser = usernameInput.value;
                
                // Clear fields
                usernameInput.value = '';
                emailInput.value = '';
                passwordInput.value = '';
                
                showDashboard();
            } else {
                switchAuthTab('login');
            }
        } else {
            const data = await response.json();
            // Handle error dictionary format
            let errMsg = 'Registration failed. ';
            for (const key in data) {
                errMsg += `${data[key]} `;
            }
            authError.textContent = errMsg;
            authError.classList.remove('hidden');
        }
    } catch (err) {
        authError.textContent = 'Registration communication error.';
        authError.classList.remove('hidden');
    }
}

// Logout
function handleLogout() {
    logout();
}

function logout() {
    accessToken = null;
    refreshToken = null;
    currentUser = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-username').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    
    showAuthScreen();
}

// Tab view switching
function switchView(viewName) {
    currentView = viewName;
    
    // Toggle navigation button styles
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-${viewName}`).classList.add('active');

    // Toggle content views
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`view-${viewName}`).classList.remove('hidden');

    // Reload views dynamically
    if (viewName === 'resumes') {
        loadResumes();
    } else if (viewName === 'jobs') {
        loadJobs();
    } else if (viewName === 'analysis') {
        populateAnalysisSelects();
    }
}

// Drag & Drop Handlers
function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('active');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('active');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            uploadFile(files[0]);
        } else {
            alert('Please drop a valid PDF resume file.');
        }
    });
}

function triggerFileInput() {
    document.getElementById('resume-file-input').click();
}

function handleFileUpload(input) {
    if (input.files.length > 0) {
        uploadFile(input.files[0]);
    }
}

// Upload Resume file with parsing loader
async function uploadFile(file) {
    const progressContainer = document.getElementById('upload-progress-container');
    const filenameLabel = document.getElementById('progress-filename');
    const fill = document.getElementById('progress-bar-fill');
    const percentLabel = document.getElementById('progress-percent');

    filenameLabel.textContent = file.name;
    progressContainer.classList.remove('hidden');
    fill.style.width = '15%';
    percentLabel.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('resume_file', file);

    // Simulate progress while uploading/parsing
    let progress = 15;
    const interval = setInterval(() => {
        if (progress < 85) {
            progress += Math.floor(Math.random() * 8) + 2;
            fill.style.width = `${progress}%`;
            percentLabel.textContent = `Parsing text & skills... ${progress}%`;
        }
    }, 200);

    try {
        const response = await fetch('/api/resumes/upload/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: formData
        });

        clearInterval(interval);

        if (response.ok) {
            fill.style.width = '100%';
            percentLabel.textContent = 'Parsing complete!';
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                loadResumes();
            }, 1000);
        } else {
            const data = await response.json();
            percentLabel.textContent = 'Upload failed.';
            fill.style.width = '0%';
            alert(data.resume_file || 'Parsing failed. Please check the PDF format.');
        }
    } catch (err) {
        clearInterval(interval);
        percentLabel.textContent = 'Connection error.';
        fill.style.width = '0%';
        alert('Network error while uploading resume.');
    }
}

// Fetch Resumes List
async function loadResumes() {
    try {
        const response = await fetch('/api/resumes/', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.ok) {
            const resumes = await response.json();
            renderResumes(resumes);
        } else if (response.status === 401) {
            const refreshed = await attemptTokenRefresh();
            if (refreshed) loadResumes();
        }
    } catch (err) {
        console.error('Load resumes error:', err);
    }
}

// Render Resume cards in DOM
function renderResumes(resumes) {
    const listContainer = document.getElementById('resumes-list');
    const countBadge = document.getElementById('resume-count');
    const emptyState = document.getElementById('resumes-empty-state');

    countBadge.textContent = resumes.length;

    // Clear list
    listContainer.innerHTML = '';

    if (resumes.length === 0) {
        listContainer.appendChild(emptyState);
        emptyState.classList.remove('hidden');
        return;
    }

    resumes.forEach(resume => {
        const card = document.createElement('div');
        card.className = 'card resume-card';
        
        // Extract filename from file path
        const fileParts = resume.resume_file.split('/');
        const filename = decodeURIComponent(fileParts[fileParts.length - 1]);
        
        const uploadDate = new Date(resume.uploaded_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        // Parse skills
        const skills = resume.extracted_skills || [];
        const skillsHTML = skills.length > 0 
            ? skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
            : '<span class="skill-tag text-muted" style="border-style:dashed;">No skills extracted</span>';

        card.innerHTML = `
            <div class="resume-card-header">
                <div class="resume-name" title="${filename}">${filename}</div>
                <div class="resume-date">${uploadDate}</div>
            </div>
            <div class="skills-tags-container">
                ${skillsHTML}
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// Create Job Description
async function handleCreateJob(e) {
    e.preventDefault();
    const titleInput = document.getElementById('job-title');
    const descInput = document.getElementById('job-description');

    try {
        const response = await fetch('/api/jobs/create/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: titleInput.value,
                description: descInput.value
            })
        });

        if (response.ok) {
            titleInput.value = '';
            descInput.value = '';
            alert('Job description added and key skills extracted!');
            loadJobs();
        } else {
            const errors = await response.json();
            alert(JSON.stringify(errors));
        }
    } catch (err) {
        console.error('Job creation error:', err);
    }
}

// Fetch Job Descriptions
async function loadJobs() {
    try {
        const response = await fetch('/api/jobs/', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.ok) {
            const jobs = await response.json();
            renderJobs(jobs);
        }
    } catch (err) {
        console.error('Load jobs error:', err);
    }
}

// Render Jobs
function renderJobs(jobs) {
    const container = document.getElementById('jobs-list');
    const countBadge = document.getElementById('job-count');
    const emptyState = document.getElementById('jobs-empty-state');

    countBadge.textContent = jobs.length;
    container.innerHTML = '';

    if (jobs.length === 0) {
        container.appendChild(emptyState);
        emptyState.classList.remove('hidden');
        return;
    }

    jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'card job-card';

        const createdDate = new Date(job.created_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        const skills = job.extracted_skills || [];
        const skillsHTML = skills.length > 0
            ? skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
            : '<span class="skill-tag text-muted" style="border-style:dashed;">No skills specified</span>';

        card.innerHTML = `
            <div class="job-card-header">
                <div class="job-title">${job.title}</div>
                <div class="job-date">${createdDate}</div>
            </div>
            <div class="skills-tags-container mt-2">
                ${skillsHTML}
            </div>
        `;
        container.appendChild(card);
    });
}

// Match Select Option lists populate
async function populateAnalysisSelects() {
    const selectResume = document.getElementById('select-resume');
    const selectJob = document.getElementById('select-job');

    // Retain first placeholder option
    selectResume.innerHTML = '<option value="" disabled selected>Choose a resume...</option>';
    selectJob.innerHTML = '<option value="" disabled selected>Choose a job description...</option>';

    try {
        // Fetch resumes
        const resumesResponse = await fetch('/api/resumes/', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        // Fetch jobs
        const jobsResponse = await fetch('/api/jobs/', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (resumesResponse.ok && jobsResponse.ok) {
            const resumes = await resumesResponse.json();
            const jobs = await jobsResponse.json();

            resumes.forEach(resume => {
                const parts = resume.resume_file.split('/');
                const filename = decodeURIComponent(parts[parts.length - 1]);
                const option = document.createElement('option');
                option.value = resume.id;
                option.textContent = filename;
                selectResume.appendChild(option);
            });

            jobs.forEach(job => {
                const option = document.createElement('option');
                option.value = job.id;
                option.textContent = job.title;
                selectJob.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Error populating selects:', err);
    }
}

// Perform Analysis Check
async function performAnalysis() {
    const selectResume = document.getElementById('select-resume');
    const selectJob = document.getElementById('select-job');
    const loadingCard = document.getElementById('analysis-loading');
    const resultsView = document.getElementById('analysis-results');

    const resumeId = selectResume.value;
    const jobId = selectJob.value;

    if (!resumeId || !jobId) {
        alert('Please select both a resume and a target job role.');
        return;
    }

    // Reset views
    resultsView.classList.add('hidden');
    loadingCard.classList.remove('hidden');

    try {
        const response = await fetch(`/api/analysis/${resumeId}/${jobId}/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        loadingCard.classList.add('hidden');

        if (response.ok) {
            const data = await response.json();
            displayAnalysisResults(data);
        } else {
            alert('Failed to perform analysis. Please check your selections.');
        }
    } catch (err) {
        loadingCard.classList.add('hidden');
        alert('Communication error while running the compatibility analysis.');
    }
}

// Display analysis outcomes
function displayAnalysisResults(data) {
    const resultsView = document.getElementById('analysis-results');
    
    // Skill match score
    const skillScore = Math.round(data.skill_match_score || 0);
    document.getElementById('score-text-skills').textContent = `${skillScore}%`;
    animateCircle('circle-fill-skills', skillScore);

    // Text similarity score
    const textScore = Math.round(data.text_similarity_score || 0);
    document.getElementById('score-text-text').textContent = `${textScore}%`;
    animateCircle('circle-fill-text', textScore);

    // Recommendation card
    const badge = document.getElementById('recommendation-badge');
    const stmt = document.getElementById('recommendation-statement');

    badge.className = 'recommendation-badge'; // reset class list
    
    if (skillScore >= 80) {
        badge.textContent = 'EXCELLENT MATCH';
        badge.classList.add('badge-excellent');
        stmt.textContent = 'Outstanding alignment. The candidate possesses nearly all target technical skills and fits the role profile perfectly.';
    } else if (skillScore >= 60) {
        badge.textContent = 'GOOD MATCH';
        badge.classList.add('badge-good');
        stmt.textContent = 'Strong capability profile. The candidate has core skills required for this job but might need a brief onboarding to fill minor gaps.';
    } else if (skillScore >= 40) {
        badge.textContent = 'AVERAGE MATCH';
        badge.classList.add('badge-average');
        stmt.textContent = 'Moderate profile overlap. Some essential skills are missing. Consider secondary interviews or evaluating related competencies.';
    } else {
        badge.textContent = 'NEEDS IMPROVEMENT';
        badge.classList.add('badge-needs');
        stmt.textContent = 'Low overlap detected. The candidate requires significant skill acquisition to match the core expectations of this profile.';
    }

    // Populate skill tags
    const matchedContainer = document.getElementById('matched-skills-tags');
    const missingContainer = document.getElementById('missing-skills-tags');

    matchedContainer.innerHTML = '';
    missingContainer.innerHTML = '';

    const matchedSkills = data.matched_skills || [];
    const missingSkills = data.missing_skills || [];

    if (matchedSkills.length > 0) {
        matchedSkills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.textContent = skill;
            matchedContainer.appendChild(tag);
        });
    } else {
        matchedContainer.innerHTML = '<span class="helper-text">No overlapping skills found.</span>';
    }

    if (missingSkills.length > 0) {
        missingSkills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.textContent = skill;
            missingContainer.appendChild(tag);
        });
    } else {
        missingContainer.innerHTML = '<span class="helper-text" style="color:var(--accent-emerald)">No missing key skills detected!</span>';
    }

    // Reveal results block
    resultsView.classList.remove('hidden');
}

// Animate SVG circular metrics loader
function animateCircle(elementId, score) {
    const circle = document.getElementById(elementId);
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius; // 314.16 for r=50
    
    circle.style.strokeDasharray = circumference;
    
    // Animate fill offset
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}
