# Shared Code Instructions

This file contains Copilot instructions specific to shared code between frontend and backend in the `shared/` directory.

## Path Scope
Applies to: `shared/**/*`

## Purpose
The `shared/` directory contains code that is used by both the client and server:
- Database schema definitions
- Zod validation schemas
- Shared TypeScript types
- Common utilities

## Database Schema

### Schema Definition
- All schemas defined in `shared/schema.ts` using Drizzle ORM
- Use Drizzle's PostgreSQL dialect syntax
- Define tables with proper types and constraints

### Schema Pattern
```typescript
import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";

export const myTable = pgTable("my_table", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  count: integer("count").default(0),
});
```

### Validation Schemas
- Create Zod schemas using `createInsertSchema()` from drizzle-zod
- Export both insert schemas and select schemas when needed
- Example:
  ```typescript
  import { createInsertSchema } from "drizzle-zod";
  export const insertMyTableSchema = createInsertSchema(myTable);
  ```

### Type Exports
- Export TypeScript types derived from schemas
- Use Drizzle's type inference:
  ```typescript
  export type MyTable = typeof myTable.$inferSelect;
  export type InsertMyTable = typeof myTable.$inferInsert;
  ```

## Validation Rules

### Zod Best Practices
- Keep validation strict and comprehensive
- Use descriptive error messages
- Validate all required fields
- Set appropriate min/max lengths for strings
- Use `.email()`, `.url()`, etc. for specific formats
- Use `.refine()` for custom validation logic

### Schema Updates
When modifying schemas:
1. Update the Drizzle table definition
2. Update the Zod validation schema
3. Update TypeScript type exports
4. Run `npm run db:push` to sync database
5. Update both client and server code using the schema

## Import Usage
- Client imports: `import { schema } from "@shared/schema"`
- Server imports: `import { schema } from "../shared/schema"` or `import { schema } from "@shared/schema"`
- Both paths work due to path mapping in tsconfig.json

## Backward Compatibility
- When modifying existing schemas, ensure backward compatibility
- Add new fields as optional when possible
- Use database migrations for breaking changes
- Update API version if breaking changes are necessary

## Naming Conventions
- Tables: snake_case (e.g., `user_profiles`)
- Schemas: camelCase ending in Schema (e.g., `insertUserProfileSchema`)
- Types: PascalCase (e.g., `UserProfile`, `InsertUserProfile`)
