UPDATE store_pages
SET
    title = 'About our store',
    description = 'Learn what the store stands for and how it approaches everyday shopping.',
    content_json = $${
        "heroTitle":"Thoughtfully selected products for everyday life.",
        "heroDescription":"We focus on products that feel useful, reliable, and easy to welcome into everyday routines.",
        "badges":[
            {
                "title":"Carefully chosen",
                "description":"We aim to offer products that are useful, enjoyable, and suitable for a wide range of customers. Every item should have a clear reason to be in the store."
            },
            {
                "title":"Simple and honest",
                "description":"We believe shopping should feel straightforward. Clear product information, transparent communication, and reliable service are part of the experience."
            },
            {
                "title":"Mindful approach",
                "description":"Sustainability and creativity matter to us. We value thoughtful choices, long-lasting usefulness, and products that are not only attractive but also practical."
            }
        ],
        "secondaryTitle":"A better everyday shopping experience.",
        "secondaryBody":"As the catalog grows, the goal stays the same: offer products with a clear purpose and support customers with straightforward service.",
        "finalTitle":"Thank you for supporting our shop.",
        "finalBody":"Every order helps keep the store focused on quality, clarity, and thoughtful service."
    }$$,
    closing_note = NULL,
    status = 'PUBLISHED',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'about'
  AND updated_at = created_at;

UPDATE store_pages
SET
    title = 'Get in touch',
    description = 'Use this page for support questions, store contact details, and direct inquiries.',
    content_json = $${
        "intro":"We'd love to hear from you. Whether you have a question about products, support, or the store itself, feel free to get in touch.",
        "detailsTitle":"Contact details",
        "detailsDescription":"Use the information below for direct support or general store questions.",
        "formTitle":"Message",
        "formDescription":"Your message will be delivered to our support inbox."
    }$$,
    closing_note = 'Contact details such as support email, phone number, and address continue to come from the main shop profile.',
    status = 'PUBLISHED',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'contact'
  AND updated_at = created_at;

UPDATE store_pages
SET
    title = 'Frequently Asked Questions',
    description = 'Common questions about ordering, delivery, payments, refunds, and support.',
    content_json = $${
        "intro":"Here are answers to common questions about ordering, delivery, payments, refunds, and contacting our shop.",
        "items":[
            {
                "question":"How do I place an order?",
                "answer":"Browse our products, add the items you want to your cart, and continue to checkout. At checkout, enter your contact and delivery details, then complete payment using the available secure payment method."
            },
            {
                "question":"Do I need an account to order?",
                "answer":"No. Orders are placed as a guest. We only ask for the information needed to process your order, deliver your products, and contact you about your purchase."
            },
            {
                "question":"How long does delivery take?",
                "answer":"Orders are usually processed within 1-2 business days. Delivery typically takes 3-7 business days after processing, depending on the delivery method and destination."
            },
            {
                "question":"Can I cancel my order myself?",
                "answer":"No. If there is a problem with your order, please contact support as soon as possible. Cancellation and refund requests are handled through customer support and reviewed case by case."
            },
            {
                "question":"When can I request a refund?",
                "answer":"Refunds may be considered if the product is damaged, incorrect, not delivered, or unavailable because of a stock issue. Change of mind is not normally accepted as a refund reason."
            },
            {
                "question":"How long do I have to report an issue?",
                "answer":"Please contact us within 14 days of receiving your order, or within 14 days of the expected delivery period if the order was not delivered. Requests made after this period may not be accepted."
            },
            {
                "question":"Do I need to return a product before receiving a refund?",
                "answer":"In most cases, yes. Products must usually be returned before a refund is issued. Returned items should be unused and in reasonable condition unless the issue is related to damage or a defect."
            },
            {
                "question":"Who pays for return shipping?",
                "answer":"Return shipping is usually paid by the customer, unless the return is caused by our mistake, such as sending the wrong product, or the product arrived damaged or defective."
            },
            {
                "question":"Are payments secure?",
                "answer":"Yes. Payments are handled by a secure third-party payment provider. We do not store your card details on our own servers."
            },
            {
                "question":"How can I contact the shop?",
                "answer":"You can contact us through the contact page or by using the support email shown on the website. Please include your order number if your message is related to an existing order."
            }
        ]
    }$$,
    closing_note = 'This FAQ is provided for general information. Store policies may be updated from time to time, and the latest version applies to all new purchases.',
    status = 'PUBLISHED',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'faq'
  AND updated_at = created_at;

UPDATE store_pages
SET
    title = 'Privacy Policy',
    description = 'How the store collects, uses, and protects customer information.',
    content_json = $${
        "intro":"This Privacy Policy explains how we collect, use, and protect your personal information when you use our store.",
        "sections":[
            {
                "title":"Information we collect",
                "body":"When you place an order or contact us, we may collect the following information:\n\n- Name\n- Email address\n- Delivery address\n- Phone number\n- Order details and purchase history"
            },
            {
                "title":"How we use your information",
                "body":"Your information is used only for the following purposes:\n\n- Processing and delivering your orders\n- Communicating with you about your order\n- Providing customer support\n- Improving our store and services"
            },
            {
                "title":"Payments",
                "body":"Payments are handled by secure third-party payment providers. We do not store or have access to your full card details."
            },
            {
                "title":"Data sharing",
                "body":"We do not sell your personal data. Your information may only be shared with trusted service providers when necessary to fulfill your order (for example, payment processors or delivery services)."
            },
            {
                "title":"Data retention",
                "body":"We retain your information only as long as necessary to fulfill orders, comply with legal obligations, and maintain basic business records."
            },
            {
                "title":"Your rights",
                "body":"You may contact us at any time to request access to, correction of, or deletion of your personal data, where applicable."
            },
            {
                "title":"Contact",
                "body":"If you have any questions about this Privacy Policy or how your data is handled, please contact us using the contact information provided on the website."
            }
        ]
    }$$,
    closing_note = 'We may update this Privacy Policy from time to time. The latest version will always be available on this page and applies to all interactions with the store.',
    status = 'PUBLISHED',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'privacy'
  AND updated_at = created_at;

UPDATE store_pages
SET
    title = 'Terms & Conditions',
    description = 'The general terms that apply to using the storefront and placing orders.',
    content_json = $${
        "intro":"These Terms & Conditions govern your use of our store and apply to all purchases made through the website.",
        "sections":[
            {
                "title":"General use",
                "body":"By using this website and placing an order, you agree to these Terms & Conditions. If you do not agree, please do not use the store."
            },
            {
                "title":"Products and availability",
                "body":"We aim to ensure that all product information is accurate. However, errors may occasionally occur, including incorrect descriptions, pricing, or stock availability. We reserve the right to correct such errors and to cancel or refuse orders if necessary."
            },
            {
                "title":"Orders",
                "body":"When you place an order, you agree to provide accurate and complete information. We reserve the right to refuse or cancel any order if fraud, unauthorized activity, or incorrect information is suspected."
            },
            {
                "title":"Payments",
                "body":"Payments are processed through secure third-party providers. We do not store your full payment details. By completing a purchase, you agree to the payment terms of the provider used."
            },
            {
                "title":"Delivery",
                "body":"Orders are processed and shipped according to our delivery policy. Delivery times are estimates and may vary depending on location and external factors. We are not responsible for delays outside our control."
            },
            {
                "title":"Cancellations and refunds",
                "body":"Cancellation and refund requests are handled according to our Cancellation & Refund Policy. By placing an order, you agree to those terms."
            },
            {
                "title":"Limitation of liability",
                "body":"To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from the use of our store or products. Our liability is limited to the amount paid for the purchased product."
            },
            {
                "title":"Changes to terms",
                "body":"We reserve the right to update or modify these Terms & Conditions at any time. The latest version will always be available on this page and applies to all purchases made after changes are published."
            },
            {
                "title":"Contact",
                "body":"If you have any questions about these Terms & Conditions, please contact us using the information provided on the website."
            }
        ]
    }$$,
    closing_note = 'These terms apply to all purchases made through the store and form a binding agreement between you and the store operator.',
    status = 'PUBLISHED',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'terms'
  AND updated_at = created_at;

UPDATE store_pages
SET
    title = 'Cancellation & Refund Policy',
    description = 'How cancellations, returns, and refunds are handled for store purchases.',
    content_json = $${
        "intro":"This policy explains how cancellations, returns, and refunds are handled for purchases made through our store.",
        "sections":[
            {
                "title":"Order cancellations",
                "body":"Customers cannot cancel orders directly through the website. If there is an issue with your order, please contact our support team as soon as possible. Cancellation requests are reviewed case by case."
            },
            {
                "title":"After shipment",
                "body":"Once an order has been shipped, it can no longer be cancelled as a standard cancellation. You will receive a notification when your order is on the way. If there is a problem after delivery, the refund and return process below applies."
            },
            {
                "title":"Valid refund reasons",
                "body":"Refunds may be considered only when there is a valid issue with the order, including:\n\n- The product arrived damaged.\n- The wrong product was delivered.\n- The product was not delivered.\n- The product became unavailable due to an incorrect stock status.\n\nRefunds are not normally provided for change of mind or general customer dissatisfaction unless the issue is connected to one of the valid refund reasons above."
            },
            {
                "title":"Refund request period",
                "body":"Refund or complaint requests must be submitted within 14 days of receiving the order. If the order was not delivered, the request should be submitted within 14 days of the expected delivery period. Requests made after this period may not be accepted."
            },
            {
                "title":"Returns",
                "body":"In most cases, the product must be returned before a refund can be issued. Returned products should be unused and in reasonable condition unless the return is related to damage, defect, or an incorrect product."
            },
            {
                "title":"Return shipping",
                "body":"Return shipping is usually paid by the customer. If the return is caused by our mistake, such as sending the wrong product, or if the product arrived damaged or defective, return shipping may be reviewed separately by support."
            },
            {
                "title":"Refund processing",
                "body":"Approved refunds are processed through the original payment method where possible. Processing times may vary depending on the payment provider and bank."
            },
            {
                "title":"How to request help",
                "body":"To request a cancellation review, return, or refund, contact us using the support email or contact form provided on the website. Please include your order number, contact details, and a clear description of the issue."
            }
        ]
    }$$,
    closing_note = 'We reserve the right to review each request individually and to update this policy from time to time. The latest version of this policy applies to all purchases made through the store.',
    status = 'PUBLISHED',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'cancellation-refund'
  AND updated_at = created_at;

UPDATE store_pages
SET
    title = 'Shipping Policy',
    description = 'How orders are processed, packed, shipped, and delivered.',
    content_json = $${
        "intro":"This Shipping Policy explains how orders are processed, packed, shipped, and delivered after purchase.",
        "sections":[
            {
                "title":"Processing time",
                "body":"Orders are usually reviewed and prepared for shipment within 1 to 2 business days. Processing may take longer during holidays, promotions, or unusually busy periods."
            },
            {
                "title":"Delivery timing",
                "body":"After processing, delivery times vary based on destination, carrier, and the shipping option selected at checkout. Estimated delivery dates are guidance only."
            },
            {
                "title":"Shipping confirmation",
                "body":"When an order is dispatched, the customer may receive a confirmation email or status update with shipment details when available."
            },
            {
                "title":"Delays and disruptions",
                "body":"Unexpected delays can happen because of weather, customs, transport interruptions, or carrier issues outside the store's direct control."
            },
            {
                "title":"Address accuracy",
                "body":"Customers are responsible for providing a complete and accurate delivery address. Incorrect or incomplete information may cause delays, failed delivery attempts, or extra charges."
            },
            {
                "title":"Damaged or missing deliveries",
                "body":"If an order arrives damaged, incomplete, or does not arrive within the expected timeframe, please contact support as soon as possible so the issue can be reviewed."
            }
        ]
    }$$,
    closing_note = 'Shipping details may be updated from time to time. The version published on this page is the current policy for new orders.',
    status = 'PUBLISHED',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'shipping'
  AND updated_at = created_at;
