package com.shop.auth;

import com.shop.common.ApiExceptions;
import com.shop.user.User;
import com.shop.user.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (users.existsByEmailIgnoreCase(request.email())) {
            throw new ApiExceptions.ConflictException("An account with that email already exists");
        }
        User saved = users.save(User.builder()
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .role(User.Role.CUSTOMER)
                .build());
        return toAuthResponse(saved);
    }

    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = users.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ApiExceptions.UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiExceptions.UnauthorizedException("Invalid email or password");
        }
        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ApiExceptions.UnauthorizedException("Not authenticated");
        }
        return users.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ApiExceptions.UnauthorizedException("Not authenticated"));
    }

    /** For endpoints readable anonymously that show extra detail when signed in. */
    public User currentUserOrNull() {
        try {
            return currentUser();
        } catch (ApiExceptions.UnauthorizedException notSignedIn) {
            return null;
        }
    }

    private AuthDtos.AuthResponse toAuthResponse(User user) {
        return new AuthDtos.AuthResponse(
                jwtService.issue(user.getEmail(), user.getRole().name()),
                jwtService.ttlSeconds(),
                toUserResponse(user));
    }

    public static AuthDtos.UserResponse toUserResponse(User user) {
        return new AuthDtos.UserResponse(
                user.getId(), user.getEmail(), user.getFullName(), user.getRole().name());
    }
}
