# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json
from datetime import datetime, timezone


class AIHiringPanelProtocol(gl.Contract):
    panels: TreeMap[u64, str]
    applications: TreeMap[u64, str]
    rankings: TreeMap[u64, str]
    appeals: TreeMap[u64, str]
    panel_applications: TreeMap[u64, str]
    candidate_applications: TreeMap[str, str]
    manager_panels: TreeMap[str, str]
    panel_count: u64
    application_count: u64

    def __init__(self) -> None:
        self.panel_count = u64(0)
        self.application_count = u64(0)

    # ── Write methods ────────────────────────────────────────────────────────

    @gl.public.write
    def create_panel(
        self,
        organisation_name: str,
        role_title: str,
        role_summary: str,
        must_have_requirements: str,
        nice_to_have_requirements: str,
        evaluation_weights: str,
        culture_values: str,
        minimum_evidence_required: u64,
        application_deadline: u64,
        appeal_window: u64,
    ) -> None:
        panel_id = self.panel_count
        self.panel_count = u64(int(self.panel_count) + 1)
        manager = gl.message.sender_address.as_hex
        panel = {
            "panel_id": int(panel_id),
            "manager": manager,
            "organisation_name": organisation_name,
            "role_title": role_title,
            "role_summary": role_summary,
            "must_have_requirements": json.loads(must_have_requirements),
            "nice_to_have_requirements": json.loads(nice_to_have_requirements),
            "evaluation_weights": json.loads(evaluation_weights),
            "culture_values": culture_values,
            "minimum_evidence_required": int(minimum_evidence_required),
            "application_deadline": int(application_deadline),
            "appeal_window": int(appeal_window),
            "status": "draft",
            "created_at": int(datetime.now(timezone.utc).timestamp()),
        }
        self.panels[panel_id] = json.dumps(panel)
        key = manager
        existing = json.loads(self.manager_panels[key]) if key in self.manager_panels else []
        existing.append(int(panel_id))
        self.manager_panels[key] = json.dumps(existing)

    @gl.public.write
    def open_panel(self, panel_id: u64) -> None:
        assert panel_id in self.panels, "panel not found"
        panel = json.loads(self.panels[panel_id])
        assert panel["manager"] == gl.message.sender_address.as_hex, "not manager"
        assert panel["status"] == "draft", "not draft"
        panel["status"] = "open"
        self.panels[panel_id] = json.dumps(panel)

    @gl.public.write
    def close_applications(self, panel_id: u64) -> None:
        assert panel_id in self.panels, "panel not found"
        panel = json.loads(self.panels[panel_id])
        assert panel["manager"] == gl.message.sender_address.as_hex, "not manager"
        assert panel["status"] == "open", "not open"
        panel["status"] = "closed"
        self.panels[panel_id] = json.dumps(panel)

    @gl.public.write
    def cancel_panel(self, panel_id: u64) -> None:
        assert panel_id in self.panels, "panel not found"
        panel = json.loads(self.panels[panel_id])
        assert panel["manager"] == gl.message.sender_address.as_hex, "not manager"
        assert panel["status"] in ("draft", "open"), "cannot cancel"
        panel["status"] = "cancelled"
        self.panels[panel_id] = json.dumps(panel)

    @gl.public.write
    def submit_application(
        self,
        panel_id: u64,
        name_or_handle: str,
        resume_summary: str,
        portfolio_url: str,
        github_url: str,
        reference_urls: str,
        work_sample_urls: str,
        communication_statement: str,
        role_fit_statement: str,
        evidence_urls: str,
    ) -> None:
        assert panel_id in self.panels, "panel not found"
        panel = json.loads(self.panels[panel_id])
        assert panel["status"] == "open", "applications closed"
        candidate = gl.message.sender_address.as_hex
        app_id = self.application_count
        self.application_count = u64(int(self.application_count) + 1)
        app = {
            "application_id": int(app_id),
            "panel_id": int(panel_id),
            "candidate": candidate,
            "name_or_handle": name_or_handle,
            "resume_summary": resume_summary,
            "portfolio_url": portfolio_url,
            "github_url": github_url,
            "reference_urls": json.loads(reference_urls),
            "work_sample_urls": json.loads(work_sample_urls),
            "communication_statement": communication_statement,
            "role_fit_statement": role_fit_statement,
            "evidence_urls": json.loads(evidence_urls),
            "status": "submitted",
            "submitted_at": int(datetime.now(timezone.utc).timestamp()),
        }
        self.applications[app_id] = json.dumps(app)
        pa_key = panel_id
        panel_apps = json.loads(self.panel_applications[pa_key]) if pa_key in self.panel_applications else []
        panel_apps.append(int(app_id))
        self.panel_applications[pa_key] = json.dumps(panel_apps)
        ca_key = candidate
        cand_apps = json.loads(self.candidate_applications[ca_key]) if ca_key in self.candidate_applications else []
        cand_apps.append(int(app_id))
        self.candidate_applications[ca_key] = json.dumps(cand_apps)

    @gl.public.write
    def revise_application(
        self,
        application_id: u64,
        name_or_handle: str,
        resume_summary: str,
        portfolio_url: str,
        github_url: str,
        reference_urls: str,
        work_sample_urls: str,
        communication_statement: str,
        role_fit_statement: str,
        evidence_urls: str,
    ) -> None:
        assert application_id in self.applications, "application not found"
        app = json.loads(self.applications[application_id])
        assert app["candidate"] == gl.message.sender_address.as_hex, "not applicant"
        assert app["status"] == "submitted", "cannot revise"
        panel = json.loads(self.panels[u64(app["panel_id"])])
        assert panel["status"] == "open", "panel not open"
        app["name_or_handle"] = name_or_handle
        app["resume_summary"] = resume_summary
        app["portfolio_url"] = portfolio_url
        app["github_url"] = github_url
        app["reference_urls"] = json.loads(reference_urls)
        app["work_sample_urls"] = json.loads(work_sample_urls)
        app["communication_statement"] = communication_statement
        app["role_fit_statement"] = role_fit_statement
        app["evidence_urls"] = json.loads(evidence_urls)
        self.applications[application_id] = json.dumps(app)

    @gl.public.write
    def request_ranking(self, panel_id: u64) -> None:
        assert panel_id in self.panels, "panel not found"
        panel = json.loads(self.panels[panel_id])
        assert panel["manager"] == gl.message.sender_address.as_hex, "not manager"
        assert panel["status"] == "closed", "applications not closed"

        pa_key = panel_id
        app_ids = json.loads(self.panel_applications[pa_key]) if pa_key in self.panel_applications else []
        apps = []
        for aid in app_ids:
            a = json.loads(self.applications[u64(aid)])
            apps.append(a)

        weights = panel.get("evaluation_weights", {})
        prompt = (
            "You are an expert hiring panel evaluating candidates for the following role.\n\n"
            f"Organisation: {panel['organisation_name']}\n"
            f"Role: {panel['role_title']}\n"
            f"Summary: {panel['role_summary']}\n"
            f"Must-have requirements: {json.dumps(panel['must_have_requirements'])}\n"
            f"Nice-to-have requirements: {json.dumps(panel['nice_to_have_requirements'])}\n"
            f"Culture values: {panel['culture_values']}\n"
            f"Evaluation weights: {json.dumps(weights)}\n\n"
            "Candidate applications:\n"
        )
        for a in apps:
            prompt += (
                f"\nCandidate ID {a['application_id']}:\n"
                f"  Name/Handle: {a['name_or_handle']}\n"
                f"  Resume summary: {a['resume_summary']}\n"
                f"  Role fit: {a['role_fit_statement']}\n"
                f"  Communication: {a['communication_statement']}\n"
                f"  Evidence URLs: {json.dumps(a['evidence_urls'])}\n"
            )
        prompt += (
            "\nReturn a JSON object with this exact structure (no markdown, no extra text):\n"
            '{"rankings": [{"application_id": <int>, "rank": <int starting at 1>, '
            '"verdict": <"strong_yes"|"yes"|"maybe"|"no">, '
            '"technical_band": <"exceptional"|"strong"|"good"|"developing"|"insufficient">, '
            '"communication_band": <same options>, '
            '"experience_band": <same options>, '
            '"role_alignment_band": <same options>, '
            '"evidence_strength_band": <same options>, '
            '"culture_fit_band": <same options>, '
            '"overall_score": <0-100>, '
            '"confidence": <"high"|"medium"|"low">, '
            '"reasoning": <string>, '
            '"flags": [<string>]}]}\n'
            "Rank all candidates. Do not omit any. Use only the allowed values for enum fields."
        )

        def parse_ranking(raw: str) -> list:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start == -1 or end == 0:
                return []
            parsed = json.loads(raw[start:end])
            rankings = parsed.get("rankings", [])
            normalized = sorted(rankings, key=lambda x: x.get("rank", 999))
            for r in normalized:
                r["application_id"] = int(r.get("application_id", 0))
                r["rank"] = int(r.get("rank", 0))
                r["overall_score"] = int(r.get("overall_score", 0))
                r["verdict"] = str(r.get("verdict", "maybe"))
                r["technical_band"] = str(r.get("technical_band", "developing"))
                r["communication_band"] = str(r.get("communication_band", "developing"))
                r["experience_band"] = str(r.get("experience_band", "developing"))
                r["role_alignment_band"] = str(r.get("role_alignment_band", "developing"))
                r["evidence_strength_band"] = str(r.get("evidence_strength_band", "developing"))
                r["culture_fit_band"] = str(r.get("culture_fit_band", "developing"))
                r["confidence"] = str(r.get("confidence", "medium"))
                r["reasoning"] = str(r.get("reasoning", ""))
                r["flags"] = [str(f) for f in r.get("flags", [])]
            return normalized

        def leader_fn() -> str:
            raw = gl.nondet.exec_prompt(prompt)
            rankings = parse_ranking(raw)
            return json.dumps({"rankings": rankings}, sort_keys=True)

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            leader_data = json.loads(leader_result.calldata)
            leader_order = [r["application_id"] for r in leader_data.get("rankings", [])]
            # Re-run LLM independently and compare only rank order
            val_raw = gl.nondet.exec_prompt(prompt)
            val_rankings = parse_ranking(val_raw)
            val_order = [r["application_id"] for r in val_rankings]
            return leader_order == val_order

        result_str = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        result = json.loads(result_str)
        ranking = {
            "panel_id": int(panel_id),
            "rankings": result.get("rankings", []),
            "status": "final",
            "created_at": int(datetime.now(timezone.utc).timestamp()),
        }
        self.rankings[panel_id] = json.dumps(ranking)
        panel["status"] = "ranked"
        self.panels[panel_id] = json.dumps(panel)

    @gl.public.write
    def file_appeal(
        self,
        panel_id: u64,
        basis: str,
        statement: str,
        evidence_urls: str,
    ) -> None:
        assert panel_id in self.panels, "panel not found"
        panel = json.loads(self.panels[panel_id])
        assert panel["status"] == "ranked", "not ranked"
        candidate = gl.message.sender_address.as_hex
        appeal = {
            "panel_id": int(panel_id),
            "appellant": candidate,
            "basis": basis,
            "statement": statement,
            "evidence_urls": json.loads(evidence_urls),
            "status": "pending",
            "filed_at": int(datetime.now(timezone.utc).timestamp()),
            "verdict": "",
            "reasoning": "",
        }
        self.appeals[panel_id] = json.dumps(appeal)
        panel["status"] = "appeal_pending"
        self.panels[panel_id] = json.dumps(panel)

    @gl.public.write
    def request_appeal_review(self, panel_id: u64) -> None:
        assert panel_id in self.panels, "panel not found"
        panel = json.loads(self.panels[panel_id])
        assert panel["manager"] == gl.message.sender_address.as_hex, "not manager"
        assert panel["status"] == "appeal_pending", "no pending appeal"
        assert panel_id in self.appeals, "appeal not found"
        appeal = json.loads(self.appeals[panel_id])
        ranking = json.loads(self.rankings[panel_id]) if panel_id in self.rankings else {}

        prompt = (
            "You are an independent appeal reviewer for a hiring panel.\n\n"
            f"Role: {panel['role_title']} at {panel['organisation_name']}\n"
            f"Appeal basis: {appeal['basis']}\n"
            f"Appellant statement: {appeal['statement']}\n"
            f"Original ranking: {json.dumps(ranking.get('rankings', []))}\n"
            f"Appeal evidence URLs: {json.dumps(appeal['evidence_urls'])}\n\n"
            "Evaluate whether the appeal has merit. Return JSON:\n"
            '{"verdict": <"upheld"|"dismissed">, "reasoning": <string>}'
        )

        def appeal_leader_fn() -> str:
            raw = gl.nondet.exec_prompt(prompt)
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start == -1 or end == 0:
                return json.dumps({"verdict": "dismissed", "reasoning": "Parse error"}, sort_keys=True)
            parsed = json.loads(raw[start:end])
            return json.dumps({
                "verdict": str(parsed.get("verdict", "dismissed")),
                "reasoning": str(parsed.get("reasoning", "")),
            }, sort_keys=True)

        def appeal_validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            leader_data = json.loads(leader_result.calldata)
            val_raw = gl.nondet.exec_prompt(prompt)
            start = val_raw.find("{")
            end = val_raw.rfind("}") + 1
            if start == -1 or end == 0:
                return False
            val_data = json.loads(val_raw[start:end])
            # Only compare the verdict decision, not the reasoning text
            return str(val_data.get("verdict", "dismissed")) == leader_data.get("verdict")

        result_str = gl.vm.run_nondet_unsafe(appeal_leader_fn, appeal_validator_fn)
        result = json.loads(result_str)
        appeal["verdict"] = result.get("verdict", "dismissed")
        appeal["reasoning"] = result.get("reasoning", "")
        appeal["status"] = "reviewed"
        self.appeals[panel_id] = json.dumps(appeal)
        panel["status"] = "appeal_reviewed"
        self.panels[panel_id] = json.dumps(panel)

    @gl.public.write
    def finalize_ranking(self, panel_id: u64) -> None:
        assert panel_id in self.panels, "panel not found"
        panel = json.loads(self.panels[panel_id])
        assert panel["manager"] == gl.message.sender_address.as_hex, "not manager"
        assert panel["status"] in ("ranked", "appeal_reviewed"), "not ready to finalize"
        panel["status"] = "finalized"
        self.panels[panel_id] = json.dumps(panel)

    # ── View methods ─────────────────────────────────────────────────────────

    @gl.public.view
    def get_panel(self, panel_id: u64) -> str:
        if panel_id not in self.panels:
            return "null"
        return self.panels[panel_id]

    @gl.public.view
    def get_application(self, application_id: u64) -> str:
        if application_id not in self.applications:
            return "null"
        return self.applications[application_id]

    @gl.public.view
    def get_panel_applications(self, panel_id: u64) -> str:
        pa_key = panel_id
        if pa_key not in self.panel_applications:
            return "[]"
        app_ids = json.loads(self.panel_applications[pa_key])
        result = []
        for aid in app_ids:
            uid = u64(aid)
            if uid in self.applications:
                result.append(json.loads(self.applications[uid]))
        return json.dumps(result)

    @gl.public.view
    def get_ranking_result(self, panel_id: u64) -> str:
        if panel_id not in self.rankings:
            return "null"
        return self.rankings[panel_id]

    @gl.public.view
    def get_appeal(self, panel_id: u64) -> str:
        if panel_id not in self.appeals:
            return "null"
        return self.appeals[panel_id]

    @gl.public.view
    def get_panels_by_manager(self, manager_address: str) -> str:
        key = manager_address
        if key not in self.manager_panels:
            return "[]"
        panel_ids = json.loads(self.manager_panels[key])
        result = []
        for pid in panel_ids:
            uid = u64(pid)
            if uid in self.panels:
                result.append(json.loads(self.panels[uid]))
        return json.dumps(result)

    @gl.public.view
    def get_applications_by_candidate(self, candidate_address: str) -> str:
        key = candidate_address
        if key not in self.candidate_applications:
            return "[]"
        app_ids = json.loads(self.candidate_applications[key])
        result = []
        for aid in app_ids:
            uid = u64(aid)
            if uid in self.applications:
                result.append(json.loads(self.applications[uid]))
        return json.dumps(result)

    @gl.public.view
    def get_all_panels(self) -> str:
        result = []
        i = u64(0)
        count = self.panel_count
        while int(i) < int(count):
            if i in self.panels:
                result.append(json.loads(self.panels[i]))
            i = u64(int(i) + 1)
        return json.dumps(result)
