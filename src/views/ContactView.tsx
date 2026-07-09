import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, Check } from "lucide-react";
import { CinemaSettings } from "../types";

interface ContactViewProps {
  settings: CinemaSettings;
}

export default function ContactView({ settings }: ContactViewProps) {
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  // Feedback status
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSending(true);
    // Simulate API delay
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      // Reset inputs
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      // Clear toast after 5s
      setTimeout(() => setIsSent(false), 5000);
    }, 1500);
  };

  return (
    <div id="contact-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12 animate-fade-in font-sans">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
          Contact Customer Support
        </h2>
        <p className="text-xs sm:text-sm text-cinema-text-muted mt-1.5 uppercase tracking-wide">
          Have an inquiry, booking conflict, or group theater booking request? Get in touch with JFC Cineplex.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Column 1: Info Cards */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Contacts info panel */}
          <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Cinema Coordinates
            </h3>
            
            <div className="flex flex-col gap-4 text-xs text-slate-300">
              <div className="flex gap-3">
                <MapPin className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{settings.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold-500 shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-gold-500 transition-colors uppercase tracking-wider font-semibold">
                  {settings.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold-500 shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-gold-500 transition-colors uppercase tracking-wider font-semibold">
                  {settings.email}
                </a>
              </div>
            </div>
          </div>

          {/* Operational timings panel */}
          <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-500" />
              Box-Office Opening Hours
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-wider font-semibold text-[10px]">
              Timings may vary during national holidays, special festival screenings, or midnight blockbuster premieres.
            </p>
            <div className="flex flex-col gap-2.5 text-xs text-slate-300 border-t border-white/5 pt-3 mt-1.5 uppercase tracking-wide">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Monday - Thursday</span>
                <span className="font-mono text-slate-300 font-bold">{settings.openingHours.weekdays}</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2">
                <span className="font-semibold text-slate-500">Friday - Sunday</span>
                <span className="font-mono text-gold-500 font-bold">{settings.openingHours.weekends}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Column 2: Form panel */}
        <div className="lg:col-span-3 bg-cinema-card/55 border border-white/5 rounded-lg p-6 sm:p-8 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1.5 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gold-500" />
            Send Us a Message
          </h3>
          <p className="text-[10px] uppercase font-bold tracking-wide text-slate-500 mb-6">
            We prioritize replying to support emails within 24 operational hours.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-mono font-bold uppercase text-slate-500 block mb-1 tracking-wider">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Danyal Amin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/45 border border-white/5 rounded-sm px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold uppercase text-slate-500 block mb-1 tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/45 border border-white/5 rounded-sm px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-mono font-bold uppercase text-slate-500 block mb-1 tracking-wider">
                Subject
              </label>
              <input
                type="text"
                placeholder="How can we assist you?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-black/45 border border-white/5 rounded-sm px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="text-[9px] font-mono font-bold uppercase text-slate-500 block mb-1 tracking-wider">
                Your Message
              </label>
              <textarea
                required
                rows={5}
                placeholder="Tell us what you'd like to ask..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-black/45 border border-white/5 rounded-sm p-4 text-xs text-white focus:outline-none focus:border-gold-500"
              />
            </div>

            {isSent && (
              <div className="p-4 bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs rounded-sm flex items-center gap-2">
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Message successfully sent! JFC Box-Office will inspect your ticket inquiry shortly.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="w-full sm:w-auto py-3.5 px-8 rounded-sm font-bold text-xs text-black bg-gold-600 hover:bg-gold-500 uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 self-start cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>Simulating Connection...</>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                  Send Inquiry Message
                </>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
