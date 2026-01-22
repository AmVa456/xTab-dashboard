# Server-Side Instructions

This file contains Copilot instructions specific to the backend Express application in the `server/` directory.

## Path Scope
Applies to: `server/**/*`

## Backend Architecture

### API Routes
- All routes defined in `server/routes.ts`
- Follow RESTful conventions:
  - GET for retrieving data
  - POST for creating resources
  - PUT for updating resources
  - DELETE for removing resources
- All API routes are prefixed with `/api/`
- Return appropriate HTTP status codes:
  - 200: Success (GET, PUT)
  - 201: Created (POST)
  - 400: Bad Request (validation errors)
  - 404: Not Found
  - 500: Server Error

### Request Validation
- **Always** validate request bodies using Zod schemas from `shared/schema.ts`
- Use `.safeParse()` for validation and return 400 on errors
- Validate query parameters when filtering data
- Example:
  ```typescript
  const result = insertPostSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  ```

### Storage Layer
- All data access goes through the `IStorage` interface in `server/storage.ts`
- Current implementation: In-memory storage for development
- All storage methods return Promises
- When adding new data operations:
  1. Add method to `IStorage` interface
  2. Implement in `InMemoryStorage` class
  3. Call from route handlers

### Error Handling
- **Always** wrap async operations in try-catch blocks
- Return consistent error response format:
  ```typescript
  res.status(500).json({ error: "Error message" })
  ```
- Log errors to console for debugging
- Never expose internal error details to client in production

### Database Integration
- Schema defined in `shared/schema.ts` using Drizzle ORM
- To sync schema changes: run `npm run db:push`
- Use `createInsertSchema()` from drizzle-zod for validation schemas
- Export both schemas and TypeScript types

### WebSocket Support
- WebSocket available for real-time updates (optional feature)
- Currently set up but not actively used in routes

### Session Management
- Uses `express-session` with in-memory store
- Session configuration in `server/index.ts`

### Async/Await
- **Always** use async/await for asynchronous operations
- Never use callbacks or raw Promises without await
- Mark route handlers as `async` when using await

### Import Paths
- Use `@shared/` for importing shared schemas and types
- Relative imports for server-local modules

### Development vs Production
- Check `process.env.NODE_ENV` for environment-specific logic
- Use environment variables for configuration (never hardcode)

### Common Patterns

#### Creating a New API Endpoint
1. Add route in `server/routes.ts`
2. Add storage method in `IStorage` interface
3. Implement storage method in `InMemoryStorage`
4. Validate request with Zod schema
5. Call storage method
6. Return appropriate response

#### Adding Database Table
1. Define schema in `shared/schema.ts` with Drizzle
2. Create insert schema with `createInsertSchema()`
3. Export types using `typeof` and `InferModel`
4. Run `npm run db:push` to sync changes
5. Update storage interface and implementation
