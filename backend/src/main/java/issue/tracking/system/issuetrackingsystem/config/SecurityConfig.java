package issue.tracking.system.issuetrackingsystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // Отключаем для упрощения
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll() // Вход и регистрация доступны всем
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**").permitAll() // Документация
                    .requestMatchers("/h2-console/**").permitAll() // Добавили для H2 console
                .anyRequest().authenticated() // Все требует входа
            )
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::disable) // Для H2 console
                )
            // Используем Basic Auth для Postman
            // Нужно JWT Filter
            .httpBasic(basic -> {});

        return http.build();
    }
}
