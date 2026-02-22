# Contributing to AskFlow

Thank you for your interest in contributing to AskFlow! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Getting Started

```bash
# Clone the repository
git clone https://github.com/AlexBaum-ai/askflow.git
cd askflow

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env and set JWT_SECRET to a random string

# Start development server
npm run dev
```

The app will be available at `http://localhost:3001`.

### Project Structure

```
askflow/
├── server/           # Express.js backend
│   ├── routes/       # API route handlers
│   ├── middleware/    # Auth middleware
│   ├── db.ts         # SQLite database setup
│   └── index.ts      # Server entry point
├── src/              # React frontend
│   ├── admin/        # Admin panel pages & components
│   ├── templates/    # 20+ FAQ page templates
│   ├── context/      # React contexts (Auth, Settings)
│   └── main.tsx      # App entry point
├── data/             # SQLite database (auto-created)
└── uploads/          # User uploads (logos)
```

## Making Changes

### Branch Naming

- `feature/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation changes

### Code Style

- TypeScript for all code
- React functional components with hooks
- Tailwind CSS for styling
- 2-space indentation

### Before Submitting

```bash
# Type check
npx tsc --noEmit

# Build
npx vite build
```

## Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Ensure the build passes (`npx vite build`)
5. Commit your changes (`git commit -m 'feat: add my feature'`)
6. Push to the branch (`git push origin feature/my-feature`)
7. Open a Pull Request

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `refactor:` — Code refactoring
- `chore:` — Maintenance tasks

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- Include your Node.js version and OS

## License

By contributing to AskFlow, you agree that your contributions will be licensed under the MIT License.
