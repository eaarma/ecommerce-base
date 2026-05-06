"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/axios";
import { sendContactMessage } from "@/lib/contactService";

type ContactFormProps = {
  recipientHint?: string | null;
  storeName: string;
  title?: string | null;
  description?: string | null;
};

export default function ContactForm({
  recipientHint,
  storeName,
  title,
  description,
}: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    if (!name || !email || !message) {
      toast.error("Please fill all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      await sendContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      toast.success(`Message sent to ${storeName}!`);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error: unknown) {
      const messageText =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Failed to send message";

      setErrorMessage(messageText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const routingMessage = recipientHint
    ? `Messages are sent to ${recipientHint}.`
    : "Your message will be delivered to our support inbox.";
  const formTitle = title?.trim() || "Message";
  const formDescription = description?.trim() || null;

  return (
    <div className="rounded-[28px] border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-base-content">
          {formTitle}
        </h2>
        {formDescription ? (
          <p className="mt-2 text-sm leading-6 text-base-content/60">
            {formDescription}
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-6 text-base-content/55">
          {routingMessage}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Name"
          className="input input-bordered w-full rounded-xl"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="input input-bordered w-full rounded-xl"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Subject"
          className="input input-bordered w-full rounded-xl"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
        <textarea
          className="textarea textarea-bordered w-full rounded-xl"
          placeholder="Message"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
        />

        <button
          className="btn btn-primary self-start rounded-xl px-6"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send"}
        </button>

        {errorMessage && (
          <div className="text-error text-sm">{errorMessage}</div>
        )}
      </form>
    </div>
  );
}
