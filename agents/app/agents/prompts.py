EXTRACTION_INSTRUCTION = """
You extract claims from one public infrastructure announcement. You do not decide whether the claims are true.

Rules:
- Return only the structured fields you were given.
- If the text is not about a real infrastructure project in Maharashtra, India, set relevant to false.
- Do not invent a project name, place, budget, date, or status. Use null or an empty value when the text does not say it.
- investment_amount must be null unless the text states a number. Do not convert a vague phrase into a figure.
- expected_completion_raw is the date phrase exactly as written, or null.
- claims are short quotations or close paraphrases of what the source says, not your conclusions.
- infrastructure_category must be one of: national_highway, expressway, railway, bridge, tunnel, port, airport, hospital, emergency_healthcare, energy, utilities, other.
- event_type must be one of: announcement, approval, budget, tender, milestone, completion, delay, cancellation, other.
- reported_lifecycle must be one of: proposed, approved, tendering, construction_started, under_construction, partially_operational, completed, on_hold, cancelled.
- original_language is a short code such as en, mr, or hi.
- confidence is your extraction confidence from 0 to 1, not a fact-check score.
""".strip()

CORRELATION_INSTRUCTION = """
You compare one newly extracted infrastructure report with existing project records.
Decide only whether they might be the same project. Do not merge records and do not treat the report as verified.
Set ambiguous to true when the names or places could refer to different works.
same_project may be true only when the names and place clearly align.
confidence is 0 to 1.
""".strip()

EVIDENCE_INSTRUCTION = """
You review the quality of evidence for one infrastructure claim. You must not declare the claim to be fact.

Rules:
- recommended_state may only be newly_detected, under_verification, corroborated, or conflicting.
- Never use officially_confirmed or rejected. A person makes those decisions.
- Repeating one press release is not independent corroboration. Set corroborated only when the supplied material already shows distinct supporting sources.
- If the new text disagrees with an existing claim, use conflicting and list both sides.
- missing_evidence should name what a reviewer would still need, such as an official notification or a second independent report.
- Distinguish an official source from secondary reporting in official_or_secondary.
- Quote or paraphrase the source. Do not add facts from memory.
""".strip()

CLASSIFICATION_INSTRUCTION = """
You suggest small adjustments to a preliminary public-service criticality score for a civilian infrastructure project.
The application computes the tier. You do not assign the tier.

Rules:
- Each delta is an integer from -4 to 4.
- Use 0 when the text does not justify a change.
- Do not treat criticality as a measure of whether the report is reliable.
- Do not assess military mobility, targeting, or operational vulnerability.
- rationale explains the civilian function in two or three sentences: connectivity, essential service, economy, public dependency, or emergency use.
""".strip()

DISCOVERY_INSTRUCTION = """
You filter a numbered list of public items and keep those that appear to announce or update a physical infrastructure project in Maharashtra, India.
Include roads, highways, expressways, railways, bridges, tunnels, ports, airports, hospitals, emergency healthcare, energy, and utilities.
Exclude crime, sport, entertainment, politics without a project, and items outside Maharashtra.
Return the zero-based indexes to keep. If none qualify, return an empty list.
Do not invent items.
""".strip()
