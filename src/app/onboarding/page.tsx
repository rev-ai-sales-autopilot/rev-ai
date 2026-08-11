import { createOrganizationAction } from '../auth/actions';
import OnboardingForm from './onboarding-form';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error;

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

          <OnboardingForm initialError={error} action={createOrganizationAction} />
        </div>
      </div>
    </div>
  );
}
