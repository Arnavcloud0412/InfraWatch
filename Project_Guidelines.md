# PROJECT: InfraWatch AI

## 1. Project Overview

Build InfraWatch AI, an AI-powered public infrastructure monitoring and intelligence platform.

The platform aims to aggregate publicly available infrastructure-related information from multiple sources, process unstructured announcements using AI agents, extract structured project information, correlate related reports, assess evidence quality, classify infrastructure importance, and present the results through an interactive intelligence dashboard.

The larger vision is to support infrastructure monitoring and high-level infrastructure resilience analysis for authorised government and defence stakeholders.

IMPORTANT: This is an internship selection prototype, not a production defence system.

### Prototype Scope
- Geographic coverage: Maharashtra, India only.
- Infrastructure categories: Roads, highways, expressways, railways, bridges, tunnels, ports, airports, hospitals, emergency healthcare, energy and utilities.
- Data sources: Official government sources, news APIs, public news websites and permitted social listening APIs.
- AI framework: Google Gemini Agent Development Kit (ADK).
- LLM: Gemini Flash.
- Database: PostgreSQL through Supabase.
- Frontend: Next.js 15.
- Hosting: Vercel for frontend and Next.js backend; Render or equivalent for the Python ADK service.

## 2. Core Functional Pipeline

Implement the following workflow:

1. Discover public infrastructure-related announcements.
2. Collect the original source content and metadata.
3. Detect language and process multilingual information.
4. Extract structured infrastructure project information.
5. Identify the infrastructure category and event type.
6. Correlate announcements that may refer to the same project.
7. Assess source evidence, corroboration and conflicting claims.
8. Calculate preliminary infrastructure criticality.
9. Store information with complete source provenance.
10. Present records in an interactive dashboard.
11. Allow human reviewers to accept, reject or request further verification.

Never automatically treat an AI-generated statement as an established fact.

## 3. Data Acquisition

Implement separate source adapters.

### A. Official sources
Initial sources:
- Maharashtra Public Works Department: https://pwd.maharashtra.gov.in/en/
- PIB: https://www.pib.gov.in/
- data.gov.in where relevant datasets are available.

Collect publicly available:
- Project declarations.
- Approvals and sanctions.
- Budget announcements.
- Official project milestones.
- Reported completion updates.

### B. OSINT and news sources
Initial sources:
- GDELT DOC API.
- News APIs if credentials are available.
- Publicly accessible news sources.
- Social listening APIs where authorised access is available.

GDELT API:
https://api.gdeltproject.org/api/v2/doc/doc

### C. Social listening
Create an adapter-based architecture for:
- X API.
- YouTube Data API.
- Reddit API where access is available.

Do not assume credentials exist.
Do not hardcode API keys.
Do not create fake integrations.

Use environment variables and clearly document unavailable integrations.

### D. Ingestion requirements
- Preserve original article text where legally and technically permitted.
- Store original source URLs.
- Store publisher and source type.
- Store publication and retrieval timestamps.
- Store original language.
- Prevent obvious duplicate ingestion.
- Preserve raw source evidence separately from extracted information.

For the MVP, support RSS/API ingestion and manual URL or text submission.

Do not attempt to build a nationwide crawler.

## 4. AI Architecture — Google Gemini ADK

Use Python Google ADK for agent orchestration.

Build a root orchestrator and specialised agents.

### Agent 1: Discovery Agent
Responsibilities:
- Search connected data sources.
- Retrieve infrastructure-related announcements.
- Filter irrelevant results.
- Return source metadata and content.

### Agent 2: Extraction Agent
Responsibilities:
- Identify project names.
- Identify state and geographical location.
- Identify infrastructure category.
- Extract investment and reported completion timelines.
- Identify event types.
- Extract relevant claims.
- Preserve original language and source attribution.

Use structured JSON output and Pydantic validation.

### Agent 3: Correlation Agent
Responsibilities:
- Identify potentially duplicate announcements.
- Determine whether different reports may refer to the same project.
- Compare names, geographical references and project attributes.
- Return candidate matches and matching rationale.

Do not automatically merge ambiguous projects.

### Agent 4: Evidence Review Agent
Responsibilities:
- Assess source type and provenance.
- Identify supporting and conflicting reports.
- Identify missing evidence.
- Distinguish official confirmation from secondary reporting.
- Recommend a verification state.

The agent must not independently declare information to be factually verified.

### Agent 5: Infrastructure Classification Agent
Responsibilities:
- Classify infrastructure category.
- Assign baseline criticality tier.
- Evaluate contextual factors.
- Provide a transparent classification rationale.

### Orchestration
Use ADK orchestration to coordinate the agents.

Prefer sequential workflows for the initial MVP.

Use deterministic Python functions for:
- Schema validation.
- Duplicate checks.
- Criticality calculations.
- Database operations.
- Verification state transitions.

Avoid unnecessary autonomous agent loops and excessive LLM calls.

## 5. Infrastructure Classification System

Implement hybrid infrastructure criticality classification.

Separate infrastructure category from criticality.

### Baseline taxonomy

Tier 1 — Critical Connectivity Infrastructure
- National highways.
- Major expressways.
- Major railway corridors.
- Major bridges and tunnels.
- Major ports.
- Major multimodal transport infrastructure.

Tier 2 — Essential Public Services
- Hospitals.
- Trauma centres.
- Emergency healthcare.
- Fire and emergency services.
- Water treatment facilities.
- Electricity distribution infrastructure.

Tier 3 — Economic and Industrial Infrastructure
- Industrial corridors.
- Manufacturing parks.
- Warehousing and logistics facilities.
- Commercial airports.
- Energy generation facilities.

Tier 4 — Regional and Community Infrastructure
- Municipal buildings.
- Local bus terminals.
- Community facilities.
- Local administrative infrastructure.

Tier 5 — General Development Infrastructure
- General urban development.
- Residential development.
- Local road improvements.
- Landscaping and other non-essential civic projects.

These are prototype categories, not official government classifications.

### Contextual adjustment

A baseline tier should be adjusted based on the individual project's civilian function and public-service significance.

Potential factors:
- Connectivity significance.
- Essential service importance.
- Economic significance.
- Public dependency.
- Emergency service relevance.

Use a configurable weighted scoring system.

Store:
- Baseline tier.
- Contextual score.
- Final proposed tier.
- Classification rationale.
- Classification method.
- Review status.

Do not use infrastructure criticality as a measure of information reliability.

## 6. Verification and Evidence Management

Maintain separate records for:
- Infrastructure projects.
- Sources.
- Events.
- Evidence and extracted claims.

Verification states:
- Newly detected.
- Under verification.
- Corroborated.
- Officially confirmed.
- Conflicting.
- Rejected.

Important rules:
- Multiple publications repeating one press release are not independent corroboration.
- Preserve conflicting claims.
- Never overwrite official project records based on unverified news.
- Preserve the original source URL and publication date.
- Maintain an auditable history of analyst decisions.

Provide a manual verification interface.

## 7. Project Lifecycle

Support the following proposed lifecycle states:

- Proposed.
- Approved / Sanctioned.
- Tendering.
- Construction Started.
- Under Construction.
- Partially Operational.
- Completed / Operational.
- On Hold.
- Cancelled.

Lifecycle status and evidence verification status must be separate fields.

Do not automatically change lifecycle status based on an unverified report.

## 8. Database Design

Use PostgreSQL.

Initial tables:

### projects
- id
- project_name
- description
- state
- district
- location_name
- latitude
- longitude
- infrastructure_category
- baseline_criticality_tier
- contextual_criticality_score
- proposed_criticality_tier
- lifecycle_status
- investment_amount
- currency
- expected_completion_date
- created_at
- updated_at

### sources
- id
- source_url
- publisher
- source_type
- language
- published_at
- retrieved_at
- raw_content
- content_hash

### events
- id
- project_id
- source_id
- event_type
- reported_claim
- extracted_data
- evidence_status
- event_date
- created_at

### evidence
- id
- event_id
- source_id
- evidence_type
- evidence_description
- supporting_or_conflicting
- review_status

### review_logs
- id
- event_id
- reviewer_action
- reviewer_notes
- previous_status
- new_status
- created_at

Adapt the schema if necessary, but maintain relational integrity.

A project can have multiple events.
An event must preserve its source.
Multiple sources can support or contradict a project-related claim.

## 9. Frontend Requirements

Build a premium, professional intelligence dashboard.

Design direction:
- Dark interface.
- Navy/charcoal background.
- Restrained blue, cyan and green accents.
- Dense but readable data visualisation.
- Professional typography.
- Clear information hierarchy.
- Responsive layout.

Avoid excessive gradients, decorative elements and generic AI-dashboard styling.

### Required pages

1. Overview Dashboard
   - Total projects.
   - Projects by infrastructure category.
   - Criticality distribution.
   - Lifecycle distribution.
   - Recent announcements.
   - Verification statistics.

2. Project Explorer
   - Search projects.
   - Filter by district, category, criticality and lifecycle.
   - Project details.
   - Associated events and sources.

3. Intelligence Feed
   - Latest collected announcements.
   - Source information.
   - AI extraction results.
   - Event categories.

4. Verification Centre
   - Pending records.
   - Supporting and conflicting evidence.
   - Source details.
   - Accept, reject and request review actions.

5. Architecture / About
   - System architecture.
   - Agent responsibilities.
   - Data acquisition approach.
   - Prototype limitations.
   - Future operational deployment architecture.

Use Recharts for charts.
Use Leaflet or React Leaflet for a basic Maharashtra project map if time permits.

## 10. Prototype Data

The application must support both:
- Live API ingestion.
- Clearly labelled demonstration records.

Preload a small number of realistic, source-attributed demonstration records.

Do not fabricate official project claims, investment figures, completion dates or verification statuses.

If actual source material is unavailable, use explicitly labelled synthetic demonstration data.

## 11. Security and Future Deployment

The prototype may use:
- Gemini API.
- GDELT.
- Public social listening APIs.
- Supabase.
- Vercel.

However, the proposed operational system must not depend on commercial cloud AI APIs or uncontrolled third-party services.

Design replaceable interfaces for:
- External data connectors.
- AI model providers.
- Storage providers.

Future operational architecture should support:
- Locally hosted open-source models.
- Organisation-controlled databases.
- Controlled and approved data ingestion.
- Restricted outbound network access.
- Role-based access control.
- Encryption.
- Audit logs.
- Security assessment.

Do not claim that the prototype is defence-grade or operationally secure.

The operational deployment proposal must be clearly separated from implemented prototype capabilities.

## 12. Implementation Constraints

Deadline: 31 October 2026, 12 PM IST.

Prioritise a working end-to-end vertical slice.

Implementation order:

1. Initialise repository and project structure.
2. Configure Supabase and database schema.
3. Build the main dashboard and project explorer.
4. Implement GDELT and official-source ingestion.
5. Build the ADK orchestrator and extraction agent.
6. Add project correlation and evidence assessment.
7. Implement hybrid criticality classification.
8. Build the verification interface.
9. Integrate all components.
10. Deploy and test.
11. Prepare README and architecture documentation.

Do not overengineer.

Do not implement all possible integrations.
Do not train custom ML models.
Do not build a complex distributed pipeline.
Do not implement military movement optimisation or operational vulnerability analysis.

## 13. Development Instructions

Before modifying files:

1. Inspect the existing repository.
2. Identify installed dependencies and current architecture.
3. Create a concise implementation plan.
4. Identify any missing credentials.
5. Start implementing the highest-priority vertical slice.

Make reasonable assumptions rather than repeatedly asking for approval.

Use TypeScript for the frontend and Python for ADK.

Keep API keys server-side.
Use environment variables.
Provide .env.example without real secrets.
Include database migrations or SQL setup scripts.
Add basic error handling and loading states.

At every stage, ensure the application remains runnable.

The final deliverable must be a working, deployable prototype, not merely a UI mockup.