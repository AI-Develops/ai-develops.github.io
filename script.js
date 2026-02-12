/**
 * AI-Develops Organization Index
 * GitHub API Integration & Interactive Features
 */

// Configuration
const CONFIG = {
    org: 'AI-Develops',
    apiBase: 'https://api.github.com',
    cacheDuration: 5 * 60 * 1000, // 5 minutes
};

// State
const state = {
    repos: [],
    contributors: [],
    activity: new Map(),
    stats: { repos: 0, contributors: 0, commits: 0 },
};

// DOM Elements
const elements = {
    nav: document.getElementById('nav'),
    themeToggle: document.getElementById('themeToggle'),
    mobileToggle: document.getElementById('mobileToggle'),
    heroCanvas: document.getElementById('heroCanvas'),
    heroStats: document.getElementById('heroStats'),
    projectsGrid: document.getElementById('projectsGrid'),
    activityGraph: document.getElementById('activityGraph'),
    activityMonths: document.getElementById('activityMonths'),
    contributorsGrid: document.getElementById('contributorsGrid'),
};

// ============================================
// Theme Management
// ============================================
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.set(theme);

        elements.themeToggle.addEventListener('click', () => this.toggle());
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.set(e.matches ? 'dark' : 'light');
            }
        });
    },

    set(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        this.set(current === 'dark' ? 'light' : 'dark');
    },
};

// ============================================
// Navigation
// ============================================
const Navigation = {
    init() {
        // Scroll detection
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Mobile menu
        elements.mobileToggle.addEventListener('click', () => {
            document.body.classList.toggle('menu-open');
        });

        // Close menu on link click
        document.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => {
                document.body.classList.remove('menu-open');
            });
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    },

    handleScroll() {
        const scrolled = window.scrollY > 50;
        document.body.classList.toggle('scrolled', scrolled);
    },
};

// ============================================
// Hero Canvas Animation
// ============================================
const HeroCanvas = {
    particles: [],
    connections: [],
    animationId: null,

    init() {
        if (!elements.heroCanvas) return;
        
        this.ctx = elements.heroCanvas.getContext('2d');
        this.resize();
        this.createParticles();
        this.animate();

        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        const rect = elements.heroCanvas.parentElement.getBoundingClientRect();
        elements.heroCanvas.width = rect.width;
        elements.heroCanvas.height = rect.height;
        
        // Recreate particles on resize
        if (this.particles.length > 0) {
            this.createParticles();
        }
    },

    createParticles() {
        const count = Math.floor((elements.heroCanvas.width * elements.heroCanvas.height) / 15000);
        this.particles = [];
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * elements.heroCanvas.width,
                y: Math.random() * elements.heroCanvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2,
            });
        }
    },

    animate() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const particleColor = isDark ? 'rgba(99, 102, 241,' : 'rgba(99, 102, 241,';
        const lineColor = isDark ? 'rgba(139, 92, 246,' : 'rgba(139, 92, 246,';

        this.ctx.clearRect(0, 0, elements.heroCanvas.width, elements.heroCanvas.height);

        // Update and draw particles
        this.particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off walls
            if (p.x < 0 || p.x > elements.heroCanvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > elements.heroCanvas.height) p.vy *= -1;

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particleColor + p.opacity + ')';
            this.ctx.fill();

            // Draw connections
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = lineColor + (1 - dist / 150) * 0.2 + ')';
                    this.ctx.stroke();
                }
            }
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    },
};

// ============================================
// GitHub API
// ============================================
const GitHubAPI = {
    cache: new Map(),

    async fetch(endpoint) {
        const url = `${CONFIG.apiBase}${endpoint}`;
        const cached = this.cache.get(url);
        
        if (cached && Date.now() - cached.timestamp < CONFIG.cacheDuration) {
            return cached.data;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            
            this.cache.set(url, { data, timestamp: Date.now() });
            return data;
        } catch (error) {
            console.error(`GitHub API Error: ${error.message}`);
            return cached?.data || null;
        }
    },

    async getRepos() {
        const repos = await this.fetch(`/orgs/${CONFIG.org}/repos?per_page=100&sort=updated`);
        return repos?.filter(r => !r.archived && !r.private) || [];
    },

    async getContributors(repo) {
        return await this.fetch(`/repos/${CONFIG.org}/${repo}/contributors?per_page=100`) || [];
    },

    async getCommitActivity(repo) {
        return await this.fetch(`/repos/${CONFIG.org}/${repo}/stats/commit-activity`) || [];
    },
};

// ============================================
// Projects Section
// ============================================
const ProjectsSection = {
    filter: 'all',

    init() {
        // Filter buttons
        document.querySelectorAll('.projects__filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.projects__filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filter = btn.dataset.filter;
                this.render();
            });
        });
    },

    async load() {
        state.repos = await GitHubAPI.getRepos();
        state.stats.repos = state.repos.length;
        this.render();
        StatsDisplay.update();
    },

    getFilteredRepos() {
        let repos = [...state.repos];
        
        switch (this.filter) {
            case 'featured':
                repos = repos.filter(r => r.stargazers_count > 0 || r.forks_count > 0);
                break;
            case 'recent':
                repos = repos.slice(0, 6);
                break;
        }
        
        return repos;
    },

    render() {
        const repos = this.getFilteredRepos();
        
        if (repos.length === 0) {
            elements.projectsGrid.innerHTML = `
                <div class="projects__loader">
                    <p>No repositories found</p>
                </div>
            `;
            return;
        }

        elements.projectsGrid.innerHTML = repos.map(repo => this.createCard(repo)).join('');
    },

    createCard(repo) {
        const liveUrl = repo.has_pages 
            ? `https://${CONFIG.org}.github.io/${repo.name}`
            : null;
        
        const language = repo.language || 'Various';
        const updated = new Date(repo.updated_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });

        return `
            <article class="project-card slide-up">
                <div class="project-card__header">
                    <div class="project-card__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 3h18v18H3zM3 9h18M9 21V9"/>
                        </svg>
                    </div>
                    <div class="project-card__meta">
                        <h3 class="project-card__name">${repo.name}</h3>
                        <span class="project-card__lang">${language}</span>
                    </div>
                </div>
                <p class="project-card__description">
                    ${repo.description || 'A project by AI-Develops'}
                </p>
                <div class="project-card__stats">
                    <span class="project-card__stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        ${repo.stargazers_count}
                    </span>
                    <span class="project-card__stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="18" r="3"/>
                            <circle cx="6" cy="6" r="3"/>
                            <circle cx="18" cy="6" r="3"/>
                            <path d="M18 9v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/>
                        </svg>
                        ${repo.forks_count}
                    </span>
                    <span class="project-card__stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                        ${updated}
                    </span>
                </div>
                <div class="project-card__actions">
                    ${liveUrl ? `
                        <a href="${liveUrl}" target="_blank" rel="noopener" class="project-card__btn project-card__btn--primary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                <polyline points="15,3 21,3 21,9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                            Live Demo
                        </a>
                    ` : ''}
                    <a href="${repo.html_url}" target="_blank" rel="noopener" class="project-card__btn project-card__btn--secondary">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        Code
                    </a>
                </div>
            </article>
        `;
    },
};

// ============================================
// Activity Section (Contribution Graph)
// ============================================
const ActivitySection = {
    async load() {
        const contributionsMap = new Map();
        let totalCommits = 0;
        const contributorSet = new Set();

        // Fetch activity for each repo
        for (const repo of state.repos.slice(0, 10)) {
            const activity = await GitHubAPI.getCommitActivity(repo.name);
            const contributors = await GitHubAPI.getContributors(repo.name);
            
            contributors.forEach(c => contributorSet.add(c.login));
            
            activity.forEach(week => {
                const date = new Date(week.week * 1000);
                const dateStr = date.toISOString().split('T')[0];
                const current = contributionsMap.get(dateStr) || 0;
                contributionsMap.set(dateStr, current + week.total);
                totalCommits += week.total;
            });
        }

        state.activity = contributionsMap;
        state.stats.commits = totalCommits;
        state.stats.contributors = contributorSet.size;
        
        this.render();
        StatsDisplay.update();
    },

    render() {
        // Generate 52 weeks of data
        const weeks = [];
        const months = [];
        const today = new Date();
        let currentMonth = -1;

        for (let w = 51; w >= 0; w--) {
            const weekData = [];
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - (w * 7));

            // Track month changes
            const month = weekStart.getMonth();
            if (month !== currentMonth) {
                currentMonth = month;
                months.push(weekStart.toLocaleDateString('en-US', { month: 'short' }));
            } else {
                months.push('');
            }

            for (let d = 0; d < 7; d++) {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + d);
                const dateStr = date.toISOString().split('T')[0];
                const count = state.activity.get(dateStr) || 0;
                
                weekData.push({
                    date: dateStr,
                    count,
                    level: this.getLevel(count),
                });
            }
            
            weeks.push(weekData);
        }

        // Render months
        elements.activityMonths.innerHTML = months
            .filter(m => m)
            .map(m => `<span class="activity__month">${m}</span>`)
            .join('');

        // Render graph
        elements.activityGraph.innerHTML = weeks.map(week => `
            <div class="activity__week">
                ${week.map(day => `
                    <div class="activity__day" 
                         data-level="${day.level}" 
                         data-date="${day.date}" 
                         data-count="${day.count}"
                         title="${day.date}: ${day.count} contributions">
                    </div>
                `).join('')}
            </div>
        `).join('');
    },

    getLevel(count) {
        if (count === 0) return 0;
        if (count < 3) return 1;
        if (count < 6) return 2;
        if (count < 10) return 3;
        return 4;
    },
};

// ============================================
// Contributors Section
// ============================================
const ContributorsSection = {
    async load() {
        const contributorMap = new Map();

        // Aggregate contributors from all repos
        for (const repo of state.repos) {
            const contributors = await GitHubAPI.getContributors(repo.name);
            
            contributors.forEach(c => {
                const current = contributorMap.get(c.login) || { 
                    login: c.login, 
                    avatar_url: c.avatar_url, 
                    contributions: 0 
                };
                current.contributions += c.contributions;
                contributorMap.set(c.login, current);
            });
        }

        state.contributors = Array.from(contributorMap.values())
            .sort((a, b) => b.contributions - a.contributions)
            .slice(0, 12);

        this.render();
    },

    render() {
        if (state.contributors.length === 0) {
            elements.contributorsGrid.innerHTML = `
                <div class="contributors__loader">
                    <p>No contributors found</p>
                </div>
            `;
            return;
        }

        elements.contributorsGrid.innerHTML = state.contributors.map(c => `
            <article class="contributor-card slide-up">
                <div class="contributor-card__avatar">
                    <img src="${c.avatar_url}" alt="${c.login}" loading="lazy">
                </div>
                <div class="contributor-card__info">
                    <h3 class="contributor-card__name">${c.login}</h3>
                    <span class="contributor-card__username">@${c.login}</span>
                    <div class="contributor-card__contributions">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M8 12l2 2 4-4"/>
                        </svg>
                        ${c.contributions.toLocaleString()} contributions
                    </div>
                </div>
                <a href="https://github.com/${c.login}" target="_blank" rel="noopener" class="contributor-card__link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15,3 21,3 21,9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                </a>
            </article>
        `).join('');
    },
};

// ============================================
// Stats Display (Animated Counter)
// ============================================
const StatsDisplay = {
    update() {
        const stats = elements.heroStats.querySelectorAll('.hero__stat-value');
        const values = [state.stats.repos, state.stats.contributors, state.stats.commits];
        
        stats.forEach((stat, i) => {
            const target = values[i] || 0;
            this.animateValue(stat, 0, target, 1500);
        });
    },

    animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const range = end - start;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            const current = Math.floor(start + (range * eased));
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },
};

// ============================================
// Initialize Application
// ============================================
async function init() {
    // Initialize UI components
    ThemeManager.init();
    Navigation.init();
    HeroCanvas.init();
    ProjectsSection.init();

    // Load data from GitHub API
    try {
        await ProjectsSection.load();
        await Promise.all([
            ActivitySection.load(),
            ContributorsSection.load(),
        ]);
    } catch (error) {
        console.error('Failed to load data:', error);
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
