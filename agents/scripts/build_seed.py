"""Write the labelled synthetic demonstration workspace used by the dashboard."""

from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.classification import classify

NS = uuid.UUID("6f0c2a1e-0b3a-4f1a-9c1a-0a0a0a0a0a0a")
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "web" / "data" / "seed.json"


def uid(name: str) -> str:
    return str(uuid.uuid5(NS, name))


def main() -> None:
    projects = []
    sources = []
    events = []
    evidence = []
    review_logs = []

    def add_project(key: str, **fields):
        scored = classify(fields["infrastructure_category"], fields.pop("score_text"))
        project = {
            "id": uid(f"project:{key}"),
            "state": "Maharashtra",
            "latitude": fields.pop("latitude"),
            "longitude": fields.pop("longitude"),
            "coordinate_source": "city_centroid",
            "baseline_criticality_tier": scored["baseline_criticality_tier"],
            "contextual_criticality_score": scored["contextual_criticality_score"],
            "proposed_criticality_tier": scored["proposed_criticality_tier"],
            "classification_rationale": scored["classification_rationale"]
            + " Seeded for the prototype workspace. It is not an official classification.",
            "classification_method": scored["classification_method"],
            "classification_review_status": "proposed",
            "contextual_factors": scored["contextual_factors"],
            "investment_amount": fields.pop("investment_amount", None),
            "currency": fields.pop("currency", None),
            "investment_status": fields.pop("investment_status", None),
            "expected_completion_date": None,
            "completion_date_status": None,
            "record_origin": "demonstration",
            "synthetic": True,
            "created_at": fields.pop("created_at"),
            "updated_at": fields.pop("updated_at"),
        }
        project.update(fields)
        projects.append(project)
        return project

    def add_source(key: str, **fields):
        source = {
            "id": uid(f"source:{key}"),
            "content_hash": uid(f"hash:{key}").replace("-", ""),
            "full_text_retrieved": True,
        }
        source.update(fields)
        sources.append(source)
        return source

    def add_event(key: str, project_id: str, source_id: str, **fields):
        event = {
            "id": uid(f"event:{key}"),
            "project_id": project_id,
            "source_id": source_id,
            "event_date": None,
            "pipeline_mode": "illustrative_dataset",
            "created_at": fields.pop("created_at"),
        }
        event.update(fields)
        events.append(event)
        return event

    def add_evidence(key: str, event_id: str, source_id: str, kind: str, description: str, stance: str, review_status: str):
        evidence.append(
            {
                "id": uid(f"evidence:{key}"),
                "event_id": event_id,
                "source_id": source_id,
                "evidence_type": kind,
                "evidence_description": description,
                "supporting_or_conflicting": stance,
                "review_status": review_status,
            }
        )

    def add_review(key: str, event_id: str, action: str, notes: str, previous: str, new: str, created_at: str):
        review_logs.append(
            {
                "id": uid(f"review:{key}"),
                "event_id": event_id,
                "reviewer_action": action,
                "reviewer_notes": notes,
                "previous_status": previous,
                "new_status": new,
                "created_at": created_at,
            }
        )

    note = (
        "SYNTHETIC DEMONSTRATION. This text was written for the InfraWatch prototype. "
        "It is not an official notice, and the figures in it are not government claims."
    )

    kalyan = add_project(
        "kalyan",
        project_name="Kalyan–Badlapur Elevated Connector",
        description="Synthetic elevated-road proposal used to show an unverified expressway record. No official budget or opening date is attached.",
        district="Thane",
        location_name="Kalyan",
        latitude=19.2403,
        longitude=73.1305,
        infrastructure_category="expressway",
        lifecycle_status="proposed",
        reported_lifecycle_status="under_construction",
        score_text="A new expressway corridor is reported between Kalyan and Badlapur.",
        created_at="2026-10-20T08:30:00+00:00",
        updated_at="2026-10-20T08:30:00+00:00",
    )
    kalyan_source = add_source(
        "kalyan",
        source_url=None,
        title="Kalyan–Badlapur elevated connector announcement",
        publisher="Public bulletin",
        source_type="demonstration",
        language="en",
        published_at="2026-10-20T08:00:00+00:00",
        retrieved_at="2026-10-20T08:30:00+00:00",
        raw_content=note + " The bulletin says construction of an elevated connector in Thane district is underway. It gives no contract value.",
    )
    add_event(
        "kalyan",
        kalyan["id"],
        kalyan_source["id"],
        event_type="milestone",
        reported_claim="The submitted report states the elevated connector is under construction. That claim has not been reviewed.",
        extracted_data={"reported_lifecycle": "under_construction", "confidence": None, "synthetic": True},
        evidence_status="newly_detected",
        ai_recommended_status="newly_detected",
        recommendation_rationale="Single synthetic source. A model was not asked to confirm it.",
        created_at="2026-10-20T08:30:00+00:00",
    )
    add_evidence(
        "kalyan-missing",
        uid("event:kalyan"),
        kalyan_source["id"],
        "missing_evidence",
        "No official notification or second publisher is linked to this demonstration claim.",
        "insufficient",
        "pending",
    )

    wardha = add_project(
        "wardha",
        project_name="Wardha District Trauma Annexe",
        description="Synthetic emergency-care proposal. The recorded lifecycle stays proposed until a reviewer accepts a reported status.",
        district="Wardha",
        location_name="Wardha",
        latitude=20.7453,
        longitude=78.6022,
        infrastructure_category="emergency_healthcare",
        lifecycle_status="proposed",
        reported_lifecycle_status="approved",
        score_text="A district trauma and emergency care annexe is proposed for Wardha.",
        created_at="2026-10-21T10:00:00+00:00",
        updated_at="2026-10-22T11:00:00+00:00",
    )
    wardha_source = add_source(
        "wardha",
        source_url=None,
        title="Wardha trauma annexe announcement",
        publisher="Public bulletin",
        source_type="demonstration",
        language="en",
        published_at="2026-10-21T09:00:00+00:00",
        retrieved_at="2026-10-21T10:00:00+00:00",
        raw_content=note + " The note says a trauma annexe for Wardha has been approved. Approval is a claim inside the synthetic note, not an official order.",
    )
    add_event(
        "wardha",
        wardha["id"],
        wardha_source["id"],
        event_type="approval",
        reported_claim="The submitted report states the trauma annexe has been approved.",
        extracted_data={"reported_lifecycle": "approved", "synthetic": True},
        evidence_status="under_verification",
        ai_recommended_status="under_verification",
        recommendation_rationale="Held for a person to read. The pipeline cannot mark an approval as official.",
        created_at="2026-10-22T11:00:00+00:00",
    )
    add_evidence(
        "wardha-missing",
        uid("event:wardha"),
        wardha_source["id"],
        "missing_evidence",
        "An official sanction order is not in the workspace.",
        "insufficient",
        "pending",
    )

    ratnagiri = add_project(
        "ratnagiri",
        project_name="Ratnagiri Feeder Strengthening",
        description="Synthetic utility work. A demonstration review accepted the reported tendering status. That acceptance is not an official confirmation.",
        district="Ratnagiri",
        location_name="Ratnagiri",
        latitude=16.9902,
        longitude=73.312,
        infrastructure_category="utilities",
        lifecycle_status="tendering",
        reported_lifecycle_status="tendering",
        score_text="Electrical feeder strengthening is being tendered in Ratnagiri.",
        created_at="2026-10-18T06:00:00+00:00",
        updated_at="2026-10-19T09:15:00+00:00",
    )
    ratnagiri_source = add_source(
        "ratnagiri",
        source_url=None,
        title="Ratnagiri feeder package announcement",
        publisher="Public bulletin",
        source_type="demonstration",
        language="en",
        published_at="2026-10-18T05:00:00+00:00",
        retrieved_at="2026-10-18T06:00:00+00:00",
        raw_content=note + " The note says a feeder-strengthening package in Ratnagiri is at tender stage.",
    )
    add_event(
        "ratnagiri",
        ratnagiri["id"],
        ratnagiri_source["id"],
        event_type="tender",
        reported_claim="The submitted report states the Ratnagiri feeder package is at tender stage.",
        extracted_data={"reported_lifecycle": "tendering", "synthetic": True},
        evidence_status="corroborated",
        ai_recommended_status="under_verification",
        recommendation_rationale="Automated review left this as under verification because one publisher is not corroboration. A demonstration reviewer later accepted it for the workspace only.",
        created_at="2026-10-18T06:00:00+00:00",
    )
    add_evidence(
        "ratnagiri-support",
        uid("event:ratnagiri"),
        ratnagiri_source["id"],
        "supporting_claim",
        "The only support is the synthetic note itself.",
        "supporting",
        "accepted",
    )
    add_review(
        "ratnagiri",
        uid("event:ratnagiri"),
        "accept",
        "Review recorded for the audit trail. The tendering status was copied from the submitted claim.",
        "under_verification",
        "corroborated",
        "2026-10-19T09:15:00+00:00",
    )

    nashik = add_project(
        "nashik",
        project_name="Nashik North Water Treatment Stage II",
        description="Synthetic water-treatment record. The investment figure is invented for the layout and is labelled synthetic. It is not an official budget.",
        district="Nashik",
        location_name="Nashik",
        latitude=19.9975,
        longitude=73.7898,
        infrastructure_category="utilities",
        lifecycle_status="under_construction",
        reported_lifecycle_status="under_construction",
        investment_amount=180000000,
        currency="INR",
        investment_status="synthetic_demonstration",
        score_text="Water treatment capacity for Nashik is described as under construction.",
        created_at="2026-10-16T07:00:00+00:00",
        updated_at="2026-10-17T12:00:00+00:00",
    )
    nashik_source = add_source(
        "nashik",
        source_url=None,
        title="Nashik water treatment stage II announcement",
        publisher="Public bulletin",
        source_type="demonstration",
        language="en",
        published_at="2026-10-16T06:00:00+00:00",
        retrieved_at="2026-10-16T07:00:00+00:00",
        raw_content=note
        + " The note says stage II of a Nashik water-treatment plant is under construction and invents an outlay of INR 18 crore for display purposes.",
    )
    add_event(
        "nashik",
        nashik["id"],
        nashik_source["id"],
        event_type="milestone",
        reported_claim="The submitted report states stage II is under construction and states a synthetic outlay of INR 18 crore.",
        extracted_data={"reported_lifecycle": "under_construction", "investment_amount": 180000000, "currency": "INR", "synthetic": True},
        evidence_status="corroborated",
        ai_recommended_status="under_verification",
        recommendation_rationale="One synthetic publisher. The human demonstration review did not turn the figure into an official budget.",
        created_at="2026-10-16T07:00:00+00:00",
    )
    add_evidence(
        "nashik-support",
        uid("event:nashik"),
        nashik_source["id"],
        "supporting_claim",
        "Support is limited to the submitted report.",
        "supporting",
        "accepted",
    )
    add_review(
        "nashik",
        uid("event:nashik"),
        "accept",
        "Acceptance recorded. The investment figure remains labelled as unverified.",
        "newly_detected",
        "corroborated",
        "2026-10-17T12:00:00+00:00",
    )

    pune = add_project(
        "pune",
        project_name="Pune–Satara Bridge Deck Replacement",
        description="Synthetic bridge record with two demonstration claims that disagree on timing. Both claims are kept.",
        district="Pune",
        location_name="Pune",
        latitude=18.5204,
        longitude=73.8567,
        infrastructure_category="bridge",
        lifecycle_status="proposed",
        reported_lifecycle_status="under_construction",
        score_text="A bridge deck replacement between Pune and Satara is being discussed.",
        created_at="2026-10-22T04:00:00+00:00",
        updated_at="2026-10-23T04:30:00+00:00",
    )
    pune_a = add_source(
        "pune-a",
        source_url=None,
        title="Pune bridge deck — reported completion timeline",
        publisher="Public bulletin",
        source_type="demonstration",
        language="en",
        published_at="2026-10-22T03:00:00+00:00",
        retrieved_at="2026-10-22T04:00:00+00:00",
        raw_content=note + " Bulletin A says the deck replacement will finish in 2027.",
    )
    pune_b = add_source(
        "pune-b",
        source_url=None,
        title="Pune bridge deck — revised completion timeline",
        publisher="Public bulletin",
        source_type="demonstration",
        language="en",
        published_at="2026-10-23T03:00:00+00:00",
        retrieved_at="2026-10-23T04:30:00+00:00",
        raw_content=note + " Bulletin B says the same deck replacement will finish in 2029. The two reports differ on timing.",
    )
    add_event(
        "pune-a",
        pune["id"],
        pune_a["id"],
        event_type="milestone",
        reported_claim="The submitted report states the deck replacement finishes in 2027.",
        extracted_data={"reported_lifecycle": "under_construction", "expected_completion_raw": "2027", "synthetic": True},
        evidence_status="under_verification",
        ai_recommended_status="under_verification",
        recommendation_rationale="A second bulletin names a different completion year. Both claims stay under verification.",
        created_at="2026-10-22T04:00:00+00:00",
    )
    add_event(
        "pune-b",
        pune["id"],
        pune_b["id"],
        event_type="delay",
        reported_claim="The submitted report states the deck replacement finishes in 2029.",
        extracted_data={"reported_lifecycle": "under_construction", "expected_completion_raw": "2029", "synthetic": True},
        evidence_status="under_verification",
        ai_recommended_status="under_verification",
        recommendation_rationale="Differs from bulletin A on timing. Both claims stay under verification.",
        created_at="2026-10-23T04:30:00+00:00",
    )
    add_evidence(
        "pune-conflict-a",
        uid("event:pune-a"),
        pune_b["id"],
        "supporting_claim",
        "Bulletin B names 2029, which differs from bulletin A's 2027.",
        "insufficient",
        "pending",
    )
    add_evidence(
        "pune-conflict-b",
        uid("event:pune-b"),
        pune_a["id"],
        "supporting_claim",
        "Bulletin A names 2027, which differs from bulletin B's 2029.",
        "insufficient",
        "pending",
    )

    nagpur = add_project(
        "nagpur",
        project_name="Nagpur Freight Siding Extension",
        description="Synthetic railway-siding proposal. Still newly detected.",
        district="Nagpur",
        location_name="Nagpur",
        latitude=21.1458,
        longitude=79.0882,
        infrastructure_category="railway",
        lifecycle_status="proposed",
        reported_lifecycle_status="construction_started",
        score_text="A freight railway siding extension is reported at Nagpur.",
        created_at="2026-10-25T09:40:00+00:00",
        updated_at="2026-10-25T09:40:00+00:00",
    )
    nagpur_source = add_source(
        "nagpur",
        source_url=None,
        title="Nagpur freight siding announcement",
        publisher="Public bulletin",
        source_type="demonstration",
        language="en",
        published_at="2026-10-25T09:00:00+00:00",
        retrieved_at="2026-10-25T09:40:00+00:00",
        raw_content=note + " The note says freight-siding work at Nagpur has started. No length or cost is stated.",
    )
    add_event(
        "nagpur",
        nagpur["id"],
        nagpur_source["id"],
        event_type="milestone",
        reported_claim="The submitted report states freight-siding work at Nagpur has started.",
        extracted_data={"reported_lifecycle": "construction_started", "synthetic": True},
        evidence_status="newly_detected",
        ai_recommended_status="newly_detected",
        recommendation_rationale="Awaiting a human reviewer.",
        created_at="2026-10-25T09:40:00+00:00",
    )
    add_evidence(
        "nagpur-missing",
        uid("event:nagpur"),
        nagpur_source["id"],
        "missing_evidence",
        "No railway notification is attached.",
        "insufficient",
        "pending",
    )

    nanded = add_project(
        "nanded",
        project_name="Nanded Airside Lighting",
        description="Synthetic airport record. A demonstration reviewer accepted the reported approval for workspace display only.",
        district="Nanded",
        location_name="Nanded",
        latitude=19.1383,
        longitude=77.321,
        infrastructure_category="airport",
        lifecycle_status="approved",
        reported_lifecycle_status="approved",
        score_text="Airside lighting at the Nanded airport is described as approved.",
        created_at="2026-10-15T08:00:00+00:00",
        updated_at="2026-10-16T08:20:00+00:00",
    )
    nanded_source = add_source(
        "nanded",
        source_url=None,
        title="Nanded airside lighting announcement",
        publisher="Public bulletin",
        source_type="demonstration",
        language="en",
        published_at="2026-10-15T07:00:00+00:00",
        retrieved_at="2026-10-15T08:00:00+00:00",
        raw_content=note + " The note says airside lighting work at Nanded has been approved.",
    )
    add_event(
        "nanded",
        nanded["id"],
        nanded_source["id"],
        event_type="approval",
        reported_claim="The submitted report states the Nanded airside lighting work has been approved.",
        extracted_data={"reported_lifecycle": "approved", "synthetic": True},
        evidence_status="corroborated",
        ai_recommended_status="under_verification",
        recommendation_rationale="Left unverified by automation. A demonstration reviewer accepted it afterwards.",
        created_at="2026-10-15T08:00:00+00:00",
    )
    add_evidence(
        "nanded-support",
        uid("event:nanded"),
        nanded_source["id"],
        "supporting_claim",
        "The synthetic note is the only support on file.",
        "supporting",
        "accepted",
    )
    add_review(
        "nanded",
        uid("event:nanded"),
        "accept",
        "Acceptance recorded for workspace display only.",
        "under_verification",
        "corroborated",
        "2026-10-16T08:20:00+00:00",
    )

    kolhapur = add_project(
        "kolhapur",
        project_name="Kolhapur Hospital Power Backup",
        description="Synthetic hospital utility claim, including a Marathi sentence so language handling is visible.",
        district="Kolhapur",
        location_name="Kolhapur",
        latitude=16.705,
        longitude=74.2433,
        infrastructure_category="hospital",
        lifecycle_status="proposed",
        reported_lifecycle_status="proposed",
        score_text="Hospital power backup and emergency electrical capacity for Kolhapur.",
        created_at="2026-10-26T13:10:00+00:00",
        updated_at="2026-10-26T13:10:00+00:00",
    )
    kolhapur_source = add_source(
        "kolhapur",
        source_url=None,
        title="Kolhapur hospital backup announcement",
        publisher="Public bulletin",
        source_type="demonstration",
        language="mr",
        published_at="2026-10-26T12:00:00+00:00",
        retrieved_at="2026-10-26T13:10:00+00:00",
        raw_content=note
        + " कोल्हापूर जिल्हा रुग्णालयासाठी वीज बॅकअप यंत्रणेची घोषणा या कृत्रिम नोंदीत केली आहे. The English gloss is a synthetic claim about hospital power backup.",
    )
    add_event(
        "kolhapur",
        kolhapur["id"],
        kolhapur_source["id"],
        event_type="announcement",
        reported_claim="The submitted report states hospital power backup for Kolhapur. The Marathi sentence is synthetic.",
        extracted_data={"reported_lifecycle": "proposed", "original_language": "mr", "synthetic": True},
        evidence_status="newly_detected",
        ai_recommended_status="newly_detected",
        recommendation_rationale="Language was recorded as Marathi. The claim is unreviewed.",
        created_at="2026-10-26T13:10:00+00:00",
    )
    add_evidence(
        "kolhapur-missing",
        uid("event:kolhapur"),
        kolhapur_source["id"],
        "missing_evidence",
        "No hospital or utility order is attached.",
        "insufficient",
        "pending",
    )

    solapur = add_project(
        "solapur",
        project_name="Solapur Garden Frontage Resurfacing",
        description="Synthetic local landscaping item. A demonstration reviewer rejected it. The record and the decision both stay in the audit log.",
        district="Solapur",
        location_name="Solapur",
        latitude=17.6599,
        longitude=75.9064,
        infrastructure_category="other",
        lifecycle_status="proposed",
        reported_lifecycle_status="proposed",
        score_text="Municipal garden beautification, fountain landscaping and local road resurfacing in Solapur.",
        created_at="2026-10-14T08:00:00+00:00",
        updated_at="2026-10-14T15:00:00+00:00",
    )
    solapur_source = add_source(
        "solapur",
        source_url=None,
        title="Solapur garden frontage announcement",
        publisher="Public bulletin",
        source_type="demonstration",
        language="en",
        published_at="2026-10-14T07:00:00+00:00",
        retrieved_at="2026-10-14T08:00:00+00:00",
        raw_content=note + " The note describes garden beautification and local resurfacing in Solapur.",
    )
    add_event(
        "solapur",
        solapur["id"],
        solapur_source["id"],
        event_type="announcement",
        reported_claim="The submitted report states garden frontage resurfacing in Solapur.",
        extracted_data={"reported_lifecycle": "proposed", "synthetic": True},
        evidence_status="rejected",
        ai_recommended_status="newly_detected",
        recommendation_rationale="Automation only marked it newly detected. A reviewer rejected the item.",
        created_at="2026-10-14T08:00:00+00:00",
    )
    add_evidence(
        "solapur-missing",
        uid("event:solapur"),
        solapur_source["id"],
        "missing_evidence",
        "Rejected before any further source was sought.",
        "insufficient",
        "rejected",
    )
    add_review(
        "solapur",
        uid("event:solapur"),
        "reject",
        "Rejection recorded. Civic landscaping is outside the monitoring interest of this workspace.",
        "newly_detected",
        "rejected",
        "2026-10-14T15:00:00+00:00",
    )

    raigad = add_project(
        "raigad",
        project_name="Raigad Harbour Shed Repairs",
        description="Synthetic harbour repair. Baseline tier follows the port category; the contextual score is stored separately from verification.",
        district="Raigad",
        location_name="Alibag",
        latitude=18.6554,
        longitude=72.8671,
        infrastructure_category="port",
        lifecycle_status="on_hold",
        reported_lifecycle_status="on_hold",
        score_text="Repairs to a harbour shed at Alibag in Raigad are on hold.",
        created_at="2026-10-12T08:00:00+00:00",
        updated_at="2026-10-13T10:00:00+00:00",
    )
    raigad_source = add_source(
        "raigad",
        source_url=None,
        title="Raigad harbour shed announcement",
        publisher="Public bulletin",
        source_type="demonstration",
        language="en",
        published_at="2026-10-12T07:00:00+00:00",
        retrieved_at="2026-10-12T08:00:00+00:00",
        raw_content=note + " The note says shed repairs at Alibag harbour are on hold.",
    )
    add_event(
        "raigad",
        raigad["id"],
        raigad_source["id"],
        event_type="delay",
        reported_claim="The submitted report states the Alibag harbour shed repairs are on hold.",
        extracted_data={"reported_lifecycle": "on_hold", "synthetic": True},
        evidence_status="corroborated",
        ai_recommended_status="under_verification",
        recommendation_rationale="A demonstration reviewer accepted the on-hold claim for the workspace. It was not officially confirmed.",
        created_at="2026-10-12T08:00:00+00:00",
    )
    add_evidence(
        "raigad-support",
        uid("event:raigad"),
        raigad_source["id"],
        "supporting_claim",
        "Only the synthetic note supports the on-hold claim.",
        "supporting",
        "accepted",
    )
    add_review(
        "raigad",
        uid("event:raigad"),
        "accept",
        "Acceptance recorded. Lifecycle was set to on hold from the submitted claim.",
        "under_verification",
        "corroborated",
        "2026-10-13T10:00:00+00:00",
    )

    payload = {
        "projects": projects,
        "sources": sources,
        "events": events,
        "evidence": evidence,
        "review_logs": review_logs,
        "correlation_candidates": [],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} ({len(projects)} projects, {len(events)} events)")


if __name__ == "__main__":
    main()
