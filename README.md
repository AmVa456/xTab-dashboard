# xTab - Social Media Post Management Dashboard

A modern, full-stack web application for managing posts across multiple social media platforms, forums, and blogs. Built with React, TypeScript, Express.js, and Tailwind CSS.

![xTab Dashboard](https://img.shields.io/badge/Status-Ready%20to%20Deploy-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)

## 🌐 Live Demo

**Frontend Demo**: [https://amva456.github.io/xTab-dasboard/](https://amva456.github.io/xTab-dasboard/)

> **Note**: The live demo is a static frontend-only version with sample data. For full functionality including backend features (create, edit, delete posts), see the [Full Deployment](#-full-deployment) section below.

## Features

✨ **Multi-Platform Management**
- Support for Reddit, Twitter, LinkedIn, Medium, and more
- Platform connection status monitoring
- Visual platform identification with color coding

📊 **Analytics Dashboard**
- Real-time engagement metrics
- Post performance tracking
- Best performing platform insights
- Weekly activity summaries

📝 **Post Management**
- Create, edit, and delete posts
- Draft, scheduled, and published status tracking
- Bulk scheduling capabilities
- Rich text content editing

🔍 **Advanced Filtering**
- Search posts by title or content
- Filter by platform and status
- Category-based navigation (Forums, Blogs, Social)
- Real-time table updates

📱 **Modern UI/UX**
- Responsive design for all devices
- Dark/light theme support
- Smooth animations and transitions
- Accessible components with proper ARIA labels

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Radix UI** for accessible primitives
- **TanStack Query** for state management
- **React Hook Form** with Zod validation
- **Wouter** for lightweight routing

### Backend
- **Express.js** with TypeScript
- **In-memory storage** with interface-based design
- **Drizzle ORM** for type-safe database operations
- **Zod** for runtime validation
- **WebSocket** support for real-time updates

### Development Tools
- **TypeScript** for type safety
- **ESLint** and **Prettier** for code quality
- **Vite** with HMR for instant feedback
- **Path mapping** for clean imports

## Quick Start

### Prerequisites
- Node.js 20+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/amva456/xtab-dashboard.git
cd xtab-dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5000` to see the application.

## Project Structure

```
xtab-dashboard/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── dashboard/  # Dashboard-specific components
│   │   │   ├── forms/      # Form components
│   │   │   └── ui/         # Base UI components (shadcn)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configs
│   │   ├── pages/          # Application pages
│   │   └── App.tsx         # Main application component
│   └── index.html          # HTML entry point
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data storage interface and implementation
│   └── vite.ts            # Vite integration for development
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema and validation
└── package.json           # Dependencies and scripts
```

## API Endpoints

### Platforms
- `GET /api/platforms` - Get all platforms
- `POST /api/platforms` - Create a new platform
- `PUT /api/platforms/:id` - Update platform

### Posts
- `GET /api/posts` - Get all posts with optional filtering
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts` - Create a new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Analytics
- `GET /api/analytics` - Get dashboard analytics

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # Type check with TypeScript
npm run db:push      # Push database schema (if using database)
```

### Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
```

### Adding New Platforms

1. Add platform configuration in `server/storage.ts`:
```typescript
{ 
  id: "platform-id", 
  name: "Platform Name", 
  type: "social", // or "forum", "blog"
  color: "bg-blue-500", 
  isConnected: 1 
}
```

2. The platform will automatically appear in the UI.

### Customizing the UI

The application uses Tailwind CSS with a custom design system:
- Colors are defined in `client/src/index.css`
- Component styles use the shadcn/ui system
- Custom gradients and animations for branding

## Database Integration

Currently uses in-memory storage for development. To integrate with a real database:

1. Update the `IStorage` interface in `server/storage.ts`
2. Implement database operations using Drizzle ORM
3. Configure your database connection
4. Run migrations with `npm run db:push`

## Contributing

This project includes comprehensive [GitHub Copilot instructions](.github/copilot-instructions.md) to help AI assistants understand the codebase structure, conventions, and best practices.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

When using GitHub Copilot, the AI will automatically use the project-specific instructions to provide better suggestions aligned with our coding standards.

## 🚀 Deployment

### GitHub Pages (Frontend Only)

The frontend is automatically deployed to GitHub Pages on every push to the `main` branch. The deployment:
- Builds the React frontend with Vite
- Deploys to `https://amva456.github.io/xTab-dasboard/`
- Uses mock data for demonstration
- Shows a banner indicating it's a static demo

The GitHub Actions workflow is configured in `.github/workflows/deploy-frontend.yml`.

### 🌟 Full Deployment

For a complete deployment with backend functionality, you'll need:

1. **Backend Hosting** (choose one):
   - **Render**: 
     - Create a new Web Service
     - Connect your repository
     - Build command: `npm install && npm run build`
     - Start command: `npm start`
     - Add environment variables (see below)
   
   - **Railway**:
     - Create a new project from GitHub
     - Railway auto-detects the build configuration
     - Add environment variables
   
   - **Heroku**:
     - Create a new app
     - Connect to GitHub repository
     - Enable automatic deploys from `main` branch

2. **Database Setup**:
   - Set up PostgreSQL (most platforms offer managed databases)
   - Update `DATABASE_URL` in environment variables
   - Run migrations: `npm run db:push`

3. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=your_database_url
   SESSION_SECRET=your_secret_key
   ```

4. **Domain Configuration**:
   - Update the `base` path in `vite.config.ts` if deploying to a custom domain
   - Remove or adjust the base path for root domain deployments

### Local Development

For local development with full backend support:

```bash
# Install dependencies
npm install

# Start development server (includes both frontend and backend)
npm run dev

# Access at http://localhost:5000
```

### Production Build

To build both frontend and backend for production:

```bash
npm run build
```

This creates:
- Frontend: `dist/public/` (static files)
- Backend: `dist/index.js` (Node.js server)



## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the documentation
- Review the code comments for implementation details

---

Built with ❤️ for efficient social media management
