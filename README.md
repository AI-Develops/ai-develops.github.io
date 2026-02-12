# AI-Develops Organization Index

<p align="center">
  <strong>The constellation hub for AI-Develops projects</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#setup">Setup</a> •
  <a href="#license">License</a>
</p>

---

## Features

- **Dynamic Repository Listing** — Automatically fetches and displays all public repositories
- **GitHub Pages Detection** — Shows live demo links for repos with GitHub Pages enabled
- **Contribution Activity Graph** — GitHub-style contribution visualization across all repos
- **Contributor Showcase** — Highlights top contributors with avatars and contribution counts
- **Dark/Light Theme** — System-aware theme with manual toggle
- **Responsive Design** — Optimized for all screen sizes
- **Modern CSS Features**:
  - CSS Custom Properties for theming
  - Scroll-driven animations
  - Container queries
  - Backdrop filters
  - CSS nesting support

## Tech Stack

- **HTML5** — Semantic markup
- **CSS3** — Modern styling with custom properties, scroll animations, container queries
- **Vanilla JavaScript** — No frameworks, just pure JS
- **GitHub REST API** — Repository and contributor data
- **Canvas API** — Interactive particle animation

## Setup

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/AI-Develops/ai-develops.github.io.git
   cd ai-develops.github.io
   ```

2. Serve locally (any static server works):
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```

3. Open `http://localhost:8000` (or the port shown)

### Deployment

This site is automatically deployed to GitHub Pages when pushed to the `main` branch.

## API Rate Limits

The GitHub API has rate limits for unauthenticated requests (60 requests/hour). For higher limits, consider:

1. Creating a GitHub App or OAuth App
2. Adding authentication to API requests

## Project Structure

```
ai-develops.github.io/
├── index.html      # Main HTML structure
├── style.css       # All styles with CSS custom properties
├── script.js       # GitHub API integration & interactivity
└── README.md       # This file
```

## License

MIT License — feel free to use and modify for your own organization!

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/AI-Develops">AI-Develops</a>
</p>
