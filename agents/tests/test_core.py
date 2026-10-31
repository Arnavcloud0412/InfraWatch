import unittest

from app.classification import classify
from app.correlation import correlate, may_link_after_agent
from app.evidence import clamp_recommendation
from app.fallback import fallback_assessment


class ClassificationTests(unittest.TestCase):
    def test_expressway_stays_tier_one(self):
        result = classify("expressway", "A new expressway corridor will connect two districts.")
        self.assertEqual(result["baseline_criticality_tier"], 1)
        self.assertEqual(result["proposed_criticality_tier"], 1)
        self.assertGreater(result["contextual_criticality_score"], 30)

    def test_landscaping_is_downgraded(self):
        result = classify("other", "Municipal garden beautification and fountain landscaping.")
        self.assertEqual(result["baseline_criticality_tier"], 5)
        self.assertLessEqual(result["contextual_criticality_score"], 30)
        self.assertEqual(result["proposed_criticality_tier"], 5)

    def test_deltas_are_clamped_inside_classify(self):
        result = classify(
            "hospital",
            "District hospital expansion",
            {"emergency_delta": 99, "connectivity_delta": -99},
        )
        self.assertLessEqual(result["contextual_factors"]["emergency"], 20)
        self.assertGreaterEqual(result["contextual_factors"]["connectivity"], 0)


class CorrelationTests(unittest.TestCase):
    def test_clear_repeat_links_without_merging_fields(self):
        existing = [
            {
                "id": "p1",
                "project_name": "Kalyan Badlapur Elevated Connector",
                "district": "Thane",
                "infrastructure_category": "expressway",
            }
        ]
        result = correlate(
            {
                "project_name": "Kalyan Badlapur Elevated Connector phase",
                "district": "Thane",
                "infrastructure_category": "expressway",
            },
            existing,
        )
        self.assertEqual(result["linked_project_id"], "p1")
        self.assertFalse(result["auto_merged"])

    def test_ambiguous_pair_is_not_linked_until_the_agent_agrees(self):
        existing = [
            {
                "id": "p2",
                "project_name": "Nashik Water Treatment Stage",
                "district": "Nashik",
                "infrastructure_category": "utilities",
            }
        ]
        result = correlate(
            {
                "project_name": "Nashik Treatment Plant Expansion",
                "district": "Nashik",
                "infrastructure_category": "utilities",
            },
            existing,
        )
        self.assertIsNone(result["linked_project_id"])
        self.assertTrue(result["ambiguous"])
        linked = may_link_after_agent(
            result,
            {"same_project": False, "ambiguous": True, "confidence": 0.9},
            {"infrastructure_category": "bridge"},
            existing,
        )
        self.assertIsNone(linked)


class FallbackTests(unittest.TestCase):
    def test_negated_budget_is_not_a_budget_event(self):
        result = fallback_assessment(
            "Nashik district road widening",
            "Maharashtra Nashik announces widening of a district road. The work is proposed. No budget is stated.",
            "manual",
            [],
            "en",
        )
        self.assertTrue(result["relevant"])
        self.assertNotEqual(result["extraction"]["event_type"], "budget")
        self.assertIsNone(result["extraction"]["investment_amount"])


class EvidenceTests(unittest.TestCase):
    def test_agent_cannot_confirm_a_fact(self):
        state, notes = clamp_recommendation("officially_confirmed", 1)
        self.assertEqual(state, "under_verification")
        self.assertTrue(notes)

    def test_single_source_is_not_corroboration(self):
        state, _notes = clamp_recommendation("corroborated", 1)
        self.assertEqual(state, "under_verification")


if __name__ == "__main__":
    unittest.main()
