# Backend Listing Service

A distributed microservices platform for automated car listing aggregation from Facebook Marketplace.

---

## Table of Contents

1. [Technologies Used](#technologies-used)
2. [API Details](#api-details)
3. [Architecture](#architecture)
4. [Low Level Design](#low-level-design)
5. [High Level Design](#high-level-design)
6. [Important Decisions](#important-decisions)
7. [Getting Started](#getting-started)
8. [Future Improvements](#future-improvements)

---

## Technologies Used

| Category | Technology | Purpose |
|----------|------------|---------|
| **Runtime** | Node.js 20 | JavaScript runtime |
| **Language** | TypeScript 5.7 | Type safety |
| **API Framework** | Express.js 4.21 | REST API server |
| **Database** | PostgreSQL 16 | Data persistence |
| **Message Broker** | RabbitMQ 3.13 | Async job queue |
| **Job Scheduler** | Graphile Worker | Cron-based task scheduling |
| **Browser Automation** | Playwright | Web scraping |
| **Validation** | Zod | Schema validation |
| **Query Builder** | Knex.js | SQL query construction |
| **Containerization** | Docker Compose | Service orchestration |

---

## API Details

**Base URL:** `http://localhost:8080/api/v1`

### Endpoints

#### Listings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/listings` | Get paginated listings with filters |
| `GET` | `/listings/:id` | Get single listing by ID |
| `PUT` | `/listings/:id` | Update a listing |
| `POST` | `/listings/refresh` | Trigger new scrape job |

#### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/jobs/:jobId` | Get job status |

### Query Parameters (GET /listings)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max: 100) |
| `minPrice` | number | - | Minimum price filter |
| `maxPrice` | number | - | Maximum price filter |
| `location` | string | - | Location filter |
| `yearMin` | number | - | Minimum year (1900-2100) |
| `yearMax` | number | - | Maximum year (1900-2100) |
| `status` | enum | - | `active`, `sold`, `hidden` |
| `vehicleType` | enum | - | `car`, `bike`, `truck`, `suv` |
| `sortBy` | enum | `createdAt` | `price`, `year`, `mileage`, `createdAt` |
| `sortOrder` | enum | `desc` | `asc`, `desc` |

### Example Request

```bash
curl "http://localhost:8080/api/v1/listings?minPrice=100000&maxPrice=500000&yearMin=2018&sortBy=price&sortOrder=asc&limit=10"
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND-LISTING                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ ListingAPI  │    │ Listing     │    │ Listing     │    │ Listing     │  │
│  │             │    │ Scheduler   │    │ Seeder      │    │ Extractor   │  │
│  │ REST API    │    │ Cron Jobs   │    │ URL         │    │ Data        │  │
│  │ :8080       │    │ Graphile    │    │ Discovery   │    │ Extraction  │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │         │
│         │                  │                  │                  │         │
│  ┌──────┴──────────────────┴──────────────────┴──────────────────┴──────┐  │
│  │                          RabbitMQ                                     │  │
│  │                     (Message Broker)                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                       │          │
│  ┌──────┴───────────────────────────────────────────────────────┴──────┐   │
│  │                         PostgreSQL                                   │   │
│  │                    (listings + jobs tables)                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Low Level Design

### Service Responsibilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LISTINGAPI SERVICE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Request → Router → Validator → Controller → Service → Database            │
│                                                                             │
│   ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐   │
│   │ Express  │→ │   Zod    │→ │ Controller │→ │ Service  │→ │   Knex   │   │
│   │ Routes   │  │ Schemas  │  │   Layer    │  │  Layer   │  │ Queries  │   │
│   └──────────┘  └──────────┘  └────────────┘  └──────────┘  └──────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         LISTINGSEEDER SERVICE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   RabbitMQ → Consumer → Processor → Browser → Publisher                     │
│                                                                             │
│   ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐   │
│   │ Discovery│→ │ Consumer │→ │ Playwright │→ │ Extract  │→ │ Publish  │   │
│   │  Queue   │  │          │  │  Browser   │  │   URLs   │  │ to Queue │   │
│   └──────────┘  └──────────┘  └────────────┘  └──────────┘  └──────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        LISTINGEXTRACTOR SERVICE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   RabbitMQ → Consumer → Processor → Browser → Database                      │
│                                                                             │
│   ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐   │
│   │Extraction│→ │ Consumer │→ │ Playwright │→ │ Parse &  │→ │  Upsert  │   │
│   │  Queue   │  │          │  │  Browser   │  │ Validate │  │ Database │   │
│   └──────────┘  └──────────┘  └────────────┘  └──────────┘  └──────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
                         ┌─────────────────┐
                         │   Scheduler     │
                         │  (Cron: 0 * * *)│
                         └────────┬────────┘
                                  │ Every hour
                                  ▼
                    ┌─────────────────────────┐
                    │    discovery_queue      │
                    │    { url, jobId }       │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       Seeder            │
                    │  • Navigate to URL      │
                    │  • Infinite scroll      │
                    │  • Extract listing URLs │
                    └────────────┬────────────┘
                                 │ For each URL
                                 ▼
                    ┌─────────────────────────┐
                    │    extraction_queue     │
                    │  { url, location }      │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      Extractor          │
                    │  • Open listing page    │
                    │  • Extract details      │
                    │  • Validate data        │
                    │  • Upsert to DB         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      PostgreSQL         │
                    │    listings table       │
                    └─────────────────────────┘
```

---

## High Level Design

### System Overview

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENTS                                          │
│                     (Web App / Mobile App / Admin Dashboard)                        │
└───────────────────────────────────────┬────────────────────────────────────────────┘
                                        │ HTTP/REST
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                               LISTING API (Port 8080)                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  GET /listings │  │ GET /listings/ │  │ PUT /listings/ │  │POST /listings/ │    │
│  │  (paginated)   │  │     :id        │  │     :id        │  │    refresh     │    │
│  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘    │
└───────────────────────────────────────┬────────────────────────────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
           ▼                            ▼                            ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────────────┐
│     PostgreSQL      │    │      RabbitMQ       │    │    BACKGROUND WORKERS       │
│  ┌───────────────┐  │    │  ┌───────────────┐  │    │  ┌───────────────────────┐  │
│  │   listings    │  │    │  │ discovery_q   │──┼────┼─▶│   Listing Seeder      │  │
│  │   (data)      │  │    │  └───────────────┘  │    │  │   (URL Discovery)     │  │
│  ├───────────────┤  │    │  ┌───────────────┐  │    │  └───────────────────────┘  │
│  │ graphile_     │  │    │  │ extraction_q  │──┼────┼─▶│   Listing Extractor   │  │
│  │ worker_jobs   │  │    │  └───────────────┘  │    │  │   (Data Extraction)   │  │
│  └───────────────┘  │    │  ┌───────────────┐  │    │  └───────────────────────┘  │
│         ▲           │    │  │ DLX (errors)  │  │    │  ┌───────────────────────┐  │
│         │           │    │  └───────────────┘  │    │  │   Listing Scheduler   │  │
│         └───────────┼────┼─────────────────────┼────┼──│   (Cron Jobs)         │  │
│                     │    │                     │    │  └───────────────────────┘  │
└─────────────────────┘    └─────────────────────┘    └─────────────────────────────┘
```

### Queue Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RABBITMQ QUEUES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  discovery_queue ─────────────────────▶ discovery_queue_dlx                 │
│  (marketplace URLs)                     (failed discovery jobs)             │
│       │                                                                     │
│       │ Seeder publishes                                                    │
│       ▼                                                                     │
│  extraction_queue ────────────────────▶ extraction_queue_dlx                │
│  (individual listing URLs)              (failed extraction jobs)            │
│                                                                             │
│  Exchange: listing_exchange (direct)                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Important Decisions

### 1. Microservices over Monolithic

**Decision:** Split into 4 independent services

**Rationale:**
- **Independent scaling** - Extractor can scale separately during high load
- **Fault isolation** - Seeder failure doesn't affect API availability
- **Technology flexibility** - Each service can use optimal dependencies
- **Deployment independence** - Update Extractor without touching API

### 2. RabbitMQ for Job Distribution

**Decision:** Message queue instead of direct HTTP calls

**Rationale:**
- **Decoupling** - Services don't need to know about each other
- **Reliability** - Jobs persist even if workers are down
- **Load balancing** - Multiple workers can consume from same queue
- **Dead Letter Queue** - Failed jobs are preserved for debugging

### 3. Graphile Worker for Scheduling

**Decision:** PostgreSQL-backed scheduler over Redis/cron

**Rationale:**
- **Single database** - No additional infrastructure (Redis)
- **ACID compliance** - Job state is transactional
- **Built-in retry** - Automatic exponential backoff
- **Cron support** - Native cron expression scheduling

### 4. Playwright over Puppeteer

**Decision:** Playwright for browser automation

**Rationale:**
- **Multi-browser** - Chrome, Firefox, WebKit support
- **Auto-wait** - Built-in waiting for elements
- **Modern API** - Better TypeScript support
- **Stealth** - Less detection by anti-bot systems

### 5. Upsert with External ID

**Decision:** Deduplicate using `externalId` from source URL

**Rationale:**
- **Idempotent** - Re-running extraction updates existing records
- **Unique constraint** - Database enforces uniqueness
- **Efficient** - Single query for insert or update

### 6. Dead Letter Queues for Failures

**Decision:** Route failed messages to DLX instead of retry loops

**Rationale:**
- **No infinite loops** - Failed jobs don't block the queue
- **Debugging** - Failed messages preserved for inspection
- **Clean queues** - Main queues stay healthy

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Facebook account credentials (for Marketplace access)

### 1. Clone Repository

```bash
git clone <repository-url>
cd backend-listing
```

### 2. Configure Environment

Create `.env` file in the root directory:

```env
# Database
POSTGRES_USER=test1
POSTGRES_PASSWORD=test1
POSTGRES_DB=listingdb
POSTGRES_PORT=5432

# RabbitMQ
RABBITMQ_USER=test1
RABBITMQ_PASSWORD=test1
RABBITMQ_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672

# API
NODE_ENV=development
API_PORT=8080

# Scraping (REQUIRED)
SCRAPE_URL=https://www.facebook.com/marketplace/cebu/vehicles
FACEBOOK_USERNAME=your_facebook_email
FACEBOOK_PASSWORD=your_facebook_password

# Worker
WORKER_CONCURRENCY=2
```

### 3. Start Services

```bash
docker compose up --build
```

### 4. Verify Services

| Service | URL | Purpose |
|---------|-----|---------|
| API | http://localhost:8080/health | Health check |
| API Docs | http://localhost:8080/api/v1/listings | Listings endpoint |
| RabbitMQ | http://localhost:15672 | Queue management UI |

### 5. Trigger Manual Scrape

```bash
curl -X POST http://localhost:8080/api/v1/listings/refresh \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.facebook.com/marketplace/cebu/vehicles"}'
```

---

## Future Improvements

### Performance Optimizations
- [ ] **Browser pool** - Reuse browser instances instead of launching per-job
- [ ] **Batch database inserts** - Bulk upsert instead of individual queries
- [ ] **Redis caching** - Cache frequently accessed listings

### Reliability Enhancements
- [ ] **Retry with backoff** - Exponential retry for transient failures
- [ ] **Circuit breaker** - Prevent cascade failures during outages
- [ ] **Health monitoring** - Prometheus metrics and Grafana dashboards

### Extraction Improvements
- [ ] **Image download** - Store listing images in S3/CloudStorage
- [ ] **ML-based parsing** - Use NLP for better title/description extraction
- [ ] **Proxy rotation** - Avoid IP blocking with proxy pool

### Feature Additions
- [ ] **Multi-source support** - Add Carousell, OLX scrapers
- [ ] **Price history** - Track price changes over time
- [ ] **Notifications** - Alert users on new listings matching criteria
- [ ] **Admin dashboard** - UI for job management and monitoring

### Infrastructure
- [ ] **Kubernetes** - Deploy to K8s for production scaling
- [ ] **CI/CD** - Automated testing and deployment pipeline
- [ ] **Log aggregation** - Centralized logging with ELK stack

---

## License

MIT

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

