
import React, { useState } from 'react';
import { getHairCareAdvice } from '../services/geminiService';
import { Sparkles, Loader2, Info, AlertCircle, Clock, Package, Droplets } from 'lucide-react';

interface AdviceResult {
  maintenanceTips: string[];
  washingFrequency: string;
  recommendedProducts: string[];
  commonMistakes: string[];
  estimatedDuration: string;
}

const AIHairAssistant: React.FC = () => {
  const [hairstyle, setHairstyle] = useState('');
  const [hairType, setHairType] = useState('');
  const [scalpSensitivity, setScalpSensitivity] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdviceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hairstyle.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const advice = await getHairCareAdvice(hairstyle, hairType, scalpSensitivity);
      setResult(advice);
    } catch (err) {
      setError('Failed to get advice. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-purple-100 overflow-hidden">
        <div className="bg-purple-900 p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={120} className="text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 relative z-10">AI Hair Care Assistant</h2>
          <p className="text-purple-200 text-sm md:text-base font-medium max-w-2xl mx-auto relative z-10">
            Get personalized maintenance tips and product recommendations for your specific hairstyle and hair type.
          </p>
        </div>

        <div className="p-6 md:p-10">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-purple-900 block ml-1">Hairstyle *</label>
              <input
                type="text"
                value={hairstyle}
                onChange={(e) => setHairstyle(e.target.value)}
                placeholder="e.g. Knotless Braids"
                className="w-full p-4 bg-purple-50 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm font-medium"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-purple-900 block ml-1">Hair Type (Optional)</label>
              <input
                type="text"
                value={hairType}
                onChange={(e) => setHairType(e.target.value)}
                placeholder="e.g. 4C, Curly, Fine"
                className="w-full p-4 bg-purple-50 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-purple-900 block ml-1">Scalp Sensitivity (Optional)</label>
              <input
                type="text"
                value={scalpSensitivity}
                onChange={(e) => setScalpSensitivity(e.target.value)}
                placeholder="e.g. Sensitive, Dry"
                className="w-full p-4 bg-purple-50 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm font-medium"
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={loading || !hairstyle.trim()}
                className="w-full bg-purple-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-purple-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center space-x-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <span>Analyzing your hair...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Get Expert Advice</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center space-x-3 text-red-600 mb-8">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Maintenance Tips */}
                <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-900">
                      <Info size={20} />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-purple-900">Maintenance Tips</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.maintenanceTips.map((tip, i) => (
                      <li key={i} className="flex items-start space-x-3 text-sm text-gray-600 leading-relaxed">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 shrink-0"></span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Washing & Duration */}
                <div className="space-y-8">
                  <div className="bg-purple-50 border border-purple-100 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-purple-900 shadow-sm">
                        <Droplets size={20} />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-purple-900">Washing Frequency</h3>
                    </div>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">{result.washingFrequency}</p>
                  </div>

                  <div className="bg-purple-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <Clock size={100} />
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
                        <Clock size={20} />
                      </div>
                      <h3 className="text-xl font-serif font-bold">Estimated Duration</h3>
                    </div>
                    <p className="text-2xl font-bold">{result.estimatedDuration}</p>
                    <p className="text-purple-200 text-xs mt-2 uppercase tracking-widest font-black">Before your next redo</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Products */}
                <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-900">
                      <Package size={20} />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-purple-900">Recommended Products</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.recommendedProducts.map((product, i) => (
                      <span key={i} className="bg-purple-50 text-purple-900 px-4 py-2 rounded-full text-xs font-bold border border-purple-100">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mistakes */}
                <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                      <AlertCircle size={20} />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-red-900">Common Mistakes</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.commonMistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start space-x-3 text-sm text-red-700/80 leading-relaxed">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 shrink-0"></span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIHairAssistant;
