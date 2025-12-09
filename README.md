# Backend Listing Service

A distributed microservices platform for automated car listing from Facebook Marketplace.

---

## Table of Contents

1. [Technologies Used](#technologies-used)
2. [API Details](#api-details)
3. [Data Flow](#ldata-flow)
4. [High Level Design](#high-level-design)
5. [Important Decisions](#important-decisions)
6. [Future Improvements](#future-improvements)
7. [Getting Started](#getting-started)

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


---

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

---

## Future Improvements

### Performance Optimizations
- [ ] **Browser pool** - Reuse browser instances instead of launching per-job
- [ ] **Batch database inserts** - Bulk upsert instead of individual queries
- [ ] **Redis caching** - Cache frequently accessed listings

### Reliability Enhancements
- [ ] **Retry with backoff** - Exponential retry for transient failures

### Extraction Improvements
- [ ] **AI based parsing** - Use NLP for better listing extraction
- [ ] **Proxy rotation** - Avoid IP blocking with proxy pool

### Feature Additions
- [ ] **Price history** - Track price changes over time
- [ ] **Notifications** - Alert users on new listings matching criteria
- [ ] **Admin dashboard** - UI for job management and monitoring

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

Copy `.env` from `.env.example` file in the root directory, ListingAPI, ListingSeeder, ListingExtractor, ListingScheduler
Replace these env variables FACEBOOK_USERNAME, FACEBOOK_PASSWORD, SCRAPE_URL

### 3. Start backend

```bash
npm run dev
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
  -d '{"url": "https://www.facebook.com/marketplace/manila/cars?minPrice=300000&maxPrice=300001&exact=true"}'
```
