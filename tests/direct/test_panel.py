"""
Direct tests for AIHiringPanelProtocol contract state transitions.

These tests verify contract logic by importing and calling methods directly,
bypassing GenLayer's GenVM execution environment. They cover:
- create_panel: storage and manager index
- open_panel: status transition and access control
- submit_application: storage, panel index, candidate index
- get_all_panels: iterates all stored panels
- get_panels_by_manager: manager index lookup
- get_applications_by_candidate: candidate index lookup
"""

import json
import sys
import types
from unittest.mock import MagicMock, patch

import pytest


# ── GenLayer stub ────────────────────────────────────────────────────────────

def _make_gl_stub():
    """Build a minimal stub for the `genlayer` module."""
    gl = types.ModuleType("genlayer")

    # Numeric types
    class _UInt:
        def __init__(self, v=0):
            self._v = int(v)
        def __int__(self):
            return self._v
        def __index__(self):
            return self._v
        def __eq__(self, other):
            return self._v == int(other)
        def __hash__(self):
            return hash(self._v)
        def __lt__(self, other):
            return self._v < int(other)
        def __repr__(self):
            return str(self._v)

    class u32(_UInt): pass
    class u64(_UInt): pass
    class Address:
        def __init__(self, hex_str="0x0000000000000000000000000000000000000000"):
            self._hex = hex_str.lower()
        @property
        def as_hex(self):
            return self._hex

    # TreeMap — a dict that supports `in` and subscript access
    class TreeMap(dict):
        pass

    # Contract base — auto-initialize annotated storage fields on instantiation
    class Contract:
        def __new__(cls, *args, **kwargs):
            obj = super().__new__(cls)
            for klass in reversed(cls.__mro__):
                for name, ann in getattr(klass, "__annotations__", {}).items():
                    if hasattr(obj, name):
                        continue
                    origin = getattr(ann, "__origin__", ann)
                    if origin is TreeMap:
                        setattr(obj, name, TreeMap())
                    elif ann is u32:
                        setattr(obj, name, u32(0))
                    elif ann is u64:
                        setattr(obj, name, u64(0))
            return obj

    # Public decorator stubs
    class _Public:
        @staticmethod
        def write(fn):
            return fn
        @staticmethod
        def view(fn):
            return fn

    public = _Public()

    # Message context
    message = MagicMock()
    message.sender_address = Address("0xabcdef1234567890abcdef1234567890abcdef12")

    # vm stub for UserError
    vm = MagicMock()
    vm.UserError = Exception

    gl.Contract = Contract
    gl.public = public
    gl.message = message
    gl.vm = vm
    gl.nondet = MagicMock()

    # Install into sys.modules so `from genlayer import *` resolves
    sys.modules["genlayer"] = gl
    gl.u32 = u32
    gl.u64 = u64
    gl.Address = Address
    gl.TreeMap = TreeMap

    # Patch builtins so `from genlayer import *` exposes these
    gl.__all__ = ["u32", "u64", "Address", "TreeMap", "gl"]
    gl.gl = gl

    return gl, u32, u64, Address, TreeMap


GL, u32, u64, Address, TreeMap = _make_gl_stub()


# ── Load contract ────────────────────────────────────────────────────────────

# Patch built-in TreeMap/u32/u64 names into the contract's namespace
import builtins

_orig_import = builtins.__import__

def _patched_import(name, *args, **kwargs):
    if name == "genlayer":
        return sys.modules["genlayer"]
    return _orig_import(name, *args, **kwargs)

builtins.__import__ = _patched_import

# Make TreeMap, u32, u64, Address available at module level for `from genlayer import *`
import importlib, importlib.util, pathlib

spec = importlib.util.spec_from_file_location(
    "ai_hiring_panel",
    pathlib.Path(__file__).parent.parent.parent / "contract" / "ai_hiring_panel.py",
)
mod = importlib.util.module_from_spec(spec)
# Inject stubs into module globals before exec
mod.gl = GL
mod.u32 = u32
mod.u64 = u64
mod.TreeMap = TreeMap
mod.Address = Address
spec.loader.exec_module(mod)

builtins.__import__ = _orig_import

AIHiringPanelProtocol = mod.AIHiringPanelProtocol


# ── Helpers ──────────────────────────────────────────────────────────────────

MANAGER = "0xabcdef1234567890abcdef1234567890abcdef12"
CANDIDATE_1 = "0x1111111111111111111111111111111111111111"
CANDIDATE_2 = "0x2222222222222222222222222222222222222222"

MUST_HAVE = json.dumps(["Python", "3+ years experience"])
NICE_TO_HAVE = json.dumps(["Go", "Kubernetes"])
EVAL_WEIGHTS = json.dumps({"technical": 40, "communication": 30, "experience": 30})

def _set_sender(address: str):
    GL.message.sender_address = Address(address)

def _new_contract() -> AIHiringPanelProtocol:
    _set_sender(MANAGER)
    c = AIHiringPanelProtocol()
    return c

def _create_open_panel(c: AIHiringPanelProtocol) -> int:
    c.create_panel(
        "Acme Corp", "Senior Python Engineer",
        "Build distributed systems for our platform.",
        MUST_HAVE, NICE_TO_HAVE, EVAL_WEIGHTS,
        "We value autonomy and craft.",
        u64(2), u64(1800000000), u64(86400),
    )
    panel_id = int(c.panel_count) - 1
    _set_sender(MANAGER)
    c.open_panel(u64(panel_id))
    return panel_id

def _submit_app(c: AIHiringPanelProtocol, panel_id: int, candidate: str, handle: str) -> int:
    _set_sender(candidate)
    c.submit_application(
        u64(panel_id), handle,
        f"Experienced Python dev with 5 years in distributed systems.",
        f"https://portfolio.example/{handle}",
        f"https://github.com/{handle}",
        json.dumps([f"https://ref.example/{handle}"]),
        json.dumps([f"https://sample.example/{handle}"]),
        "I communicate clearly and document my decisions.",
        "My skills match the must-haves exactly.",
        json.dumps([f"https://evidence.example/{handle}"]),
    )
    return int(c.application_count) - 1


# ── Tests ────────────────────────────────────────────────────────────────────

class TestCreatePanel:
    def test_creates_panel_in_storage(self):
        c = _new_contract()
        c.create_panel(
            "Acme Corp", "Backend Engineer",
            "Build APIs.", MUST_HAVE, NICE_TO_HAVE, EVAL_WEIGHTS,
            "We value craftsmanship.", u64(1), u64(1800000000), u64(86400),
        )
        assert int(c.panel_count) == 1
        panel = json.loads(c.panels[u32(0)])
        assert panel["organisation_name"] == "Acme Corp"
        assert panel["role_title"] == "Backend Engineer"
        assert panel["status"] == "draft"
        assert panel["manager"] == MANAGER

    def test_increments_panel_count_each_call(self):
        c = _new_contract()
        for i in range(3):
            c.create_panel(
                f"Org {i}", f"Role {i}", "Summary.",
                MUST_HAVE, NICE_TO_HAVE, EVAL_WEIGHTS,
                "Values.", u64(1), u64(1800000000), u64(86400),
            )
        assert int(c.panel_count) == 3

    def test_indexes_panel_under_manager_address(self):
        c = _new_contract()
        c.create_panel(
            "Acme", "Role", "Summary.", MUST_HAVE, NICE_TO_HAVE, EVAL_WEIGHTS,
            "Values.", u64(1), u64(1800000000), u64(86400),
        )
        ids = json.loads(c.manager_panels[MANAGER])
        assert 0 in ids

    def test_parses_json_arrays_in_requirements(self):
        c = _new_contract()
        c.create_panel(
            "Acme", "Role", "Summary.",
            json.dumps(["Python", "SQL"]),
            json.dumps(["Go"]),
            EVAL_WEIGHTS,
            "Values.", u64(1), u64(1800000000), u64(86400),
        )
        panel = json.loads(c.panels[u32(0)])
        assert panel["must_have_requirements"] == ["Python", "SQL"]
        assert panel["nice_to_have_requirements"] == ["Go"]


class TestOpenPanel:
    def test_transitions_draft_to_open(self):
        c = _new_contract()
        c.create_panel(
            "Acme", "Role", "Desc.", MUST_HAVE, NICE_TO_HAVE, EVAL_WEIGHTS,
            "Values.", u64(1), u64(1800000000), u64(86400),
        )
        _set_sender(MANAGER)
        c.open_panel(u64(0))
        panel = json.loads(c.panels[u32(0)])
        assert panel["status"] == "open"

    def test_rejects_non_manager(self):
        c = _new_contract()
        c.create_panel(
            "Acme", "Role", "Desc.", MUST_HAVE, NICE_TO_HAVE, EVAL_WEIGHTS,
            "Values.", u64(1), u64(1800000000), u64(86400),
        )
        _set_sender(CANDIDATE_1)
        with pytest.raises((AssertionError, Exception)):
            c.open_panel(u64(0))

    def test_rejects_already_open_panel(self):
        c = _new_contract()
        c.create_panel(
            "Acme", "Role", "Desc.", MUST_HAVE, NICE_TO_HAVE, EVAL_WEIGHTS,
            "Values.", u64(1), u64(1800000000), u64(86400),
        )
        _set_sender(MANAGER)
        c.open_panel(u64(0))
        with pytest.raises((AssertionError, Exception)):
            c.open_panel(u64(0))

    def test_rejects_missing_panel(self):
        c = _new_contract()
        _set_sender(MANAGER)
        with pytest.raises((AssertionError, Exception, KeyError)):
            c.open_panel(u64(999))


class TestSubmitApplication:
    def test_stores_application_in_both_indexes(self):
        c = _new_contract()
        panel_id = _create_open_panel(c)
        app_id = _submit_app(c, panel_id, CANDIDATE_1, "alice")

        app = json.loads(c.applications[u32(app_id)])
        assert app["name_or_handle"] == "alice"
        assert app["candidate"] == CANDIDATE_1
        assert app["panel_id"] == panel_id

        # Panel index
        panel_app_ids = json.loads(c.panel_applications[u32(panel_id)])
        assert app_id in panel_app_ids

        # Candidate index
        cand_app_ids = json.loads(c.candidate_applications[CANDIDATE_1])
        assert app_id in cand_app_ids

    def test_rejects_application_to_closed_panel(self):
        c = _new_contract()
        panel_id = _create_open_panel(c)
        _set_sender(MANAGER)
        c.close_applications(u64(panel_id))
        with pytest.raises((AssertionError, Exception)):
            _submit_app(c, panel_id, CANDIDATE_1, "alice")

    def test_multiple_candidates_tracked_separately(self):
        c = _new_contract()
        panel_id = _create_open_panel(c)
        _submit_app(c, panel_id, CANDIDATE_1, "alice")
        _submit_app(c, panel_id, CANDIDATE_2, "bob")

        assert int(c.application_count) == 2
        ids1 = json.loads(c.candidate_applications[CANDIDATE_1])
        ids2 = json.loads(c.candidate_applications[CANDIDATE_2])
        assert ids1 != ids2
        assert len(ids1) == 1
        assert len(ids2) == 1

    def test_parses_evidence_url_arrays(self):
        c = _new_contract()
        panel_id = _create_open_panel(c)
        _submit_app(c, panel_id, CANDIDATE_1, "alice")
        app = json.loads(c.applications[u32(0)])
        assert isinstance(app["evidence_urls"], list)
        assert app["evidence_urls"][0].startswith("https://")


class TestGetAllPanels:
    def test_returns_empty_list_initially(self):
        c = _new_contract()
        result = json.loads(c.get_all_panels())
        assert result == []

    def test_returns_all_created_panels(self):
        c = _new_contract()
        for i in range(3):
            c.create_panel(
                f"Org {i}", f"Role {i}", "Desc.",
                MUST_HAVE, NICE_TO_HAVE, EVAL_WEIGHTS,
                "Values.", u64(1), u64(1800000000), u64(86400),
            )
        panels = json.loads(c.get_all_panels())
        assert len(panels) == 3
        titles = [p["role_title"] for p in panels]
        assert "Role 0" in titles
        assert "Role 2" in titles


class TestGetPanelsByManager:
    def test_returns_panels_for_manager(self):
        c = _new_contract()
        c.create_panel(
            "Acme", "Role A", "Desc.", MUST_HAVE, NICE_TO_HAVE, EVAL_WEIGHTS,
            "Values.", u64(1), u64(1800000000), u64(86400),
        )
        c.create_panel(
            "Acme", "Role B", "Desc.", MUST_HAVE, NICE_TO_HAVE, EVAL_WEIGHTS,
            "Values.", u64(1), u64(1800000000), u64(86400),
        )
        panels = json.loads(c.get_panels_by_manager(MANAGER))
        assert len(panels) == 2

    def test_returns_empty_for_unknown_manager(self):
        c = _new_contract()
        result = json.loads(c.get_panels_by_manager("0x0000000000000000000000000000000000000000"))
        assert result == []

    def test_does_not_return_other_managers_panels(self):
        c = _new_contract()
        c.create_panel(
            "Acme", "Role", "Desc.", MUST_HAVE, NICE_TO_HAVE, EVAL_WEIGHTS,
            "Values.", u64(1), u64(1800000000), u64(86400),
        )
        result = json.loads(c.get_panels_by_manager(CANDIDATE_1))
        assert result == []


class TestGetApplicationsByCandidate:
    def test_returns_applications_for_candidate(self):
        c = _new_contract()
        panel_id = _create_open_panel(c)
        _submit_app(c, panel_id, CANDIDATE_1, "alice")
        apps = json.loads(c.get_applications_by_candidate(CANDIDATE_1))
        assert len(apps) == 1
        assert apps[0]["name_or_handle"] == "alice"

    def test_returns_empty_for_non_applicant(self):
        c = _new_contract()
        result = json.loads(c.get_applications_by_candidate(CANDIDATE_2))
        assert result == []

    def test_candidate_can_apply_to_multiple_panels(self):
        c = _new_contract()
        pid1 = _create_open_panel(c)
        _set_sender(MANAGER)
        c.create_panel(
            "Beta Corp", "Frontend Engineer", "Build UIs.",
            MUST_HAVE, NICE_TO_HAVE, EVAL_WEIGHTS,
            "Values.", u64(1), u64(1800000000), u64(86400),
        )
        pid2 = int(c.panel_count) - 1
        _set_sender(MANAGER)
        c.open_panel(u64(pid2))

        _submit_app(c, pid1, CANDIDATE_1, "alice")
        _submit_app(c, pid2, CANDIDATE_1, "alice")

        apps = json.loads(c.get_applications_by_candidate(CANDIDATE_1))
        assert len(apps) == 2
