// JS for Milestone 2 Features
document.addEventListener('DOMContentLoaded', () => {
    
    // Bind navigation click for our new view
    const navItem = document.getElementById('nav-routine-planner');
    if(navItem) {
        navItem.addEventListener('click', () => {
            if(window.app && window.app.navigate) {
                window.app.navigate('routine-planner');
            } else {
                // Fallback basic navigation
                document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
                document.getElementById('view-routine-planner').style.display = 'block';
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                navItem.classList.add('active');
            }
            loadMilestone2Data();
        });
    }

    const generateBtn = document.getElementById('btn-generate-assessment');
    if(generateBtn) {
        generateBtn.addEventListener('click', generateAssessmentAndRoutine);
    }
});

async function loadMilestone2Data() {
    try {
        const currentToken = window.api ? window.api.token : localStorage.getItem('skiniq_token');
        const headers = { 'Authorization': `Bearer ${currentToken}` };

        // Fetch Score
        const scoreRes = await fetch('/api/v1/assessment/score/latest', { headers });
        if(scoreRes.ok) {
            const scoreData = await scoreRes.json();
            if(scoreData) {
                document.getElementById('score-results').style.display = 'block';
                
                // Animate score dial
                const circle = document.getElementById('overall-score-circle');
                const display = document.getElementById('overall-score-display');
                
                let current = 0;
                const target = scoreData.overall_score;
                const anim = setInterval(() => {
                    current += (target - current) * 0.1;
                    if(target - current < 0.5) {
                        current = target;
                        clearInterval(anim);
                    }
                    circle.style.setProperty('--score', current);
                    display.innerText = Math.round(current);
                }, 30);
                
                const components = [
                    { name: 'Condition', data: scoreData.condition_score },
                    { name: 'Lifestyle', data: scoreData.lifestyle_score },
                    { name: 'Sleep', data: scoreData.sleep_score },
                    { name: 'Routine', data: scoreData.routine_score }
                ];
                
                let html = '';
                components.forEach(c => {
                    let color = c.data.score >= 80 ? 'var(--accent-green)' : (c.data.score >= 60 ? 'var(--accent-gold)' : '#F26060');
                    html += `
                    <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.05); transition: transform 0.2s; cursor: default;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">${c.name}</div>
                        <div style="font-size: 1.3rem; color: ${color}; font-weight: 600; font-family: var(--font-heading);">${Math.round(c.data.score)}</div>
                        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px;">${c.data.impact}</div>
                    </div>`;
                });
                document.getElementById('score-components').innerHTML = html;
            }
        }

        // Fetch Assessment
        const assRes = await fetch('/api/v1/assessment/latest', { headers });
        if(assRes.ok) {
            const assData = await assRes.json();
            if(assData) {
                document.getElementById('assessment-results').style.display = 'block';
                document.getElementById('assessment-summary').innerText = assData.overall_health_summary;
                
                const ul = document.getElementById('assessment-concerns-list');
                ul.innerHTML = '';
                assData.prioritized_concerns.forEach(c => {
                    let sevColor = c.severity === 'Severe' ? '#F26060' : (c.severity === 'Moderate' ? 'var(--accent-gold)' : 'var(--accent-indigo)');
                    ul.innerHTML += `
                    <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: rgba(0,0,0,0.15); border-radius: var(--radius-sm); border-left: 3px solid ${sevColor}; transition: transform 0.2s;" onmouseover="this.style.transform='translateX(4px)'" onmouseout="this.style.transform='translateX(0)'">
                      <div style="background: ${sevColor}20; color: ${sevColor}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">${c.priority}</div>
                      <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                          <strong style="color: var(--text-primary); font-size: 0.95rem;">${c.concern}</strong>
                          <span style="font-size: 0.7rem; color: ${sevColor}; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">${c.severity}</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">${c.reasoning}</div>
                      </div>
                    </div>`;
                });
                
                // Render High Risk Factors
                const riskContainer = document.getElementById('assessment-high-risk-container');
                const riskTags = document.getElementById('assessment-high-risk-tags');
                if(assData.high_risk_factors && assData.high_risk_factors.length > 0) {
                    riskContainer.style.display = 'block';
                    riskTags.innerHTML = '';
                    assData.high_risk_factors.forEach(factor => {
                        let bgColor = "rgba(242, 96, 96, 0.15)";
                        let color = "#F26060";
                        if (factor.toLowerCase().includes("(mid risk)")) {
                            bgColor = "rgba(212, 175, 55, 0.15)";
                            color = "var(--accent-gold)";
                        } else if (factor.toLowerCase().includes("(low risk)")) {
                            bgColor = "rgba(144, 164, 255, 0.15)";
                            color = "var(--accent-indigo)";
                        }
                        
                        riskTags.innerHTML += `<span style="background: ${bgColor}; color: ${color}; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; border: 1px solid ${color};">${factor}</span>`;
                    });
                } else {
                    riskContainer.style.display = 'none';
                }
            }
        }

        // Fetch Routine
        const rouRes = await fetch('/api/v1/routine/latest', { headers });
        if(rouRes.ok) {
            const rouData = await rouRes.json();
            if(rouData) {
                document.getElementById('routine-results').style.display = 'block';
                document.getElementById('routine-target').innerText = `Target: ${rouData.target_concern} | ${rouData.season} Protocol`;
                
                const renderSteps = (steps, elId) => {
                    const ul = document.getElementById(elId);
                    ul.innerHTML = '';
                    steps.forEach((s, i) => {
                        ul.innerHTML += `
                        <div style="position: relative; padding-left: 20px; border-left: 2px solid var(--border-subtle); padding-bottom: ${i === steps.length - 1 ? '0' : '16px'};">
                          <div style="position: absolute; left: -6px; top: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--accent-gold); box-shadow: 0 0 10px var(--accent-gold);"></div>
                          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Step ${i+1}: ${s.step_name}</div>
                          <div style="color: var(--text-primary); font-weight: 600; font-size: 1rem; margin-bottom: 4px;">${s.recommendation.product_name}</div>
                          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                            <span style="color: var(--accent-indigo); font-weight: 600;">${s.recommendation.product_type}</span> • ${s.recommendation.reason}
                          </div>
                        </div>`;
                    });
                };

                renderSteps(rouData.morning_routine, 'morning-routine-list');
                renderSteps(rouData.evening_routine, 'evening-routine-list');
                document.getElementById('weekly-treatment-text').innerText = rouData.weekly_treatment;
            }
        }
    } catch (e) {
        console.error("Error loading milestone 2 data", e);
    }
}

async function generateAssessmentAndRoutine() {
    const season = document.getElementById('season-selector').value;
    const btn = document.getElementById('btn-generate-assessment');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line></svg> Analyzing...`;
    
    if(!document.getElementById('spin-style')) {
        const style = document.createElement('style');
        style.id = 'spin-style';
        style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }
    
    btn.disabled = true;

    try {
        const token = window.api ? window.api.token : localStorage.getItem('skiniq_token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 1. Evaluate Assessment
        await fetch(`/api/v1/assessment/evaluate?season=${season}`, { method: 'POST', headers });
        
        // 2. Score
        await fetch(`/api/v1/assessment/score`, { method: 'POST', headers });

        // 3. Generate Routine
        await fetch(`/api/v1/routine/generate`, { method: 'POST', headers });

        // Add a slight delay for dramatic effect
        await new Promise(r => setTimeout(r, 800));
        await loadMilestone2Data();
    } catch (e) {
        console.error(e);
        alert("Failed to generate assessment. Did you create your skin profile first?");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
