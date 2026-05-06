import api from "@/lib/api/axios";

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function sendContactMessage(data: ContactMessagePayload) {
  await api.post("/api/public/contact", data);
}
