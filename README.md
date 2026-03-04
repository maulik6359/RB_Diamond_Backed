# Diamond Packet Management System - Backend

Production-ready SaaS backend for managing diamond inventory, ownership transfers, and valuations with enterprise-grade security and multi-tenancy support.

## Architecture Overview

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT (15-minute access tokens, 7-day refresh)
- **Authorization**: RBAC with 5 roles (owner, admin, manager, appraiser, viewer)
- **Logging**: Winston with file rotation

### Multi-Tenancy Architecture
- **Strategy**: Schema-per-tenant (separate database schema per company)
- **Isolation**: Complete data isolation at database level
- **Scaling**: Supports unlimited tenants
- **Public Schema**: Shared tenant metadata, subscriptions, API keys, audit logs

### Folder Structure
```
src/
├── controllers/          # HTTP request handlers
├── services/            # Business logic layer
├── repositories/        # Data access layer
├── middleware/          # HTTP middleware (auth, logging, error)
├── config/              # Environment configuration
├── types/               # TypeScript types & interfaces
├── schemas/             # Joi validation schemas
├── utils/               # Helper utilities (logger, JWT, password)
├── routes/              # API route definitions
└── index.ts             # Express app entry point
```

## Setup Instructions

### 1. Prerequisites
```bash
# Node.js 18+ and npm
node --version  # v18.0.0 or higher
npm --version   # 9.0.0 or higher

# PostgreSQL 14+
psql --version
```

### 2. Installation
```bash
# Clone repository
cd /home/crk/workspace/ek/ek-site-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Update .env.local with your configuration
```

### 3. Configuration
Edit `.env.local` and set:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Generate with `openssl rand -base64 32`
- `JWT_REFRESH_SECRET`: Generate with `openssl rand -base64 32`

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Open Prisma Studio for data inspection
npm run db:studio
```

### 5. Start Development Server
```bash
# Start with hot reload
npm run dev

# Server runs on http://localhost:3000
# API available at http://localhost:3000/api/v1
# Health check: http://localhost:3000/health
```

### 6. Build for Production
```bash
# Compile TypeScript
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register         - Register new tenant & user
POST   /api/v1/auth/login            - Login with email/password
POST   /api/v1/auth/refresh          - Refresh access token
POST   /api/v1/auth/logout           - Logout
POST   /api/v1/auth/change-password  - Change password
GET    /api/v1/auth/validate         - Validate token
```

### Packets (Diamond Inventory)
```
POST   /api/v1/packets               - Create new packet
GET    /api/v1/packets/:id           - Get packet details
GET    /api/v1/packets/search        - Search packets with filters
PUT    /api/v1/packets/:id           - Update packet
DELETE /api/v1/packets/:id           - Delete packet (soft delete)
GET    /api/v1/packets/inventory/stats - Get inventory statistics
```

### Transactions (Ownership Transfers)
```
POST   /api/v1/transactions          - Create transaction
PUT    /api/v1/transactions/:id/complete - Mark transaction complete
GET    /api/v1/packets/:packetId/transactions - Get transaction history
GET    /api/v1/transactions/pending  - List pending transactions
```

### Inventory
```
GET    /api/v1/inventory             - Get inventory summary
GET    /api/v1/inventory/by-status   - Get packets by status (paginated)
GET    /api/v1/inventory/value       - Get value breakdown
```

### Audit
```
GET    /api/v1/audit-logs            - Get audit trail (paginated)
```

## Authentication Flow

### 1. Register
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "companyName": "Diamond Co Ltd",
  "email": "owner@diamondco.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}

# Response
{
  "success": true,
  "data": {
    "user": { id, email, firstName, lastName, tenantId, role: "owner" },
    "tenant": { id, name, tier: "starter" },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

### 2. Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "owner@diamondco.com",
  "password": "SecurePass123!"
}

# Response includes accessToken (valid 15 min) and refreshToken (valid 7 days)
```

### 3. Using Access Token
```bash
GET /api/v1/packets
Authorization: Bearer {accessToken}
```

### 4. Refresh Token
```bash
POST /api/v1/auth/refresh
X-Refresh-Token: {refreshToken}

# Returns new accessToken
```

## Request Validation

### Create Packet Example
```bash
POST /api/v1/packets
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "caratWeight": 1.5,
  "clarity": "VVS1",          # Options: FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1
  "color": "D",               # D-Z scale
  "pricePerCarat": 5000,
  "certificationBody": "GIA", # Options: GIA, AGS, EGL, IGI
  "certificationNumber": "GIA123456",
  "description": "Premium quality diamond",
  "location": "Vault A"
}

# Auto-generated fields
{
  "packetNumber": "DMD-20240115-00001"  # Format: DMD-YYYYMMDD-XXXXX
}
```

### Search Packets Example
```bash
GET /api/v1/packets/search?status=available&clarityMin=VS1&caratMin=1&caratMax=5&page=1&pageSize=20
Authorization: Bearer {accessToken}

# Filters: status, clarity, color, caratMin/Max, priceMin/Max, text search
# Response: paginated results with total count
```

## Middleware Stack

Requests flow through middleware in order:
1. **requestIdMiddleware** - Generates unique request ID for tracing
2. **authenticateJWT** - Validates JWT token (if required)
3. **optionalAuth** - Attempts auth but doesn't fail
4. **requireRole** - Checks user role (owner, admin, etc.)
5. **requirePermission** - Checks specific permission
6. **requestLogger** - Logs request details
7. **errorHandler** - Catches and formats errors

## Error Handling

All errors follow standardized format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [...]
  },
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Types & Status Codes
- `ValidationError` → 400 Bad Request
- `NotFoundError` → 404 Not Found
- `UnauthorizedError` → 401 Unauthorized
- `ForbiddenError` → 403 Forbidden
- `ConflictError` → 409 Conflict
- `BusinessError` → 422 Unprocessable Entity
- `ServerError` → 500 Internal Server Error

## Database Schema

### Public Schema (Shared)
- **Tenant**: Companies/organizations with subscription info
- **Subscription**: Billing records
- **ApiKey**: Programmatic access tokens
- **AuditLog**: Cross-tenant audit trail

### Tenant Schema (Per-tenant)
- **User**: Team members with roles
- **Role**: RBAC configuration
- **Permission**: Granular permissions
- **Packet**: Diamond inventory (carat, clarity, color, certifications)
- **PacketTransaction**: Ownership transfers, sales, appraisals
- **Inventory**: Summary statistics
- **InventoryLog**: Audit trail for changes
- **Appraisal**: Professional valuations
- **Valuation**: Price history
- **Report**: Generated reports
- **UserAuditLog**: User action tracking
- **UsageMetric**: Feature usage for tier enforcement

## Security Features

### Authentication & Authorization
- JWT-based stateless authentication
- Refresh token rotation
- RBAC with 5 predefined roles
- Granular permission system
- Role-based endpoint protection

### Data Protection
- Password hashing with bcrypt (12 salt rounds)
- SQL injection prevention via Drizzle ORM
- CORS configuration per environment
- Helmet.js for security headers
- Rate limiting on sensitive endpoints

### Audit & Compliance
- Complete audit trail for all mutations
- Before/after change tracking
- User action logging
- Tenant data isolation
- Encrypted sensitive fields (optional)

### Multi-Tenancy Isolation
- Schema-per-tenant database isolation
- Tenant ID validation on all queries
- Cross-tenant request prevention
- Separate encryption keys per tenant (optional)

## Production Deployment

### Prerequisites
```bash
# Set production environment
NODE_ENV=production

# Generate strong JWT secrets
openssl rand -base64 32

# Configure PostgreSQL backups
pg_dump diamond_packet_db > backup.sql

```

### Environment Variables
```bash
# Copy production values
cp .env.example .env.production

# Required for production:
# - NODE_ENV=production
# - Production database URL with SSL
# - Strong JWT secrets (32+ chars)
# - CORS_ORIGIN set to production domain
```

### Database Backups
```bash
# Automatic backup strategy
# - Daily backups to S3
# - 30-day retention
# - Point-in-time recovery enabled

# Manual backup
pg_dump postgresql://user:pass@host/db | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Monitoring & Logging
```bash
# Application logs rotate daily, max 14 files
logs/
  ├── error.log          # Errors only
  ├── combined.log       # All logs
  └── [date].log         # Daily rotation

# Monitor with
tail -f logs/error.log
tail -f logs/combined.log
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/services/__tests__/packet.service.test.ts

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## Performance Considerations

### Query Optimization
- Indexed searches on `status`, `clarity`, `color`, `caratWeight`
- Full-text search on packet descriptions
- Pagination enforced (max 100 items per request)

### Database Connection Pooling
- Min: 2, Max: 10 connections (configurable)
- Automatic reconnect on failure
- Idle timeout: 30 seconds

### Rate Limiting
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user
- Custom limits per endpoint (optional)

## Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql $DATABASE_URL

# Push schema changes
npm run db:push

# Generate migrations
npm run db:generate
```

### JWT Token Issues
```bash
# Validate token format
curl -X GET http://localhost:3000/api/v1/auth/validate \
  -H "Authorization: Bearer {token}"

# Check token expiration
node -e "console.log(new Date(require('jsonwebtoken').decode('{token}').exp * 1000))"
```

### Performance Issues
```bash
# Check database query performance
npm run db:studio  # Open Drizzle Studio for analysis

# Check logs for slow queries
grep "SLOW" logs/combined.log
```

## Support & Documentation

- **API Documentation**: [Swagger/OpenAPI] (to be added)
- **GitHub Issues**: Report bugs and request features
- **Contributing**: See CONTRIBUTING.md
- **License**: MIT

## License

MIT License - See LICENSE file for details
