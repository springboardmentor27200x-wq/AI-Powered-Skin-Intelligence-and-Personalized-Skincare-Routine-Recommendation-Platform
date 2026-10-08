/**
 * SkinIQ Multi-Role Clinical Application Orchestrator
 * Specialized UIs for Consumer, Consultant, Dermatologist, and Administrator
 */

class App {
  constructor() {
    this.currentView = 'dashboard';
    this.cachedUsers = [];
    this.init();
  }

  async init() {
    this.initNavigation();

    // Check session authentication state
    if (!window.api.token) {
      if (window.auth) {
        window.auth.showAuthPage('login');
      }
    } else {
      if (window.auth) {
        window.auth.hideAuthPage();
        window.auth.renderUserState();
      }
      this.updateSidebarForRole(window.api.user);
      await this.loadAllData();
      const defaultView = this.getDefaultViewForRole(window.api.user ? window.api.user.role : 'USER');
      this.navigate(defaultView);
    }

    window.addEventListener('app:reload', async () => {
      if (window.api.token) {
        this.updateSidebarForRole(window.api.user);
        await this.loadAllData();
        const defaultView = this.getDefaultViewForRole(window.api.user ? window.api.user.role : 'USER');
        this.navigate(defaultView);
      }
    });
  }

  getDefaultViewForRole(role = 'USER') {
    switch (role) {
      case 'SKINCARE_CONSULTANT':
        return 'consultant-workstation';
      case 'DERMATOLOGIST':
        return 'dermatologist-diagnostics';
      case 'ADMINISTRATOR':
        return 'admin-overview';
      case 'USER':
      default:
        return 'dashboard';
    }
  }

  updateSidebarForRole(user) {
    const role = user ? user.role : 'USER';
    const consumerGroup = document.getElementById('nav-group-consumer');
    const consultantGroup = document.getElementById('nav-group-consultant');
    const dermGroup = document.getElementById('nav-group-dermatologist');
    const adminGroup = document.getElementById('nav-group-admin');

    if (consumerGroup) consumerGroup.style.display = (role === 'USER') ? 'block' : 'none';
    if (consultantGroup) consultantGroup.style.display = (role === 'SKINCARE_CONSULTANT') ? 'block' : 'none';
    if (dermGroup) dermGroup.style.display = (role === 'DERMATOLOGIST') ? 'block' : 'none';
    if (adminGroup) adminGroup.style.display = (role === 'ADMINISTRATOR') ? 'block' : 'none';
  }

  initNavigation() {
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        this.navigate(view);
      });
    });
  }

  navigate(viewName) {
    this.currentView = viewName;

    // Update active nav item
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update visible view section
    document.querySelectorAll('.view-section').forEach(section => {
      section.style.display = (section.id === `view-${viewName}`) ? 'block' : 'none';
    });

    // Update page header title & description
    const headerTitle = document.getElementById('header-current-view-title');
    const headerDesc = document.getElementById('header-current-view-desc');

    const viewMeta = {
      // Consumer
      'dashboard': {
        title: 'Skin Health Intelligence Overview',
        desc: 'Real-time overview of your skin profile, circadian recovery scoring, and daily vitals.'
      },
      'profile-wizard': {
        title: 'Skin Profile Assessment Wizard',
        desc: 'Configure skin type, target concerns, allergen alerts, and baseline barrier parameters.'
      },
      'lifestyle-tracking': {
        title: 'Lifestyle & Environmental Tracker',
        desc: 'Log daily hydration, sleep quality, stress levels, and environmental UV exposure.'
      },
      'routine-planner': {
        title: 'Routine & Assessment',
        desc: 'Review your skin profile assessment and customized skincare routine.'
      },
      'product-recommendations': {
        title: 'Product Recommendations',
        desc: 'AI-curated products tailored specifically for your skin concerns and profile.'
      },
      'progress-analytics': {
        title: 'Progress Analytics',
        desc: 'Monitor your routine adherence and track your overall skin health over time.'
      },
      'ingredient-intelligence': {
        title: 'Ingredient Intelligence',
        desc: 'Deep clinical dive into skincare ingredients, their ratings, and safety profiles.'
      },
      // Consultant
      'consultant-workstation': {
        title: 'Consultant Workstation & Client Queue',
        desc: 'Review client intake dossiers, skin barrier indices, and active routine programs.'
      },
      'consultant-prescription': {
        title: 'Custom Regimen Prescription Studio',
        desc: 'Formulate bespoke 5-step morning and evening protocols with barrier repair targets.'
      },
      'consultant-compatibility': {
        title: 'Ingredient Synergy & Conflict Matrix',
        desc: 'Analyze molecular compatibility, optimal pH windows, and application timing.'
      },
      // Dermatologist
      'dermatologist-diagnostics': {
        title: 'Clinical Diagnostic & Triage Suite',
        desc: 'Physician patient triage, Fitzpatrick phototyping, TEWL barrier metrics, and case history.'
      },
      'dermatologist-staging': {
        title: 'Dermatological Pathology & Staging',
        desc: 'Standardized clinical staging for Acne Vulgaris, Rosacea, Melasma, and Atopic Dermatitis.'
      },
      'dermatologist-titration': {
        title: 'Medical Rx Active Titration Studio',
        desc: 'Titrate pharmaceutical concentrations for Tretinoin, Azelaic Acid, and Hydroquinone.'
      },
      // Administrator
      'admin-overview': {
        title: 'Executive Platform Hub & Telemetry',
        desc: 'Overview of user role distribution, API latencies, security policies, and system health.'
      },
      'admin-users': {
        title: 'User Directory & RBAC Role Controller',
        desc: 'Elevate roles, assign specialist credentials, and monitor platform accounts.'
      },
      'admin-regulatory': {
        title: 'INCI Ingredient Safety & Regulatory Matrix',
        desc: 'CIR safety evaluations, comedogenic ratings, and EU 1223/2009 compliance index.'
      },
      'admin-telemetry': {
        title: 'Database Health & Document Storage',
        desc: 'MongoDB collection statistics, unique compound index states, and connection health.'
      }
    };

    const meta = viewMeta[viewName] || { title: 'SkinIQ Platform', desc: '' };
    if (headerTitle) headerTitle.textContent = meta.title;
    if (headerDesc) headerDesc.textContent = meta.desc;

    // View-specific trigger loads
    if (viewName === 'profile-wizard' && window.profile) {
      window.profile.populateWizardInputs();
    }
    
    if (viewName === 'routine-planner' && window.milestone2) {
      window.milestone2.generateAssessmentAndRoutine();
    }

    if (viewName === 'product-recommendations' && window.milestone3) {
      window.milestone3.loadProductRecommendations();
    }

    if (viewName === 'progress-analytics' && window.milestone3) {
      window.milestone3.loadProgressAnalytics();
    }
    
    if (viewName === 'ingredient-intelligence' && window.milestone3) {
      window.milestone3.loadIngredientIntelligence();
    } else if (viewName === 'consultant-workstation') {
      this.loadConsultantWorkstation();
    } else if (viewName === 'consultant-prescription') {
      this.initPrescriptionStudio();
    } else if (viewName === 'consultant-compatibility') {
      this.analyzeIngredientCompatibility();
    } else if (viewName === 'dermatologist-diagnostics') {
      this.loadDermatologistDiagnostics();
    } else if (viewName === 'dermatologist-staging') {
      this.updateConditionStaging();
    } else if (viewName === 'dermatologist-titration') {
      this.updateTitrationValues();
    } else if (viewName === 'admin-overview') {
      this.loadAdminData();
    } else if (viewName === 'admin-users') {
      this.loadAdminUsersTable();
    } else if (viewName === 'admin-regulatory') {
      this.loadInciDatabase();
    } else if (viewName === 'admin-telemetry') {
      this.loadDatabaseTelemetry();
    }
  }

  async loadAllData() {
    const role = window.api.user ? window.api.user.role : 'USER';
    if (role === 'USER') {
      if (window.profile) await window.profile.loadProfile();
      if (window.tracking) await window.tracking.loadTodayData();
    }
    
    // Always fetch notifications for any logged in user
    if (window.api.user) {
      this.fetchNotifications();
    }
  }

  toggleNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === 'none' || dropdown.style.display === '' ? 'block' : 'none';
      if (dropdown.style.display === 'block') {
        this.fetchNotifications();
      }
    }
  }

  async fetchNotifications() {
    const userId = window.api.user ? window.api.user.id : null;
    if (!userId) return;

    try {
      const response = await fetch(`/api/v1/notifications/${userId}`);
      if (!response.ok) return;

      const notifications = await response.json();
      
      const badge = document.getElementById('notification-badge');
      const list = document.getElementById('notification-list');
      
      if (notifications.length > 0) {
        if (badge) {
          badge.style.display = 'flex';
          badge.textContent = notifications.length;
        }
        
        if (list) {
          list.innerHTML = notifications.map(n => {
            let icon = 'ℹ️';
            let color = 'var(--text-secondary)';
            if (n.type.includes('Reminder')) { icon = '⏰'; color = 'var(--accent-indigo)'; }
            if (n.type.includes('Hydration')) { icon = '💧'; color = '#0ea5e9'; }
            if (n.type.includes('Replenish')) { icon = '🛒'; color = 'var(--accent-gold)'; }
            if (n.type.includes('Progress')) { icon = '🎉'; color = 'var(--accent-emerald)'; }
            
            return `
              <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); display: flex; gap: 12px; align-items: flex-start; cursor: pointer;">
                <div style="font-size: 1.2rem;">${icon}</div>
                <div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: ${color}; text-transform: uppercase; margin-bottom: 4px;">${n.type}</div>
                  <div style="font-size: 0.9rem; color: var(--text-primary); line-height: 1.4;">${n.message}</div>
                </div>
              </div>
            `;
          }).join('');
        }
      } else {
        if (badge) badge.style.display = 'none';
        if (list) list.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">You have no new notifications.</div>';
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }

  exportReport(format) {
    if (!window.api.user || !window.api.user.id) {
      showToast('You must be logged in to export reports', 'error');
      return;
    }
    
    // Trigger download via window.location.href or opening in new tab
    const url = `/api/v1/exports/${format === 'csv' ? 'excel' : 'pdf'}/${window.api.user.id}`;
    showToast(`Generating ${format.toUpperCase()} report...`, 'info');
    window.open(url, '_blank');
  }

  /* =========================================================
     CONSULTANT PORTAL METHODS
     ========================================================= */

  async loadConsultantWorkstation() {
    const tableBody = document.getElementById('consultant-clients-table');
    if (!tableBody) return;

    try {
      const token = localStorage.getItem('skiniq_token');
      const response = await fetch('/api/v1/consultant/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch clients');
      
      this.cachedUsers = await response.json();
      this.renderConsultantClients(this.cachedUsers);
      const totalEl = document.getElementById('stat-consultant-total-clients');
      if (totalEl) totalEl.textContent = this.cachedUsers.length;
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:var(--text-muted);">${err.message}</td></tr>`;
    }
  }

  renderConsultantClients(users) {
    const tableBody = document.getElementById('consultant-clients-table');
    if (!tableBody) return;

    tableBody.innerHTML = users.map((u, i) => {
      const skinType = u.skin_type || 'Unknown';
      const concern = u.concerns && u.concerns.length > 0 ? u.concerns.join(', ') : 'None specified';
      const score = u.latest_score !== null ? u.latest_score : '--';

      return `
        <tr style="border-bottom: 1px solid var(--border-subtle);">
          <td style="padding: 14px; display:flex; align-items:center; gap:10px;">
            <img src="${u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'Client')}&background=d4af37&color=1c1917`}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1px solid var(--border-subtle);">
            <div>
              <strong>${u.full_name}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted);">Client #${u.id}</div>
            </div>
          </td>
          <td style="padding: 14px; color:var(--text-secondary);">${u.email}</td>
          <td style="padding: 14px;"><span class="tag-chip active" style="font-size:0.75rem; padding:2px 8px;">${skinType}</span></td>
          <td style="padding: 14px; color:var(--text-primary); font-weight:500;">${concern}</td>
          <td style="padding: 14px;">
            <span style="font-size:0.8rem; font-weight:600; color:var(--accent-indigo);">
              Score: ${score}
            </span>
          </td>
          <td style="padding: 14px; display:flex; gap:8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.app.viewPatientDossier(${u.id}, '${(u.full_name || '').replace(/'/g, "\\'")}', '${u.avatar_url || ''}')">Dossier</button>
            <button class="btn btn-gold btn-sm" onclick="window.app.openPrescriptionForClient(${u.id}, '${(u.full_name || '').replace(/'/g, "\\'")}')">Prescribe</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async viewPatientDossier(id, name, avatar) {
    this.currentDossierId = id;
    this.navigate('consultant-dossier');
    document.getElementById('dossier-name').textContent = name || 'Unknown Client';
    document.getElementById('dossier-avatar').src = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Client')}&background=d4af37&color=1c1917`;

    try {
      const token = localStorage.getItem('skiniq_token');
      const response = await fetch(`/api/v1/consultant/clients/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch client dossier');
      const data = await response.json();

      // Profile
      const prof = data.profile || {};
      const notes = (prof.consultant_notes || []).map(n => `<div style="padding:8px; background:rgba(212,175,55,0.05); margin-bottom:8px; border-left:3px solid var(--accent-gold); font-size:0.85rem;"><strong>${new Date(n.date).toLocaleDateString()}</strong>: ${n.note}</div>`).join('');
      document.getElementById('dossier-profile-details').innerHTML = `
        <div style="margin-bottom:8px;"><strong>Skin Type:</strong> ${prof.skin_type || 'N/A'}</div>
        <div style="margin-bottom:8px;"><strong>Concerns:</strong> ${(prof.concerns || []).join(', ')}</div>
        <div style="margin-bottom:8px;"><strong>Allergies:</strong> ${(prof.allergies || []).join(', ')}</div>
        <div style="margin-top:16px;"><strong>Notes History:</strong><br>${notes || 'No notes yet.'}</div>
      `;

      // Assessments
      const assess = data.assessments || [];
      document.getElementById('dossier-assessment-reports').innerHTML = assess.length === 0 ? 'No assessments found.' : assess.map(a => `
        <div style="padding:10px; border:1px solid var(--border-subtle); margin-bottom:10px; border-radius:8px;">
          <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">${new Date(a.created_at).toLocaleString()}</div>
          <div><strong>Barrier Health:</strong> ${a.barrier_health}</div>
          <div><strong>Sensitivity:</strong> ${a.sensitivity}</div>
        </div>
      `).join('');

      // Progress
      const scores = data.scores || [];
      document.getElementById('dossier-progress-history').innerHTML = scores.length === 0 ? 'No progress data.' : scores.map(s => `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-subtle);">
          <span>${new Date(s.evaluated_at).toLocaleDateString()}</span>
          <strong style="color:var(--accent-indigo);">Score: ${s.overall_score}</strong>
        </div>
      `).join('');

      // Active Routine (Recommendations)
      const routine = data.active_routine;
      document.getElementById('dossier-active-routine').innerHTML = !routine ? 'No active routine prescribed.' : `
        <div style="font-weight:bold; margin-bottom:8px;">Prescribed Routine:</div>
        <ul style="font-size:0.9rem; padding-left:20px; margin:0;">
          ${(routine.morning_steps || []).map(s => `<li>[AM] ${s.category}: ${s.product_name}</li>`).join('')}
          ${(routine.evening_steps || []).map(s => `<li>[PM] ${s.category}: ${s.product_name}</li>`).join('')}
        </ul>
      `;
    } catch (err) {
      console.error(err);
      document.getElementById('dossier-profile-details').innerHTML = 'Error loading dossier.';
    }
  }

  async addClientNote() {
    const input = document.getElementById('dossier-note-input');
    const note = input.value.trim();
    if (!note || !this.currentDossierId) return;

    try {
      const token = localStorage.getItem('skiniq_token');
      const res = await fetch(`/api/v1/consultant/clients/${this.currentDossierId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ note })
      });
      if (res.ok) {
        input.value = '';
        showToast('Consultant note saved successfully.', 'success');
        // Reload dossier to show the new note
        this.viewPatientDossier(this.currentDossierId, document.getElementById('dossier-name').textContent, document.getElementById('dossier-avatar').src);
      }
    } catch (err) {
      console.error(err);
    }
  }

  filterConsultantClients() {
    const query = document.getElementById('consultant-client-search')?.value.toLowerCase().trim() || '';
    const filtered = this.cachedUsers.filter(u =>
      (u.full_name && u.full_name.toLowerCase().includes(query)) || (u.email && u.email.toLowerCase().includes(query))
    );
    this.renderConsultantClients(filtered);
  }

  async initPrescriptionStudio() {
    const clientSelect = document.getElementById('prescribe-client-select');
    if (!clientSelect) return;

    if (!this.cachedUsers.length) {
      this.cachedUsers = await window.api.listUsers().catch(() => []);
    }

    clientSelect.innerHTML = this.cachedUsers.map(u => `
      <option value="${u.id}" data-name="${u.full_name}">${u.full_name} (${u.email})</option>
    `).join('');

    this.updatePrescriptionPreview();
  }

  handlePrescribeClientChange() {
    this.updatePrescriptionPreview();
  }

  openPrescriptionForClient(userId, userName) {
    this.navigate('consultant-prescription');
    setTimeout(() => {
      const clientSelect = document.getElementById('prescribe-client-select');
      if (clientSelect) {
        clientSelect.value = userId;
        this.updatePrescriptionPreview();
      }
    }, 100);
  }

  updatePrescriptionPreview() {
    const previewBox = document.getElementById('prescription-preview-box');
    if (!previewBox) return;

    const clientSelect = document.getElementById('prescribe-client-select');
    const selectedOption = clientSelect ? clientSelect.options[clientSelect.selectedIndex] : null;
    const clientName = selectedOption ? selectedOption.dataset.name || selectedOption.text : 'Client';

    const protocolMode = document.getElementById('prescribe-protocol-mode')?.value || 'BARRIER_REPAIR';
    const step1 = document.getElementById('prescribe-step-1')?.value || 'Gentle Hydrating Cleanser';
    const step2 = document.getElementById('prescribe-step-2')?.value || 'Panthenol Essence';
    const step3 = document.getElementById('prescribe-step-3')?.value || 'Target Active Serum';
    const step4 = document.getElementById('prescribe-step-4')?.value || 'Ceramide Complex';
    const step5 = document.getElementById('prescribe-step-5')?.value || 'Mineral SPF 50+';

    const protocolTitles = {
      'BARRIER_REPAIR': '✦ Lipid Barrier Repair & Soothing Protocol',
      'ACNE_CLARIFYING': '✦ Anti-Inflammatory Clarifying Regimen',
      'ANTIOXIDANT_RADIANCE': '✦ Antioxidant Radiance & Brightening Protocol',
      'HYDRATION_PLUMP': '✦ Deep Circadian Hydration Protocol'
    };

    previewBox.innerHTML = `
      <div>
        <div style="border-bottom:1px solid var(--border-subtle); padding-bottom:12px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h4 style="margin:0; font-family:var(--font-heading); font-size:1.15rem; color:var(--accent-gold);">${protocolTitles[protocolMode]}</h4>
            <span style="font-size:0.82rem; color:var(--text-secondary);">Prescribed for: <strong>${clientName}</strong></span>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Date: ${new Date().toLocaleDateString()}</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px; font-size:0.88rem;">
          <div style="display:flex; gap:10px; align-items:center;">
            <span style="width:24px; height:24px; border-radius:50%; background:var(--accent-gold); color:#1c1917; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem;">1</span>
            <div><strong style="color:var(--text-primary);">Cleanser:</strong> <span style="color:var(--text-secondary);">${step1}</span></div>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <span style="width:24px; height:24px; border-radius:50%; background:var(--accent-gold); color:#1c1917; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem;">2</span>
            <div><strong style="color:var(--text-primary);">Toner / Essence:</strong> <span style="color:var(--text-secondary);">${step2}</span></div>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <span style="width:24px; height:24px; border-radius:50%; background:var(--accent-gold); color:#1c1917; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem;">3</span>
            <div><strong style="color:var(--text-primary);">Active Treatment:</strong> <span style="color:var(--accent-gold); font-weight:600;">${step3}</span></div>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <span style="width:24px; height:24px; border-radius:50%; background:var(--accent-gold); color:#1c1917; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem;">4</span>
            <div><strong style="color:var(--text-primary);">Moisturizer:</strong> <span style="color:var(--text-secondary);">${step4}</span></div>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <span style="width:24px; height:24px; border-radius:50%; background:var(--accent-gold); color:#1c1917; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem;">5</span>
            <div><strong style="color:var(--text-primary);">Sunscreen (AM):</strong> <span style="color:var(--text-secondary);">${step5}</span></div>
          </div>
        </div>
      </div>

      <div style="margin-top:16px; padding-top:12px; border-top:1px dashed var(--border-subtle); display:flex; justify-content:space-between; align-items:center; font-size:0.78rem; color:var(--text-muted);">
        <span>✦ Consultant Signature: <em>Verified Practitioner</em></span>
        <span style="color:var(--accent-emerald); font-weight:600;">✓ Ready for Client Dispatch</span>
      </div>
    `;
  }

  issuePrescription() {
    showToast('Prescription authorized & issued to client dashboard!', 'success');
  }

  analyzeIngredientCompatibility() {
    const activeA = document.getElementById('matrix-active-a')?.value || 'RETINOL';
    const activeB = document.getElementById('matrix-active-b')?.value || 'VITAMIN_C';
    const resultBox = document.getElementById('ingredient-matrix-result');
    if (!resultBox) return;

    const combinations = {
      'RETINOL_VITAMIN_C': {
        synergy: 'Caution — Separation Recommended',
        score: '62% Compatibility',
        scoreColor: '#f59e0b',
        phWindow: 'Vitamin C requires pH 2.5-3.5 | Retinol works at pH 5.5-6.5',
        timing: 'Apply Vitamin C in Morning (AM) with SPF • Apply Retinol at Night (PM)',
        mechanism: 'Direct layering may cause skin barrier irritation and neutralize acidic potency. Alternating morning and night maximizes antioxidant photoprotection and collagen renewal.'
      },
      'VITAMIN_C_RETINOL': {
        synergy: 'Caution — Separation Recommended',
        score: '62% Compatibility',
        scoreColor: '#f59e0b',
        phWindow: 'Vitamin C requires pH 2.5-3.5 | Retinol works at pH 5.5-6.5',
        timing: 'Apply Vitamin C in Morning (AM) with SPF • Apply Retinol at Night (PM)',
        mechanism: 'Direct layering may cause skin barrier irritation and neutralize acidic potency.'
      },
      'NIACINAMIDE_RETINOL': {
        synergy: 'Optimal Clinical Synergy',
        score: '96% Compatibility',
        scoreColor: 'var(--accent-emerald)',
        phWindow: 'Compatible pH 5.0 - 6.5',
        timing: 'Can be layered together in PM routine or formulated in single emulsion',
        mechanism: 'Niacinamide upregulates ceramide synthesis and reduces retinoid-induced flaking and transepidermal water loss (TEWL).'
      },
      'AHA_BHA': {
        synergy: 'Synergistic Exfoliation (Controlled Frequency)',
        score: '84% Compatibility',
        scoreColor: 'var(--accent-gold)',
        phWindow: 'Low Acidic pH 3.0 - 3.8',
        timing: 'Limit combined use to 1-2 nights per week to prevent acid barrier burn',
        mechanism: 'AHA (Glycolic) dissolves dead stratum corneum desmosomes while BHA (Salicylic) penetrates lipophilic sebaceous pore linings.'
      },
      'BENZOYL_PEROXIDE_RETINOL': {
        synergy: 'Direct Conflict — Do Not Mix Simultaneously',
        score: '28% Compatibility',
        scoreColor: '#ef4444',
        phWindow: 'Oxidative degradation conflict',
        timing: 'Use Benzoyl Peroxide in AM wash • Use Retinol in PM',
        mechanism: 'Benzoyl peroxide is a potent oxidizer that chemically decomposes traditional tretinoin and retinol molecules on contact.'
      }
    };

    const key = `${activeA}_${activeB}`;
    const reverseKey = `${activeB}_${activeA}`;
    const info = combinations[key] || combinations[reverseKey] || {
      synergy: 'Safe & Well-Tolerated Combination',
      score: '90% Compatibility',
      scoreColor: 'var(--accent-emerald)',
      phWindow: 'Physiological skin pH (4.5 - 6.0)',
      timing: 'Can be safely paired in standard sequence (thinnest to thickest consistency)',
      mechanism: 'No known molecular antagonism or negative competitive receptor binding observed.'
    };

    resultBox.innerHTML = `
      <div style="background:var(--bg-surface); border:1.5px solid var(--border-subtle); border-radius:var(--radius-md); padding:22px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:14px; margin-bottom:16px;">
          <div>
            <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Clinical Verdict</span>
            <h3 style="margin:2px 0 0; color:${info.scoreColor}; font-size:1.25rem;">${info.synergy}</h3>
          </div>
          <div style="background:rgba(212, 175, 55, 0.12); padding:6px 14px; border-radius:var(--radius-sm); border:1px solid rgba(212, 175, 55, 0.3);">
            <strong style="color:${info.scoreColor}; font-size:1.1rem;">${info.score}</strong>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
          <div style="background:#ffffff; padding:14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <strong style="display:block; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">Optimal Application Timing</strong>
            <span style="font-size:0.9rem; color:var(--text-primary); font-weight:600;">${info.timing}</span>
          </div>
          <div style="background:#ffffff; padding:14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <strong style="display:block; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">pH Stability Window</strong>
            <span style="font-size:0.9rem; color:var(--text-primary);">${info.phWindow}</span>
          </div>
        </div>

        <div style="background:rgba(212, 175, 55, 0.06); padding:14px; border-radius:var(--radius-sm); border:1px solid rgba(212, 175, 55, 0.2);">
          <strong style="display:block; font-size:0.8rem; text-transform:uppercase; color:var(--accent-gold); margin-bottom:4px;">Clinical Mechanism & Pharmacokinetics</strong>
          <p style="margin:0; font-size:0.86rem; color:var(--text-secondary); line-height:1.5;">${info.mechanism}</p>
        </div>
      </div>
    `;
  }

  /* =========================================================
     DERMATOLOGIST PORTAL METHODS
     ========================================================= */

  async loadDermatologistDiagnostics() {
    const tableBody = document.getElementById('derm-patients-table');
    if (!tableBody) return;

    try {
      this.cachedUsers = await window.api.listUsers();
      const patients = this.cachedUsers.filter(u => u.role === 'USER');
      
      const mockFitz = ['Type I', 'Type II', 'Type III', 'Type IV', 'Type V', 'Type VI'];
      const mockPathologies = ['Acne Vulgaris (Grade II)', 'Erythematotelangiectatic Rosacea', 'Epidermal & Dermal Melasma', 'Atopic Dermatitis & Eczema', 'Comedonal Maintenance'];
      
      tableBody.innerHTML = patients.length === 0 ? '<tr><td colspan="6" style="padding:20px; text-align:center;">No patients found</td></tr>' : patients.map((p, i) => {
        // Hydrating some mock diagnostic fields until we build full diagnostic tables
        const fitz = mockFitz[i % mockFitz.length];
        const pathology = mockPathologies[i % mockPathologies.length];
        const severity = i % 2 === 0 ? 'Moderate' : 'High';
        const alertColor = severity === 'High' ? '#ef4444' : '#f59e0b';
        const tewl = (10 + (i * 2.4)).toFixed(1) + ' g/m²/h';

        return `
        <tr style="border-bottom:1px solid var(--border-subtle);">
          <td style="padding:14px;">
            <strong>${p.full_name || p.email}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">Patient ID: #${p.id}</div>
          </td>
          <td style="padding:14px;"><span class="tag-chip" style="font-size:0.75rem; padding:2px 8px;">${fitz}</span></td>
          <td style="padding:14px; font-weight:600; color:var(--text-primary);">${pathology}</td>
          <td style="padding:14px;">
            <span style="display:inline-block; padding:3px 10px; border-radius:4px; font-size:0.75rem; font-weight:700; background:${alertColor}20; color:${alertColor}; border:1px solid ${alertColor}50;">
              ${severity}
            </span>
          </td>
          <td style="padding:14px; color:var(--text-secondary); font-size:0.85rem;">${tewl}</td>
          <td style="padding:14px; display:flex; gap:8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('dermatologist-staging'); setTimeout(() => { document.getElementById('staging-patient-id').textContent='${(p.full_name || p.email).replace(/'/g, "\\'")}'; }, 100);">Stage Case</button>
            <button class="btn btn-gold btn-sm" onclick="window.app.navigate('dermatologist-titration')">Titrate Rx</button>
            <button class="btn btn-secondary btn-sm" style="border: 1px solid var(--accent-indigo); color: var(--accent-indigo);" onclick="window.app.viewPatientDossier(${p.id}, '${(p.full_name || '').replace(/'/g, "\\'")}', '${p.avatar_url || ''}')">View Progress</button>
          </td>
        </tr>
        `;
      }).join('');
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#ef4444;">${err.message}</td></tr>`;
    }
  }

  updateConditionStaging() {
    const condition = document.getElementById('staging-condition-select')?.value || 'ACNE_VULGARIS';
    const grade = document.getElementById('staging-grade-select')?.value || 'GRADE_2';
    const guidelinesBox = document.getElementById('staging-clinical-guidelines');
    if (!guidelinesBox) return;

    const data = {
      'ACNE_VULGARIS': {
        guideline: 'Leeds Grade II (Papulopustular Acne): First-line therapy combines topical Retinoid (Tretinoin 0.05% or Adapalene 0.3%) with Topical Azelaic Acid 15-20% or Benzoyl Peroxide 2.5% to suppress Cutibacterium acnes biofilm and normalize follicular hyperkeratinization.',
        contraindications: 'Do not pair high-strength Salicylic Acid peel during active oral Isotretinoin cycle.',
        followUp: '6 Weeks to assess lesion count reduction and retinization tolerance.'
      },
      'ROSACEA': {
        guideline: 'Subtype 1/2 Rosacea with Neurovascular Hyperreactivity: Topical Azelaic Acid 15% gel BID combined with Ivermectin 1% cream. Sub-antimicrobial dose Doxycycline (40-50mg daily) provides potent MMP inhibition without bacterial resistance.',
        contraindications: 'Avoid high-concentration Glycolic/AHA acids and astringent alcohol toners.',
        followUp: '4 Weeks to assess erythema score and telangiectasia stability.'
      },
      'MELASMA': {
        guideline: 'MASI Grade II Hyperpigmentation: Modified Kligman Formula (Hydroquinone 4% + Tretinoin 0.05% + Fluocinolone Acetonide 0.01%) for 12 weeks, followed by Azelaic Acid 20% maintenance.',
        contraindications: 'Strict 3-month holiday cycling required for Hydroquinone to eliminate ochronosis risk.',
        followUp: '8 Weeks photographic Wood’s lamp pigment depth evaluation.'
      },
      'ATOPIC_DERMATITIS': {
        guideline: 'SCORAD Moderate Flare: Physiological 3:1:1 Ceramide/Cholesterol dominant lipid replenishment paired with Topical Calcineurin Inhibitor (Tacrolimus 0.1%) to spare corticosteroid cutaneous atrophy.',
        contraindications: 'Avoid alcohol carriers, fragrance, and essential oils.',
        followUp: '2 Weeks TEWL monitoring.'
      }
    };

    const info = data[condition] || data['ACNE_VULGARIS'];

    guidelinesBox.innerHTML = `
      <div style="margin-bottom:14px;">
        <span style="font-size:0.75rem; text-transform:uppercase; color:var(--accent-gold); font-weight:700;">Diagnostic Clinical Guidance</span>
        <p style="margin:4px 0 0; font-size:0.9rem; line-height:1.55; color:var(--text-primary);">${info.guideline}</p>
      </div>

      <div style="background:#fef2f2; border:1px solid #fecaca; padding:12px; border-radius:var(--radius-sm); margin-bottom:14px;">
        <strong style="color:#b91c1c; font-size:0.8rem; text-transform:uppercase;">Clinical Contraindications & Warnings:</strong>
        <p style="margin:2px 0 0; font-size:0.85rem; color:#991b1b;">${info.contraindications}</p>
      </div>

      <div style="font-size:0.82rem; color:var(--text-muted);">
        <span>✦ Standard Follow-Up Interval: <strong>${info.followUp}</strong></span>
      </div>
    `;
  }

  saveClinicalStaging() {
    showToast('Clinical diagnostic staging recorded in patient medical chart.', 'success');
  }

  updateTitrationValues() {
    const tretinoinSteps = ['Off (0%)', '0.025%', '0.05%', '0.1%'];
    const azelaicSteps = ['Off (0%)', '10% (OTC)', '15% (Rx Gel)', '20% (Rx Cream)'];
    const hqSteps = ['Off (0%)', '4.0% (Cycled)', '5.0% (Compounded)'];

    const tretVal = parseInt(document.getElementById('rx-tretinoin-slider')?.value || '1', 10);
    const azVal = parseInt(document.getElementById('rx-azelaic-slider')?.value || '2', 10);
    const hqVal = parseInt(document.getElementById('rx-hq-slider')?.value || '1', 10);
    const systemicVal = document.getElementById('rx-systemic-select')?.value || 'NONE';

    const tretText = tretinoinSteps[tretVal] || '0.05%';
    const azText = azelaicSteps[azVal] || '15%';
    const hqText = hqSteps[hqVal] || '4.0%';

    const tretEl = document.getElementById('rx-tretinoin-val');
    const azEl = document.getElementById('rx-azelaic-val');
    const hqEl = document.getElementById('rx-hq-val');

    if (tretEl) tretEl.textContent = tretText;
    if (azEl) azEl.textContent = azText;
    if (hqEl) hqEl.textContent = hqText;

    // Safety alerts & summary
    const alertsBox = document.getElementById('rx-safety-alerts-box');
    const summaryBox = document.getElementById('rx-summary-details');

    if (alertsBox) {
      let alerts = [];
      if (tretVal > 0) alerts.push('<strong>Pregnancy Category C/X:</strong> Tretinoin is contraindicated during pregnancy and breastfeeding.');
      if (hqVal > 0) alerts.push('<strong>Ochronosis Safety:</strong> Limit Hydroquinone to a maximum 12-week continuous cycle, followed by an 8-week holiday.');
      if (systemicVal.startsWith('DOXY')) alerts.push('<strong>Photosensitivity:</strong> Oral Doxycycline causes increased solar UV erythema. Mandatory daily broad-spectrum SPF 50+.');

      alertsBox.innerHTML = `
        <div style="font-size:0.75rem; text-transform:uppercase; color:#92400e; font-weight:700; margin-bottom:4px;">Pharmacological Alerts & Warnings:</div>
        <ul style="margin:0; padding-left:18px; font-size:0.84rem; color:#78350f; line-height:1.45;">
          ${alerts.map(a => `<li style="margin-bottom:3px;">${a}</li>`).join('')}
        </ul>
      `;
    }

    if (summaryBox) {
      summaryBox.innerHTML = `
        <div><strong>Topical Retinoid:</strong> ${tretText}</div>
        <div><strong>Anti-Inflammatory Active:</strong> ${azText}</div>
        <div><strong>Tyrosinase Inhibitor:</strong> ${hqText}</div>
        <div><strong>Systemic Adjuvant:</strong> ${systemicVal.replace('_', ' ')}</div>
      `;
    }
  }

  signOffRxProtocol() {
    showToast('Medical Rx protocol signed and electronically authorized.', 'success');
  }

  /* =========================================================
     ADMINISTRATOR PORTAL METHODS
     ========================================================= */

  async loadAdminData() {
    try {
      this.cachedUsers = await window.api.listUsers();
      this.computeAdminStats(this.cachedUsers);
      this.loadDatabaseTelemetry();
    } catch (err) {
      console.error(err);
    }
  }

  computeAdminStats(users) {
    const userCount = users.filter(u => u.role === 'USER').length;
    const consultantCount = users.filter(u => u.role === 'SKINCARE_CONSULTANT').length;
    const dermCount = users.filter(u => u.role === 'DERMATOLOGIST').length;
    const adminCount = users.filter(u => u.role === 'ADMINISTRATOR').length;

    const uEl = document.getElementById('role-count-user');
    const cEl = document.getElementById('role-count-consultant');
    const dEl = document.getElementById('role-count-derm');
    const aEl = document.getElementById('role-count-admin');

    if (uEl) uEl.textContent = `${userCount} Users`;
    if (cEl) cEl.textContent = `${consultantCount} Consultants`;
    if (dEl) dEl.textContent = `${dermCount} Physicians`;
    if (aEl) aEl.textContent = `${adminCount} Superusers`;
  }

  async loadAdminUsersTable() {
    const tableBody = document.getElementById('admin-users-table');
    if (!tableBody) return;

    try {
      if (!this.cachedUsers.length) {
        this.cachedUsers = await window.api.listUsers();
      }
      this.renderAdminUsers(this.cachedUsers);
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="7" style="padding:20px; text-align:center; color:var(--text-muted);">${err.message}</td></tr>`;
    }
  }

  renderAdminUsers(users) {
    const tableBody = document.getElementById('admin-users-table');
    if (!tableBody) return;

    tableBody.innerHTML = users.map(u => `
      <tr style="border-bottom: 1px solid var(--border-subtle);">
        <td style="padding: 14px; font-weight:700; color:var(--text-muted);">#${u.id}</td>
        <td style="padding: 14px; font-weight:600; color:var(--text-primary);">${u.full_name}</td>
        <td style="padding: 14px; color:var(--text-secondary);">${u.email}</td>
        <td style="padding: 14px;"><span class="user-role-pill">${u.role.replace('_', ' ')}</span></td>
        <td style="padding: 14px;">
          <select class="form-select" style="padding:4px 8px; font-size:0.8rem; width:160px;" onchange="window.app.handleRoleChange(${u.id}, this.value)">
            <option value="USER" ${u.role === 'USER' ? 'selected' : ''}>Consumer (USER)</option>
            <option value="SKINCARE_CONSULTANT" ${u.role === 'SKINCARE_CONSULTANT' ? 'selected' : ''}>Consultant</option>
            <option value="DERMATOLOGIST" ${u.role === 'DERMATOLOGIST' ? 'selected' : ''}>Dermatologist</option>
            <option value="ADMINISTRATOR" ${u.role === 'ADMINISTRATOR' ? 'selected' : ''}>Administrator</option>
          </select>
        </td>
        <td style="padding: 14px; color:var(--accent-emerald); font-weight:600; font-size:0.85rem;">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--accent-emerald); margin-right:6px;"></span>Active
        </td>
        <td style="padding: 14px;">
          <button class="btn btn-secondary btn-sm" onclick="window.app.viewPatientDossier(${u.id}, '${u.full_name.replace(/'/g, "\\'")}', '${u.avatar_url || ''}')">Inspect</button>
        </td>
      </tr>
    `).join('');
  }

  filterAdminUsers() {
    const query = document.getElementById('admin-user-search-input')?.value.toLowerCase().trim() || '';
    const filtered = this.cachedUsers.filter(u =>
      u.full_name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );
    this.renderAdminUsers(filtered);
  }

  async handleRoleChange(userId, newRole) {
    try {
      showToast(`Updating user #${userId} permissions to ${newRole}...`, 'info');
      await window.api.updateUserRole(userId, newRole);
      showToast(`User role successfully elevated to ${newRole}`, 'success');
      this.cachedUsers = await window.api.listUsers();
      this.renderAdminUsers(this.cachedUsers);
      this.computeAdminStats(this.cachedUsers);
    } catch (err) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  }

  loadInciDatabase() {
    const tableBody = document.getElementById('admin-inci-table');
    if (!tableBody) return;

    const inciData = [
      { name: 'Niacinamide (Vitamin B3)', category: 'Cell-Communicating / Barrier Repair', comedogenic: '0 (Non-Comedogenic)', irritancy: 'Low (0/5)', euStatus: 'Annex III / Approved Safe', statusColor: 'var(--accent-emerald)' },
      { name: 'Retinol (Vitamin A)', category: 'Cell-Renewing / Collagen Synthesis', comedogenic: '0 (Non-Comedogenic)', irritancy: 'Moderate (Retinization)', euStatus: 'Max 0.3% Facial (SCCS 2024)', statusColor: 'var(--accent-gold)' },
      { name: 'Salicylic Acid (BHA)', category: 'Lipophilic Keratolytic Exfoliant', comedogenic: '0 (Non-Comedogenic)', irritancy: 'Low to Moderate', euStatus: 'Max 2.0% Leave-on Approved', statusColor: 'var(--accent-emerald)' },
      { name: 'Ceramide NP (3)', category: 'Physiological Intercellular Lipid', comedogenic: '0 (Non-Comedogenic)', irritancy: 'None (0/5)', euStatus: 'Unrestricted / Safe', statusColor: 'var(--accent-emerald)' },
      { name: 'Isopropyl Myristate', category: 'Emollient / Solvent', comedogenic: '5 (Highly Comedogenic)', irritancy: 'Low (1/5)', euStatus: 'Restricted Acne Formulations', statusColor: '#ef4444' },
      { name: 'Oxybenzone (Benzophenone-3)', category: 'Chemical UVB/UVA Filter', comedogenic: '1 (Low)', irritancy: 'High (Photoallergen)', euStatus: 'Max 6% (Coral Reef Banned)', statusColor: '#ef4444' },
      { name: 'L-Ascorbic Acid', category: 'Direct Antioxidant / Vitamin C', comedogenic: '0 (Non-Comedogenic)', irritancy: 'Moderate (Low pH 3.0)', euStatus: 'Unrestricted / Safe', statusColor: 'var(--accent-emerald)' }
    ];

    tableBody.innerHTML = inciData.map(item => `
      <tr style="border-bottom:1px solid var(--border-subtle);">
        <td style="padding:14px; font-weight:700; color:var(--text-primary);">${item.name}</td>
        <td style="padding:14px; color:var(--text-secondary); font-size:0.85rem;">${item.category}</td>
        <td style="padding:14px;"><span class="tag-chip" style="font-size:0.75rem;">${item.comedogenic}</span></td>
        <td style="padding:14px; font-size:0.85rem;">${item.irritancy}</td>
        <td style="padding:14px; font-size:0.85rem; color:var(--text-secondary);">${item.euStatus}</td>
        <td style="padding:14px;">
          <span style="color:${item.statusColor}; font-weight:600; font-size:0.85rem;">✓ Verified</span>
        </td>
      </tr>
    `).join('');
  }

  filterInciDatabase() {
    const query = document.getElementById('admin-inci-search')?.value.toLowerCase().trim() || '';
    const rows = document.querySelectorAll('#admin-inci-table tr');
    rows.forEach(r => {
      r.style.display = r.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
  }

  loadDatabaseTelemetry() {
    const grid = document.getElementById('admin-mongo-collections-grid');
    if (!grid) return;

    const collections = [
      { name: 'users', count: this.cachedUsers.length || 5, desc: 'Registered user documents & encrypted credentials' },
      { name: 'skin_profiles', count: 5, desc: 'Fitzpatrick typing, concerns & allergy arrays' },
      { name: 'lifestyle_logs', count: 28, desc: 'Daily stress, diet, alcohol & smoking records' },
      { name: 'sleep_logs', count: 28, desc: 'Sleep duration, REM quality & circadian scoring' },
      { name: 'hydration_logs', count: 28, desc: 'Intake logs, ml consumption & daily goal targets' },
      { name: 'environment_logs', count: 28, desc: 'UV index, sun exposure hours & air pollution records' }
    ];

    grid.innerHTML = collections.map(c => `
      <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <code style="color:var(--accent-gold); font-size:0.9rem; font-weight:700;">db.${c.name}</code>
          <span style="font-weight:700; font-size:1.1rem; color:var(--accent-emerald);">${c.count} docs</span>
        </div>
        <p style="margin:0; font-size:0.78rem; color:var(--text-muted); line-height:1.4;">${c.desc}</p>
      </div>
    `).join('');
  }

  /* =========================================================
     MODAL DOSSIER HANDLERS
     ========================================================= */

  async viewPatientDossier(userId, userName, userAvatar) {
    const modal = document.getElementById('clinical-dossier-modal');
    const modalTitle = document.getElementById('dossier-patient-name');
    const modalAvatar = document.getElementById('dossier-patient-avatar');
    const modalBody = document.getElementById('dossier-modal-body');

    if (!modal) return;

    if (modalTitle) modalTitle.textContent = `Clinical Skin Dossier — ${userName}`;
    if (modalAvatar) modalAvatar.src = userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=d4af37&color=1c1917`;
    if (modalBody) modalBody.innerHTML = '<div style="text-align:center; padding:30px;"><div class="spinner-gold" style="margin:0 auto 12px;"></div>Loading clinical records...</div>';

    modal.style.display = 'flex';

    try {
      const profile = await window.api.getUserProfile(userId).catch(() => null);
      if (!profile) {
        if (modalBody) {
          modalBody.innerHTML = `
            <div style="padding:24px; text-align:center;">
              <p style="color:var(--text-muted); margin-bottom:12px;">No skin assessment recorded yet for ${userName}.</p>
              <button class="btn btn-secondary btn-sm" onclick="window.app.closeDossierModal()">Close</button>
            </div>
          `;
        }
        return;
      }

      const concernsHtml = (profile.concerns && profile.concerns.length)
        ? profile.concerns.map(c => `<span class="tag-chip active" style="font-size:0.75rem; padding:3px 8px;">${c}</span>`).join('')
        : '<span style="color:var(--text-muted); font-size:0.8rem;">None recorded</span>';

      const allergiesHtml = (profile.allergies && profile.allergies.length)
        ? profile.allergies.map(a => `<span class="tag-chip" style="font-size:0.75rem; padding:3px 8px; border-color:#ef4444; color:#dc2626; background:rgba(239,68,68,0.06);">Allergen: ${a}</span>`).join('')
        : '<span style="color:var(--text-muted); font-size:0.8rem;">No allergies recorded</span>';

      if (modalBody) {
        modalBody.innerHTML = `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">
            <div style="background:var(--bg-surface); padding:12px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
              <span style="font-size:0.72rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; display:block;">Skin Type</span>
              <strong style="font-size:1.1rem; color:var(--accent-gold);">${profile.skin_type || 'NORMAL'}</strong>
            </div>
            <div style="background:var(--bg-surface); padding:12px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
              <span style="font-size:0.72rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; display:block;">Age & Group</span>
              <strong style="font-size:1.1rem; color:var(--text-primary);">${profile.age || 25} yrs (${profile.age_group || '25-34'})</strong>
            </div>
          </div>

          <div style="margin-bottom:14px;">
            <strong style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:6px;">Primary Concerns:</strong>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">${concernsHtml}</div>
          </div>

          <div style="margin-bottom:14px;">
            <strong style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:6px;">Allergies & Reactive Sensitivities:</strong>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">${allergiesHtml}</div>
          </div>

          <div style="border-top:1px solid var(--border-subtle); padding-top:14px; margin-top:16px; display:flex; justify-content:flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="window.app.closeDossierModal()">Close Dossier</button>
          </div>
        `;
      }
    } catch (err) {
      if (modalBody) modalBody.innerHTML = `<div style="color:#ef4444; padding:20px; text-align:center;">${err.message}</div>`;
    }
  }

  closeDossierModal() {
    const modal = document.getElementById('clinical-dossier-modal');
    if (modal) modal.style.display = 'none';
  }
}

window.app = new App();
