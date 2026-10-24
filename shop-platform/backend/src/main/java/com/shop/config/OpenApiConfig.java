package com.shop.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Drives the Swagger UI at /swagger-ui.html. The two security schemes are what make
 * "Try it out" usable: bearerAuth for shopper/admin endpoints and testToken for the
 * seed/reset endpoints that are guarded by a shared secret instead of a JWT.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_AUTH = "bearerAuth";
    private static final String TEST_TOKEN = "testToken";

    @Value("${PUBLIC_BASE_URL:http://localhost:8081}")
    private String publicBaseUrl;

    @Bean
    public OpenAPI shopOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Shop Platform API")
                        .version("1.0.0")
                        .description("""
                                Backend for the multi-agent E2E automation workshop. The same API backs \
                                the React web app and the React Native mobile app, and is exercised by \
                                the API, web and mobile automation suites.

                                ### Trying an endpoint
                                1. `POST /api/auth/login` with one of the demo accounts below.
                                2. Copy the `token` from the response.
                                3. Click **Authorize**, paste the token under `bearerAuth`, and press Authorize.
                                4. Any endpoint can now be called with **Try it out**.

                                ### Demo accounts
                                | Email | Password | Role |
                                |---|---|---|
                                | `demo@shop.in` | `Demo@12345` | CUSTOMER |
                                | `priya@shop.in` | `Priya@12345` | CUSTOMER |
                                | `admin@shop.in` | `Admin@12345` | ADMIN |

                                ### Test cards
                                | Number | Outcome |
                                |---|---|
                                | `4111111111111111` | approved |
                                | `4000000000000002` | declined |
                                | `4000000000009995` | insufficient funds |

                                ### Coupons
                                `SAVE10` (10% off), `SAVE25` (25% off, has a minimum order), `EXPIRED` (inactive).

                                Money is stored and returned in **paise**: `pricePaise: 129900` is Rs 1,299.
                                """)
                        .contact(new Contact().name("Shop QA").email("qa@shop.in"))
                        .license(new License().name("Workshop use")))
                .servers(List.of(new Server().url(publicBaseUrl).description("Shop backend")))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Paste the `token` returned by POST /api/auth/login."))
                        .addSecuritySchemes(TEST_TOKEN, new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-Test-Token")
                                .description("Shared secret for /api/test-support/**. Local value: local-test-token")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .addSecurityItem(new SecurityRequirement().addList(TEST_TOKEN));
    }
}
