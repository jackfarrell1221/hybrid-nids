"""
routes/simulation.py — /api/simulate endpoint.

Why this exists:
  The attack simulator is an educational tool that lets the dashboard 
  trigger synthetic attack flows without real network activity. It is 
  a separate route so it can be disabled in production environments.
"""

from flask import Blueprint, request, jsonify

from backend.services.simulator import simulate_scenario, run_full_simulation, list_scenarios
from backend.models.model_manager import get_alert_db
from backend.utils.logger import get_logger

logger = get_logger("routes.simulation")

simulation_bp = Blueprint("simulation", __name__)


@simulation_bp.route("/api/simulate", methods=["POST"])
def simulate():
    """
    POST /api/simulate
    Runs a traffic simulation scenario.

    Body:
        { "scenario": "port_scan", "count": 3 }
        or
        { "scenario": "full" }
    """
    data = request.get_json(silent=True) or {}
    scenario = data.get("scenario", "normal")
    count    = int(data.get("count", 1))

    try:
        if scenario == "full":
            results = run_full_simulation()
        else:
            results = simulate_scenario(scenario, count)

        # Log all simulated flows for statistics
        db = get_alert_db()
        for r in results:
            db.log_flow(r)

        return jsonify({
            "scenario": scenario,
            "count":    len(results),
            "results":  results,
        }), 200

    except ValueError as exc:
        return jsonify({"error": str(exc), "available_scenarios": list_scenarios()}), 400
    except Exception as exc:
        logger.exception("Simulation error: %s", exc)
        return jsonify({"error": "Simulation failed.", "detail": str(exc)}), 500


@simulation_bp.route("/api/simulate/scenarios", methods=["GET"])
def scenarios():
    """GET /api/simulate/scenarios — list available scenario names."""
    return jsonify({"scenarios": list_scenarios()}), 200
