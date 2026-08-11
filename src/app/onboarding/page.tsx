import { createOrganizationAction } from '../auth/actions';
import { ArrowRight, Building2, Globe, FileText, Briefcase } from 'lucide-react';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-swiss-grid flex items-center justify-center p-6 selection:bg-[#12B76A]">
      <div className="w-full max-w-xl relative">
        {/* Background Geometric Accent Block */}
        <div className="absolute -top-6 -left-6 w-full h-full bg-block-pink -z-10 transform -rotate-1 pointer-events-none" />

        <div className="border-sharp bg-white p-8 md:p-12 shadow-2xl">
          {/* Header */}
          <div className="mb-8 border-b border-black pb-6">
            <div className="inline-flex items-center gap-2 bg-[#12B76A] text-black font-extrabold text-xs px-3 py-1 uppercase tracking-widest mb-4">
              STEP 1 / MULTI-TENANT ONBOARDING
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black">
              Create Organization
            </h1>
            <p className="text-xs font-bold text-black/70 uppercase tracking-widest mt-2">
              Establish your isolated multi-tenant business workspace
            </p>
          </div>

          {/* Form */}
          <form action={createOrganizationAction} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                Company / Business Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Acme Automation Labs"
                  className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium"
                />
                <Building2 className="absolute right-3 top-3.5 w-4 h-4 text-black/40" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                Industry Sector *
              </label>
              <div className="relative">
                <select
                  name="industry"
                  required
                  className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium appearance-none"
                >
                  <option value="">Select Primary Industry</option>
                  <option value="B2B Software & SaaS">B2B Software & SaaS</option>
                  <option value="AI & Automation Services">AI & Automation Services</option>
                  <option value="Marketing & Digital Agency">Marketing & Digital Agency</option>
                  <option value="E-commerce & Retail">E-commerce & Retail</option>
                  <option value="Financial & Legal Services">Financial & Legal Services</option>
                  <option value="Healthcare & Tech">Healthcare & Tech</option>
                  <option value="Other Business Services">Other Business Services</option>
                </select>
                <Briefcase className="absolute right-3 top-3.5 w-4 h-4 text-black/40 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Company Website
                </label>
                <div className="relative">
                  <input
                    type="url"
                    name="website"
                    placeholder="https://company.com"
                    className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium"
                  />
                  <Globe className="absolute right-3 top-3.5 w-4 h-4 text-black/40" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Owner Access Code *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="accessCode"
                    required
                    placeholder="Enter Owner Access Code (e.g. rev9422)"
                    className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black font-mono font-bold placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                Short Business Description
              </label>
              <div className="relative">
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Describe your primary services, core products, and customer target market..."
                  className="w-full border-sharp bg-[#F1F2F3] px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#12B76A] transition-all font-medium resize-none"
                />
                <FileText className="absolute right-3 top-3.5 w-4 h-4 text-black/40" />
              </div>
            </div>

            <button type="submit" className="btn-pill-primary w-full justify-center py-4 text-sm uppercase tracking-wider mt-4">
              Launch Workspace & Enter Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
