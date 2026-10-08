from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy.orm import Session
from app.models.system_setting import SystemSetting

DEFAULT_SETTINGS: Dict[str, Dict[str, Any]] = {
    "ui_branding": {
        "app_name": "DermaIQ",
        "tagline": "Personalized Skincare Intelligence",
        "primary_brand_color": "#1b382d",
        "accent_color": "#d4af37",
        "announcement_banner_enabled": True,
        "announcement_banner_text": "🔬 Neural ConcernNet 4.2 active: real-time barrier sensitivity & exposome intelligence enabled.",
        "announcement_banner_type": "INFO",
        "maintenance_mode": False,
        "maintenance_message": "DermaIQ is undergoing scheduled clinical algorithm optimization. Please check back shortly.",
        "footer_copyright": "© 2026 DermaIQ Intelligence & Personalized Planner - by Deep Kamble",
        "support_email": "clinical@dermaiq.ai",
    },
    "legal_privacy": {
        "title": "Privacy Policy & Biometric Data Safeguards",
        "last_updated": "October 2026",
        "effective_date": "October 1, 2026",
        "summary": "DermaIQ is committed to safeguarding cutaneous biometric data, lifestyle habit telemetry, and clinical care interactions in compliance with international health privacy standards, GDPR, and zero-knowledge principles.",
        "sections": [
            {
                "heading": "1. Biometric & Cutaneous Telemetry We Collect",
                "body": "When you complete a diagnostic assessment or log your skin profile, DermaIQ processes skin type characteristics, active concerns (such as acne, dyschromia, or xerosis), known allergies, and lifestyle factors including circadian sleep regularity and water intake. Assessment facial photos are processed locally on device or via secure encrypted tensor pipelines and are never monetized or sold.",
            },
            {
                "heading": "2. End-to-End Cryptographic Security",
                "body": "All diagnostic scores, personalized routines, and care circle consultation chats are secured via AES-256 encryption at rest and TLS 1.3 transit protocols. Access tokens use short-lived JWTs with rotating session invalidation.",
            },
            {
                "heading": "3. Care Circle Disclosures & Medical Permissions",
                "body": "Your diagnostic skin passport is strictly private to your account unless you explicitly initiate or accept a connection request to a licensed Dermatologist or certified Skincare Consultant. You retain the absolute right to revoke professional access instantly with one click.",
            },
            {
                "heading": "4. Data Subject Rights & Deletion Protocols",
                "body": "Under GDPR and CCPA parity, you may request an immutable copy of your longitudinal skin telemetry or request the permanent purge of all historical scans, routine logs, and personal identifiers at any time via your account settings.",
            },
            {
                "heading": "5. Compliance & Regulatory Inquiries",
                "body": "For formal inquiries regarding biometric data handling or clinical audit trails, please contact our Data Protection Officer at privacy@dermaiq.ai.",
            },
        ],
    },
    "legal_terms": {
        "title": "Terms of Clinical & Wellness Service",
        "last_updated": "October 2026",
        "effective_date": "October 1, 2026",
        "summary": "These Terms of Service govern your access to the DermaIQ platform, its AI-assisted skincare analysis, routine planner, and care circle coordination network.",
        "sections": [
            {
                "heading": "1. Medical Disclaimer & Non-Emergency Notice",
                "body": "DermaIQ provides educational skincare analytics, habit consistency tracking, and personalized cosmetic routine recommendations. The platform DOES NOT provide emergency medical intervention, prescription narcotics, or diagnostic pathology for malignant neoplasms. If you suspect an acute cutaneous infection or allergic anaphylaxis, seek immediate hospital care.",
            },
            {
                "heading": "2. Professional Account Requirements",
                "body": "Professionals registering as Dermatologists or Skincare Consultants warrant that they hold valid credentials, certifications, or licenses in their respective jurisdictions. DermaIQ reserves the right to verify credentials or restrict professional access upon administrative review.",
            },
            {
                "heading": "3. Ingredient Safety & Sensitivity Testing",
                "body": "Ingredient contraindication modeling is powered by algorithmic heuristic evaluation and curated cosmetic science databases. Individual cutaneous hypersensitivity or patch reactions cannot be 100% anticipated. Patch testing of any new cosmetic product is strongly recommended prior to full facial application.",
            },
            {
                "heading": "4. User Accounts & Security",
                "body": "You are responsible for maintaining the confidentiality of your authentication credentials. Any activity originating from your authenticated session is deemed authorized by you.",
            },
            {
                "heading": "5. Limitation of Liability",
                "body": "To the maximum extent permitted by applicable law, DermaIQ and its developers assume no liability for individual cutaneous reactions, misuse of cosmetic products, or advice exchanged outside official platform channels.",
            },
        ],
    },
    "legal_security": {
        "title": "Security Standards & Cryptographic Integrity",
        "last_updated": "October 2026",
        "effective_date": "October 1, 2026",
        "summary": "DermaIQ implements comprehensive defense-in-depth security standards across all database layers, neural endpoints, and clinical communication conduits.",
        "sections": [
            {
                "heading": "1. Cryptographic Storage & Zero-Trust Architecture",
                "body": "All user credentials utilize salted Argon2/bcrypt hashing algorithms. Sensitive biometric assessments and clinical notes are partitioned with isolated foreign key constraints and encrypted volume storage.",
            },
            {
                "heading": "2. Transport Layer Security & API Hardening",
                "body": "Network egress and ingress are guarded by TLS 1.3 encryption. API endpoints enforce strict CORS whitelisting, role-based access control (RBAC), rate-limiting middleware, and parameterized SQL query execution preventing injection vectors.",
            },
            {
                "heading": "3. Administrative Audit Logging",
                "body": "All administrative interventions (role alterations, account status toggles, platform policy modifications) generate immutable audit logs with timestamped administrative IDs to protect clinical integrity and patient privacy.",
            },
            {
                "heading": "4. Infrastructure Resilience & Health Monitoring",
                "body": "Our backend infrastructure operates in isolated containerized environments with continuous health probes, PostgreSQL transaction isolation, and automated database backup routines.",
            },
        ],
    },
    "feature_controls": {
        "enable_ai_assessment": True,
        "enable_professional_care_circle": True,
        "enable_sleep_circadian_tracking": True,
        "enable_hydration_tracking": True,
        "enable_weather_environmental_telemetry": True,
        "enable_community_reviews": True,
        "ai_confidence_threshold": 0.75,
        "max_upload_size_mb": 10,
        "rate_limit_per_minute": 120,
    },
}


class SettingsService:
    @staticmethod
    def get_setting(db: Session, key: str) -> Dict[str, Any]:
        """
        Retrieves a setting by key from the database.
        If not yet stored, falls back to DEFAULT_SETTINGS and automatically initializes it.
        """
        record = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if record and isinstance(record.value, dict):
            return record.value

        # Fallback to default template
        default_val = DEFAULT_SETTINGS.get(key, {})
        if default_val:
            try:
                new_setting = SystemSetting(
                    key=key,
                    value=default_val,
                    description=f"Auto-initialized default for {key}",
                    updated_at=datetime.now(timezone.utc),
                )
                db.add(new_setting)
                db.commit()
                db.refresh(new_setting)
                return new_setting.value
            except Exception:
                db.rollback()
                return default_val
        return {}

    @staticmethod
    def get_all_settings(db: Session) -> Dict[str, Any]:
        """
        Returns all system settings dictionary, merging database values with defaults.
        """
        all_settings = {}
        for key in DEFAULT_SETTINGS.keys():
            all_settings[key] = SettingsService.get_setting(db, key)
        return all_settings

    @staticmethod
    def update_setting(db: Session, key: str, value: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates or creates a setting record in the database.
        """
        record = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if not record:
            record = SystemSetting(
                key=key,
                value=value,
                description=f"Administrative setting for {key}",
                updated_at=datetime.now(timezone.utc),
            )
            db.add(record)
        else:
            record.value = value
            record.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(record)
        return record.value

    @staticmethod
    def reset_setting(db: Session, key: str) -> Dict[str, Any]:
        """
        Resets a setting to factory default.
        """
        default_val = DEFAULT_SETTINGS.get(key)
        if default_val is None:
            return {}
        return SettingsService.update_setting(db, key, default_val)
