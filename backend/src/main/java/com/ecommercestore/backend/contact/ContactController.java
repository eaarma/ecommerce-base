package com.ecommercestore.backend.contact;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ecommercestore.backend.contact.dto.ContactMessageRequest;
import com.ecommercestore.backend.email.EmailService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/public/contact")
public class ContactController {

    private final EmailService emailService;

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void sendMessage(@Valid @RequestBody ContactMessageRequest request) {
        emailService.sendContactMessage(request);
    }
}
