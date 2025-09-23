export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'district_officer' | 'tribal_welfare' | 'forest_dept' | 'revenue_dept' | 'ngo';
  department: string;
  state: 'Madhya Pradesh' | 'Tripura' | 'Odisha' | 'Telangana';
  district?: string;
  created_at: string;
}

export interface FRARecord {
  id: string;
  claim_id: string;
  patta_number?: string;
  claim_type: 'IFR' | 'CR' | 'CFR';
  status: 'pending' | 'verified' | 'granted' | 'rejected';
  applicant_name: string;
  village: string;
  block: string;
  district: string;
  state: 'Madhya Pradesh' | 'Tripura' | 'Odisha' | 'Telangana';
  tribal_group: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  area_hectares: number;
  claim_date: string;
  verification_date?: string;
  grant_date?: string;
  documents: FRADocument[];
  assets: AssetMapping[];
  eligible_schemes: string[];
  created_at: string;
}

export interface FRADocument {
  id: string;
  claim_id: string;
  name: string;
  type: 'application' | 'verification' | 'survey' | 'patta' | 'legacy';
  file_url: string;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_entities: {
    village_names: string[];
    patta_holders: string[];
    coordinates: string[];
    claim_status: string;
    dates: string[];
  };
  uploaded_at: string;
}

export interface AssetMapping {
  id: string;
  claim_id: string;
  asset_type: 'agricultural_land' | 'forest_cover' | 'water_body' | 'homestead' | 'pond' | 'stream';
  coordinates: {
    lat: number;
    lng: number;
  };
  area_sqm: number;
  confidence_score: number;
  detected_by: 'satellite_ai' | 'ground_survey' | 'manual';
  detection_date: string;
}

export interface CSSScheme {
  id: string;
  name: string;
  ministry: 'DAJGUA' | 'Rural Development' | 'Jal Shakti' | 'Agriculture' | 'Tribal Affairs';
  description: string;
  eligibility_criteria: string[];
  target_beneficiaries: string[];
  funding_amount: number;
  application_process: string;
  deadline?: string;
  status: 'active' | 'closed' | 'upcoming';
  applicable_states: string[];
  priority_score: number;
}

export interface VillageProfile {
  id: string;
  name: string;
  block: string;
  district: string;
  state: string;
  tribal_population: number;
  total_population: number;
  fra_claims_total: number;
  fra_claims_granted: number;
  water_index: number;
  forest_cover_percentage: number;
  infrastructure_score: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  assets_summary: {
    agricultural_land: number;
    water_bodies: number;
    forest_area: number;
    homesteads: number;
  };
}

export interface DashboardStats {
  total_claims: number;
  granted_claims: number;
  pending_verification: number;
  active_schemes: number;
  states_covered: number;
  villages_mapped: number;
  claim_distribution: {
    IFR: number;
    CR: number;
    CFR: number;
  };
  state_wise_progress: {
    [state: string]: {
      total: number;
      granted: number;
      pending: number;
    };
  };
  asset_mapping_progress: {
    villages_completed: number;
    total_villages: number;
    assets_detected: number;
  };
}

export interface DSSSuggestion {
  id: string;
  village_id: string;
  scheme_id: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  estimated_beneficiaries: number;
  implementation_timeline: string;
  required_actions: string[];
  success_probability: number;
}