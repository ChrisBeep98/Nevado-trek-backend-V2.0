# Project Context

## Purpose
Nevado Trek Backend is a complete reservation system for adventure tour management with bilingual support, anonymous booking, and advanced admin management. The system enables tour operators to manage bookings, events, and customer information for adventure tours in Colombia, with special emphasis on tours to locations like the Nevado del Tolima. It provides both public-facing booking capabilities and a comprehensive admin panel for managing all aspects of the tour business including tour creation, booking management, event scheduling, and capacity control.

## Tech Stack
- **Backend Framework**: Firebase Cloud Functions (Node.js 22)
- **Database**: Google Cloud Firestore (NoSQL)
- **Authentication**: Secret key headers (X-Admin-Secret-Key)
- **Runtime Environment**: Google Cloud Run (2nd Gen)
- **SDKs**: Firebase Admin SDK (v12.7.0), Firebase Functions SDK (v6.4.0)
- **Development Tools**: ESLint for linting, npm for package management

## Project Conventions

### Code Style
- Uses JavaScript (ES6+) with consistent formatting and linting via ESLint
- Function and variable names use camelCase
- Modular architecture with separate files for constants, validators, helpers, and audit functions
- Proper documentation with JSDoc-style comments for functions explaining parameters and return values
- Error handling with specific error messages and HTTP status codes
- Consistent indentation and formatting following Google JavaScript style guide
- Use of const for variable declarations when possible, let when variables need to be reassigned

### Architecture Patterns
- Microservices architecture using Firebase Cloud Functions
- Separation of concerns with modularized code in the src/ directory
- Firestore database with three main collections: tours, tourEvents, and bookings
- Event-driven architecture with pub/sub patterns for handling booking changes
- Data denormalization strategy to optimize read operations
- Transaction-based operations for data consistency during booking and capacity updates
- Rate limiting implementation using a separate rateLimiter collection
- CQRS (Command Query Responsibility Segregation) pattern with separate read and write operations

### Testing Strategy
- Comprehensive API testing using dedicated test files (comprehensive_api_test_v2.js, comprehensive_admin_tests.js)
- Integration testing for all endpoints to ensure functionality
- End-to-end testing of booking workflows and admin operations
- Testing of rate limiting and security controls
- Validation testing for all input data
- Error scenario testing to ensure proper error handling
- Capacity management and event synchronization testing

### Git Workflow
- Feature branch workflow with descriptive branch names
- Commit messages follow conventional format with brief description of changes
- Deployment via Firebase CLI with proper environment configuration
- Secret management via Firebase parameters system instead of config
- Gitignore used to exclude sensitive files and build artifacts

## Domain Context
The system manages three core concepts: Tours (general tour experiences), Events (specific instances of tours on specific dates), and Bookings (customer reservations). Every initial booking creates a private event, and events can be toggled between private (not joinable) and public (others can join). Tours have bilingual names, descriptions, and other content stored in both Spanish and English. The system includes rate limiting to prevent spam and timezone handling for Colombia locale (UTC-5).

## Important Constraints
- All admin endpoints require X-Admin-Secret-Key header for authentication
- Public booking endpoints have IP-based rate limiting (5 minutes between requests, 3/hour, 5/day per IP)
- Timezone-aware date handling specifically for Colombia locale (UTC-5)
- Capacity validation to prevent overbooking of events
- Bilingual content requirements for all customer-facing information
- Transaction-based operations for data consistency during booking changes
- Maximum 100 participants per booking (pax validation)
- Firestore-specific limitations on complex queries and array operations

## External Dependencies
- **Google Cloud Platform**: For hosting Firebase Functions and Firestore
- **Firebase Admin SDK**: For server-side access to Firebase services
- **Firebase Functions SDK**: For creating and deploying Cloud Functions
- **Firebase Parameters System**: For storing admin secret key securely
- **Google Cloud Run**: As the runtime environment for functions
- **Client Applications**: Frontend applications that consume the API endpoints
