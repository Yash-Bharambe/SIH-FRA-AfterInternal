import React, { useState } from 'react';
import { TreePine, Eye, EyeOff, Loader2, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PublicLoginProps {
  onBack: () => void;
}

export const PublicLogin: React.FC<PublicLoginProps> = ({ onBack }) => {
  const { login, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(formData.email, formData.password, 'public');
    } catch (error) {
      setError('Invalid email or password');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-forest-sky flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-forest-dark rounded-full"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-forest-medium rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-forest-sage rounded-full"></div>
        <div className="absolute bottom-32 right-1/3 w-20 h-20 bg-forest-accent rounded-full"></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-forest-medium hover:text-forest-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Portal</span>
        </button>

        <div className="text-center">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <div className="p-3 bg-forest-gradient rounded-xl shadow-forest-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-forest-dark">Public Portal</h1>
          </div>
          <div className="flex justify-center items-center space-x-2 mb-6">
            <TreePine className="h-5 w-5 text-forest-medium" />
            <span className="text-sm font-semibold text-forest-medium">FRA Atlas Citizen Portal</span>
          </div>
          <h2 className="text-2xl text-forest-dark mb-3 font-semibold">
            Submit Your FRA Claim
          </h2>
          <p className="text-forest-medium text-base">
            Citizens can upload documents and claim Forest Rights Act benefits
          </p>
        </div>

        <div className="forest-card bg-gradient-to-br from-white to-forest-sage/5 shadow-forest-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="forest-form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="forest-input"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="forest-form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="forest-input pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-forest-medium hover:text-forest-dark transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="forest-alert-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full forest-button-primary flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-forest-spin" />}
              <span>{loading ? 'Signing In...' : 'Sign In to Submit Claim'}</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-forest-medium mb-4">
              Don't have an account? 
              <button className="text-forest-dark hover:text-forest-medium font-medium ml-1 transition-colors">
                Create one here
              </button>
            </p>
            
            <div className="p-4 bg-forest-sage/10 rounded-lg border border-forest-sage/20">
              <p className="text-sm text-forest-dark text-center">
                <Users className="h-4 w-4 inline mr-2" />
                Open access for all citizens to claim FRA rights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
