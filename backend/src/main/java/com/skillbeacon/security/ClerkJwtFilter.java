package com.skillbeacon.security;

import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import java.util.Collections;

@Component
public class ClerkJwtFilter extends OncePerRequestFilter {

    @Value("${clerk.jwks-url}")
    private String jwksUrl;

    private JwkProvider jwkProvider;

    private JwkProvider getProvider() {
        if (jwkProvider == null) {
            try {
                jwkProvider = new JwkProviderBuilder(new URL(jwksUrl)).build();
            } catch (Exception e) {
                throw new RuntimeException("Failed to initialize JWK provider", e);
            }
        }
        return jwkProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                DecodedJWT decoded = JWT.decode(token);
                RSAPublicKey publicKey = (RSAPublicKey) getProvider().get(decoded.getKeyId()).getPublicKey();
                Algorithm algorithm = Algorithm.RSA256(publicKey, null);
                DecodedJWT verified = JWT.require(algorithm).build().verify(token);

                String userId = verified.getSubject();
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userId, null,
                        Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
