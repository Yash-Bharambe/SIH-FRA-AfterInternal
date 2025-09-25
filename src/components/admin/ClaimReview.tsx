import React, { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle, Clock, FileText, MapPin, User, Calendar, Download, Filter, Search, Shield, TreePine, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { supabaseClaimsService } from '../../services/supabaseClaimsService';
import { hasGeojson, upsertClaimGeojson } from '../../services/supabaseGeoService';

interface Claim {
  id?: string;
  user_id: string;
  village: string;
  area: number;
  coordinates: string;
  document_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  approved_at?: string;
  applicantName?: string;
  claimType?: string;
  documents?: string[];
  rejection_reason?: string;
  ack_id?: string;
  // Additional fields for display
  claimId?: string;
  type?: string;
  applicant?: string;
  block?: string;
  district?: string;
  state?: string;
  tribalGroup?: string;
  areaHectares?: number;
  grantDate?: string;
  documentUrl?: string;
}

type SortField = 'created_at' | 'status' | 'applicant' | 'village' | 'area';
type SortDirection = 'asc' | 'desc';

export const ClaimReview: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter and search states
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchById, setSearchById] = useState('');
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Modal states
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [geoRequiredError, setGeoRequiredError] = useState<string | null>(null);
  const rejectionCategories: Record<string, string[]> = {
    'Incomplete / Incorrect Information': [
      "Claimant name missing or incorrect",
      "Father’s/Mother’s/Spouse’s name missing",
      "Gender & Age not provided or invalid",
      "Caste/Tribal Group not mentioned or invalid",
      "Village/District/State details incomplete",
      "Land claimed details missing or unclear",
      "Survey Number / GPS Coordinates missing or invalid"
    ],
    'Document Issues': [
      "Identity Proof missing",
      "Identity Proof invalid or unclear",
      "Tribe/Community Certificate missing",
      "Tribe/Community Certificate invalid or unclear",
      "FRA Claim Form (Form-A) missing",
      "FRA Claim Form (Form-A) invalid or incomplete",
      "Gram Sabha Resolution missing",
      "Gram Sabha Resolution invalid or unsigned"
    ],
    'Eligibility Issues': [
      "Claimant not belonging to a recognized Scheduled Tribe / eligible community",
      "Claimant not residing in the claimed village/district",
      "Land claimed is outside FRA eligibility area"
    ],
    'Verification Issues': [
      "Gram Sabha Resolution verification failed",
      "Claim details could not be verified locally",
      "Duplicate claim found for the same land/survey number"
    ],
    'Other Reasons': [
      'Manually specify reason'
    ]
  };
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false);
  const [rejectCategory, setRejectCategory] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectOther, setRejectOther] = useState<string>('');
  const [rejectInlineError, setRejectInlineError] = useState<string>('');
  const [geojsonText, setGeojsonText] = useState<string>('');

  useEffect(() => {
    loadClaims();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [claims, filterStatus, filterType, searchTerm, searchById, sortField, sortDirection]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const rows = await supabaseClaimsService.listAll();
      const mapped = rows.map(r => ({
        id: r.id,
        user_id: r.user_id,
        village: r.village,
        area: r.area,
        coordinates: r.coordinates,
        document_url: r.document_url ?? undefined,
        status: r.status,
        created_at: r.created_at,
        approved_at: r.approved_at ?? undefined,
        applicantName: r.applicant_name ?? undefined,
        claimType: r.claim_type ?? undefined,
        documents: r.documents ?? undefined,
        rejection_reason: r.rejection_reason ?? undefined,
        ack_id: r.ack_id ?? undefined,
        claimId: r.id || `FRA-${r.id}`,
        type: r.claim_type || 'IFR',
        applicant: r.applicant_name || 'Unknown Applicant',
        block: 'Kalahandi',
        district: 'Kalahandi',
        state: 'Odisha',
        tribalGroup: 'Gond',
        areaHectares: r.area,
        grantDate: r.approved_at ?? undefined,
        documentUrl: r.document_url ?? undefined
      }));
      setClaims(mapped);
    } catch (e) {
      console.error('Failed to load claims from Supabase', e);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...claims];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(claim => claim.status === filterStatus);
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(claim => claim.type === filterType);
    }

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(claim => 
        claim.applicant?.toLowerCase().includes(term) ||
        claim.village.toLowerCase().includes(term) ||
        claim.claimId?.toLowerCase().includes(term) ||
        claim.applicantName?.toLowerCase().includes(term)
      );
    }

    // Apply ID search filter
    if (searchById) {
      const id = searchById.toLowerCase();
      filtered = filtered.filter(claim => 
        claim.id?.toLowerCase().includes(id) ||
        claim.ack_id?.toLowerCase().includes(id) ||
        claim.claimId?.toLowerCase().includes(id)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredClaims(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const openClaimModal = (claim: Claim) => {
    setSelectedClaim(claim);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedClaim(null);
    setGeoRequiredError(null);
    setShowRejectForm(false);
    setRejectCategory('');
    setRejectReason('');
    setRejectOther('');
    setRejectInlineError('');
    setGeojsonText('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'forest-badge-success';
      case 'pending':
        return 'forest-badge-warning';
      case 'rejected':
        return 'forest-badge-error';
      default:
        return 'forest-badge-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const refreshClaims = async () => {
    await loadClaims();
  };

  const handleApprove = async () => {
    if (!selectedClaim?.id) return;
    try {
      const exists = await hasGeojson(selectedClaim.id);
      if (!exists) {
        setGeoRequiredError('GeoJSON is required before approving. Please attach a valid boundary in Admin Panel.');
        return;
      }
      await supabaseClaimsService.updateStatus({ id: selectedClaim.id, status: 'approved' });
      await refreshClaims();
      closeModal();
    } catch (e) {
      console.error('Failed to approve claim', e);
      alert('Failed to approve claim.');
    }
  };

  const handleRejectClick = () => {
    setShowRejectForm(true);
    setRejectInlineError('');
  };

  const handleConfirmReject = async () => {
    if (!selectedClaim?.id) return;
    const hasOther = rejectCategory === 'Other Reasons';
    const chosen = hasOther ? (rejectOther?.trim() || '') : (rejectReason?.trim() || '');
    if (!rejectCategory || !chosen) {
      setRejectInlineError('Please select a rejection category and reason (or type a custom reason).');
      return;
    }
    const reason = hasOther ? chosen : `${rejectCategory} - ${chosen}`;
    try {
      await supabaseClaimsService.updateStatus({ id: selectedClaim.id, status: 'rejected', rejection_reason: reason });
      await refreshClaims();
      closeModal();
    } catch (e) {
      console.error('Failed to reject claim', e);
      alert('Failed to reject claim.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="forest-card">
          <div className="flex items-center justify-center py-12">
            <div className="forest-spinner"></div>
            <span className="ml-3 text-forest-medium">Loading claims...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-forest-fade-in">
      {/* Header */}
      <div className="forest-card-elevated bg-gradient-to-r from-forest-sage/10 to-forest-medium/10 border-forest-medium/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-forest-primary mb-3">Claim Review</h1>
            <p className="text-forest-secondary text-xl">Review, filter, and manage Forest Rights Act claims</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="forest-badge-primary">
              <Shield className="h-4 w-4 mr-2" />
              <span>Admin Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="forest-stat-card">
          <div className="forest-stat-value text-forest-deep">{claims.length}</div>
          <div className="forest-stat-label">Total Claims</div>
          <div className="text-xs text-forest-medium mt-2">All submissions</div>
        </div>
        
        <div className="forest-stat-card">
          <div className="forest-stat-value text-green-600">
            {claims.filter(c => c.status === 'approved').length}
          </div>
          <div className="forest-stat-label">Approved</div>
          <div className="text-xs text-forest-medium mt-2">
            {Math.round((claims.filter(c => c.status === 'approved').length / claims.length) * 100)}% Success Rate
          </div>
        </div>
        
        <div className="forest-stat-card">
          <div className="forest-stat-value text-yellow-600">
            {claims.filter(c => c.status === 'pending').length}
          </div>
          <div className="forest-stat-label">Pending Review</div>
          <div className="text-xs text-forest-medium mt-2">Awaiting decision</div>
        </div>
        
        <div className="forest-stat-card">
          <div className="forest-stat-value text-red-600">
            {claims.filter(c => c.status === 'rejected').length}
          </div>
          <div className="forest-stat-label">Rejected</div>
          <div className="text-xs text-forest-medium mt-2">Require resubmission</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="forest-chart">
        <div className="forest-chart-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-forest-gradient rounded-lg">
              <Filter className="h-6 w-6 text-white" />
            </div>
            <h3 className="forest-chart-title">Filter & Search Claims</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="forest-form-group">
            <label className="forest-form-label">Status</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="forest-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="forest-form-group">
            <label className="forest-form-label">Claim Type</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="forest-select"
            >
              <option value="all">All Types</option>
              <option value="IFR">Individual Forest Rights</option>
              <option value="CR">Community Rights</option>
              <option value="CFR">Community Forest Resource Rights</option>
            </select>
          </div>

          <div className="forest-form-group">
            <label className="forest-form-label">Search by Name/Village</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-forest-medium pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search claims..."
                className="forest-input pl-10"
              />
            </div>
          </div>

          <div className="forest-form-group">
            <label className="forest-form-label">Search by ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-forest-medium pointer-events-none" />
              <input
                type="text"
                value={searchById}
                onChange={(e) => setSearchById(e.target.value)}
                placeholder="Search by ID..."
                className="forest-input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="forest-chart">
        <div className="forest-chart-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-forest-gradient rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="forest-chart-title">Claims List</h3>
            </div>
            <div className="text-sm text-forest-medium">
              Showing {filteredClaims.length} of {claims.length} claims
            </div>
          </div>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="forest-card-elevated text-center py-16">
            <div className="p-6 bg-forest-sage/20 rounded-2xl w-fit mx-auto mb-6">
              <FileText className="h-16 w-16 text-forest-medium" />
            </div>
            <h3 className="text-2xl font-semibold text-forest-deep mb-4">No Claims Found</h3>
            <p className="text-forest-medium text-lg">
              {searchTerm || searchById || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'No claims have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forest-sage/20">
                  <th className="text-left py-3 px-4 font-semibold text-forest-deep">
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center space-x-2 hover:text-forest-primary transition-colors"
                    >
                      <span>Date</span>
                      {getSortIcon('created_at')}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-forest-deep">
                    <button
                      onClick={() => handleSort('applicant')}
                      className="flex items-center space-x-2 hover:text-forest-primary transition-colors"
                    >
                      <span>Applicant</span>
                      {getSortIcon('applicant')}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-forest-deep">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-2 hover:text-forest-primary transition-colors"
                    >
                      <span>Status</span>
                      {getSortIcon('status')}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-forest-deep">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-forest-deep">
                    <button
                      onClick={() => handleSort('village')}
                      className="flex items-center space-x-2 hover:text-forest-primary transition-colors"
                    >
                      <span>Location</span>
                      {getSortIcon('village')}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-forest-deep">
                    <button
                      onClick={() => handleSort('area')}
                      className="flex items-center space-x-2 hover:text-forest-primary transition-colors"
                    >
                      <span>Area (ha)</span>
                      {getSortIcon('area')}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-forest-deep">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="border-b border-forest-sage/10 hover:bg-forest-sage/5 transition-colors">
                    <td className="py-3 px-4 text-sm text-forest-medium">
                      {claim.created_at ? formatDate(claim.created_at) : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-forest-deep">{claim.applicant}</div>
                        <div className="text-xs text-forest-medium">{claim.claimId}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(claim.status)}
                        <span className={getStatusColor(claim.status)}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="forest-badge bg-forest-sky/20 text-forest-deep">
                        {claim.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-forest-medium">
                      {claim.village}, {claim.district}
                    </td>
                    <td className="py-3 px-4 text-sm text-forest-medium">
                      {claim.areaHectares}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openClaimModal(claim)}
                        className="forest-button-secondary flex items-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Claim Review Modal */}
      {isModalOpen && selectedClaim && (
        <div className="forest-modal" onClick={closeModal}>
          <div className="forest-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="forest-modal-header">
              <div>
                <h2 className="forest-modal-title">Review FRA Claim</h2>
                <p className="text-forest-medium mt-2">{selectedClaim.claimId}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-forest-medium hover:text-forest-deep rounded-lg hover:bg-forest-sage/10 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="forest-modal-body">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Claim Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-forest-gradient rounded-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-forest-deep">Claim Information</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                      <span className="text-forest-medium font-medium">Applicant:</span>
                      <span className="text-forest-deep font-semibold">{selectedClaim.applicant}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                      <span className="text-forest-medium font-medium">Claim Type:</span>
                      <span className="forest-badge bg-forest-sky/20 text-forest-deep">{selectedClaim.type}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                      <span className="text-forest-medium font-medium">Area:</span>
                      <span className="text-forest-deep font-semibold">{selectedClaim.areaHectares} hectares</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                      <span className="text-forest-medium font-medium">Location:</span>
                      <span className="text-forest-deep font-semibold">{selectedClaim.village}, {selectedClaim.district}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                      <span className="text-forest-medium font-medium">Tribal Group:</span>
                      <span className="text-forest-deep font-semibold">{selectedClaim.tribalGroup}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                      <span className="text-forest-medium font-medium">Coordinates:</span>
                      <span className="text-forest-deep font-semibold text-sm">{selectedClaim.coordinates}</span>
                    </div>
                  </div>
                </div>

                {/* Documents and Status */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-forest-gradient rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-forest-deep">Documents & Status</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-forest-sage/10 rounded-xl">
                      <h4 className="text-forest-deep font-semibold mb-3">Uploaded Documents:</h4>
                      <div className="space-y-2">
                        {selectedClaim.documents && selectedClaim.documents.length > 0 ? (
                          selectedClaim.documents.map((doc, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
                              <FileText className="h-4 w-4 text-forest-medium" />
                              <span className="text-sm text-forest-deep">{doc}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-forest-medium text-sm">No documents uploaded</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-forest-sage/10 rounded-xl">
                      <h4 className="text-forest-deep font-semibold mb-3">Current Status:</h4>
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(selectedClaim.status)}
                        <span className={getStatusColor(selectedClaim.status)}>
                          {selectedClaim.status.charAt(0).toUpperCase() + selectedClaim.status.slice(1)}
                        </span>
                      </div>
                      {selectedClaim.grantDate && (
                        <p className="text-forest-medium text-sm mt-2">
                          Granted on: {formatDate(selectedClaim.grantDate)}
                        </p>
                      )}
                      {selectedClaim.status === 'rejected' && selectedClaim.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700 font-medium text-sm">Rejection Reason:</p>
                          <p className="text-red-600 text-sm mt-1 italic">"{selectedClaim.rejection_reason}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GeoJSON Upload Section */}
            {selectedClaim.status === 'pending' && (
              <div className="px-6 pb-6">
                <div className="p-4 bg-forest-sage/10 rounded-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-forest-gradient rounded-lg">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-forest-deep">GeoJSON Boundary Data</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="forest-form-label">GeoJSON Data</label>
                      <textarea
                        value={geojsonText}
                        onChange={(e) => {
                          setGeojsonText(e.target.value);
                          setGeoRequiredError(null);
                        }}
                        placeholder="Paste GeoJSON Feature or FeatureCollection here..."
                        className="w-full h-32 p-3 border border-forest-sage/30 rounded-lg text-sm font-mono bg-white/80 focus:border-forest-primary focus:ring-2 focus:ring-forest-primary/20"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-forest-medium">
                        Required for claim approval. Paste valid GeoJSON boundary data.
                      </div>
                      <button
                        onClick={async () => {
                          if (!selectedClaim?.id) return;
                          if (!geojsonText.trim()) {
                            setGeoRequiredError('Please enter GeoJSON data before saving.');
                            return;
                          }
                          try {
                            let geojson;
                            try {
                              geojson = JSON.parse(geojsonText);
                            } catch (e) {
                              setGeoRequiredError('Invalid JSON format. Please check your GeoJSON syntax.');
                              return;
                            }
                            await upsertClaimGeojson(selectedClaim.id, geojson);
                            setGeoRequiredError(null);
                            alert('GeoJSON data saved successfully!');
                          } catch (e) {
                            console.error('Failed to save GeoJSON', e);
                            setGeoRequiredError('Failed to save GeoJSON data. Please try again.');
                          }
                        }}
                        className="forest-button-primary flex items-center space-x-2"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Save GeoJSON</span>
                      </button>
                    </div>
                    
                    {geoRequiredError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{geoRequiredError}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="forest-modal-footer">
              <button
                onClick={closeModal}
                className="forest-button-secondary"
              >
                Close
              </button>
              {selectedClaim.status === 'pending' && (
                <>
                  <button
                    onClick={handleRejectClick}
                    className="forest-button-error flex items-center space-x-2"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={handleApprove}
                    className="forest-button-success flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                </>
              )}
            </div>
            {geoRequiredError && (
              <div className="px-6 pb-6 text-xs text-red-600">{geoRequiredError}</div>
            )}

            {/* Rejection Reason Selector */}
            {selectedClaim.status !== 'approved' && showRejectForm && (
              <div className="px-6 pb-6">
                <div className="p-4 bg-forest-sage/10 rounded-xl">
                  <h4 className="text-forest-deep font-semibold mb-3">Set Rejection Reason</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="forest-form-label">Category</label>
                      <select
                        value={rejectCategory}
                        onChange={(e) => {
                          setRejectCategory(e.target.value);
                          setRejectReason('');
                          setRejectOther('');
                          setRejectInlineError('');
                        }}
                        className="forest-select w-full"
                      >
                        <option value="">Select category</option>
                        {Object.keys(rejectionCategories).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    {rejectCategory && rejectCategory !== 'Other Reasons' && (
                      <div>
                        <label className="forest-form-label">Reason</label>
                        <select
                          value={rejectReason}
                          onChange={(e) => { setRejectReason(e.target.value); setRejectInlineError(''); }}
                          className="forest-select w-full"
                        >
                          <option value="">Select reason</option>
                          {rejectionCategories[rejectCategory].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {rejectCategory === 'Other Reasons' && (
                      <div>
                        <label className="forest-form-label">Custom Reason</label>
                        <textarea
                          value={rejectOther}
                          onChange={(e) => { setRejectOther(e.target.value); setRejectInlineError(''); }}
                          placeholder="Type rejection reason"
                          className="w-full h-20 p-2 border rounded-md text-sm"
                        />
                      </div>
                    )}
                    {rejectInlineError && (
                      <p className="text-xs text-red-600">{rejectInlineError}</p>
                    )}
                    <p className="text-xs text-forest-medium">Note: Reason will be visible to the claimant.</p>
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={handleConfirmReject}
                        disabled={!rejectCategory || (!rejectReason && rejectCategory !== 'Other Reasons') || (rejectCategory === 'Other Reasons' && !rejectOther.trim())}
                        className="forest-button-error flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Confirm Rejection</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectCategory('');
                          setRejectReason('');
                          setRejectOther('');
                          setRejectInlineError('');
                        }}
                        className="forest-button-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
