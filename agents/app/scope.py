from __future__ import annotations

PLACES = (
    "maharashtra",
    "mumbai",
    "pune",
    "nagpur",
    "nashik",
    "thane",
    "raigad",
    "kolhapur",
    "solapur",
    "nanded",
    "ratnagiri",
    "wardha",
    "palghar",
    "aurangabad",
    "sambhajinagar",
    "nagpur",
)

INFRA = (
    "highway",
    "expressway",
    "railway",
    "rail",
    "metro",
    "port",
    "airport",
    "bridge",
    "tunnel",
    "hospital",
    "trauma",
    "power",
    "substation",
    "pipeline",
    "water treatment",
    "infrastructure",
    "flyover",
    "corridor",
    "road",
)


def keyword_relevant(title: str, text: str, require_place: bool = False) -> bool:
    blob = f"{title} {text}".lower()
    if not any(word in blob for word in INFRA):
        return False
    if require_place and not any(place in blob for place in PLACES):
        return False
    return True
