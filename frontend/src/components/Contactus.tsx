"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "sonner";
import emailjs from "emailjs-com";

export default function Contactus() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }
  

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
  
    const serviceId = import.meta.env.VITE_SERVICE_ID || '';
    const templateId = import.meta.env.VITE_TEMPLATE_ID || '';
    const publicKey = import.meta.env.VITE_PUBLIC_KEY || '';


    
  
    const templateParams = {
      message: formData.message,
      from_name: formData.name,
      subject: formData.subject,
      reply_to: formData.email,
    };
  
    try {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      toast.success("Message sent successfully!", { position: "top-right" });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send message. Please try again.");
    }
  
    setIsLoading(false);
  }
  
  return (
    <section id="contactus" className="container py-24 sm:py-32 space-y-8">
      <Toaster position="top-right" richColors />
      <div className="w-full flex justify-center">
        <div className="w-full max-w-3xl space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Contact <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">Us</span>
            </h2>
            <p className="md:w-3/4 mx-auto mt-4 mb-8 text-xl text-muted-foreground">
              Get in touch with us. We'll get back to you as soon as possible.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-6">
            <Input
              type="text"
              name="name"
              placeholder="Your Name"
              required
              value={formData.name}
              onChange={handleChange}
              className="bg-muted/50 dark:bg-muted/80"
            />
            <Input
              type="email"
              name="email"
              placeholder="Email Address"
              required
              value={formData.email}
              onChange={handleChange}
              className="bg-muted/50 dark:bg-muted/80"
            />
            <Input
              type="text"
              name="subject"
              placeholder="Subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="bg-muted/50 dark:bg-muted/80"
            />
            <Textarea
              name="message"
              placeholder="Your Message"
              required
              value={formData.message}
              onChange={handleChange}
              className="min-h-[120px] bg-muted/50 dark:bg-muted/80"
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}