# Live-payload fixtures

These fixtures are checked-in snapshots of real FPL API responses used to
validate typeguards against actual live data shapes (not hand-written mocks).

## How to regenerate

```bash
# 1. Fetch raw payloads (trailing slashes required – without them the API 301s)
curl -s https://fantasy.premierleague.com/api/bootstrap-static/ -o /tmp/bootstrap-static.json
curl -s https://fantasy.premierleague.com/api/fixtures/              -o /tmp/fixtures.json

# 2. Trim bootstrap-static to a manageable size while keeping all variance:
#    - ALL 38 events  (they're small and the null-heavy pre-season ones matter)
#    - ALL 20 teams
#    - ALL 4 element_types
#    - 30 sampled elements that deliberately include:
#        • players with null ep_this / ep_next  (pre-season)
#        • players with null birth_date
#        • players with non-null birth_date
#        • at least one player per element_type (GKP/DEF/MID/FWD)
python3 << 'EOF'
import json, random
random.seed(42)

with open('/tmp/bootstrap-static.json') as f:
    data = json.load(f)

elements = data['elements']
null_ep_this      = [e for e in elements if e.get('ep_this') is None]
null_birth_date   = [e for e in elements if e.get('birth_date') is None]
non_null_birth    = [e for e in elements if e.get('birth_date') is not None]

sampled = set()
sample_elements = []

for e in random.sample(null_ep_this,    min(5, len(null_ep_this))):
    sampled.add(e['id']); sample_elements.append(e)
for e in random.sample(null_birth_date, min(5, len(null_birth_date))):
    if e['id'] not in sampled: sampled.add(e['id']); sample_elements.append(e)
for e in random.sample(non_null_birth,  min(5, len(non_null_birth))):
    if e['id'] not in sampled: sampled.add(e['id']); sample_elements.append(e)
for etype in [1, 2, 3, 4]:
    candidates = [e for e in elements if e['element_type'] == etype and e['id'] not in sampled]
    if candidates:
        e = random.choice(candidates); sampled.add(e['id']); sample_elements.append(e)
remaining = [e for e in elements if e['id'] not in sampled]
sample_elements.extend(random.sample(remaining, min(30 - len(sample_elements), len(remaining))))

out = {'events': data['events'], 'teams': data['teams'],
       'elements': sample_elements, 'element_types': data['element_types']}
with open('libs/contracts/fpl/src/lib/typeguards/__fixtures__/bootstrap-static.json', 'w') as f:
    json.dump(out, f, indent=2)
EOF

# 3. Keep all 380 fixtures (only ~155 KB)
python3 -c "
import json
with open('/tmp/fixtures.json') as f: data = json.load(f)
with open('libs/contracts/fpl/src/lib/typeguards/__fixtures__/fixtures.json', 'w') as f:
    json.dump(data, f, indent=2)
"
```

## Last regenerated

**Date:** 2026-07-31  
**Season:** 2026-27 (pre-season – all `ep_this` / `ep_next` values are `null`)  
**Elements in fixture:** 30 sampled from 564 total  
**Fixtures:** 380 (full season schedule)
