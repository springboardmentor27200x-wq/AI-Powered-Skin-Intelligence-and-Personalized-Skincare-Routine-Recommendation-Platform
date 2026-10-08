"""
Automated Test Suite for AI Skin Intelligence & Personalized Skincare Planner
Covers:
- Authentication & JWT
- Profile Questionnaire Management
- 5-Factor Weighted & ML Skin Health Scoring
- Routine Generator & Weekly Protocol
- ML Content-Based Product Recommendations & Cosine Similarity
- Daily Routine Checklist & 7-Day Adherence Tracking
- Progress Analytics & Forecast Insights
- Dermatologist Clinical Portal Endpoints
- Admin System Analytics & User Management
- PDF & Excel Clinical Report Generation
"""

import unittest
import json
from app import create_app, db
from app.models import User, SkinProfile, DailyChecklist, ScoreHistory, ClinicalRecommendation

class SkinIntelligenceTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_01_api_health_check(self):
        """Verify API is running."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("message", data)

    def test_02_user_registration_and_login(self):
        """Test registration, role assignment, and JWT authentication."""
        # 1. Register
        reg_payload = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "securepassword123",
            "role": "user"
        }
        res_reg = self.client.post("/register", json=reg_payload)
        self.assertEqual(res_reg.status_code, 201)

        # 2. Login
        login_payload = {
            "email": "jane@example.com",
            "password": "securepassword123"
        }
        res_login = self.client.post("/login", json=login_payload)
        self.assertEqual(res_login.status_code, 200)
        data = json.loads(res_login.data)
        self.assertIn("token", data)
        self.assertEqual(data["user"]["name"], "Jane Doe")

    def _get_auth_headers(self, email="test@example.com", role="user"):
        """Helper to create and log in a user and return JWT headers."""
        self.client.post("/register", json={
            "name": "Test User",
            "email": email,
            "password": "password123",
            "role": role
        })
        res = self.client.post("/login", json={
            "email": email,
            "password": "password123"
        })
        token = json.loads(res.data)["token"]
        return {"Authorization": f"Bearer {token}"}

    def test_03_skin_profile_creation_and_retrieval(self):
        """Test saving and getting questionnaire skin profile."""
        headers = self._get_auth_headers("profile@example.com")
        profile_data = {
            "skin_type": "Combination",
            "age_group": "25-34",
            "skin_concerns": "Acne, Hyperpigmentation",
            "allergies": "None",
            "sensitivities": "Fragrance",
            "sleep_hours": "7-8 hours",
            "sleep_quality": "Good",
            "stress_level": "Moderate",
            "exercise_frequency": "Weekly",
            "water_intake_level": "Moderate",
            "average_water_intake": "2.0",
            "environmental_exposure": "Moderate / Balanced"
        }
        # Save profile
        res_post = self.client.post("/profile", json=profile_data, headers=headers)
        self.assertEqual(res_post.status_code, 200)

        # Retrieve profile
        res_get = self.client.get("/profile", headers=headers)
        self.assertEqual(res_get.status_code, 200)
        saved = json.loads(res_get.data)
        self.assertEqual(saved["skin_type"], "Combination")
        self.assertEqual(saved["skin_concerns"], "Acne, Hyperpigmentation")

    def test_04_skin_assessment_and_scoring_engine(self):
        """Verify 5-factor weighted formula and concern prioritization."""
        headers = self._get_auth_headers("assessment@example.com")
        # Save a profile first
        self.client.post("/profile", json={
            "skin_type": "Oily",
            "skin_concerns": "Acne, Dark Spots",
            "sleep_hours": "7-8 hours",
            "sleep_quality": "Good",
            "stress_level": "Low",
            "water_intake_level": "High",
            "average_water_intake": "2.5",
        }, headers=headers)

        res = self.client.get("/assessment", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)

        self.assertIn("assessment", data)
        self.assertIn("score", data["assessment"])
        self.assertIn("breakdown", data["assessment"])
        self.assertIn("concerns", data["assessment"])
        self.assertIn("routine", data)
        self.assertIn("products", data)

        # Validate score bounds (0-100)
        score = data["assessment"]["score"]
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)

    def test_05_routine_generation_protocol(self):
        """Test AM, PM, and Weekly regimen creation."""
        headers = self._get_auth_headers("routine@example.com")
        self.client.post("/profile", json={
            "skin_type": "Dry",
            "skin_concerns": "Dry Skin, Sensitive Skin",
        }, headers=headers)

        res = self.client.get("/assessment", headers=headers)
        routine = json.loads(res.data)["routine"]

        self.assertIn("morning", routine)
        self.assertIn("evening", routine)
        self.assertIn("weekly", routine)
        self.assertIn("seasonal", routine)
        self.assertGreater(len(routine["morning"]), 0)
        self.assertGreater(len(routine["evening"]), 0)

    def test_06_product_recommendations_engine(self):
        """Test ML cosine similarity recommendations and categorizations."""
        headers = self._get_auth_headers("product@example.com")
        self.client.post("/profile", json={
            "skin_type": "Sensitive",
            "skin_concerns": "Redness, Dry Skin",
            "sensitivities": "Fragrance, Alcohol"
        }, headers=headers)

        res = self.client.get("/assessment", headers=headers)
        prods = json.loads(res.data)["products"]

        self.assertIn("top_recommendations", prods)
        self.assertIn("by_category", prods)
        self.assertIn("comparison", prods)

    def test_07_checklist_and_adherence(self):
        """Test routine daily checklist steps and completion toggle."""
        headers = self._get_auth_headers("checklist@example.com")
        self.client.post("/profile", json={
            "skin_type": "Normal",
            "skin_concerns": "General Maintenance",
        }, headers=headers)

        # 1. Fetch checklist
        res = self.client.get("/checklist", headers=headers)
        self.assertEqual(res.status_code, 200)
        items = json.loads(res.data)
        self.assertIn("morning", items)
        self.assertGreater(len(items["morning"]), 0)

        # 2. Toggle item
        first_item = items["morning"][0]
        toggle_res = self.client.post(f"/checklist/toggle/{first_item['id']}", headers=headers)
        self.assertEqual(toggle_res.status_code, 200)
        self.assertTrue(json.loads(toggle_res.data)["is_completed"])

    def test_07b_progress_tracking_and_comparison_analytics(self):
        """Test Module 8: progress monitoring, adherence, improvement, before/after, and trend."""
        headers = self._get_auth_headers("progress_analytics@example.com")
        self.client.post("/profile", json={"skin_type": "Combination", "skin_concerns": "Acne"}, headers=headers)

        # Trigger assessment to record initial score
        self.client.get("/assessment", headers=headers)

        # Query progress endpoint
        res = self.client.get("/progress", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)

        # 1. Skin progress monitoring
        self.assertIn("history", data)
        self.assertIn("latest_score", data)

        # 2. Routine adherence tracking
        self.assertIn("today_adherence", data)

        # 3. Improvement analysis
        self.assertIn("change", data)

        # 4. Before/after comparisons
        self.assertIn("comparison", data)
        self.assertIn("baseline_score", data["comparison"])
        self.assertIn("current_score", data["comparison"])
        self.assertIn("improvement_points", data["comparison"])

        # 5. Trend analysis
        self.assertIn("insights", data)
        self.assertIn("trend", data["insights"])
        self.assertIn("recommendations", data["insights"])

    def test_08_clinical_dermatologist_endpoints(self):
        """Test Doctor clinical review and prescription note API."""
        doc_headers = self._get_auth_headers("doctor@hospital.com", role="dermatologist")
        patient_headers = self._get_auth_headers("patient@hospital.com", role="user")

        # Save patient profile
        self.client.post("/profile", json={"skin_type": "Oily", "skin_concerns": "Acne"}, headers=patient_headers)

        # Doctor lists patients
        res_patients = self.client.get("/api/doctor/patients", headers=doc_headers)
        self.assertEqual(res_patients.status_code, 200)
        patients = json.loads(res_patients.data)
        self.assertIsInstance(patients, list)

        if patients:
            p_id = patients[0]["id"]
            # Add doctor note
            note_res = self.client.post(f"/api/doctor/patient/{p_id}/note", json={
                "notes": "Patient barrier recovering well. Prescribed 2% BHA twice a week.",
                "routine_adjustment": "Add BHA to PM routine on Wednesdays."
            }, headers=doc_headers)
            self.assertEqual(note_res.status_code, 200)

    def test_09_admin_portal_endpoints(self):
        """Test admin analytics overview and user management."""
        admin_headers = self._get_auth_headers("admin@platform.com", role="admin")

        # Fetch stats
        res_stats = self.client.get("/api/admin/stats", headers=admin_headers)
        self.assertEqual(res_stats.status_code, 200)
        stats = json.loads(res_stats.data)
        self.assertIn("total_users", stats)

        # Fetch users
        res_users = self.client.get("/api/admin/users", headers=admin_headers)
        self.assertEqual(res_users.status_code, 200)
        users = json.loads(res_users.data)
        self.assertIsInstance(users, list)

    def test_10_pdf_report_exports(self):
        """Test generation of all 4 PDF reports and Excel progress export."""
        headers = self._get_auth_headers("reports@example.com")
        self.client.post("/profile", json={"skin_type": "Combination", "skin_concerns": "Acne"}, headers=headers)

        # 1. Assessment PDF
        res_pdf1 = self.client.get("/api/reports/export/pdf/assessment", headers=headers)
        self.assertEqual(res_pdf1.status_code, 200)
        self.assertEqual(res_pdf1.mimetype, "application/pdf")

        # 2. Routine PDF
        res_pdf2 = self.client.get("/api/reports/export/pdf/routine", headers=headers)
        self.assertEqual(res_pdf2.status_code, 200)
        self.assertEqual(res_pdf2.mimetype, "application/pdf")

        # 3. Products PDF
        res_pdf3 = self.client.get("/api/reports/export/pdf/products", headers=headers)
        self.assertEqual(res_pdf3.status_code, 200)
        self.assertEqual(res_pdf3.mimetype, "application/pdf")

        # 4. Progress PDF
        res_pdf4 = self.client.get("/api/reports/export/pdf/progress", headers=headers)
        self.assertEqual(res_pdf4.status_code, 200)
        self.assertEqual(res_pdf4.mimetype, "application/pdf")

        # 5. Progress Excel
        res_excel = self.client.get("/api/reports/export/excel/progress", headers=headers)
        self.assertEqual(res_excel.status_code, 200)

if __name__ == "__main__":
    unittest.main()
