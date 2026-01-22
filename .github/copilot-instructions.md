# GitHub Copilot Instructions for xTab Dashboard

## Project Overview

xTab is a modern, full-stack social media post management dashboard built to manage posts across multiple platforms (Reddit, Twitter, LinkedIn, Medium, etc.). The application provides analytics, post scheduling, and multi-platform management capabilities.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling with custom theme using CSS variables
- **shadcn/ui** component library (based on Radix UI primitives)
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation for forms
- **Wouter** for lightweight client-side routing
- **Recharts** for analytics visualizations

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for type-safe database operations (PostgreSQL)
- **Zod** for runtime validation and schema definitions
- **In-memory storage** interface with PostgreSQL support

### Development Tools
- **TypeScript 5.6** for type safety (strict mode enabled)
- **ESBuild** for server bundling
- **Path aliases**: `@/*` for client, `@shared/*` for shared code

## Project Structure

```
xTab-dasboard/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── dashboard/     # Dashboard-specific components
│   │   │   ├── forms/         # Form components
│   │   │   └── ui/            # shadcn/ui base components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions (cn, api client)
│   │   ├── pages/             # Application pages
│   │   ├── App.tsx            # Main app with routing
│   │   └── main.tsx           # Entry point
│   └── index.html
├── server/                    # Backend Express application
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API route definitions
│   ├── storage.ts            # Storage interface and implementations
│   └── vite.ts               # Vite dev server integration
├── shared/                    # Shared types and schemas
│   └── schema.ts             # Drizzle schema and Zod validators
└── package.json
```

## Code Conventions

### TypeScript
- Use TypeScript strict mode (configured in tsconfig.json)
- Prefer explicit types over `any`
- Use path aliases: `@/` for client code, `@shared/` for shared schemas
- Export types alongside implementations
- Use Zod schemas for runtime validation, derive types from schemas

### React Components
- Use functional components with TypeScript
- Prefer named exports for components
- Use React Hook Form with Zod resolvers for forms
- Use TanStack Query hooks for API calls (`useQuery`, `useMutation`)
- Keep components focused and single-purpose
- Use shadcn/ui components from `@/components/ui/`

### Styling
- Use Tailwind CSS utility classes
- Follow the custom theme defined in `tailwind.config.ts`
- Use CSS variables for colors (defined in `client/src/index.css`)
- Custom brand colors: `xtab-blue`, `xtab-indigo`, `xtab-emerald`
- Use the `cn()` utility from `@/lib/utils` for conditional classes

### API Routes
- RESTful conventions: GET, POST, PUT, DELETE
- All API routes prefixed with `/api/`
- Use async/await for all asynchronous operations
- Return proper HTTP status codes (200, 201, 400, 404, 500)
- Validate request bodies with Zod schemas
- Handle errors gracefully with try-catch blocks

### Database Schema
- Schema defined in `shared/schema.ts` using Drizzle ORM
- Use `createInsertSchema` from drizzle-zod for input validation
- Export both insert schemas and types
- Tables: `platforms`, `posts`

## Development Workflow

### Available Commands
```bash
npm run dev      # Start dev server (frontend + backend on port 5000)
npm run build    # Build for production (Vite + ESBuild)
npm run start    # Start production server
npm run check    # TypeScript type checking
npm run db:push  # Push database schema changes
```

### Development Server
- Development runs on `http://localhost:5000`
- Vite HMR for instant frontend updates
- Backend auto-reloads with tsx watch mode

## Architecture Patterns

### Storage Layer
- Abstract `IStorage` interface in `server/storage.ts`
- In-memory implementation for development
- Easy swap to database implementation
- All storage methods return Promises

### State Management
- Server state: TanStack Query
- Form state: React Hook Form
- Local UI state: React hooks (useState, useReducer)

### Form Validation
- Define Zod schemas in shared code
- Use `@hookform/resolvers/zod` for React Hook Form integration
- Server-side validation with same Zod schemas

### Component Composition
- Use shadcn/ui primitives (Radix UI under the hood)
- Compose larger features from smaller UI components
- Pass props with TypeScript interfaces for type safety

## Common Tasks

### Adding a New API Endpoint
1. Add route in `server/routes.ts`
2. Add storage method in `server/storage.ts` (interface and implementation)
3. Use Zod for request validation
4. Return appropriate status codes and error messages

### Adding a New Component
1. Create in appropriate directory under `client/src/components/`
2. Use TypeScript for props interface
3. Use shadcn/ui components for UI primitives
4. Apply Tailwind classes for styling
5. Export as named export

### Adding a New Form
1. Define Zod schema in `shared/schema.ts` or component file
2. Use React Hook Form with `useForm` hook
3. Apply zodResolver for validation
4. Use shadcn/ui form components
5. Handle submission with TanStack Query mutation

### Working with Database
1. Update schema in `shared/schema.ts`
2. Run `npm run db:push` to sync changes
3. Update storage interface and implementation
4. Update API routes as needed

## Important Notes

- The app uses WebSocket for real-time updates (optional feature)
- Base path is set to `/xTab-dasboard/` for GitHub Pages deployment
- Session management uses express-session with in-memory store
- The codebase supports both in-memory and database storage modes
- Dark/light theme toggle uses `next-themes` package

## Best Practices

1. **Type Safety**: Always use TypeScript types, avoid `any`
2. **Validation**: Validate on both client and server with Zod
3. **Error Handling**: Always handle errors in try-catch blocks
4. **Accessibility**: Use semantic HTML and ARIA labels
5. **Performance**: Use React.memo, useMemo, useCallback when appropriate
6. **Code Organization**: Keep files focused, extract reusable logic
7. **Imports**: Use path aliases for cleaner imports
8. **Components**: Prefer composition over complex components
9. **Git**: Write clear commit messages, keep commits focused

## Testing & Building

- Type check before committing: `npm run check`
- Build locally to catch build errors: `npm run build`
- Test both frontend and backend in development mode
- Verify API endpoints work with proper HTTP methods

## Dependencies Management

- Use `npm install` for adding dependencies
- Keep dependencies up to date but test thoroughly
- Prefer lightweight libraries when possible
- Check bundle size impact for frontend dependencies
