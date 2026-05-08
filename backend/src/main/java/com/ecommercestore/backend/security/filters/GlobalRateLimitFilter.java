package com.ecommercestore.backend.security.filters;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class GlobalRateLimitFilter extends OncePerRequestFilter {

    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final String APPLICATION_TAG = "ecommerce_store";

    private final MeterRegistry meterRegistry;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private final Map<String, FixedWindowCounter> counters = new ConcurrentHashMap<>();

    private record RateLimitRule(String scope, int capacityPerMinute) {
    }

    private static final class FixedWindowCounter {

        private final AtomicInteger count = new AtomicInteger(0);
        private Instant windowStart = Instant.now();

        synchronized RateLimitDecision tryConsume(int capacity) {
            Instant now = Instant.now();
            Instant expiresAt = windowStart.plus(WINDOW);

            if (!now.isBefore(expiresAt)) {
                windowStart = now;
                count.set(0);
                expiresAt = windowStart.plus(WINDOW);
            }

            if (count.incrementAndGet() <= capacity) {
                return new RateLimitDecision(true, Duration.between(now, expiresAt).toSeconds());
            }

            count.decrementAndGet();
            return new RateLimitDecision(false, Math.max(Duration.between(now, expiresAt).toSeconds(), 1));
        }
    }

    private record RateLimitDecision(boolean allowed, long retryAfterSeconds) {
    }

    private Counter allowedCounter(String scope) {
        return Counter.builder("rate_limit_requests_allowed_total")
                .tag("application", APPLICATION_TAG)
                .tag("scope", scope)
                .register(meterRegistry);
    }

    private Counter rejectedCounter(String scope) {
        return Counter.builder("rate_limit_requests_rejected_total")
                .tag("application", APPLICATION_TAG)
                .tag("scope", scope)
                .register(meterRegistry);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        return HttpMethod.OPTIONS.matches(request.getMethod())
                || path.equals("/error")
                || path.startsWith("/actuator/health")
                || path.startsWith("/uploads/")
                || path.equals("/api/payments/stripe/webhook");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        RateLimitRule rule = resolveRule(request);

        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String identity = resolveIdentity(request);
        String bucketKey = rule.scope() + ":" + identity;

        FixedWindowCounter counter = counters.computeIfAbsent(bucketKey, ignored -> new FixedWindowCounter());
        RateLimitDecision decision = counter.tryConsume(rule.capacityPerMinute());

        if (decision.allowed()) {
            allowedCounter(rule.scope()).increment();
            filterChain.doFilter(request, response);
            return;
        }

        rejectedCounter(rule.scope()).increment();
        log.warn("Rate limit exceeded for scope={} identity={} method={} path={}",
                rule.scope(),
                identity,
                request.getMethod(),
                request.getRequestURI());

        response.setStatus(429);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json");
        response.setHeader("Retry-After", String.valueOf(decision.retryAfterSeconds()));
        response.getWriter().write("""
                {"status":429,"error":"Too Many Requests","message":"Too many requests. Please wait and try again."}
                """);
    }

    public void clearCounters() {
        counters.clear();
    }

    private RateLimitRule resolveRule(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();

        if (HttpMethod.POST.matches(method) && "/api/auth/login".equals(path)) {
            return new RateLimitRule("login", 5);
        }

        if (HttpMethod.POST.matches(method) && "/api/public/contact".equals(path)) {
            return new RateLimitRule("contact", 5);
        }

        if (HttpMethod.POST.matches(method) && "/api/checkout/orders/reserve".equals(path)) {
            return new RateLimitRule("checkout_reserve", 10);
        }

        if (HttpMethod.POST.matches(method) && (
                pathMatcher.match("/api/orders/*/payments", path)
                        || pathMatcher.match("/api/orders/*/payments/stripe/intent", path)
                        || pathMatcher.match("/api/orders/*/payments/stripe/start", path)
                        || pathMatcher.match("/api/orders/*/payments/stripe/confirm", path))) {
            return new RateLimitRule("guest_payment", 20);
        }

        if (path.startsWith("/api/admin/") || path.startsWith("/api/manager/")) {
            return new RateLimitRule("staff_api", 120);
        }

        if (path.startsWith("/api/")) {
            return new RateLimitRule("api_default", 60);
        }

        return null;
    }

    private String resolveIdentity(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof UserDetails userDetails) {
            return "USER_" + userDetails.getUsername().trim().toLowerCase();
        }

        return "IP_" + resolveClientIp(request);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}
