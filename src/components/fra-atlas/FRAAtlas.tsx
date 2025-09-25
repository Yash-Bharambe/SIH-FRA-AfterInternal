import React, { useEffect, useRef, useState } from 'react';
import { Map, Filter, Search, Download, Eye, MapPin, Users, TreePine, Mountain, Droplets, Leaf, ToggleLeft, ToggleRight, BarChart3, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listGeojsonWithStatus } from '../../services/supabaseGeoService';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const mockFRAData = [
  {
    id: 'FRA-OD-001',
    claimId: 'IFR/2024/OD/KAL/001',
    type: 'IFR',
    status: 'granted',
    applicant: 'Ramesh Gond',
    village: 'Poduchunapadar',
    block: 'Kalahandi',
    district: 'Kalahandi',
    state: 'Odisha',
    tribalGroup: 'Gond',
    areaHectares: 2.5,
    coordinates: { lat: 19.9067, lng: 83.1636 },
    grantDate: '2024-01-15',
    documentUrl: 'https://example.com/documents/ramesh_gond_claim.pdf'
  },
  {
    id: 'FRA-OD-002',
    claimId: 'CFR/2024/OD/KAL/002',
    type: 'CFR',
    status: 'pending',
    applicant: 'Poduchunapadar Tribal Committee',
    village: 'Poduchunapadar',
    block: 'Kalahandi',
    district: 'Kalahandi',
    state: 'Odisha',
    tribalGroup: 'Kandha',
    areaHectares: 45.8,
    coordinates: { lat: 19.9067, lng: 83.1636 },
    grantDate: null,
    documentUrl: 'https://example.com/documents/tribal_committee_claim.pdf'
  },
  {
    id: 'FRA-OD-003',
    claimId: 'CR/2024/OD/KAL/003',
    type: 'CR',
    status: 'granted',
    applicant: 'Poduchunapadar Community',
    village: 'Poduchunapadar',
    block: 'Kalahandi',
    district: 'Kalahandi',
    state: 'Odisha',
    tribalGroup: 'Gond',
    areaHectares: 12.3,
    coordinates: { lat: 19.9067, lng: 83.1636 },
    grantDate: '2024-01-10',
    documentUrl: 'https://example.com/documents/community_rights_claim.pdf'
  },
  {
    id: 'FRA-OD-004',
    claimId: 'IFR/2024/OD/KAL/004',
    type: 'IFR',
    status: 'rejected',
    applicant: 'Lakshman Gond',
    village: 'Poduchunapadar',
    block: 'Kalahandi',
    district: 'Kalahandi',
    state: 'Odisha',
    tribalGroup: 'Gond',
    areaHectares: 1.8,
    coordinates: { lat: 19.9067, lng: 83.1636 },
    grantDate: null,
    documentUrl: 'https://example.com/documents/lakshman_gond_claim.pdf'
  },
  {
    id: 'FRA-OD-005',
    claimId: 'IFR/2024/OD/KAL/005',
    type: 'IFR',
    status: 'granted',
    applicant: 'Sita Gond',
    village: 'Poduchunapadar',
    block: 'Kalahandi',
    district: 'Kalahandi',
    state: 'Odisha',
    tribalGroup: 'Gond',
    areaHectares: 3.2,
    coordinates: { lat: 19.9067, lng: 83.1636 },
    grantDate: '2024-02-01',
    documentUrl: 'https://example.com/documents/sita_gond_claim.pdf'
  }
];

export const FRAAtlas: React.FC = () => {
  const [selectedState, setSelectedState] = useState('Odisha');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLayers, setActiveLayers] = useState({
    ifr: true,
    cr: true,
    cfr: true,
    forestCover: true,
    waterBodies: true,
    farmland: true
  });

  const [geoLayers, setGeoLayers] = useState<{ claim_id: string; status: 'pending' | 'approved' | 'rejected'; geojson: any; applicant_name?: string | null; area?: number | null }[]>([]);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const rows = await listGeojsonWithStatus();
        setGeoLayers(rows);
      } catch {}
    })();
  }, []);

  // Center map around Poduchunapadar, Odisha 765015 by default
  const defaultCenter: [number, number] = [19.427051848890738, 83.27881023459298];
  const defaultZoom = 14;

  // Fit bounds to all geo layers when available
  useEffect(() => {
    if (!mapRef.current || geoLayers.length === 0) return;
    try {
      const features: any[] = [];
      geoLayers.forEach(layer => {
        if (layer.geojson?.type === 'FeatureCollection') {
          features.push(...layer.geojson.features);
        } else if (layer.geojson?.type === 'Feature') {
          features.push(layer.geojson);
        }
      });
      if (features.length > 0) {
        const fc = { type: 'FeatureCollection', features } as any;
        const bounds = L.geoJSON(fc as any).getBounds();
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds.pad(0.1));
        }
      }
    } catch {}
  }, [geoLayers]);

  const filteredData = mockFRAData.filter(item => {
    const stateMatch = selectedState === 'all' || item.state === selectedState;
    const typeMatch = selectedType === 'all' || item.type === selectedType;
    const statusMatch = selectedStatus === 'all' || item.status === selectedStatus;
    const searchMatch = searchTerm === '' || 
      item.applicant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.claimId.toLowerCase().includes(searchTerm.toLowerCase());
    
    return stateMatch && typeMatch && statusMatch && searchMatch;
  });

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted':
        return 'forest-badge-success';
      case 'pending':
        return 'forest-badge-warning';
      case 'rejected':
        return 'forest-badge-error';
      default:
        return 'forest-badge-secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IFR':
        return 'forest-badge bg-forest-sky text-forest-primary';
      case 'CR':
        return 'forest-badge bg-forest-mint/20 text-forest-accent';
      case 'CFR':
        return 'forest-badge-success';
      default:
        return 'forest-badge-secondary';
    }
  };

  const handleDownloadData = () => {
    const dataToDownload = filteredData.map(claim => ({
      'Claim ID': claim.claimId,
      'Applicant Name': claim.applicant,
      'Type': claim.type,
      'Status': claim.status,
      'Village': claim.village,
      'District': claim.district,
      'State': claim.state,
      'Tribal Group': claim.tribalGroup,
      'Area (Hectares)': claim.areaHectares,
      'Coordinates': `${claim.coordinates.lat}, ${claim.coordinates.lng}`,
      'Grant Date': claim.grantDate || 'Pending',
      'Document URL': claim.documentUrl || 'N/A'
    }));

    const csvContent = [
      Object.keys(dataToDownload[0]).join(','),
      ...dataToDownload.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'fra_claims_poduchunapadar.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-forest-fade-in">
      {/* Header */}
      <div className="forest-card-elevated bg-gradient-to-r from-forest-light/10 to-forest-accent/10 border-forest-accent/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-forest-primary mb-3">FRA Atlas - Poduchunapadar</h1>
            <p className="text-forest-secondary text-xl">Interactive mapping of Forest Rights Act claims and granted titles</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleDownloadData}
              className="forest-button-primary flex items-center space-x-3"
            >
              <Download className="h-5 w-5" />
              <span>Download Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="forest-chart">
        <div className="forest-chart-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Filter className="h-6 w-6 text-white" />
            </div>
            <h3 className="forest-chart-title">Filter FRA Claims</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="forest-form-group">
            <label className="forest-form-label">State</label>
            <select 
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="forest-select"
            >
              <option value="Odisha">Odisha</option>
            </select>
          </div>

          <div className="forest-form-group">
            <label className="forest-form-label">Claim Type</label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="forest-select"
            >
              <option value="all">All Types</option>
              <option value="IFR">Individual Forest Rights</option>
              <option value="CR">Community Rights</option>
              <option value="CFR">Community Forest Resource Rights</option>
            </select>
          </div>

          <div className="forest-form-group">
            <label className="forest-form-label">Status</label>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="forest-select"
            >
              <option value="all">All Status</option>
              <option value="granted">Granted</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="forest-form-group">
            <label className="forest-form-label">Search</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-forest-accent pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search claims..."
                className="forest-input pl-12"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive WebGIS Map */}
      <div className="forest-chart">
        <div className="forest-chart-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Map className="h-6 w-6 text-white" />
            </div>
            <h3 className="forest-chart-title">Interactive WebGIS Map</h3>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-forest-secondary">Coverage:</div>
            <div className="forest-badge-success">
              <div className="w-3 h-3 bg-forest-accent rounded-full animate-forest-pulse mr-2"></div>
              <span>1 Village Active</span>
            </div>
          </div>
        </div>
        
        <div className="forest-map relative bg-gradient-to-br from-forest-sky to-forest-light/20 h-[700px] mb-6 overflow-hidden rounded-2xl border-2 border-forest-accent/20">
          <MapContainer center={defaultCenter} zoom={defaultZoom} whenCreated={(map) => { mapRef.current = map; }} className="w-full h-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {geoLayers.map(layer => (
              <GeoJSON 
                key={layer.claim_id} 
                data={layer.geojson} 
                style={() => ({
                  color: layer.status === 'approved' ? '#16a34a' : layer.status === 'rejected' ? '#dc2626' : '#ca8a04',
                  weight: 2,
                  fillOpacity: 0.2,
                })}
                onEachFeature={(_, leafletLayer) => {
                  let hoverTimer: any;
                  const status = layer.status;
                  const applicant = layer.applicant_name ?? 'Unknown claimant';
                  const area = layer.area != null ? `${layer.area}` : 'N/A';
                  const tooltipHtml = `
                    <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto; font-size: 12px;">
                      <div style="font-weight: 700; margin-bottom: 4px;">Claim Info</div>
                      <div><b>Status:</b> ${status}</div>
                      <div><b>Area:</b> ${area}</div>
                      <div><b>Claimant:</b> ${applicant}</div>
                    </div>
                  `;
                  leafletLayer.on('mouseover', (e: any) => {
                    hoverTimer = setTimeout(() => {
                      leafletLayer.bindTooltip(tooltipHtml, { sticky: true, direction: 'top', opacity: 0.95 }).openTooltip(e.latlng);
                    }, 2000);
                  });
                  leafletLayer.on('mouseout', () => {
                    if (hoverTimer) {
                      clearTimeout(hoverTimer);
                      hoverTimer = null;
                    }
                    if ((leafletLayer as any).closeTooltip) {
                      (leafletLayer as any).closeTooltip();
                    }
                  });
                  leafletLayer.on('click', (e: any) => {
                    // Immediate show on click as well
                    leafletLayer.bindTooltip(tooltipHtml, { sticky: true, direction: 'top', opacity: 0.95 }).openTooltip(e.latlng);
                  });
                }}
              />
            ))}
          </MapContainer>



{/* Enhanced Village Information Panel */}
<div className="absolute bottom-6 left-6 bg-forest-primary/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-forest-accent/30 z-20">
  <div className="text-sm font-bold mb-3 flex items-center text-forest-accent">
    <TreePine className="h-4 w-4 mr-2 text-forest-accent" />
    Village Details
  </div>
  <div className="space-y-2">
    <div className="flex items-center space-x-3">
      <div className="w-3 h-3 bg-forest-accent rounded-full"></div>
      <span className="text-sm font-semibold text-forest-light">Poduchunapadar</span>
    </div>
    <div className="flex items-center space-x-3">
      <div className="w-3 h-3 bg-forest-light rounded-full"></div>
      <span className="text-sm font-semibold text-forest-light">Kalahandi District</span>
    </div>
    <div className="flex items-center space-x-3">
      <div className="w-3 h-3 bg-forest-mint rounded-full"></div>
      <span className="text-sm font-semibold text-forest-light">Odisha State</span>
    </div>
    <div className="flex items-center space-x-3">
      <div className="w-3 h-3 bg-earth-light rounded-full"></div>
      <span className="text-sm font-semibold text-forest-light">Tribal Village</span>
    </div>
  </div>
</div>

          
          {/* Enhanced Statistics Panel */}
          <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-forest-accent/20">
            <div className="text-sm font-bold text-forest-primary mb-3 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Village Statistics
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-2xl text-forest-primary">{filteredData.length}</div>
                <div className="text-forest-secondary">Total Claims</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-success">
                  {filteredData.filter(c => c.status === 'granted').length}
                </div>
                <div className="text-forest-secondary">Granted</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-warning">
                  {filteredData.filter(c => c.status === 'pending').length}
                </div>
                <div className="text-forest-secondary">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-error">
                  {filteredData.filter(c => c.status === 'rejected').length}
                </div>
                <div className="text-forest-secondary">Rejected</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Hover Tooltip Example */}
        <div className="forest-card-elevated bg-gradient-to-r from-forest-light/10 to-forest-accent/10 border-forest-accent/30">
          <div className="flex items-start space-x-4">
            <div className="p-4 bg-gradient-primary rounded-2xl shadow-lg">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-forest-primary mb-3">Village: Poduchunapadar, Kalahandi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-forest-secondary font-semibold">Patta Holders:</span>
                  <p className="text-forest-primary font-bold text-lg">Ramesh Gond, Sita Gond</p>
                </div>
                <div>
                  <span className="text-forest-secondary font-semibold">DSS Eligibility:</span>
                  <p className="text-forest-primary font-bold text-lg">PM-KISAN, FRA</p>
                </div>
                <div>
                  <span className="text-forest-secondary font-semibold">Claim Type:</span>
                  <p className="text-forest-primary font-bold text-lg">IFR - 2.5 hectares</p>
                </div>
                <div>
                  <span className="text-forest-secondary font-semibold">Status:</span>
                  <p className="text-success font-bold text-lg">Granted (2024-01-15)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Village-Level Progress Dashboard */}
      <div className="forest-chart">
        <div className="forest-chart-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="forest-chart-title">Village-Level FRA Progress Dashboard</h3>
          </div>
          <div className="text-sm text-forest-secondary">
            Poduchunapadar, Kalahandi District
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Total Claims */}
          <div className="forest-stat-card text-center">
            <div className="forest-stat-value text-forest-primary">{filteredData.length}</div>
            <div className="forest-stat-label">Total Claims</div>
            <div className="text-xs text-forest-secondary mt-2">All Types Combined</div>
          </div>
          
          {/* Approved Claims */}
          <div className="forest-stat-card text-center">
            <div className="forest-stat-value text-success">
              {filteredData.filter(c => c.status === 'granted').length}
            </div>
            <div className="forest-stat-label">Approved</div>
            <div className="text-xs text-forest-secondary mt-2">
              {Math.round((filteredData.filter(c => c.status === 'granted').length / filteredData.length) * 100)}% Success Rate
            </div>
          </div>
          
          {/* Pending Claims */}
          <div className="forest-stat-card text-center">
            <div className="forest-stat-value text-warning">
              {filteredData.filter(c => c.status === 'pending').length}
            </div>
            <div className="forest-stat-label">Pending</div>
            <div className="text-xs text-forest-secondary mt-2">Under Review</div>
          </div>
          
          {/* Rejected Claims */}
          <div className="forest-stat-card text-center">
            <div className="forest-stat-value text-error">
              {filteredData.filter(c => c.status === 'rejected').length}
            </div>
            <div className="forest-stat-label">Rejected</div>
            <div className="text-xs text-forest-secondary mt-2">Require Resubmission</div>
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Claim Type Distribution */}
          <div className="forest-card-elevated">
            <h4 className="text-xl font-semibold text-forest-primary mb-6 flex items-center">
              <div className="p-2 bg-gradient-primary rounded-lg mr-3">
                <TreePine className="h-5 w-5 text-white" />
              </div>
              Claim Type Distribution
            </h4>
            <div className="space-y-4">
              {['IFR', 'CR', 'CFR'].map(type => {
                const count = filteredData.filter(c => c.type === type).length;
                const percentage = filteredData.length > 0 ? (count / filteredData.length) * 100 : 0;
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-forest-secondary font-medium">{type} Claims</span>
                      <span className="text-forest-primary font-bold">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-forest-light/20 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          type === 'IFR' ? 'bg-forest-primary' : 
                          type === 'CR' ? 'bg-forest-accent' : 'bg-forest-light'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="forest-card-elevated">
            <h4 className="text-xl font-semibold text-forest-primary mb-6 flex items-center">
              <div className="p-2 bg-gradient-primary rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Recent Activity
            </h4>
            <div className="space-y-4">
              {filteredData
                .filter(c => c.grantDate)
                .sort((a, b) => new Date(b.grantDate!).getTime() - new Date(a.grantDate!).getTime())
                .slice(0, 5)
                .map((claim, index) => (
                  <div key={claim.id} className="flex items-center space-x-4 p-4 bg-forest-light/10 rounded-xl border border-forest-light/20">
                    <div className="w-3 h-3 bg-success rounded-full animate-forest-pulse"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-forest-primary">{claim.applicant}</p>
                      <p className="text-xs text-forest-secondary">
                        {claim.type} • {claim.areaHectares} hectares • {new Date(claim.grantDate!).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="forest-badge-success text-xs">Approved</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};