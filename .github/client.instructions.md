# Client-Side Instructions

This file contains Copilot instructions specific to the frontend React application in the `client/` directory.

## Path Scope
Applies to: `client/**/*`

## Frontend Architecture

### Component Structure
- All React components should be functional components with TypeScript
- Use named exports for components (not default exports)
- Place reusable UI components in `client/src/components/ui/`
- Place dashboard-specific components in `client/src/components/dashboard/`
- Place form components in `client/src/components/forms/`

### State Management
- **Server State**: Use TanStack Query (`useQuery`, `useMutation`) for all API calls
- **Form State**: Use React Hook Form with Zod validation via `@hookform/resolvers/zod`
- **Local UI State**: Use React hooks (`useState`, `useReducer`, `useContext`)
- Never use Redux or other state management libraries - the project uses TanStack Query

### API Client
- All API calls should use the client from `@/lib/api`
- API endpoints are prefixed with `/api/`
- Always handle loading and error states in components using API data

### Styling Guidelines
- **Primary**: Use Tailwind CSS utility classes for all styling
- Use the `cn()` utility from `@/lib/utils` for conditional class names
- Custom brand colors: `xtab-blue`, `xtab-indigo`, `xtab-emerald`
- Follow the design system defined in `tailwind.config.ts`
- Theme colors are CSS variables in `client/src/index.css`

### Form Development
1. Define Zod schema for validation (in component or `shared/schema.ts`)
2. Use React Hook Form with `useForm` hook
3. Apply `zodResolver` for validation integration
4. Use shadcn/ui form components (`Form`, `FormField`, `FormItem`, etc.)
5. Handle submission with TanStack Query's `useMutation`

### Component Library
- Use **shadcn/ui** components from `@/components/ui/` (based on Radix UI)
- These are pre-configured with proper accessibility and theming
- Available components include: Button, Input, Select, Dialog, Card, etc.
- Don't add new UI libraries - extend existing shadcn/ui components

### Routing
- Uses **Wouter** for client-side routing (not React Router)
- Define routes in `client/src/App.tsx`
- Use `<Link>` for navigation, `useLocation` for current route

### Import Aliases
- Use `@/` prefix for client code imports (e.g., `@/components/ui/button`)
- Use `@shared/` prefix for shared types and schemas (e.g., `@shared/schema`)

### Performance Best Practices
- Use `React.memo()` for expensive component re-renders
- Use `useMemo()` for expensive computations
- Use `useCallback()` for function props to prevent re-renders
- Lazy load pages with `React.lazy()` if bundle size grows

### Accessibility
- Always use semantic HTML elements
- Add proper ARIA labels to interactive elements
- Ensure keyboard navigation works for all interactive components
- Test with screen readers when adding complex interactions
