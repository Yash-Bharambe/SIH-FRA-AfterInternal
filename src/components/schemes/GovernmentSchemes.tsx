import React, { useState } from 'react';
import { Award, Calendar, MapPin, DollarSign, Filter, ExternalLink } from 'lucide-react';

const mockSchemes = [
  {
    id: 1,
    name: 'PM-KISAN Scheme',
    description: 'Direct income support to farmers with small and marginal holdings',
    eligibility: ['Small farmers', 'Marginal land holders', 'Agricultural plots'],
    funding: 6000,
    deadline: '2024-03-31',
    status: 'active' as const,
    states: ['Karnataka', 'Maharashtra', 'Tamil Nadu'],
    zoneTypes: ['agricultural'],
    category: 'Income Support'
  },
  {
    id: 2,
    name: 'Forest Rights Act',
    description: 'Recognition of forest dwelling communities and their rights over forest land',
    eligibility: ['Forest dwelling communities', 'Tribal populations', 'Forest plots'],
    funding: 25000,
    deadline: '2024-06-30',
    status: 'active' as const,
    states: ['Karnataka', 'Maharashtra'],
    zoneTypes: ['forest'],
    category: 'Land Rights'
  },
  {
    id: 3,
    name: 'Watershed Development Scheme',
    description: 'Sustainable development of natural resources in watershed areas',
    eligibility: ['Water scarce areas', 'Degraded lands', 'Rural communities'],
    funding: 150000,
    deadline: '2024-12-31',
    status: 'active' as const,
    states: ['Karnataka', 'Tamil Nadu', 'Gujarat'],
    zoneTypes: ['agricultural', 'water'],
    category: 'Water Conservation'
  },
  {
    id: 4,
    name: 'Soil Health Card Scheme',
    description: 'Soil testing and nutrient management for sustainable agriculture',
    eligibility: ['All farmers', 'Agricultural land', 'Cooperative societies'],
    funding: 5000,
    deadline: '2024-04-15',
    status: 'active' as const,
    states: ['All States'],
    zoneTypes: ['agricultural'],
    category: 'Soil Management'
  },
  {
    id: 5,
    name: 'National Afforestation Programme',
    description: 'Afforestation and eco-restoration of degraded forest lands',
    eligibility: ['Degraded forest land', 'Community participation', 'JFM committees'],
    funding: 75000,
    deadline: '2024-08-31',
    status: 'upcoming' as const,
    states: ['Karnataka', 'Kerala', 'Tamil Nadu'],
    zoneTypes: ['forest', 'water'],
    category: 'Afforestation'
  }
];

export const GovernmentSchemes: React.FC = () => {
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');

  const filteredSchemes = mockSchemes.filter(scheme => {
    const stateMatch = selectedState === 'all' || 
                     scheme.states.includes(selectedState) || 
                     scheme.states.includes('All States');
    const categoryMatch = selectedCategory === 'all' || scheme.category === selectedCategory;
    const zoneMatch = selectedZone === 'all' || scheme.zoneTypes.includes(selectedZone);
    
    return stateMatch && categoryMatch && zoneMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'forest-badge-success';
      case 'upcoming':
        return 'forest-badge bg-forest-sky text-forest-dark';
      case 'closed':
        return 'forest-badge-secondary';
      default:
        return 'forest-badge-secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="forest-card bg-gradient-to-r from-forest-sage/10 to-forest-medium/10 border-forest-medium/30">
        <h1 className="text-3xl font-bold text-forest-dark mb-2">Decision Support System</h1>
        <p className="text-forest-medium text-lg">AI-powered scheme eligibility assessment and government scheme discovery</p>
      </div>

      {/* Government Schemes Content */}
      <div className="space-y-8">
          {/* Filters */}
          <div className="forest-chart">
            <div className="forest-chart-header">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-forest-dark" />
                <h3 className="forest-chart-title">Filter Schemes</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="forest-form-label">State</label>
                <select 
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="forest-select"
                >
                  <option value="all">All States</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Kerala">Kerala</option>
                </select>
              </div>

              <div>
                <label className="forest-form-label">Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="forest-select"
                >
                  <option value="all">All Categories</option>
                  <option value="Income Support">Income Support</option>
                  <option value="Land Rights">Land Rights</option>
                  <option value="Water Conservation">Water Conservation</option>
                  <option value="Soil Management">Soil Management</option>
                  <option value="Afforestation">Afforestation</option>
                </select>
              </div>

              <div>
                <label className="forest-form-label">Zone Type</label>
                <select 
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="forest-select"
                >
                  <option value="all">All Zones</option>
                  <option value="agricultural">Agricultural</option>
                  <option value="forest">Forest</option>
                  <option value="water">Water Bodies</option>
                  <option value="residential">Residential</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="forest-stat-card text-center">
              <div className="forest-stat-value text-forest-dark mb-2">{filteredSchemes.length}</div>
              <div className="forest-stat-label">Available Schemes</div>
            </div>
            
            <div className="forest-stat-card text-center">
              <div className="forest-stat-value text-forest-medium mb-2">
                {filteredSchemes.filter(s => s.status === 'active').length}
              </div>
              <div className="forest-stat-label">Active Schemes</div>
            </div>
            
            <div className="forest-stat-card text-center">
              <div className="forest-stat-value text-forest-moss mb-2">
                {formatCurrency(filteredSchemes.reduce((sum, scheme) => sum + scheme.funding, 0))}
              </div>
              <div className="forest-stat-label">Total Funding</div>
            </div>
            
            <div className="forest-stat-card text-center">
              <div className="forest-stat-value text-forest-accent mb-2">47</div>
              <div className="forest-stat-label">Eligible Plots</div>
            </div>
          </div>

          {/* Schemes List */}
          <div className="space-y-4">
            {filteredSchemes.map((scheme) => (
              <div key={scheme.id} className="forest-card hover:shadow-forest-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-3 bg-forest-sage/10 rounded-xl shadow-forest">
                      <Award className="h-6 w-6 text-forest-dark" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-forest-dark">{scheme.name}</h3>
                      <p className="text-forest-medium mt-1 max-w-2xl">{scheme.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`forest-badge capitalize ${getStatusColor(scheme.status)}`}>
                      {scheme.status}
                    </span>
                    <button className="p-2 text-forest-medium hover:text-forest-dark rounded-lg hover:bg-forest-sage/10 transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-forest-dark">Eligibility</h4>
                    <div className="flex flex-wrap gap-2">
                      {scheme.eligibility.map((criteria, index) => (
                        <span key={index} className="forest-badge-secondary text-sm">
                          {criteria}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-forest-dark">Coverage</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-forest-medium">
                        <MapPin className="h-4 w-4" />
                        <span>{scheme.states.join(', ')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {scheme.zoneTypes.map((zone, index) => (
                          <span key={index} className="forest-badge-success text-sm capitalize">
                            {zone}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-forest-dark">Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <DollarSign className="h-4 w-4 text-forest-medium" />
                        <span className="font-semibold text-forest-medium">{formatCurrency(scheme.funding)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-forest-medium">
                        <Calendar className="h-4 w-4" />
                        <span>Deadline: {new Date(scheme.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-forest-sage/20 flex justify-end">
                  <button className="forest-button-primary">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredSchemes.length === 0 && (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-forest-medium mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-forest-dark mb-2">No schemes found</h3>
              <p className="text-forest-medium">Try adjusting your filters to find relevant schemes.</p>
            </div>
          )}
      </div>
    </div>
  );
};