"""
tests/test_api.py — Integration tests for Flask API endpoints.
"""

import os, sys, json, tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DATABASE_PATH", os.path.join(tempfile.gettempdir(), "nids_test_api.db"))

import pytest


@pytest.fixture(scope="module")
def client():
    from backend.app import create_app
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


# ── /api/health ───────────────────────────────────────────────────────────────
class TestHealth:
    def test_health_returns_200(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200

    def test_health_has_status(self, client):
        data = resp = client.get("/api/health").get_json()
        assert "status" in data
        assert data["status"] == "online"

    def test_health_has_model_loaded(self, client):
        data = client.get("/api/health").get_json()
        assert "model_loaded" in data


# ── /api/predict ──────────────────────────────────────────────────────────────
class TestPredict:
    NORMAL_FLOW = {"duration": 5.0, "src_bytes": 900.0, "dst_bytes": 700.0}
    PORT_SCAN   = {"duration": 0.3, "src_bytes": 40.0,  "dst_bytes": 20.0}
    DOS_FLOW    = {"duration": 5.0, "src_bytes": 2_000_000.0, "dst_bytes": 100.0}
    EXFIL_FLOW  = {"duration": 300.0, "src_bytes": 500.0, "dst_bytes": 50_000_000.0}
    THEFT_FLOW  = {"duration": 30.0, "src_bytes": 200.0, "dst_bytes": 150_000.0}

    def test_predict_returns_200(self, client):
        resp = client.post("/api/predict",
                           data=json.dumps(self.NORMAL_FLOW),
                           content_type="application/json")
        assert resp.status_code == 200

    def test_predict_port_scan(self, client):
        resp = client.post("/api/predict",
                           data=json.dumps(self.PORT_SCAN),
                           content_type="application/json")
        data = resp.get_json()
        assert data["status"] == "INTRUSION"
        assert data["attack_type"] == "PORT_SCAN"
        assert data["detection_method"] == "RULE"

    def test_predict_dos(self, client):
        resp = client.post("/api/predict",
                           data=json.dumps(self.DOS_FLOW),
                           content_type="application/json")
        data = resp.get_json()
        assert data["status"] == "INTRUSION"
        assert data["attack_type"] == "DOS"

    def test_predict_exfiltration(self, client):
        resp = client.post("/api/predict",
                           data=json.dumps(self.EXFIL_FLOW),
                           content_type="application/json")
        data = resp.get_json()
        assert data["status"] == "INTRUSION"
        assert data["attack_type"] == "DATA_EXFILTRATION"

    def test_predict_data_theft(self, client):
        resp = client.post("/api/predict",
                           data=json.dumps(self.THEFT_FLOW),
                           content_type="application/json")
        data = resp.get_json()
        assert data["status"] == "INTRUSION"
        assert data["attack_type"] == "DATA_THEFT"

    def test_predict_response_has_required_fields(self, client):
        resp = client.post("/api/predict",
                           data=json.dumps(self.NORMAL_FLOW),
                           content_type="application/json")
        data = resp.get_json()
        for field in ("status", "detection_method", "timestamp", "duration",
                      "src_bytes", "dst_bytes", "message"):
            assert field in data, f"Missing field: {field}"

    def test_predict_echoes_input(self, client):
        resp = client.post("/api/predict",
                           data=json.dumps(self.NORMAL_FLOW),
                           content_type="application/json")
        data = resp.get_json()
        assert data["duration"]  == self.NORMAL_FLOW["duration"]
        assert data["src_bytes"] == self.NORMAL_FLOW["src_bytes"]
        assert data["dst_bytes"] == self.NORMAL_FLOW["dst_bytes"]

    # ── Validation errors ─────────────────────────────────────────────────────
    def test_missing_field_returns_400(self, client):
        resp = client.post("/api/predict",
                           data=json.dumps({"duration": 5}),
                           content_type="application/json")
        assert resp.status_code == 400

    def test_negative_value_returns_400(self, client):
        resp = client.post("/api/predict",
                           data=json.dumps({"duration": -1, "src_bytes": 900, "dst_bytes": 700}),
                           content_type="application/json")
        assert resp.status_code == 400

    def test_invalid_type_returns_400(self, client):
        resp = client.post("/api/predict",
                           data=json.dumps({"duration": "abc", "src_bytes": 900, "dst_bytes": 700}),
                           content_type="application/json")
        assert resp.status_code == 400

    def test_empty_body_returns_400(self, client):
        resp = client.post("/api/predict",
                           data="not json",
                           content_type="application/json")
        assert resp.status_code == 400

    def test_malformed_json_returns_400(self, client):
        resp = client.post("/api/predict",
                           data="{bad json",
                           content_type="application/json")
        assert resp.status_code == 400


# ── /api/alerts ───────────────────────────────────────────────────────────────
class TestAlerts:
    def test_alerts_returns_200(self, client):
        resp = client.get("/api/alerts")
        assert resp.status_code == 200

    def test_alerts_has_list(self, client):
        data = client.get("/api/alerts").get_json()
        assert "alerts" in data
        assert isinstance(data["alerts"], list)

    def test_alerts_stored_after_intrusion(self, client):
        # Send a known intrusion to populate the DB
        client.post("/api/predict",
                    data=json.dumps({"duration": 0.3, "src_bytes": 30, "dst_bytes": 10}),
                    content_type="application/json")
        data = client.get("/api/alerts").get_json()
        assert data["count"] >= 1


# ── /api/statistics ───────────────────────────────────────────────────────────
class TestStatistics:
    def test_statistics_returns_200(self, client):
        resp = client.get("/api/statistics")
        assert resp.status_code == 200

    def test_statistics_has_required_fields(self, client):
        data = client.get("/api/statistics").get_json()
        for key in ("total_flows", "normal_flows", "intrusion_flows",
                    "rule_detections", "ml_detections", "avg_latency_ms"):
            assert key in data, f"Missing key: {key}"


# ── /api/rules ────────────────────────────────────────────────────────────────
class TestRules:
    def test_rules_returns_200(self, client):
        resp = client.get("/api/rules")
        assert resp.status_code == 200

    def test_rules_returns_4_rules(self, client):
        data = client.get("/api/rules").get_json()
        assert len(data["rules"]) == 4

    def test_rules_have_required_keys(self, client):
        data = client.get("/api/rules").get_json()
        for rule in data["rules"]:
            assert "name" in rule
            assert "severity" in rule


# ── /api/simulate ─────────────────────────────────────────────────────────────
class TestSimulate:
    def test_simulate_normal(self, client):
        resp = client.post("/api/simulate",
                           data=json.dumps({"scenario": "normal", "count": 2}),
                           content_type="application/json")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["count"] == 2

    def test_simulate_port_scan(self, client):
        resp = client.post("/api/simulate",
                           data=json.dumps({"scenario": "port_scan", "count": 1}),
                           content_type="application/json")
        assert resp.status_code == 200

    def test_simulate_invalid_scenario(self, client):
        resp = client.post("/api/simulate",
                           data=json.dumps({"scenario": "invalid_xyz"}),
                           content_type="application/json")
        assert resp.status_code == 400

    def test_simulate_full(self, client):
        resp = client.post("/api/simulate",
                           data=json.dumps({"scenario": "full"}),
                           content_type="application/json")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["count"] > 0


# ── /api/dataset ─────────────────────────────────────────────────────────────
class TestDataset:
    SAMPLE_CSV = "duration,src_bytes,dst_bytes,label\n5.0,900,700,NORMAL\n0.3,40,20,INTRUSION\n"

    def test_validate_dataset(self, client):
        resp = client.post("/api/dataset/validate",
                           data=json.dumps({"csv_text": self.SAMPLE_CSV}),
                           content_type="application/json")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "valid"
        assert data["total_rows"] == 2
        assert "duration" in data["columns"]

    def test_evaluate_dataset(self, client):
        resp = client.post("/api/dataset/evaluate",
                           data=json.dumps({"csv_text": self.SAMPLE_CSV}),
                           content_type="application/json")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["counts"]["total"] == 2
        assert "metrics" in data
        assert len(data["predictions"]) == 2

    def test_triage_alert(self, client):
        # Insert a test intrusion to get an alert ID
        client.post("/api/predict",
                    data=json.dumps({"duration": 0.2, "src_bytes": 10.0, "dst_bytes": 10.0}),
                    content_type="application/json")
        alerts = client.get("/api/alerts?limit=1").get_json()["alerts"]
        assert len(alerts) > 0
        alert_id = alerts[0]["id"]

        resp = client.put(f"/api/alerts/{alert_id}/triage",
                          data=json.dumps({"triage_status": "ACKNOWLEDGED"}),
                          content_type="application/json")
        assert resp.status_code == 200
        assert resp.get_json()["triage_status"] == "ACKNOWLEDGED"

