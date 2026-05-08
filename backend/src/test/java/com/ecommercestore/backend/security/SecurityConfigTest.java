package com.ecommercestore.backend.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ecommercestore.backend.contact.ContactController;
import com.ecommercestore.backend.email.EmailService;
import com.ecommercestore.backend.order.CheckoutController;
import com.ecommercestore.backend.order.OrderMapper;
import com.ecommercestore.backend.order.OrderService;
import com.ecommercestore.backend.payment.PaymentController;
import com.ecommercestore.backend.payment.PaymentProvider;
import com.ecommercestore.backend.payment.PaymentService;
import com.ecommercestore.backend.payment.PaymentStatus;
import com.ecommercestore.backend.payment.dto.PaymentResponse;
import com.ecommercestore.backend.payment.stripe.StripePaymentController;
import com.ecommercestore.backend.payment.stripe.StripeService;
import com.ecommercestore.backend.product.ProductImageService;
import com.ecommercestore.backend.product.ProductManagementController;
import com.ecommercestore.backend.product.ProductService;
import com.ecommercestore.backend.security.filters.GlobalRateLimitFilter;
import com.ecommercestore.backend.security.jwt.JwtAuthenticationFilter;
import com.ecommercestore.backend.security.jwt.JwtService;
import com.ecommercestore.backend.user.Role;
import com.ecommercestore.backend.user.UserController;
import com.ecommercestore.backend.user.UserService;
import com.ecommercestore.backend.user.UserStatus;
import com.ecommercestore.backend.user.dto.UserResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

@ExtendWith(SpringExtension.class)
@WebAppConfiguration
@ContextConfiguration(classes = SecurityConfigTest.TestConfig.class)
class SecurityConfigTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private StripeService stripeService;

    @Autowired
    private ProductService productService;

    @Autowired
    private UserService userService;

    @Autowired
    private GlobalRateLimitFilter globalRateLimitFilter;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        reset(emailService, orderService, paymentService, stripeService, productService, userService);
        globalRateLimitFilter.clearCounters();
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void publicContactEndpointAllowsGuestRequests() throws Exception {
        mockMvc.perform(post("/api/public/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Guest Customer",
                                  "email": "guest@example.com",
                                  "subject": "Question",
                                  "message": "Hello from the contact form."
                                }
                                """))
                .andExpect(status().isAccepted());

        verify(emailService).sendContactMessage(any());
    }

    @Test
    void publicContactEndpointIsRateLimited() throws Exception {
        String payload = """
                {
                  "name": "Guest Customer",
                  "email": "guest@example.com",
                  "subject": "Question",
                  "message": "Hello from the contact form."
                }
                """;

        for (int attempt = 0; attempt < 5; attempt += 1) {
            mockMvc.perform(post("/api/public/contact")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isAccepted());
        }

        mockMvc.perform(post("/api/public/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isTooManyRequests());

        verify(emailService, times(5)).sendContactMessage(any());
    }

    @Test
    void guestOrderLookupByIdAloneIsRejected() throws Exception {
        mockMvc.perform(get("/api/checkout/orders/42"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(orderService);
    }

    @Test
    void guestPaymentCreationIsAllowedWithToken() throws Exception {
        UUID paymentId = UUID.randomUUID();

        when(paymentService.createPendingPayment(42L, "token-123"))
                .thenReturn(new PaymentResponse(
                        paymentId,
                        42L,
                        PaymentProvider.STRIPE,
                        PaymentStatus.PENDING,
                        null,
                        null,
                        new BigDecimal("19.90"),
                        "EUR",
                        null,
                        null,
                        Instant.now(),
                        Instant.now(),
                        null));

        mockMvc.perform(post("/api/orders/42/payments")
                        .param("token", "token-123"))
                .andExpect(status().isOk());

        verify(paymentService).createPendingPayment(42L, "token-123");
    }

    @Test
    void stripeConfirmationWithoutTokenIsRejected() throws Exception {
        mockMvc.perform(post("/api/orders/42/payments/stripe/confirm")
                        .param("paymentIntentId", "pi_123"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(stripeService);
    }

    @Test
    void managerEndpointsRejectUnauthenticatedRequests() throws Exception {
        mockMvc.perform(get("/api/manager/products"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(productService);
    }

    @Test
    void managerEndpointsAllowManagerRole() throws Exception {
        when(productService.getAllProducts()).thenReturn(List.of());

        mockMvc.perform(get("/api/manager/products")
                        .with(user(User.withUsername("manager@example.com").password("password").roles("MANAGER").build())))
                .andExpect(status().isOk());

        verify(productService).getAllProducts();
    }

    @Test
    void adminEndpointsRejectManagerRole() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .with(user("manager@example.com").roles("MANAGER")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(userService);
    }

    @Test
    void adminEndpointsAllowAdminRole() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of(
                UserResponse.builder()
                        .id(UUID.randomUUID())
                        .email("admin@example.com")
                        .name("Admin User")
                        .role(Role.ADMIN)
                        .status(UserStatus.ACTIVE)
                        .createdAt(Instant.now())
                        .build()));

        mockMvc.perform(get("/api/admin/users")
                        .with(user("admin@example.com").roles("ADMIN")))
                .andExpect(status().isOk());

        verify(userService).getAllUsers();
    }

    @Test
    void adminUserUpdateAllowsOnlyAdminRole() throws Exception {
        UUID userId = UUID.randomUUID();

        mockMvc.perform(patch("/api/admin/users/{id}", userId)
                        .with(user("manager@example.com").roles("MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Updated User",
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isForbidden());

        verifyNoInteractions(userService);
    }

    @Configuration
    @EnableWebMvc
    @EnableWebSecurity
    @Import(SecurityConfig.class)
    static class TestConfig {

        @Bean
        ContactController contactController(EmailService emailService) {
            return new ContactController(emailService);
        }

        @Bean
        CheckoutController checkoutController(OrderService orderService, OrderMapper orderMapper) {
            return new CheckoutController(orderService, orderMapper);
        }

        @Bean
        PaymentController paymentController(PaymentService paymentService) {
            return new PaymentController(paymentService);
        }

        @Bean
        StripePaymentController stripePaymentController(StripeService stripeService) {
            return new StripePaymentController(stripeService);
        }

        @Bean
        ProductManagementController productManagementController(
                ProductService productService,
                ProductImageService productImageService) {
            return new ProductManagementController(productService, productImageService);
        }

        @Bean
        UserController userController(UserService userService) {
            return new UserController(userService);
        }

        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter(
                JwtService jwtService,
                CustomUserDetailsService customUserDetailsService) {
            return new JwtAuthenticationFilter(jwtService, customUserDetailsService);
        }

        @Bean
        GlobalRateLimitFilter globalRateLimitFilter(MeterRegistry meterRegistry) {
            return new GlobalRateLimitFilter(meterRegistry);
        }

        @Bean
        EmailService emailService() {
            return mock(EmailService.class);
        }

        @Bean
        OrderService orderService() {
            return mock(OrderService.class);
        }

        @Bean
        OrderMapper orderMapper() {
            return mock(OrderMapper.class);
        }

        @Bean
        PaymentService paymentService() {
            return mock(PaymentService.class);
        }

        @Bean
        StripeService stripeService() {
            return mock(StripeService.class);
        }

        @Bean
        ProductService productService() {
            return mock(ProductService.class);
        }

        @Bean
        ProductImageService productImageService() {
            return mock(ProductImageService.class);
        }

        @Bean
        UserService userService() {
            return mock(UserService.class);
        }

        @Bean
        JwtService jwtService() {
            return mock(JwtService.class);
        }

        @Bean
        MeterRegistry meterRegistry() {
            return new SimpleMeterRegistry();
        }

        @Bean
        CustomUserDetailsService customUserDetailsService() {
            return mock(CustomUserDetailsService.class);
        }
    }
}
