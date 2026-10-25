import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle, ArrowUpRight, Send, Check } from "lucide-react";
import PageShell from "@/components/site/PageShell";
import { PageHero, Section } from "@/components/site/PageParts";
import { CONTACT } from "@/lib/site-data";
import api from "@/lib/api";

const ENQUIRY_CHANNELS = [
  { key: "sales", title: "Sales Enquiry", body: "New machine, complete line or quotation request.", subject: "Sales Enquiry" },
  { key: "spares", title: "Spare Parts Enquiry", body: "Genuine OEM spares, wear parts and replacements.", subject: "Spare Parts Enquiry" },
  { key: "service", title: "Service Enquiry", body: "AMC, breakdown support and upgrades.", subject: "Service Enquiry" },
  { key: "technical", title: "International Enquiry", body: "Process, specification, scale-up or validation questions.", subject: "Technical Enquiry" },
];

const OFFICES = [
  { region: "Headquarters", name: "Mumbai, India", address: "Prochem Tapasya, Industrial Estate, Mumbai, Maharashtra, India", phone: CONTACT.phone },
  { region: "Regional Office", name: "Middle East", address: "Dubai, United Arab Emirates", phone: "+971 4 000 0000" },
  { region: "Regional Partner", name: "South East Asia", address: "Singapore", phone: "+65 6000 0000" },
  { region: "Regional Partner", name: "Africa", address: "Nairobi, Kenya", phone: "+254 700 000 000" },
];

const WHATSAPP = CONTACT.phone.replace(/[^0-9]/g, "");

export default function ContactPage() {
  const [form, setForm] = useState({
    type: "sales",
    name: "",
    company: "",
    email: "",
    phone: "",
    country: "",
    message: "",
  });

  const [status, setStatus] = useState({ state: "idle", msg: "" });

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: "sending", msg: "" });
    const channel = ENQUIRY_CHANNELS.find((c) => c.key === form.type);
    const typeMap = { sales: "contact", technical: "consultation", spares: "spare_parts", service: "contact" };
    const payload = {
      type: typeMap[form.type] || "contact",
      subject: channel?.subject,
      source_page: "/contact",
      name: form.name,
      company: form.company,
      email: form.email,
      phone: form.phone,
      country: form.country,
      message: form.message,
      enquiry_channel: channel?.title,
    };
    try {
      await api.post("/enquiries", payload);
      setStatus({ state: "sent", msg: "Thanks — we've received your enquiry." });
      setForm({ type: "sales", name: "", company: "", email: "", phone: "", country: "", message: "" });
    } catch {
      const subject = `${channel?.subject || "Enquiry"} · ${form.company || form.name || "Prochem Tapasya"}`;
      const body = `Enquiry Type: ${channel?.title}\nName: ${form.name}\nCompany: ${form.company}\nEmail: ${form.email}\nPhone: ${form.phone}\nCountry: ${form.country}\n\nMessage:\n${form.message}\n`;
      window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const inputCls =
    "w-full bg-white border border-black/15 px-4 py-3 font-mono text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-prochem-red transition-colors";

  return (
    <PageShell testid="contact-page">
      <PageHero
        kicker="Contact"
        title={<>Let's talk<br />engineering.</>}
        intro="Sales, technical, spare parts or service — one team responds within one business day."
        testid="contact-hero"
      />

      {/* 01 Contact information + quick reach strip */}
      <Section index={1} kicker="Contact Information" title="Reach us directly." testid="section-contact-info">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href={`mailto:${CONTACT.email}`} data-testid="contact-email" className="group flex items-start gap-4 bg-white border border-black/10 p-6 hover:border-ink transition-colors">
            <Mail size={22} className="text-prochem-red mt-0.5" />
            <div>
              <p className="font-mono uppercase text-[0.65rem] tracking-[0.25em] text-ink/40">Email</p>
              <p className="mt-2 font-display uppercase tracking-tight text-lg text-ink group-hover:text-prochem-red transition-colors">{CONTACT.email}</p>
            </div>
          </a>
          <a href={`tel:${CONTACT.phone.replace(/\s+/g, "")}`} data-testid="contact-phone" className="group flex items-start gap-4 bg-white border border-black/10 p-6 hover:border-ink transition-colors">
            <Phone size={22} className="text-prochem-red mt-0.5" />
            <div>
              <p className="font-mono uppercase text-[0.65rem] tracking-[0.25em] text-ink/40">Phone</p>
              <p className="mt-2 font-display uppercase tracking-tight text-lg text-ink group-hover:text-prochem-red transition-colors">{CONTACT.phone}</p>
            </div>
          </a>
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" data-testid="contact-whatsapp" className="group flex items-start gap-4 bg-white border border-black/10 p-6 hover:border-ink transition-colors">
            <MessageCircle size={22} className="text-prochem-red mt-0.5" />
            <div>
              <p className="font-mono uppercase text-[0.65rem] tracking-[0.25em] text-ink/40">WhatsApp</p>
              <p className="mt-2 font-display uppercase tracking-tight text-lg text-ink group-hover:text-prochem-red transition-colors">Chat with us</p>
            </div>
          </a>
        </div>
      </Section>

      {/* 02..05 Enquiry channels */}
      <Section alt index={2} kicker="Enquiry Channels" title="Choose the right team." testid="section-enquiry-channels"
        note="Route your message to the team that owns it — replies are faster and more specific.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ENQUIRY_CHANNELS.map((c, i) => (
            <a
              key={c.key}
              data-testid={`enquiry-${c.key}`}
              href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(c.subject)}`}
              className="group bg-white border border-black/10 p-6 hover:border-ink transition-colors"
            >
              <p className="font-mono uppercase text-[0.65rem] tracking-[0.25em] text-prochem-red">
                {String(i + 2).padStart(2, "0")} · {c.title}
              </p>
              <h3 className="mt-4 font-display uppercase tracking-tight text-xl text-ink group-hover:text-prochem-red transition-colors">
                {c.title}
              </h3>
              <p className="mt-3 text-ink/70 text-sm">{c.body}</p>
              <p className="mt-6 inline-flex items-center gap-2 font-mono uppercase text-[0.7rem] tracking-[0.2em] text-ink">
                Email team
                <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </p>
            </a>
          ))}
        </div>
      </Section>

      {/* 06 Offices */}
      <Section index={6} kicker="Global Offices / Locations" title="Where we are." testid="section-offices">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {OFFICES.map((o) => (
            <div key={o.name} className="bg-white border border-black/10 p-6">
              <p className="font-mono uppercase text-[0.65rem] tracking-[0.25em] text-prochem-red">{o.region}</p>
              <h3 className="mt-3 font-display uppercase tracking-tight text-xl text-ink">{o.name}</h3>
              <p className="mt-3 text-ink/70 text-sm flex items-start gap-2">
                <MapPin size={14} className="text-tapasya-blue mt-1 shrink-0" />
                {o.address}
              </p>
              <p className="mt-2 text-ink/70 text-sm flex items-center gap-2">
                <Phone size={14} className="text-tapasya-blue shrink-0" />
                {o.phone}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 07 Contact form */}
      <Section alt index={7} kicker="Contact Form" title="Send us a note." testid="section-contact-form"
        note="On submit, we'll open your email client pre-filled — no data is stored on this website.">
        <form data-testid="contact-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <div className="md:col-span-2">
            <label className="font-mono uppercase text-[0.65rem] tracking-[0.25em] text-ink/50">Enquiry Type</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ENQUIRY_CHANNELS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  data-testid={`form-type-${c.key}`}
                  onClick={() => setForm({ ...form, type: c.key })}
                  className={`px-4 py-2 font-mono uppercase text-[0.7rem] tracking-[0.2em] border transition-colors ${
                    form.type === c.key
                      ? "border-prochem-red bg-prochem-red text-white"
                      : "border-black/15 text-ink/70 hover:border-ink"
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>
          <input required data-testid="form-name" placeholder="Full name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input data-testid="form-company" placeholder="Company" className={inputCls} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <input required type="email" data-testid="form-email" placeholder="Email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input data-testid="form-phone" placeholder="Phone" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input data-testid="form-country" placeholder="Country" className={`${inputCls} md:col-span-2`} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <textarea required data-testid="form-message" placeholder="Your message — include batch size, application and compliance needs." rows={5} className={`${inputCls} md:col-span-2 resize-none`} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <div className="md:col-span-2 flex items-center gap-4 flex-wrap">
            <button
              type="submit"
              disabled={status.state === "sending"}
              data-testid="form-submit"
              className="group inline-flex items-center gap-3 bg-prochem-red text-white pl-6 pr-5 py-3.5 font-mono uppercase text-xs tracking-[0.15em] hover:bg-ink transition-colors disabled:opacity-50"
            >
              {status.state === "sending" ? "Sending…" : "Send Enquiry"}
              {status.state === "sent" ? <Check size={14} /> : <Send size={14} className="transition-transform group-hover:translate-x-0.5" />}
            </button>
            {status.state === "sent" && (
              <span data-testid="contact-form-success" className="font-mono uppercase text-[0.65rem] tracking-widest text-green-600">
                {status.msg}
              </span>
            )}
          </div>
        </form>
      </Section>

      {/* 08 Map */}
      <Section index={8} kicker="Map" title="Find us on the ground." testid="section-map">
        <div className="aspect-[16/7] w-full overflow-hidden border border-black/10">
          <iframe
            title="Prochem Tapasya location"
            data-testid="contact-map"
            src="https://www.google.com/maps?q=Pune%2C%20Maharashtra%2C%20India&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Section>

      {/* 09 Quick contact strip */}
      <Section dark index={9} kicker="WhatsApp · Phone · Email" title="Reach us any way." testid="section-quick-contact">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a data-testid="quick-whatsapp" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="group border border-white/20 p-6 hover:border-white transition-colors">
            <MessageCircle size={22} className="text-prochem-red" />
            <p className="mt-5 font-mono uppercase text-[0.65rem] tracking-[0.25em] text-white/50">WhatsApp</p>
            <p className="mt-2 font-display uppercase tracking-tight text-2xl text-white group-hover:text-prochem-red transition-colors">Chat now</p>
          </a>
          <a data-testid="quick-phone" href={`tel:${CONTACT.phone.replace(/\s+/g, "")}`} className="group border border-white/20 p-6 hover:border-white transition-colors">
            <Phone size={22} className="text-prochem-red" />
            <p className="mt-5 font-mono uppercase text-[0.65rem] tracking-[0.25em] text-white/50">Phone</p>
            <p className="mt-2 font-display uppercase tracking-tight text-2xl text-white group-hover:text-prochem-red transition-colors">{CONTACT.phone}</p>
          </a>
          <a data-testid="quick-email" href={`mailto:${CONTACT.email}`} className="group border border-white/20 p-6 hover:border-white transition-colors">
            <Mail size={22} className="text-prochem-red" />
            <p className="mt-5 font-mono uppercase text-[0.65rem] tracking-[0.25em] text-white/50">Email</p>
            <p className="mt-2 font-display uppercase tracking-tight text-2xl text-white group-hover:text-prochem-red transition-colors">{CONTACT.email}</p>
          </a>
        </div>
      </Section>
    </PageShell>
  );
}
