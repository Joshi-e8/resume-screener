# Resume Screener Dashboard

A modern, professional resume management system built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- **Dashboard Overview** - Complete dashboard with stats, search, quick actions, and recent activity
- **Resume Management** - Upload, organize, and manage candidate resumes
- **Advanced Upload System** - Support for single, multiple, and ZIP file uploads
- **Professional UI/UX** - Clean, responsive design with smooth interactions
- **Type Safety** - Full TypeScript coverage with proper type definitions

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Build Tool**: Turbopack (development)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect Next.js and deploy
4. Set environment variables in Vercel dashboard if needed

### Manual Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── resumes/          # Resume management components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility functions
└── types/                # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.example` for all available environment variables.

## Build Status

✅ **Production Ready** - All build errors fixed and optimized for Vercel deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details
