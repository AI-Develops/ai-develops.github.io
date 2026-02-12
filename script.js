/**
 * AI-Develops Organization Index
 * GitHub API Integration with Per-Contributor Activity
 */

const CONFIG = {
    org: 'AI-Develops',
    apiBase: 'https://api.github.com',
    cacheDuration: 5 * 60 * 1000,
};

const state = {
    repos: [],
    contributors: [],
    contributorActivity: new Map(),
    allActivity: new Map(),
    stats: { repos: 0, contributors: 0, commits: 0 },
    selectedContributor: 'all',
};

const elements = {
    nav: document.getElementById('nav'),
    themeToggle: document.getElementById('themeToggle'),
    mobileToggle: document.getElementById('mobileToggle'),
    heroStats: document.getElementById('heroStats'),
    projectsGrid: document.getElementById('projectsGrid'),
    activityGraph: document.getElementById('activityGraph'),
    activityMonths: document.getElementById('activityMonths'),
    contributorSelect: document.getElementById('contributorSelect'),
    totalContributions: document.getElementById('totalContributions'),
    activeDays: document.getElementById('activeDays'),
    contributorsGrid: document.getElementById('contributorsGrid'),
};

// ============================================
// Theme Manager
// ============================================
const ThemeManager = {
    init() {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.set(saved || (prefersDark ? 'dark' : 'light'));

        elements.themeToggle.addEventListener('click', () => this.toggle());
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
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    document.body.classList.toggle('scrolled', window.scrollY > 30);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        elements.mobileToggle.addEventListener('click', () => {
            document.body.classList.toggle('menu-open');
        });

        document.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => {
                document.body.classList.remove('menu-open');
            });
        });
    },
};

// ============================================
// GitHub API with Caching
// ============================================
const GitHubAPI = {
    cache: new Map(),

    async fetch(endpoint) {
        const url = `${CONFIG.apiBase}${endpoint}`;
        const cached = this.cache.get(url);
        
        if (cached && Date.now() - cached.time < CONFIG.cacheDuration) {
            return cached.data;
        }

        try {
            const response = await fetch(url, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });
            
            if (!response.ok) {
                // Return cached data even if expired on error
                if (cached) return cached.data;
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this.cache.set(url, { data, time: Date.now() });
            return data;
        } catch (error) {
            console.warn(`GitHub API: ${error.message}`);
            return cached?.data || null;
        }
    },

    async getRepos() {
        const repos = await this.fetch(`/orgs/${CONFIG.org}/repos?per_page=100&sort=updated`);
        return repos?.filter(r => !r.archived && !r.private) || [];
    },

    async getContributorsWithStats(repo) {
        // This endpoint gives us per-contributor weekly activity
        const stats = await this.fetch(`/repos/${CONFIG.org}/${repo}/stats/contributors`);
        return stats || [];
    },

    async getCommitActivity(repo) {
        const activity = await this.fetch(`/repos/${CONFIG.org}/${repo}/stats/commit-activity`);
        return activity || [];
    },
};

// ============================================
// Projects Section
// ============================================
const ProjectsSection = {
    filter: 'all',

    init() {
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
        const liveUrl = repo.homepage || (repo.has_pages 
            ? `https://${CONFIG.org}.github.io/${repo.name}`
            : null);
        const language = repo.language || 'Various';
        const updated = new Date(repo.pushed_at).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric' 
        });

        return `
            <article class="project-card slide-up">
                <div class="project-card__header">
                    <div class="project-card__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <path d="M3 9h18M9 21V9"/>
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
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        ${repo.stargazers_count}
                    </span>
                    <span class="project-card__stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="18" r="3"/>
                            <circle cx="6" cy="6" r="3"/>
                            <circle cx="18" cy="6" r="3"/>
                            <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/>
                        </svg>
                        ${repo.forks_count}
                    </span>
                    <span class="project-card__stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        ${updated}
                    </span>
                </div>
                <div class="project-card__actions">
                    ${liveUrl ? `
                        <a href="${liveUrl}" target="_blank" rel="noopener" class="project-card__btn project-card__btn--primary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                            Live Demo
                        </a>
                    ` : ''}
                    <a href="${repo.html_url}" target="_blank" rel="noopener" class="project-card__btn project-card__btn--secondary">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.73-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.19.7.8.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        Code
                    </a>
                </div>
            </article>
        `;
    },
};

// ============================================
// Activity Section with Per-Contributor Filter
// ============================================
const ActivitySection = {
    async load() {
        const contributorMap = new Map();
        const allActivityMap = new Map();
        let totalCommits = 0;

        // Fetch contributor stats for each repo
        for (const repo of state.repos) {
            const contributorStats = await GitHubAPI.getContributorsWithStats(repo.name);
            
            if (!contributorStats || !Array.isArray(contributorStats)) continue;

            contributorStats.forEach(stat => {
                if (!stat.author || !stat.author.login) return;
                
                const login = stat.author.login;
                const avatar = stat.author.avatar_url;
                
                // Initialize contributor if needed
                if (!contributorMap.has(login)) {
                    contributorMap.set(login, {
                        login,
                        avatar_url: avatar,
                        contributions: 0,
                        activity: new Map(),
                    });
                }
                
                const contributor = contributorMap.get(login);
                
                // Process weekly data
                if (stat.weeks && Array.isArray(stat.weeks)) {
                    stat.weeks.forEach(week => {
                        if (week.w && week.c > 0) {
                            const date = new Date(week.w * 1000);
                            const dateStr = date.toISOString().split('T')[0];
                            
                            // Add to contributor's activity
                            const currentContrib = contributor.activity.get(dateStr) || 0;
                            contributor.activity.set(dateStr, currentContrib + week.c);
                            
                            // Add to total activity
                            const currentAll = allActivityMap.get(dateStr) || 0;
                            allActivityMap.set(dateStr, currentAll + week.c);
                            
                            contributor.contributions += week.c;
                            totalCommits += week.c;
                        }
                    });
                }
            });
        }

        // Sort contributors by contributions
        state.contributors = Array.from(contributorMap.values())
            .sort((a, b) => b.contributions - a.contributions);
        
        state.contributorActivity = contributorMap;
        state.allActivity = allActivityMap;
        state.stats.commits = totalCommits;
        state.stats.contributors = state.contributors.length;

        this.populateContributorSelect();
        this.render();
        StatsDisplay.update();
    },

    populateContributorSelect() {
        const select = elements.contributorSelect;
        
        // Keep "All" option, add contributors
        select.innerHTML = '<option value="all">All Contributors</option>';
        
        state.contributors.forEach(c => {
            const option = document.createElement('option');
            option.value = c.login;
            option.textContent = `${c.login} (${c.contributions})`;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            state.selectedContributor = e.target.value;
            this.render();
        });
    },

    getActivityData() {
        if (state.selectedContributor === 'all') {
            return state.allActivity;
        }
        return state.contributorActivity.get(state.selectedContributor)?.activity || new Map();
    },

    render() {
        const activityData = this.getActivityData();
        
        // Calculate stats for current selection
        let totalContributions = 0;
        let activeDays = 0;
        
        activityData.forEach((count) => {
            totalContributions += count;
            if (count > 0) activeDays++;
        });

        // Update summary
        elements.totalContributions.textContent = totalContributions.toLocaleString();
        elements.activeDays.textContent = activeDays.toLocaleString();

        // Generate graph
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weeks = [];
        const months = [];
        let currentMonth = -1;
        let monthPositions = [];

        // Generate 52 weeks (364 days)
        for (let w = 51; w >= 0; w--) {
            const weekData = [];
            
            for (let d = 0; d < 7; d++) {
                const date = new Date(today);
                date.setDate(date.getDate() - (w * 7 + (6 - d)));
                const dateStr = date.toISOString().split('T')[0];
                const count = activityData.get(dateStr) || 0;
                
                // Track month
                const month = date.getMonth();
                if (month !== currentMonth && w < 51) {
                    currentMonth = month;
                    monthPositions.push({
                        week: 51 - w,
                        name: date.toLocaleDateString('en-US', { month: 'short' })
                    });
                }
                
                weekData.push({
                    date: dateStr,
                    count,
                    level: this.getLevel(count),
                    isToday: dateStr === today.toISOString().split('T')[0],
                });
            }
            
            weeks.push(weekData);
        }

        // Render months header
        const uniqueMonths = [];
        let lastMonthName = '';
        weeks.forEach((_, weekIndex) => {
            const found = monthPositions.find(m => m.week === weekIndex);
            if (found && found.name !== lastMonthName) {
                uniqueMonths.push(found.name);
                lastMonthName = found.name;
            } else {
                uniqueMonths.push('');
            }
        });

        elements.activityMonths.innerHTML = uniqueMonths
            .filter(m => m !== '')
            .map(m => `<span class="activity__month">${m}</span>`)
            .join('');

        // Render graph
        elements.activityGraph.innerHTML = weeks.map(week => `
            <div class="activity__week">
                ${week.map(day => `
                    <div class="activity__day ${day.isToday ? 'activity__day--today' : ''}" 
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
        if (count <= 2) return 1;
        if (count <= 5) return 2;
        if (count <= 10) return 3;
        return 4;
    },
};

// ============================================
// Contributors Section
// ============================================
const ContributorsSection = {
    render() {
        if (state.contributors.length === 0) {
            elements.contributorsGrid.innerHTML = `
                <div class="contributors__loader">
                    <p>No contributors found</p>
                </div>
            `;
            return;
        }

        elements.contributorsGrid.innerHTML = state.contributors.slice(0, 12).map(c => `
            <article class="contributor-card slide-up">
                <div class="contributor-card__avatar">
                    <img src="${c.avatar_url}" alt="${c.login}" loading="lazy">
                </div>
                <div class="contributor-card__info">
                    <h3 class="contributor-card__name">${c.login}</h3>
                    <span class="contributor-card__username">@${c.login}</span>
                    <div class="contributor-card__contributions">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        ${c.contributions.toLocaleString()} contributions
                    </div>
                </div>
                <a href="https://github.com/${c.login}" target="_blank" rel="noopener" class="contributor-card__link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                </a>
            </article>
        `).join('');
    },
};

// ============================================
// Stats Animation
// ============================================
const StatsDisplay = {
    update() {
        const stats = elements.heroStats.querySelectorAll('.hero__stat-value');
        const values = [state.stats.repos, state.stats.contributors, state.stats.commits];
        
        stats.forEach((stat, i) => {
            this.animateValue(stat, 0, values[i] || 0, 1000);
        });
    },

    animateValue(element, start, end, duration) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = Math.floor(start + (end - start) * eased).toLocaleString();
            
            if (progress < 1) requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    },
};

// ============================================
// Initialize
// ============================================
async function init() {
    ThemeManager.init();
    Navigation.init();
    ProjectsSection.init();

    try {
        await ProjectsSection.load();
        await ActivitySection.load();
        ContributorsSection.render();
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
