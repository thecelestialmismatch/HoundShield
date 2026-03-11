# Contributing to Kaelus.ai

Thanks for your interest in contributing to Kaelus! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/Kaelus.ai.git`
3. **Install** dependencies: `cd Kaelus.ai/compliance-firewall-agent && npm install`
4. **Create** a branch: `git checkout -b feature/your-feature`

## Development Setup

```bash
cd compliance-firewall-agent
cp .env.example .env.local
# Add your OPENROUTER_API_KEY
npm run dev
```

## Project Structure

- `app/` — Next.js pages and API routes
- `components/` — Reusable React components
- `lib/` — Core business logic (firewall, agents, audit)
- `agents/` — Agent persona definitions

## Code Style

- TypeScript strict mode
- Tailwind CSS for styling (use existing design tokens)
- Use existing CSS classes: `glass-card`, `btn-primary`, `btn-ghost`, `text-gradient-brand`
- Follow the existing color system: `surface`, `brand`, `accent`, `success`, `danger`

## Design System

Our design system uses a dark premium theme:
- Background: `#0c0c10` (surface)
- Primary: `#6366f1` (brand/indigo)
- Glass morphism cards with blur effects
- Animated sections with IntersectionObserver

## Pull Request Process

1. Ensure your code builds without errors: `npx next build`
2. Test your changes locally
3. Write a clear PR description
4. Reference any related issues

## Reporting Issues

- Use GitHub Issues
- Include steps to reproduce
- Include browser and OS information
- Screenshots are helpful

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
