"""Summarise a Chromium trace (Electron contentTracing JSON): CPU/wall time per process type and thread, and the heaviest top-level events.
  python tools/gpu/trace_summary.py <trace.json>"""
import json, sys, collections

tr = json.load(open(sys.argv[1], encoding="utf-8"))
ev = tr["traceEvents"] if isinstance(tr, dict) else tr
pname, tname = {}, {}
for e in ev:
    if e.get("ph") == "M":
        if e["name"] == "process_name":
            pname[e["pid"]] = e["args"]["name"]
        elif e["name"] == "thread_name":
            tname[(e["pid"], e["tid"])] = e["args"]["name"]
t0 = min(e["ts"] for e in ev if "ts" in e and e.get("ph") in ("X", "B"))
t1 = max(e["ts"] + e.get("dur", 0) for e in ev if "ts" in e and e.get("ph") in ("X", "B"))
span = (t1 - t0) / 1e6
# top-level slices only (no nesting double count): per thread, keep X events not contained in a previous one
by_thread = collections.defaultdict(list)
for e in ev:
    if e.get("ph") == "X" and "dur" in e:
        by_thread[(e["pid"], e["tid"])].append(e)
tot = collections.Counter()
cpu = collections.Counter()
names = collections.defaultdict(collections.Counter)
for k, L in by_thread.items():
    L.sort(key=lambda e: (e["ts"], -e["dur"]))
    end = -1
    for e in L:
        if e["ts"] >= end:
            tot[k] += e["dur"]
            cpu[k] += e.get("tdur", e["dur"])
            names[k][e["name"]] += e.get("tdur", e["dur"])
            end = e["ts"] + e["dur"]
print(f"trace span {span:.2f}s")
grp = collections.Counter()
for k, v in cpu.items():
    grp[(pname.get(k[0], str(k[0])).split(" ")[0], tname.get(k, str(k[1])))] += v
for (p, t), v in grp.most_common(25):
    print(f"{p:<18} {t:<34} cpu {v / 1e6 / span * 100:6.1f}% of a core")
print("\nheaviest events (cpu, all threads):")
allc = collections.Counter()
for k, c in names.items():
    for n, v in c.items():
        allc[(pname.get(k[0], "?").split(" ")[0], tname.get(k, "?"), n)] += v
for (p, t, n), v in allc.most_common(25):
    print(f"{p:<12} {t:<28} {n:<45} {v / 1e6 / span * 100:6.1f}%")
