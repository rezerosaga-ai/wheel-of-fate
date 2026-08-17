import os
#!/usr/bin/env python3
"""Check latest Vercel deployments for the wheel-of-fate project."""
import json, sys, urllib.request

TOKEN = os.environ.get("VERCEL_TOKEN", "")
PROJECT = "prj_P3iXrWZugiYCf3c4JCT1zTqHAe2y"


def get(url):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


if __name__ == "__main__":
    dep_id = sys.argv[1] if len(sys.argv) > 1 else None
    if dep_id:
        d = get(f"https://api.vercel.com/v13/deployments/{dep_id}?teamId=&projectId={PROJECT}")
        print("STATE:", d.get("state"))
        print("readyState:", d.get("readyState"))
        print("url:", d.get("url"))
        err = d.get("error") or {}
        if err.get("code"):
            print("ERROR:", err.get("code"), err.get("message"))
        print("meta keys:", list((d.get("meta") or {}).keys()))
        for k in ("name", "type", "target", "createdAt"):
            if k in d and d[k]:
                print(k + ":", d[k])
    else:
        d = get(f"https://api.vercel.com/v6/deployments?projectId={PROJECT}&limit=5")
        for dep in d.get("deployments", []):
            print(dep.get("state"), "|", dep.get("target"), "|", dep.get("url"), "|", "created:", dep.get("createdAt"))
            if dep.get("meta", {}).get("githubSha"):
                print("   sha:", dep["meta"]["githubSha"][:9])
