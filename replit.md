# Overview

This is a cloth shop management system built as a full-stack web application. The system provides an admin panel for managing multiple clothing shops, each with their own MongoDB database for storing product catalogs. It features a React frontend with shadcn/ui components, an Express.js backend, and authentication capabilities. The application allows administrators to create and manage shops, maintain product inventories, and monitor system statistics through a comprehensive dashboard.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy using session-based auth
- **Session Storage**: MongoDB session store using connect-mongo
- **Password Security**: Node.js crypto module with scrypt for password hashing
- **API Design**: RESTful endpoints with proper error handling middleware

## Data Storage Solutions
- **Primary Database**: MongoDB for user authentication and shop metadata
- **Shop Databases**: Each shop has its own MongoDB database for product storage
- **Database Client**: Native MongoDB driver (@neondatabase/serverless package suggests Neon compatibility)
- **Schema Validation**: Zod schemas for runtime type checking and validation
- **Connection Management**: Individual MongoDB connections per shop for data isolation

## Authentication and Authorization
- **Strategy**: Session-based authentication using Passport.js local strategy
- **Password Storage**: Salted and hashed passwords using scrypt algorithm
- **Session Security**: HTTP-only cookies with secure flag in production
- **Protection**: Route-level authentication middleware for API endpoints
- **User Roles**: Admin and user roles defined in schema

## External Dependencies

### Database Services
- **MongoDB**: Primary database for user data and shop metadata
- **Individual Shop Databases**: Separate MongoDB instances per shop for product data

### UI and Styling
- **Radix UI**: Comprehensive set of accessible UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Fast development server and build tool
- **ESBuild**: Fast JavaScript bundler for production builds
- **Drizzle Kit**: Database toolkit (configured but may not be actively used)

### Authentication and Security
- **Passport.js**: Authentication middleware
- **express-session**: Session management
- **connect-mongo**: MongoDB session store

### Data Management
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management
- **Zod**: Runtime schema validation
- **date-fns**: Date manipulation utilities

The architecture follows a multi-tenant pattern where each shop operates with its own isolated database while sharing the common admin interface and user management system.