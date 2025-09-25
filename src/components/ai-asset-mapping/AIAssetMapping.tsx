import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Satellite, 
  Map, 
  BarChart3, 
  Layers, 
  Download, 
  RefreshCw, 
  Eye, 
  Filter, 
  Search,
  TreePine,
  Droplets,
  Home,
  Route,
  Mountain,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Target,
  Zap,
  Leaf,
  Crop,
  Building,
  XCircle
} from 'lucide-react';
import { aiAssetMappingService } from '../../services/aiAssetMappingService';
import { AssetMapping, SatelliteImageData, AIModel, AssetAnalysisResult } from '../../types';

export const AIAssetMapping: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'analysis' | 'satellite'>('overview');
  const [loading, setLoading] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState<string>('village-001');
  const [selectedAssetType, setSelectedAssetType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data states
  const [models, setModels] = useState<AIModel[]>([]);
  const [satelliteImages, setSatelliteImages] = useState<SatelliteImageData[]>([]);
  const [assetMappings, setAssetMappings] = useState<AssetMapping[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AssetAnalysisResult | null>(null);
  
  // Modal states
  const [selectedAsset, setSelectedAsset] = useState<AssetMapping | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'analysis') {
      loadAnalysisResult();
    }
  }, [activeTab, selectedVillage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modelsData, imagesData, mappingsData] = await Promise.all([
        aiAssetMappingService.getAIModels(),
        aiAssetMappingService.getSatelliteImages(),
        aiAssetMappingService.getAssetMappings()
      ]);
      
      setModels(modelsData);
      setSatelliteImages(imagesData);
      setAssetMappings(mappingsData);
    } catch (error) {
      console.error('Failed to load AI Asset Mapping data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysisResult = async () => {
    try {
      const result = await aiAssetMappingService.analyzeVillageAssets(selectedVillage);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Failed to load analysis result:', error);
    }
  };

  const filteredAssets = assetMappings.filter(asset => {
    const matchesVillage = selectedVillage === 'all' || asset.village_id === selectedVillage;
    const matchesType = selectedAssetType === 'all' || asset.asset_type === selectedAssetType;
    const matchesSearch = !searchTerm || 
      asset.asset_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.land_use_classification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesVillage && matchesType && matchesSearch;
  });

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'agricultural_land': return <Crop className="h-5 w-5" />;
      case 'forest_cover': return <TreePine className="h-5 w-5" />;
      case 'water_body': return <Droplets className="h-5 w-5" />;
      case 'homestead': return <Home className="h-5 w-5" />;
      case 'infrastructure': return <Route className="h-5 w-5" />;
      case 'mineral_deposit': return <Mountain className="h-5 w-5" />;
      default: return <Map className="h-5 w-5" />;
    }
  };

  const getAssetColor = (assetType: string) => {
    switch (assetType) {
      case 'agricultural_land': return 'text-green-600 bg-green-50';
      case 'forest_cover': return 'text-green-700 bg-green-100';
      case 'water_body': return 'text-blue-600 bg-blue-50';
      case 'homestead': return 'text-orange-600 bg-orange-50';
      case 'infrastructure': return 'text-gray-600 bg-gray-50';
      case 'mineral_deposit': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'training': return <Clock className="h-4 w-4 text-amber-600" />;
      case 'deprecated': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatArea = (areaSqm: number) => {
    if (areaSqm >= 10000) {
      return `${(areaSqm / 10000).toFixed(1)} hectares`;
    }
    return `${areaSqm.toFixed(0)} sqm`;
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const openAssetModal = (asset: AssetMapping) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="forest-card">
          <div className="flex items-center justify-center py-12">
            <div className="forest-spinner"></div>
            <span className="ml-3 text-forest-medium">Loading AI Asset Mapping...</span>
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
            <h1 className="text-4xl font-bold text-forest-primary mb-3">AI Asset Mapping</h1>
            <p className="text-forest-secondary text-xl">Satellite-based asset detection and analysis using Computer Vision & ML</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="forest-badge-primary">
              <Brain className="h-4 w-4 mr-2" />
              <span>AI-Powered</span>
            </div>
            <button
              onClick={loadData}
              className="forest-button-secondary flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="forest-card">
        <div className="flex space-x-1 bg-forest-sage/10 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'models', label: 'AI Models', icon: Brain },
            { id: 'analysis', label: 'Village Analysis', icon: Target },
            { id: 'satellite', label: 'Satellite Data', icon: Satellite }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-forest-primary shadow-sm'
                  : 'text-forest-medium hover:text-forest-primary hover:bg-white/50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="forest-stat-card">
              <div className="forest-stat-value text-forest-deep">{models.length}</div>
              <div className="forest-stat-label">AI Models</div>
              <div className="text-xs text-forest-medium mt-2">Active ML Models</div>
            </div>
            
            <div className="forest-stat-card">
              <div className="forest-stat-value text-blue-600">{satelliteImages.length}</div>
              <div className="forest-stat-label">Satellite Images</div>
              <div className="text-xs text-forest-medium mt-2">Processed Images</div>
            </div>
            
            <div className="forest-stat-card">
              <div className="forest-stat-value text-green-600">{assetMappings.length}</div>
              <div className="forest-stat-label">Assets Detected</div>
              <div className="text-xs text-forest-medium mt-2">AI-Detected Assets</div>
            </div>
            
            <div className="forest-stat-card">
              <div className="forest-stat-value text-purple-600">
                {models.reduce((sum, model) => sum + model.processed_count, 0).toLocaleString()}
              </div>
              <div className="forest-stat-label">Total Processed</div>
              <div className="text-xs text-forest-medium mt-2">Data Points Analyzed</div>
            </div>
          </div>

          {/* Asset Types Distribution */}
          <div className="forest-chart">
            <div className="forest-chart-header">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-forest-gradient rounded-lg">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <h3 className="forest-chart-title">Asset Types Distribution</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['agricultural_land', 'forest_cover', 'water_body', 'homestead', 'infrastructure', 'mineral_deposit'].map(type => {
                const count = assetMappings.filter(asset => asset.asset_type === type).length;
                const totalArea = assetMappings.filter(asset => asset.asset_type === type).reduce((sum, asset) => sum + asset.area_sqm, 0);
                
                return (
                  <div key={type} className="p-4 bg-forest-sage/10 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`flex items-center space-x-2 p-2 rounded-lg ${getAssetColor(type)}`}>
                        {getAssetIcon(type)}
                        <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                      </div>
                      <span className="text-2xl font-bold text-forest-deep">{count}</span>
                    </div>
                    <div className="text-sm text-forest-medium">
                      Total Area: {formatArea(totalArea)}
                    </div>
                    <div className="text-xs text-forest-medium mt-1">
                      Avg Confidence: {formatConfidence(
                        assetMappings.filter(asset => asset.asset_type === type).reduce((sum, asset) => sum + asset.confidence_score, 0) / count || 0
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Assets */}
          <div className="forest-chart">
            <div className="forest-chart-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-forest-gradient rounded-lg">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="forest-chart-title">Recent Asset Detections</h3>
                </div>
                <div className="text-sm text-forest-medium">
                  Showing {filteredAssets.length} assets
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredAssets.slice(0, 10).map(asset => (
                <div key={asset.id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getAssetColor(asset.asset_type)}`}>
                      {getAssetIcon(asset.asset_type)}
                    </div>
                    <div>
                      <div className="font-medium text-forest-deep capitalize">
                        {asset.asset_type.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-forest-medium">
                        {asset.land_use_classification || 'Unclassified'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm font-medium text-forest-deep">{formatArea(asset.area_sqm)}</div>
                      <div className="text-xs text-forest-medium">Area</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-forest-deep">{formatConfidence(asset.confidence_score)}</div>
                      <div className="text-xs text-forest-medium">Confidence</div>
                    </div>
                    <button
                      onClick={() => openAssetModal(asset)}
                      className="forest-button-secondary flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Models Tab */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="forest-chart">
            <div className="forest-chart-header">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-forest-gradient rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="forest-chart-title">AI Models Performance</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              {models.map(model => (
                <div key={model.id} className="p-6 bg-white/50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-forest-gradient rounded-lg">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-forest-deep">{model.name}</h4>
                        <p className="text-sm text-forest-medium">Version {model.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(model.status)}
                      <span className="text-sm font-medium text-forest-deep">{model.status}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{model.accuracy.toFixed(1)}%</div>
                      <div className="text-sm text-forest-medium">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{model.processed_count.toLocaleString()}</div>
                      <div className="text-sm text-forest-medium">Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{model.model_parameters.training_samples.toLocaleString()}</div>
                      <div className="text-sm text-forest-medium">Training Samples</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-forest-deep mb-2">Algorithm & Features</h5>
                      <div className="space-y-1">
                        <div className="text-sm text-forest-medium">
                          <span className="font-medium">Algorithm:</span> {model.model_parameters.algorithm}
                        </div>
                        <div className="text-sm text-forest-medium">
                          <span className="font-medium">Input Features:</span> {model.model_parameters.input_features.join(', ')}
                        </div>
                        <div className="text-sm text-forest-medium">
                          <span className="font-medium">Output Classes:</span> {model.model_parameters.output_classes.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-forest-deep mb-2">Performance Metrics</h5>
                      <div className="space-y-1">
                        <div className="text-sm text-forest-medium">
                          <span className="font-medium">Precision:</span> {(model.performance_metrics.precision * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-forest-medium">
                          <span className="font-medium">Recall:</span> {(model.performance_metrics.recall * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-forest-medium">
                          <span className="font-medium">F1-Score:</span> {(model.performance_metrics.f1_score * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-forest-sage/20">
                    <div className="text-sm text-forest-medium">
                      Last trained: {new Date(model.last_trained).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => aiAssetMappingService.retrainModel(model.id)}
                      className="forest-button-secondary flex items-center space-x-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Retrain</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Village Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Village Selector */}
          <div className="forest-card">
            <div className="flex items-center space-x-4">
              <label className="forest-form-label">Select Village:</label>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="forest-select"
              >
                <option value="village-001">Village 001 - Kalahandi</option>
                <option value="village-002">Village 002 - Rayagada</option>
                <option value="village-003">Village 003 - Koraput</option>
              </select>
            </div>
          </div>

          {analysisResult && (
            <>
              {/* Analysis Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="forest-stat-card">
                  <div className="forest-stat-value text-forest-deep">{formatArea(analysisResult.total_area_analyzed)}</div>
                  <div className="forest-stat-label">Total Area</div>
                  <div className="text-xs text-forest-medium mt-2">Analyzed Area</div>
                </div>
                
                <div className="forest-stat-card">
                  <div className="forest-stat-value text-green-600">{analysisResult.assets_detected.length}</div>
                  <div className="forest-stat-label">Assets Detected</div>
                  <div className="text-xs text-forest-medium mt-2">AI-Detected Assets</div>
                </div>
                
                <div className="forest-stat-card">
                  <div className="forest-stat-value text-blue-600">{(analysisResult.confidence_level * 100).toFixed(1)}%</div>
                  <div className="forest-stat-label">Confidence</div>
                  <div className="text-xs text-forest-medium mt-2">Analysis Confidence</div>
                </div>
                
                <div className="forest-stat-card">
                  <div className="forest-stat-value text-purple-600">{analysisResult.recommendations.length}</div>
                  <div className="forest-stat-label">Recommendations</div>
                  <div className="text-xs text-forest-medium mt-2">Development Suggestions</div>
                </div>
              </div>

              {/* Land Use Summary */}
              <div className="forest-chart">
                <div className="forest-chart-header">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-forest-gradient rounded-lg">
                      <Map className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="forest-chart-title">Land Use Summary</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(analysisResult.land_use_summary).map(([type, area]) => (
                    <div key={type} className="p-4 bg-white/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-forest-deep capitalize">{type.replace('_', ' ')}</span>
                        <span className="text-lg font-bold text-forest-primary">{formatArea(area)}</span>
                      </div>
                      <div className="w-full bg-forest-sage/20 rounded-full h-2">
                        <div 
                          className="bg-forest-gradient h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(area / analysisResult.total_area_analyzed) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environmental Indicators */}
              <div className="forest-chart">
                <div className="forest-chart-header">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-forest-gradient rounded-lg">
                      <Leaf className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="forest-chart-title">Environmental Indicators</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(analysisResult.environmental_indicators).map(([indicator, value]) => (
                    <div key={indicator} className="p-4 bg-white/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-forest-deep capitalize">{indicator.replace('_', ' ')}</span>
                        <span className="text-lg font-bold text-forest-primary">{(value * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-forest-sage/20 rounded-full h-2">
                        <div 
                          className="bg-forest-gradient h-2 rounded-full transition-all duration-500"
                          style={{ width: `${value * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Development Potential */}
              <div className="forest-chart">
                <div className="forest-chart-header">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-forest-gradient rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="forest-chart-title">Development Potential</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(analysisResult.development_potential).map(([potential, value]) => (
                    <div key={potential} className="p-4 bg-white/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-forest-deep capitalize">{potential.replace('_', ' ')}</span>
                        <span className="text-lg font-bold text-forest-primary">{(value * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-forest-sage/20 rounded-full h-2">
                        <div 
                          className="bg-forest-gradient h-2 rounded-full transition-all duration-500"
                          style={{ width: `${value * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="forest-chart">
                <div className="forest-chart-header">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-forest-gradient rounded-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="forest-chart-title">Development Recommendations</h3>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {analysisResult.recommendations.map((recommendation, index) => (
                    <div key={index} className="p-4 bg-white/50 rounded-lg border-l-4 border-forest-primary">
                      <div className="flex items-start space-x-3">
                        <div className="p-1 bg-forest-primary rounded-full mt-1">
                          <Zap className="h-3 w-3 text-white" />
                        </div>
                        <p className="text-forest-deep">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Satellite Data Tab */}
      {activeTab === 'satellite' && (
        <div className="space-y-6">
          <div className="forest-chart">
            <div className="forest-chart-header">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-forest-gradient rounded-lg">
                  <Satellite className="h-6 w-6 text-white" />
                </div>
                <h3 className="forest-chart-title">Satellite Imagery Data</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              {satelliteImages.map(image => (
                <div key={image.id} className="p-6 bg-white/50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-forest-gradient rounded-lg">
                        <Satellite className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-forest-deep">Village {image.village_id.split('-')[1]}</h4>
                        <p className="text-sm text-forest-medium">{image.sensor_type} - {image.resolution}m resolution</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        image.processing_status === 'analyzed' ? 'bg-green-100 text-green-700' :
                        image.processing_status === 'processed' ? 'bg-blue-100 text-blue-700' :
                        image.processing_status === 'raw' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {image.processing_status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{image.resolution}m</div>
                      <div className="text-sm text-forest-medium">Resolution</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{image.cloud_coverage}%</div>
                      <div className="text-sm text-forest-medium">Cloud Coverage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{image.spectral_bands.length}</div>
                      <div className="text-sm text-forest-medium">Spectral Bands</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {new Date(image.acquisition_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-forest-medium">Acquisition Date</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-forest-sage/20">
                    <div className="text-sm text-forest-medium">
                      Spectral bands: {image.spectral_bands.join(', ')}
                    </div>
                    <div className="flex space-x-2">
                      <button className="forest-button-secondary flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button className="forest-button-secondary flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Asset Detail Modal */}
      {isModalOpen && selectedAsset && (
        <div className="forest-modal" onClick={closeModal}>
          <div className="forest-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="forest-modal-header">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getAssetColor(selectedAsset.asset_type)}`}>
                  {getAssetIcon(selectedAsset.asset_type)}
                </div>
                <div>
                  <h2 className="forest-modal-title capitalize">{selectedAsset.asset_type.replace('_', ' ')}</h2>
                  <p className="text-forest-medium mt-1">{selectedAsset.land_use_classification}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-forest-medium hover:text-forest-deep rounded-lg hover:bg-forest-sage/10 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="forest-modal-body">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-forest-gradient rounded-lg">
                      <Map className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-forest-deep">Asset Information</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                      <span className="text-forest-medium font-medium">Area:</span>
                      <span className="text-forest-deep font-semibold">{formatArea(selectedAsset.area_sqm)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                      <span className="text-forest-medium font-medium">Confidence Score:</span>
                      <span className="text-forest-deep font-semibold">{formatConfidence(selectedAsset.confidence_score)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                      <span className="text-forest-medium font-medium">Detection Method:</span>
                      <span className="text-forest-deep font-semibold capitalize">{selectedAsset.detected_by.replace('_', ' ')}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                      <span className="text-forest-medium font-medium">Detection Date:</span>
                      <span className="text-forest-deep font-semibold">{new Date(selectedAsset.detection_date).toLocaleDateString()}</span>
                    </div>
                    
                    {selectedAsset.elevation && (
                      <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                        <span className="text-forest-medium font-medium">Elevation:</span>
                        <span className="text-forest-deep font-semibold">{selectedAsset.elevation}m</span>
                      </div>
                    )}
                    
                    {selectedAsset.slope_angle && (
                      <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                        <span className="text-forest-medium font-medium">Slope:</span>
                        <span className="text-forest-deep font-semibold">{selectedAsset.slope_angle}°</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-forest-gradient rounded-lg">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-forest-deep">AI Analysis</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedAsset.vegetation_index && (
                      <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                        <span className="text-forest-medium font-medium">Vegetation Index:</span>
                        <span className="text-forest-deep font-semibold">{selectedAsset.vegetation_index.toFixed(3)}</span>
                      </div>
                    )}
                    
                    {selectedAsset.soil_moisture_index && (
                      <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                        <span className="text-forest-medium font-medium">Soil Moisture:</span>
                        <span className="text-forest-deep font-semibold">{selectedAsset.soil_moisture_index.toFixed(3)}</span>
                      </div>
                    )}
                    
                    {selectedAsset.accessibility_score && (
                      <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                        <span className="text-forest-medium font-medium">Accessibility:</span>
                        <span className="text-forest-deep font-semibold">{(selectedAsset.accessibility_score * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    
                    {selectedAsset.economic_value_estimate && (
                      <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                        <span className="text-forest-medium font-medium">Economic Value:</span>
                        <span className="text-forest-deep font-semibold">₹{selectedAsset.economic_value_estimate.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {selectedAsset.conservation_priority && (
                      <div className="flex justify-between items-center p-4 bg-forest-sage/10 rounded-xl">
                        <span className="text-forest-medium font-medium">Conservation Priority:</span>
                        <span className={`font-semibold ${
                          selectedAsset.conservation_priority === 'high' ? 'text-red-600' :
                          selectedAsset.conservation_priority === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {selectedAsset.conservation_priority.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {selectedAsset.notes && (
                    <div className="p-4 bg-forest-sage/10 rounded-xl">
                      <h4 className="text-forest-deep font-semibold mb-2">Notes:</h4>
                      <p className="text-forest-medium text-sm">{selectedAsset.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="forest-modal-footer">
              <button
                onClick={closeModal}
                className="forest-button-secondary"
              >
                Close
              </button>
              <button className="forest-button-primary flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
