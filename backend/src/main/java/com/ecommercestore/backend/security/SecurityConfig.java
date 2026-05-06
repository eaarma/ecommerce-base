package com.ecommercestore.backend.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.ecommercestore.backend.security.jwt.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                return http
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(Customizer.withDefaults())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .formLogin(form -> form.disable())
                                .httpBasic(basic -> basic.disable())
                                .exceptionHandling(exceptions -> exceptions
                                                .authenticationEntryPoint((request, response, authException) -> response
                                                                .sendError(HttpServletResponse.SC_UNAUTHORIZED))
                                                .accessDeniedHandler((request, response, accessDeniedException) -> response
                                                                .sendError(HttpServletResponse.SC_FORBIDDEN)))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/error").permitAll()

                                                .requestMatchers("/api/auth/**").permitAll()
                                                .requestMatchers("/api/public/**").permitAll()
                                                .requestMatchers("/api/store/shop").permitAll()
                                                .requestMatchers("/api/store/homepage").permitAll()
                                                .requestMatchers("/api/store/pages/**").permitAll()
                                                .requestMatchers("/api/products/**").permitAll()
                                                .requestMatchers("/uploads/**").permitAll()
                                                .requestMatchers("/api/checkout/**").permitAll()
                                                .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()

                                                .requestMatchers(HttpMethod.POST,
                                                                "/api/orders/*/payments/stripe/intent",
                                                                "/api/orders/*/payments/stripe/confirm",
                                                                "/api/payments/stripe/webhook")
                                                .permitAll()

                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/manager/**").hasAnyRole("ADMIN", "MANAGER")

                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                                .build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(List.of(
                                "http://localhost:3000",
                                "http://127.0.0.1:3000"));

                config.setAllowedMethods(List.of(
                                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

                config.setAllowedHeaders(List.of(
                                "Authorization",
                                "Content-Type",
                                "Accept"));

                config.setExposedHeaders(List.of(
                                "Authorization"));

                config.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }
}
