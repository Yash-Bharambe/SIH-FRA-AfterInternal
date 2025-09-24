import { supabase } from './supabaseClient';

export interface SupabaseClaimRow {
  id: string;
  user_id: string;
  village: string;
  area: number;
  coordinates: string;
  document_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string | null;
  applicant_name?: string | null;
  claim_type?: string | null;
  documents?: string[] | null;
  aadhaar?: string | null;
}

export type CreateClaimInput = {
  user_id: string;
  village: string;
  area: number;
  coordinates: string;
  document_url?: string | null;
  applicant_name?: string | null;
  claim_type?: string | null;
  documents?: string[] | null;
  aadhaar?: string | null;
};

export const supabaseClaimsService = {
  async create(input: CreateClaimInput): Promise<SupabaseClaimRow> {
    const { data, error } = await supabase
      .from('claims')
      .insert({
        user_id: input.user_id,
        village: input.village,
        area: input.area,
        coordinates: input.coordinates,
        document_url: input.document_url ?? null,
        status: 'pending',
        applicant_name: input.applicant_name ?? null,
        claim_type: input.claim_type ?? null,
        documents: input.documents ?? null,
        aadhaar: input.aadhaar ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SupabaseClaimRow;
  },

  async listAll(): Promise<SupabaseClaimRow[]> {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as SupabaseClaimRow[];
  },
};


