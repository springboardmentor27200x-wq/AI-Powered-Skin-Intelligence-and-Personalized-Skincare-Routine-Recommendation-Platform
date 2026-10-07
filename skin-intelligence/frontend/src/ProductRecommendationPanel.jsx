import React, { useState, useEffect } from 'react';
import { api } from './api';

const CATEGORY_FALLBACKS = {
  Cleanser: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop',
  Serum: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop',
  Toner: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=600&auto=format&fit=crop',
  Exfoliant: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
  Moisturizer: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop',
  Sunscreen: 'https://images.unsplash.com/photo-1643185539104-3622eb1f0ff6?q=80&w=600&auto=format&fit=crop',
};

const ProductRecommendationPanel = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alternatives, setAlternatives] = useState([]);

  // New states for budget and comparison
  const [budget, setBudget] = useState('Any');
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  useEffect(() => {
    fetchRecommendations(budget);
  }, [budget]);

  const fetchRecommendations = async (selectedBudget) => {
    try {
      setLoading(true);
      const data = await api.getProductRecommendations(selectedBudget);
      setProducts(data);
      setSelectedForCompare([]); // Reset selection when recommendations change
    } catch (err) {
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const renderPrice = (priceStr) => {
    if (priceStr === '$') return '₹ 499';
    if (priceStr === '$$') return '₹ 999';
    if (priceStr === '$$$') return '₹ 1,499';
    if (priceStr === '$$$$') return '₹ 2,499';
    return priceStr;
  };

  const analyze = async (product) => {
    try {
      setAnalyzingId(product.id);
      const result = await api.analyzeProductIngredients(product.id);
      setAnalysisResult({ product, ...result });
      setIsModalOpen(true);
    } catch (err) {
      setAnalysisResult({ product, error: "Error analyzing product." });
      setIsModalOpen(true);
    } finally {
      setAnalyzingId(null);
    }
  };

  const getAlternatives = async (product) => {
    try {
      setAnalyzingId(product.id);
      const result = await api.getProductAlternatives(product.id);
      setAlternatives(result.alternatives);
      setAnalysisResult({ product, isAlternativeView: true });
      setIsModalOpen(true);
    } catch (err) {
      setAnalysisResult({ product, error: "Error fetching alternatives.", isAlternativeView: true });
      setIsModalOpen(true);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleCompare = async () => {
      if (selectedForCompare.length < 2) return;
      try {
          const res = await api.compareProducts(selectedForCompare);
          setCompareData(res.comparison);
          setIsCompareModalOpen(true);
      } catch(err) {
          alert('Failed to compare products');
      }
  };

  const toggleCompare = (productId) => {
      setSelectedForCompare(prev => {
          if (prev.includes(productId)) return prev.filter(id => id !== productId);
          if (prev.length >= 3) return prev; // Limit comparison to 3
          return [...prev, productId];
      });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
        setAnalysisResult(null);
        setAlternatives([]);
    }, 300); // clear after animation
  };

  if (loading) return <div className="loading-spinner">Loading recommendations...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (products.length === 0) return <div>No recommendations found. Please complete your skin profile.</div>;

  return (
    <div className="product-panel panel-glass">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h3>Recommended Products</h3>
            <p>Curated based on your skin profile and concerns.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Budget:</label>
                <select 
                    className="border rounded p-1 text-sm bg-white"
                    value={budget} 
                    onChange={e => setBudget(e.target.value)}
                >
                    <option value="Any">Any</option>
                    <option value="$">₹ (Budget)</option>
                    <option value="$$">₹₹ (Mid-range)</option>
                    <option value="$$$">₹₹₹ (Premium)</option>
                    <option value="$$$$">₹₹₹₹ (Luxury)</option>
                </select>
            </div>
            
            {selectedForCompare.length >= 2 && (
                <button 
                    onClick={handleCompare}
                    className="btn btn-primary btn-small bg-indigo-600 text-white"
                >
                    Compare ({selectedForCompare.length})
                </button>
            )}
        </div>
      </div>
      <div className="product-grid">
        {products.map(product => {
          const fallbackUrl = CATEGORY_FALLBACKS[product.category] || CATEGORY_FALLBACKS.Serum;
          const displayUrl = product.image_url && !product.image_url.includes('via.placeholder.com')
            ? product.image_url
            : fallbackUrl;

          return (
            <div key={product.id} className="product-card relative">
              
              <div className="absolute top-2 right-2 z-10">
                  <input 
                      type="checkbox" 
                      className="w-5 h-5 cursor-pointer accent-indigo-600 shadow-sm"
                      checked={selectedForCompare.includes(product.id)}
                      onChange={() => toggleCompare(product.id)}
                      title="Select for comparison (up to 3)"
                  />
              </div>

              <div className="product-image-container" style={{ position: 'relative', overflow: 'hidden', background: '#F8F4F6' }}>
                <img
                  src={displayUrl}
                  alt={product.name}
                  className="product-image"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackUrl;
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <span className="product-brand">{product.brand}</span>
              <h4>{product.name}</h4>
              <p className="product-category">{product.category}</p>
              <p className="product-price">{renderPrice(product.price)}</p>
              <p className="product-desc">{product.description}</p>

            <div className="product-tags">
              {product.target_concerns.map(c => (
                <span key={c} className="tag tag-concern">{c}</span>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="btn btn-secondary btn-small flex-1"
                onClick={() => analyze(product)}
                disabled={analyzingId === product.id}
              >
                {analyzingId === product.id ? 'Loading...' : 'Analyze'}
              </button>
              <button
                className="btn btn-primary btn-small flex-1 text-xs"
                onClick={() => getAlternatives(product)}
                disabled={analyzingId === product.id}
              >
                Alternatives
              </button>
            </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && analysisResult && (
        <div className="ingredient-modal-overlay" onClick={closeModal}>
          <div className="ingredient-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="ingredient-modal-close" onClick={closeModal}>×</button>
            <div className="modal-header">
              <span className="modal-brand">{analysisResult.product.brand}</span>
              <h3 className="modal-title">{analysisResult.product.name}</h3>
            </div>

            <div className="modal-body">
              {analysisResult.error ? (
                <div className="analysis-alert danger">
                  <span className="alert-icon">⚠️</span>
                  <p>{analysisResult.error}</p>
                </div>
              ) : analysisResult.isAlternativeView ? (
                <div className="alternatives-section">
                  <h4 className="font-bold mb-4">Alternatives for {analysisResult.product.name}</h4>
                  {alternatives.length > 0 ? (
                      <div className="space-y-4">
                        {alternatives.map(alt => (
                            <div key={alt.id} className="flex justify-between items-center p-4 border rounded-lg bg-gray-50">
                                <div>
                                    <p className="font-bold">{alt.name}</p>
                                    <p className="text-sm text-gray-600">{alt.brand}</p>
                                </div>
                                <div className="text-indigo-600 font-bold">{renderPrice(alt.price)}</div>
                            </div>
                        ))}
                      </div>
                  ) : (
                      <p>No alternatives found in the same category.</p>
                  )}
                </div>
              ) : (
                <>
                  <div className={`analysis-alert ${analysisResult.is_safe_to_use ? 'success' : 'warning'}`}>
                    <span className="alert-icon">{analysisResult.is_safe_to_use ? '✨' : '⚠️'}</span>
                    <div>
                      <h4 className="alert-title">
                        {analysisResult.is_safe_to_use ? 'Safe for your skin profile' : 'Caution Advised'}
                      </h4>
                      <p className="alert-message">
                        {analysisResult.is_safe_to_use
                          ? 'We found no known allergens or irritants based on your current skin profile.'
                          : 'This product contains ingredients that might trigger your skin concerns.'}
                      </p>
                    </div>
                  </div>

                  {!analysisResult.is_safe_to_use && analysisResult.flagged_ingredients && (
                    <div className="flagged-ingredients-section">
                      <h5>Flagged Ingredients</h5>
                      <ul className="flagged-list">
                        {analysisResult.flagged_ingredients.map((ing, idx) => (
                          <li key={idx} className="flagged-item">{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="all-ingredients-section">
                    <h5>Full Ingredient List & Education</h5>
                    <div className="space-y-2 mt-2">
                        {analysisResult.product.ingredients.map(ing => (
                            <div key={ing} className="p-2 bg-gray-50 rounded text-sm">
                                <span className="font-bold">{ing}</span>
                                {analysisResult.education && analysisResult.education[ing] && (
                                    <span className="block text-gray-600 mt-1">{analysisResult.education[ing]}</span>
                                )}
                            </div>
                        ))}
                    </div>
                  </div>

                  {analysisResult.interactions && analysisResult.interactions.length > 0 && (
                    <div className="interactions-section mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h5 className="text-orange-800 font-bold flex items-center gap-2">
                          <span>⚡</span> Ingredient Interactions
                      </h5>
                      <ul className="list-disc ml-5 mt-2 text-sm text-orange-900 space-y-1">
                        {analysisResult.interactions.map((interaction, idx) => (
                          <li key={idx}>{interaction}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {isCompareModalOpen && compareData && (
        <div className="ingredient-modal-overlay" onClick={() => setIsCompareModalOpen(false)}>
            <div className="ingredient-modal-content max-w-4xl" onClick={e => e.stopPropagation()}>
                <button className="ingredient-modal-close" onClick={() => setIsCompareModalOpen(false)}>×</button>
                <div className="modal-header mb-6">
                    <h3 className="modal-title">Product Comparison</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="p-3 border-b border-r bg-gray-50 w-1/4">Feature</th>
                                {compareData.map(p => (
                                    <th key={p.id} className="p-3 border-b text-center w-1/4 font-bold">{p.name} <br/><span className="text-sm text-gray-500 font-normal">{p.brand}</span></th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-3 border-b border-r font-medium bg-gray-50">Price</td>
                                {compareData.map(p => (
                                    <td key={p.id} className="p-3 border-b text-center text-indigo-600 font-bold">{renderPrice(p.price)}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="p-3 border-b border-r font-medium bg-gray-50">Category</td>
                                {compareData.map(p => (
                                    <td key={p.id} className="p-3 border-b text-center">{p.category}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="p-3 border-b border-r font-medium bg-gray-50">Target Concerns</td>
                                {compareData.map(p => (
                                    <td key={p.id} className="p-3 border-b text-center">
                                        {p.target_concerns.map(c => <span key={c} className="block text-sm">{c}</span>)}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="p-3 border-b border-r font-medium bg-gray-50">Key Ingredients</td>
                                {compareData.map(p => (
                                    <td key={p.id} className="p-3 border-b text-center text-sm text-gray-600">
                                        {p.key_ingredients.join(', ')}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProductRecommendationPanel;
