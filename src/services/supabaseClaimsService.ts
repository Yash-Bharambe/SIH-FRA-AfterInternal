import { supabase } from './supabaseClient';

export interface SupabaseClaimRow {
  id: string;
  ack_id?: string | null;
  user_id: string;
  village: string;
  area: number;
  coordinates: string;
  document_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string | null;
  rejection_reason?: string | null;
  applicant_name?: string | null;
  claim_type?: string | null;
  documents?: string[] | null;
  aadhaar?: string | null;
}

export type CreateClaimInput = {
  ack_id?: string | null;
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
        ack_id: input.ack_id ?? null,
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

  async getByAckId(ackId: string): Promise<SupabaseClaimRow | null> {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('ack_id', ackId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as SupabaseClaimRow | null;
  },

  async deleteById(id: string): Promise<void> {
    const { error } = await supabase
      .from('claims')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async updateStatus(params: { id: string; status: 'approved' | 'rejected'; rejection_reason?: string | null }): Promise<void> {
    const update: Record<string, any> = { status: params.status };
    if (params.status === 'approved') {
      update.approved_at = new Date().toISOString();
      update.rejection_reason = null;
    } else if (params.status === 'rejected') {
      update.approved_at = null;
      update.rejection_reason = params.rejection_reason ?? null;
    }
    const { error } = await supabase
      .from('claims')
      .update(update)
      .eq('id', params.id);
    if (error) throw error;
  },
};


