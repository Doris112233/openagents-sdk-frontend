# OpenAgents Frontend

Built with TypeScript, Vite, and Tailwind CSS.

## Prerequisites

- Node.js (v20)
- pnpm (v10.12.3 or higher)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd openagents_frontend
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the development server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### 4. Build for production

```bash
pnpm build
```

### 5. Preview production build

```bash
pnpm preview
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── app-sidebar.tsx # Main sidebar component
│   ├── nav-main.tsx    # Main navigation
│   └── nav-secondary.tsx # Secondary navigation
├── pages/              # Page components
│   ├── home.tsx        # Home page
│   ├── models.tsx      # Models page
│   ├── playground.tsx  # Playground page
│   └── tasks/          # Task-related pages
│       ├── taskslist.tsx   # Task list view
│       └── taskdetail.tsx  # Task detail view
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── assets/             # Static assets
├── App.tsx             # Main app component
├── layout.tsx          # Layout wrapper
└── main.tsx            # Entry point
```

