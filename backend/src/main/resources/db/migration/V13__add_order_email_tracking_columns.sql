ALTER TABLE orders
    ADD COLUMN confirmation_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN confirmation_email_sent_at TIMESTAMP(6) WITH TIME ZONE,
    ADD COLUMN cancellation_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN cancellation_email_sent_at TIMESTAMP(6) WITH TIME ZONE;
