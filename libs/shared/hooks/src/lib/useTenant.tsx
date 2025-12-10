import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  appName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  primaryDomain?: string;
  plan: string;
  status: string;
  features: {
    maxContributors: number;
    maxArticlesPerMonth: number;
    aiGenerationEnabled: boolean;
    wordpressPublishing: boolean;
    customDomains: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    advancedAnalytics: boolean;
  };
}

interface TenantContextType {
  tenant: Tenant | null;
  tenantId: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  tenantId: null,
  isLoading: true,
  error: null,
  refetch: async () => {},
});

interface TenantProviderProps {
  children: ReactNode;
  supabase: SupabaseClient;
}

export function TenantProvider({ children, supabase }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setTenant(null);
        return;
      }

      const tenantId = user.app_metadata?.tenant_id;
      
      if (!tenantId) {
        setTenant(null);
        return;
      }

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tenantError) throw tenantError;

      setTenant({
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        appName: tenantData.app_name,
        logoUrl: tenantData.logo_url,
        primaryColor: tenantData.primary_color,
        secondaryColor: tenantData.secondary_color,
        accentColor: tenantData.accent_color,
        primaryDomain: tenantData.primary_domain,
        plan: tenantData.plan,
        status: tenantData.status,
        features: tenantData.features,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tenant'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadTenant();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantId: tenant?.id ?? null,
        isLoading,
        error,
        refetch: loadTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

export default useTenant;
