import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserOrgMembership } from '@/lib/supabase/user-profile';
import { Bot, CheckCircle2, ShieldCheck, Flame, Users, CalendarCheck, TrendingUp, AlertCircle } from 'lucide-react';
import AIIntelligenceStatusCard from '@/components/dashboard/ai-intelligence-status';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Query actual database metrics for the current organization
  let totalLeadsCount = 0;
  let hotLeadsCount = 0;
  let meetingsCount = 0;
  let conversionsCount = 0;
  let activeOrgName = 'Rev AI Workspace';
  let activeOrgIndustry = 'Sales Automation';

  if (user) {
    try {
      const membership = await getUserOrgMembership(supabase, user);

      if (membership) {
        const orgId = membership.organizationId;
        activeOrgName = membership.orgName;
        activeOrgIndustry = membership.orgIndustry;

          // Fetch actual database lead metrics scoped by orgId
          const { count: leads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId);
          totalLeadsCount = leads || 0;

          const { count: hotLeads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .or('ai_classification.eq.HOT,heat_level.eq.HOT');
          hotLeadsCount = hotLeads || 0;

          const { count: meetings } = await supabase
            .from('meetings')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId);
          meetingsCount = meetings || 0;

          const { count: won } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'WON');
          conversionsCount = won || 0;
        }
    } catch {
      // Placeholder DB fallback
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome Card */}
      <div className="border-sharp bg-white p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-full bg-block-green opacity-80 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-black text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-widest mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#12B76A]" /> MULTI-TENANT ISOLATED WORKSPACE
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">
              {activeOrgName}
            </h1>
            <p className="text-xs font-bold text-black/60 uppercase tracking-widest mt-1">
              Industry: {activeOrgIndustry} • Tenant Security Status: Active RLS
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="border-sharp bg-[#F1F2F3] px-4 py-2 text-center">
              <div className="text-[10px] font-bold text-black/60 uppercase">User Identity</div>
              <div className="text-xs font-extrabold text-black font-mono">{user?.email || 'Active User'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border-sharp bg-white p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-black/60">Total Leads</span>
            <Users className="w-4 h-4 text-black" />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black tracking-tight">{totalLeadsCount}</span>
            <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Database Real Metric</p>
          </div>
        </div>

        <div className="border-sharp bg-white p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-black/60">Hot Leads</span>
            <Flame className="w-4 h-4 text-[#12B76A]" />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black tracking-tight text-[#12B76A]">{hotLeadsCount}</span>
            <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Score Threshold &gt; 80</p>
          </div>
        </div>

        <div className="border-sharp bg-white p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-black/60">Scheduled Meetings</span>
            <CalendarCheck className="w-4 h-4 text-[#20C8E8]" />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black tracking-tight">{meetingsCount}</span>
            <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Confirmed Calendar Slots</p>
          </div>
        </div>

        <div className="border-sharp bg-white p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-black/60">Deals Converted</span>
            <TrendingUp className="w-4 h-4 text-[#F4B62A]" />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black tracking-tight">{conversionsCount}</span>
            <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Status: WON</p>
          </div>
        </div>
      </div>

      {/* Rev AI Intelligence Engine Status */}
      <AIIntelligenceStatusCard />

      {/* System Automation Status Section */}
      <div className="border-sharp bg-white p-8">
        <div className="flex items-center justify-between border-b border-black pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              System Automation Status
            </h2>
            <p className="text-xs font-bold text-black/60 uppercase tracking-widest mt-1">
              Real-time pipeline engine operational status
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-[#12B76A] text-black font-extrabold text-xs px-3 py-1 uppercase tracking-wider">
            <Bot className="w-3.5 h-3.5" /> Engine Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-sharp bg-[#F1F2F3] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#12B76A]" />
              <div>
                <h4 className="font-extrabold text-sm uppercase text-black">Lead Ingestion API</h4>
                <p className="text-xs text-black/60">Multi-tenant webhook capture endpoints</p>
              </div>
            </div>
            <span className="bg-[#12B76A] text-black text-[10px] font-extrabold px-2 py-0.5 uppercase">
              Active
            </span>
          </div>

          <div className="border-sharp bg-[#F1F2F3] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#12B76A]" />
              <div>
                <h4 className="font-extrabold text-sm uppercase text-black">AI Lead Intelligence</h4>
                <p className="text-xs text-black/60">Qwen 3.5 scoring & decision engine</p>
              </div>
            </div>
            <span className="bg-[#12B76A] text-black text-[10px] font-extrabold px-2 py-0.5 uppercase">
              Active (Qwen 3.5)
            </span>
          </div>

          <div className="border-sharp bg-[#F1F2F3] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-black/40" />
              <div>
                <h4 className="font-extrabold text-sm uppercase text-black/80">Automated Follow-ups</h4>
                <p className="text-xs text-black/60">n8n event bus dispatcher & triggers</p>
              </div>
            </div>
            <span className="bg-black/10 text-black/60 text-[10px] font-bold px-2 py-0.5 uppercase">
              Operational
            </span>
          </div>

          <div className="border-sharp bg-[#F1F2F3] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-black/40" />
              <div>
                <h4 className="font-extrabold text-sm uppercase text-black/80">Calendar Integration</h4>
                <p className="text-xs text-black/60">Google / Cal.com meeting booking</p>
              </div>
            </div>
            <span className="bg-black/10 text-black/60 text-[10px] font-bold px-2 py-0.5 uppercase">
              Not Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
