// Builds the handbook content once, as structured sections, so the Markdown and HTML
// renderers stay in sync.
export function sections(d) {
  const surfaceCell = (row, s) =>
    ({ covered: 'covered', gap: 'GAP', 'n/a': 'n/a' })[row.cells[s]];

  const contractRows = d.contracts.map((c) => {
    const rows = d.matrix.filter((r) => r.contractId === c.contractId);
    const state = (surface) => {
      const cells = rows.map((r) => r.cells[surface]);
      if (cells.every((x) => x === 'n/a')) return 'n/a';
      if (cells.some((x) => x === 'gap')) return 'GAP';
      return 'covered';
    };
    return {
      ...c,
      api: state('api'),
      web: state('web'),
      mobile: state('mobile'),
      scenarioCount: c.scenarios.length,
    };
  });

  return { surfaceCell, contractRows };
}

export const DIAGRAMS = {
  system: `graph TB
    subgraph SUT["shop-platform &mdash; System Under Test (agents: READ-ONLY)"]
        WEB["Web app<br/>React 18 + Vite<br/>:5173"]
        MOB["Mobile app<br/>React Native / Expo<br/>com.shop.mobile"]
        API["Backend<br/>Spring Boot 3.3 + Java 21<br/>:8081"]
        DB[("PostgreSQL 16<br/>:5432<br/>Flyway V1..V6")]
        WEB --> API
        MOB --> API
        API --> DB
    end

    subgraph CONTRACT["shop-qa-orchestrator &mdash; the single source of truth"]
        GHERKIN["contracts/features/*.feature<br/>{{CONTRACTS}} contracts &middot; {{SCENARIOS}} scenarios"]
        FIXTURES["contracts/fixtures/*.json<br/>users &middot; products &middot; cards"]
        COVERAGE["contracts/coverage/coverage.yaml<br/>GENERATED"]
    end

    subgraph FRAMEWORKS["Three frameworks, two languages"]
        APIF["shop-api-automation<br/>cucumber-jvm + Rest Assured"]
        WEBF["shop-web-automation<br/>playwright-bdd"]
        MOBF["shop-mobile-automation<br/>cucumber-jvm + Appium"]
    end

    GHERKIN --> APIF
    GHERKIN --> WEBF
    GHERKIN --> MOBF
    FIXTURES --> APIF
    FIXTURES --> WEBF
    FIXTURES --> MOBF

    APIF -->|HTTP| API
    WEBF -->|Chromium| WEB
    MOBF -->|Appium :4723| MOB

    APIF -.->|link_implementation| COVERAGE
    WEBF -.->|link_implementation| COVERAGE
    MOBF -.->|link_implementation| COVERAGE

    APIF --> ALLURE["Unified Allure report"]
    WEBF --> ALLURE
    MOBF --> ALLURE`,

  agents: `graph TB
    HUMAN["Human<br/>&quot;close the gaps&quot;"] --> ORCH

    subgraph AGENTS["Orchestrator-worker pattern"]
        ORCH["shop-qa-orchestrator agent<br/>parses intent &middot; delegates &middot; reconciles"]
        CONTRACT_A["contract agent<br/>authors Gherkin"]
        APIA["api-automation agent"]
        WEBA["web-automation agent"]
        MOBA["mobile-automation agent"]
    end

    ORCH -->|delegation brief| APIA
    ORCH -->|delegation brief| WEBA
    ORCH -->|delegation brief| MOBA
    ORCH -->|delegation brief| CONTRACT_A

    APIA -->|report back block| ORCH
    WEBA -->|report back block| ORCH
    MOBA -->|report back block| ORCH

    subgraph MCP["MCP servers &mdash; the only shared channel"]
        CMCP["contract-mcp<br/>find_gaps &middot; get_scenario<br/>link_implementation"]
        AMCP["shop-app-mcp<br/>seed_user &middot; seed_cart &middot; reset"]
        NMCP["android-mcp<br/>wait_for_boot &middot; install_apk"]
    end

    ORCH <--> CMCP
    APIA <--> CMCP
    WEBA <--> CMCP
    MOBA <--> CMCP
    APIA <--> AMCP
    WEBA <--> AMCP
    MOBA <--> NMCP

    NOTE["Agents cannot message each other.<br/>Coordination is delegation + blackboard + MCP only."]
    style NOTE fill:#fff3cd,stroke:#856404`,

  flow: `sequenceDiagram
    participant H as Human
    participant O as Orchestrator agent
    participant C as contract-mcp
    participant S as Specialist agent
    participant F as Framework repo

    H->>O: Close the web checkout gap
    O->>C: get_coverage_matrix
    C-->>O: {{COVERED}} covered, {{GAPS}} gaps
    O->>C: find_gaps surface=web
    C-->>O: CHECKOUT-01, 2 scenarios
    O->>C: get_scenario
    C-->>O: steps, background, fixtures
    O->>S: delegation brief
    S->>F: write page objects and step definitions
    S->>F: run suite locally
    F-->>S: green
    S->>C: link_implementation
    S-->>O: report-back block
    O->>C: get_coverage_matrix
    C-->>O: gap closed, verified not claimed
    O-->>H: summary and remaining gaps`,

  layering: `graph LR
    A[".feature<br/>behavioural spec"] --> B["Step definitions<br/>ASSERTIONS ONLY"]
    B --> C["Page / Screen / Service objects<br/>NO assertions"]
    C --> D["Driver / HTTP client"]
    B -.->|"setup only"| E["ShopApi facade"]
    E --> D

    style A fill:#e8f0fe
    style B fill:#d4edda
    style C fill:#fff3cd
    style D fill:#f8d7da`,

  data: `erDiagram
    users ||--o{ carts : has
    users ||--o{ orders : places
    users ||--o{ wishlist_items : saves
    users ||--o{ addresses : keeps
    users ||--o{ reviews : writes
    carts ||--o{ cart_items : contains
    orders ||--o{ order_items : contains
    products ||--o{ cart_items : appears_in
    products ||--o{ wishlist_items : appears_in
    products ||--o{ reviews : reviewed_by
    coupons ||--o{ carts : discounts`,
};

/** Diagram labels quote live counts, so they are filled in at generation time. */
export function diagramsFor({ contracts, scenarios, covered, gaps }) {
  const fill = (text) =>
    text
      .replaceAll('{{CONTRACTS}}', String(contracts))
      .replaceAll('{{SCENARIOS}}', String(scenarios))
      .replaceAll('{{COVERED}}', String(covered))
      .replaceAll('{{GAPS}}', String(gaps));

  return Object.fromEntries(Object.entries(DIAGRAMS).map(([name, text]) => [name, fill(text)]));
}
