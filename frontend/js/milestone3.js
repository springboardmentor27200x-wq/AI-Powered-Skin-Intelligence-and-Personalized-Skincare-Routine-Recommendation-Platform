document.addEventListener('DOMContentLoaded', () => {
    // Expose functions globally for app.js to call during view changes
    window.milestone3 = {
        loadProductRecommendations: async () => {
            try {
                const token = localStorage.getItem('skiniq_token');
                if (!token) return;

                const budget = document.getElementById('budget-filter') ? document.getElementById('budget-filter').value : 50;

                const response = await fetch(`/api/v1/products/recommendations?max_budget=${budget}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    document.getElementById('product-recommendation-list').innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                            Failed to load recommendations. Please ensure you have completed your skin profile.
                        </div>
                    `;
                    return;
                }

                const data = await response.json();
                const container = document.getElementById('product-recommendation-list');
                
                if (data.recommended_products && data.recommended_products.length > 0) {
                    container.innerHTML = data.recommended_products.map(rec => {
                        const alternativesHtml = (rec.alternatives && rec.alternatives.length > 0) 
                            ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border-subtle);">
                                <strong style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Alternative Options</strong>
                                <ul style="margin: 6px 0 0; padding-left: 18px; font-size: 0.85rem; color: var(--text-secondary);">
                                    ${rec.alternatives.map(alt => `<li>${alt.name} (${alt.price})</li>`).join('')}
                                </ul>
                               </div>`
                            : '';
                        
                        return `
                        <div class="glass-card" style="display: flex; flex-direction: column; position: relative;">
                            <div style="position: absolute; top: 12px; right: 12px; z-index: 10;">
                                <input type="checkbox" class="compare-checkbox" value="${rec.product.name}" title="Select for comparison" style="width: 18px; height: 18px; cursor: pointer;">
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-right: 24px;">
                                <div>
                                    <span class="badge" style="background: rgba(206, 175, 122, 0.2); color: var(--accent-gold); margin-bottom: 8px;">${rec.product.brand}</span>
                                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">${rec.product.name}</h3>
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">
                                    ${rec.product.category} &bull; ${rec.price_estimate}
                                </p>
                                <div style="background: var(--bg-deep); padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 0.9rem; color: var(--accent-emerald);">
                                    ${rec.suitability_score}% Match
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 16px; flex-grow: 1;">
                                <strong style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase;">Key Ingredients</strong>
                                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
                                    ${rec.product.key_ingredients.map(ing => `<span class="badge" style="background: var(--bg-deep); border: 1px solid var(--border-subtle);">${ing}</span>`).join('')}
                                </div>
                            </div>
                            
                            <div style="background: rgba(144, 164, 255, 0.1); border-radius: 8px; padding: 12px; font-size: 0.85rem; color: var(--accent-indigo);">
                                <strong>Why it matches:</strong> ${rec.match_reason}
                            </div>
                            
                            ${alternativesHtml}
                        </div>
                    `;
                    }).join('');
                } else {
                    container.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                            No products found within budget matching your profile.
                        </div>
                    `;
                }
            } catch (err) {
                console.error('Error loading recommendations:', err);
                alert('JS Error in loadProductRecommendations: ' + err.message);
            }
        },

        compareSelectedProducts: async () => {
            const checkboxes = document.querySelectorAll('.compare-checkbox:checked');
            const selectedNames = Array.from(checkboxes).map(cb => cb.value);
            
            const comparisonView = document.getElementById('product-comparison-view');
            if (!comparisonView) {
                alert('Comparison view element not found!');
                return;
            }

            if (selectedNames.length < 2) {
                alert('Please select at least 2 products to compare using the checkboxes on the product cards.');
                return;
            }

            try {
                const token = localStorage.getItem('skiniq_token');
                const response = await fetch('/api/v1/products/compare', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ product_names: selectedNames })
                });

                if (response.ok) {
                    const data = await response.json();
                    const comps = data.comparisons;
                    
                    if (comps) {
                        let html = `
                            <div class="glass-card" style="background: linear-gradient(135deg, rgba(206, 175, 122, 0.05) 0%, rgba(144, 164, 255, 0.05) 100%);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                    <h3 style="margin: 0; color: var(--accent-gold); font-family: var(--font-heading);">Product Comparison</h3>
                                    <button class="btn btn-ghost btn-sm" onclick="document.getElementById('product-comparison-view').style.display='none'">&times; Close</button>
                                </div>
                                <div style="overflow-x: auto;">
                                    <table class="table" style="width: 100%; border-collapse: collapse;">
                                        <thead>
                                            <tr style="border-bottom: 1px solid var(--border-subtle);">
                                                <th style="padding: 12px; color: var(--text-muted); font-size: 0.85rem;">Feature</th>
                                                ${selectedNames.map(name => `<th style="padding: 12px; color: var(--text-primary); font-size: 0.95rem;">${name}</th>`).join('')}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style="border-bottom: 1px solid var(--border-subtle);">
                                                <td style="padding: 12px; font-weight: 600; color: var(--text-secondary);">Price Estimate</td>
                                                ${selectedNames.map(name => `<td style="padding: 12px;">${comps.price_comparison[name] || 'N/A'}</td>`).join('')}
                                            </tr>
                                            <tr style="border-bottom: 1px solid var(--border-subtle);">
                                                <td style="padding: 12px; font-weight: 600; color: var(--text-secondary);">Key Ingredients</td>
                                                ${selectedNames.map(name => `<td style="padding: 12px;">${(comps.ingredients_diff[name] || []).map(i => `<span class="badge" style="background:var(--bg-surface); border:1px solid var(--border-subtle); margin:2px;">${i}</span>`).join('')}</td>`).join('')}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div style="margin-top: 16px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; color: var(--accent-emerald); font-size: 0.85rem;">
                                    <strong>Common Suitability:</strong> ${comps.suitability_overlap.length > 0 ? comps.suitability_overlap.join(', ') : 'None identified'}
                                </div>
                            </div>
                        `;
                        comparisonView.innerHTML = html;
                        comparisonView.style.display = 'block';
                    }
                } else {
                    alert('Error from server: ' + await response.text());
                }
            } catch (err) {
                console.error('Error comparing products:', err);
                alert('JS Error in compareSelectedProducts: ' + err.message);
            }
        },

        loadProgressAnalytics: async () => {
            try {
                const token = localStorage.getItem('skiniq_token');
                if (!token) return;

                const response = await fetch('/api/v1/progress/analytics?days=30', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) return;

                const data = await response.json();
                
                // Update Adherence Rate
                document.getElementById('analytics-adherence-rate').innerText = `${data.adherence_rate}%`;

                // Fetch scoring engine data
                try {
                    const scoreRes = await fetch('/api/v1/progress/score', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (scoreRes.ok) {
                        const scoreData = await scoreRes.json();
                        if (document.getElementById('score-overall')) {
                            document.getElementById('score-overall').innerText = scoreData.overall_score;
                            
                            const imp = scoreData.skin_improvement_score;
                            const impEl = document.getElementById('score-improvement');
                            impEl.innerText = `${imp > 0 ? '+' : ''}${imp} Improvement`;
                            impEl.style.color = imp >= 0 ? 'var(--accent-emerald)' : '#ef4444';
                            
                            document.getElementById('score-skin').innerText = scoreData.skin_condition_score;
                            document.getElementById('score-lifestyle').innerText = scoreData.lifestyle_impact_score;
                            document.getElementById('score-sleep').innerText = scoreData.sleep_quality_score;
                            document.getElementById('score-routine').innerText = scoreData.routine_adherence_score;
                            document.getElementById('score-hydration').innerText = scoreData.hydration_level_score;
                        }
                    }
                } catch (e) {
                    console.error('Error fetching score data', e);
                }

                // Fetch new progress analysis metrics
                try {
                    // Trend analysis
                    const trendRes = await fetch('/api/v1/progress/trends', { headers: { 'Authorization': `Bearer ${token}` } });
                    if (trendRes.ok) {
                        const trendData = await trendRes.json();
                        if (document.getElementById('trend-analysis-result')) {
                            document.getElementById('trend-analysis-result').innerText = trendData.trend || 'N/A';
                        }
                    }

                    // Improvement analysis
                    const impRes = await fetch('/api/v1/progress/improvement', { headers: { 'Authorization': `Bearer ${token}` } });
                    if (impRes.ok) {
                        const impData = await impRes.json();
                        if (document.getElementById('improvement-analysis-result')) {
                            if (impData.overall_improvement !== undefined) {
                                document.getElementById('improvement-analysis-result').innerText = `${impData.overall_improvement > 0 ? '+' : ''}${impData.overall_improvement} Points`;
                            } else {
                                document.getElementById('improvement-analysis-result').innerText = 'Not enough data';
                            }
                        }
                    }

                    // Before/After comparison
                    const today = new Date();
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    
                    const d1 = thirtyDaysAgo.toISOString().split('T')[0];
                    const d2 = today.toISOString().split('T')[0];
                    
                    const compRes = await fetch(`/api/v1/progress/compare?date1=${d1}&date2=${d2}`, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (compRes.ok) {
                        const compData = await compRes.json();
                        if (document.getElementById('compare-before')) {
                            document.getElementById('compare-before').innerText = compData.before !== null ? compData.before.toFixed(1) : '--';
                            document.getElementById('compare-after').innerText = compData.after !== null ? compData.after.toFixed(1) : '--';
                        }
                    }

                } catch (e) {
                    console.error('Error fetching progress metrics', e);
                }

                // Update Logs Table
                const tbody = document.getElementById('adherence-logs-table');
                if (data.adherence_logs && data.adherence_logs.length > 0) {
                    tbody.innerHTML = data.adherence_logs.map(log => `
                        <tr style="border-bottom: 1px solid var(--border-subtle);">
                            <td style="padding: 12px; color: var(--text-primary);">${log.date}</td>
                            <td style="padding: 12px;">
                                ${log.morning_completed ? '<span style="color:var(--accent-emerald);">✓</span>' : '<span style="color:var(--text-muted);">-</span>'}
                            </td>
                            <td style="padding: 12px;">
                                ${log.evening_completed ? '<span style="color:var(--accent-emerald);">✓</span>' : '<span style="color:var(--text-muted);">-</span>'}
                            </td>
                            <td style="padding: 12px; color: var(--text-secondary);">${log.notes || '-'}</td>
                        </tr>
                    `).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--text-muted);">No adherence logs found.</td></tr>';
                }

                // Render Chart if data exists
                const chartContainer = document.getElementById('score-history-chart-container');
                if (data.score_history && data.score_history.length > 0) {
                    chartContainer.innerHTML = '<canvas id="score-history-chart"></canvas>';
                    const ctx = document.getElementById('score-history-chart').getContext('2d');
                    
                    const labels = data.score_history.map(s => s.date);
                    const scores = data.score_history.map(s => s.overall_score);

                    // Premium glowing gradient for the fill area
                    const fillGradient = ctx.createLinearGradient(0, 0, 0, 300);
                    fillGradient.addColorStop(0, 'rgba(212, 175, 55, 0.35)'); // Gold glow
                    fillGradient.addColorStop(0.5, 'rgba(144, 164, 255, 0.1)'); // Transition to indigo
                    fillGradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Fade to transparent

                    // Vibrant gradient for the stroke line itself
                    const lineGradient = ctx.createLinearGradient(0, 0, 400, 0);
                    lineGradient.addColorStop(0, '#90A4FF'); // Soft Indigo
                    lineGradient.addColorStop(1, '#D4AF37'); // Premium Gold

                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Skin Health Score',
                                data: scores,
                                borderColor: lineGradient,
                                backgroundColor: fillGradient,
                                borderWidth: 4,
                                pointBackgroundColor: '#ffffff',
                                pointBorderColor: '#D4AF37',
                                pointBorderWidth: 2,
                                pointRadius: 0, // Hide points by default for a sleek line
                                pointHoverRadius: 8,
                                pointHoverBackgroundColor: '#D4AF37',
                                pointHoverBorderColor: '#ffffff',
                                pointHoverBorderWidth: 3,
                                fill: true,
                                tension: 0.5 // Smooth flowing curve
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: {
                                mode: 'index',
                                intersect: false,
                            },
                            layout: {
                                padding: { top: 20, right: 20, bottom: 10, left: 10 }
                            },
                            scales: {
                                y: {
                                    min: 0,
                                    max: 100,
                                    grid: { 
                                        color: 'rgba(0,0,0,0.04)', 
                                        drawBorder: false,
                                        borderDash: [5, 5] // Elegant dashed grid
                                    },
                                    ticks: { 
                                        color: 'rgba(0,0,0,0.4)', 
                                        font: { family: "'Inter', sans-serif", size: 10, weight: '500' },
                                        padding: 10
                                    }
                                },
                                x: {
                                    grid: { display: false, drawBorder: false },
                                    ticks: { 
                                        color: 'rgba(0,0,0,0.4)', 
                                        font: { family: "'Inter', sans-serif", size: 10, weight: '500' },
                                        padding: 10
                                    }
                                }
                            },
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: 'rgba(20, 20, 20, 0.9)',
                                    titleFont: { family: "'Inter', sans-serif", size: 12, weight: '600' },
                                    bodyFont: { family: "'Inter', sans-serif", size: 14, weight: '700' },
                                    bodyColor: '#D4AF37', // Gold text for score
                                    padding: 12,
                                    cornerRadius: 8,
                                    displayColors: false,
                                    callbacks: {
                                        label: function(context) {
                                            return 'Score: ' + context.parsed.y;
                                        }
                                    }
                                }
                            }
                        }
                    });
                } else {
                    chartContainer.innerHTML = '<div>Not enough score history to generate chart.</div>';
                }

            } catch (err) {
                console.error('Error loading analytics:', err);
            }
        },

        logAdherence: async (isMorning) => {
            try {
                const token = localStorage.getItem('skiniq_token');
                const today = new Date().toISOString().split('T')[0];
                
                const payload = {
                    log_date: today,
                    morning_completed: isMorning,
                    evening_completed: !isMorning
                };

                const response = await fetch('/api/v1/progress/adherence', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    window.milestone3.loadProgressAnalytics();
                } else {
                    alert('Failed to log adherence');
                }
            } catch (err) {
                console.error(err);
            }
        },

        loadIngredientIntelligence: async () => {
            try {
                const token = localStorage.getItem('skiniq_token');
                if (!token) return;

                const response = await fetch('/api/v1/products/ingredients', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    cache: 'no-store'
                });

                if (!response.ok) return;

                const data = await response.json();
                const tbody = document.getElementById('ingredient-intelligence-table');
                
                if (data && data.length > 0) {
                    tbody.innerHTML = data.map(ing => {
                        const isAllergic = ing.allergy_alert;
                        const rowBg = isAllergic ? 'rgba(239, 68, 68, 0.05)' : 'transparent';
                        const suitColor = ing.user_suitability.includes('Avoid') ? '#ef4444' : (ing.user_suitability.includes('Highly Recommended') ? '#10b981' : '#f59e0b');
                        
                        let interactionsHtml = '';
                        if (ing.interactions && ing.interactions.length > 0) {
                            interactionsHtml = `<div style="color: #f59e0b; font-size: 0.8rem; margin-top: 4px;">⚠️ Conflicts: ${ing.interactions.join(', ')}</div>`;
                        } else {
                            interactionsHtml = `<span style="color: var(--text-muted); font-size: 0.8rem;">None detected</span>`;
                        }
                        
                        return `
                        <tr style="border-bottom: 1px solid var(--border-subtle); background: ${rowBg};">
                            <td style="padding: 12px; color: ${isAllergic ? '#ef4444' : 'var(--text-primary)'}; font-weight: bold;">
                                ${ing.name} ${isAllergic ? '<span title="Allergy Warning">⚠️</span>' : ''}
                            </td>
                            <td style="padding: 12px; color: var(--text-secondary);">${ing.category}</td>
                            <td style="padding: 12px; font-weight: 600; color: ${suitColor};">${ing.user_suitability}</td>
                            <td style="padding: 12px;">${interactionsHtml}</td>
                            <td style="padding: 12px;"><span style="color: var(--accent-emerald);">${ing.safety_status}</span></td>
                            <td style="padding: 12px; color: var(--text-muted); font-size: 0.9rem;">
                                ${ing.description}
                                <div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary);">
                                    <span class="badge" style="background: ${ing.comedogenic_rating > 2 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}; color: ${ing.comedogenic_rating > 2 ? '#ef4444' : '#10b981'}; padding: 2px 6px;">Comedogenic: ${ing.comedogenic_rating}/5</span>
                                    <span class="badge" style="background: rgba(144, 164, 255, 0.1); color: var(--accent-indigo); padding: 2px 6px;">Irritancy: ${ing.irritancy_level}</span>
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="6" style="padding: 20px; text-align: center; color: var(--text-muted);">No ingredients found.</td></tr>';
                }
            } catch (err) {
                console.error('Error loading ingredients:', err);
            }
        }
    };

    // Event Listeners
    document.getElementById('btn-fetch-products')?.addEventListener('click', () => {
        window.milestone3.loadProductRecommendations();
    });

    document.getElementById('btn-fetch-ingredients')?.addEventListener('click', () => {
        window.milestone3.loadIngredientIntelligence();
    });

    document.getElementById('btn-log-morning')?.addEventListener('click', () => {
        window.milestone3.logAdherence(true);
    });

    document.getElementById('btn-log-evening')?.addEventListener('click', () => {
        window.milestone3.logAdherence(false);
    });
});
