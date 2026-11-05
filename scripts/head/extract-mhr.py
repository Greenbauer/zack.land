# Writes scripts/head/mhr/neck.json.gz: the pose correctives Meta's Momentum
# Human Rig (MHR, Apache 2.0) learned from body scans for the neck, as offsets
# of its rest surface, for the four neck poses the page drives (neckPose.ts).
# scripts/head/mhr.mjs carries them onto our neck.
#
#   python extract-mhr.py <MHR's assets/mhr_model.pt> <output.json.gz>
#
# Needs torch (MHR's TorchScript model runs in it; no other MHR code). Each
# pose is split evenly between MHR's neck and head joints, as our turn is
# split between the neck and the joint under the skull (headTurn.ts).

import gzip
import json
import sys

import torch

# MHR's model parameters for its neck joint (turn, tilt, nod) and its head
# joint, found by turning each parameter and measuring the head (only these
# turn the head without moving the chest).
NECK = {"turn": 24, "nod": 26}
HEAD = {"turn": 27, "nod": 29}
# The page's full strengths (neckPose.ts FULL_TURN, FULL_NOD), radians, and
# the far turn the head goes on to (FAR_TURN, the neck's share of it: 80
# degrees, about as far as a neck turns).
POSES = {
    "neckTurnLeft": ("turn", 0.79),
    "neckTurnRight": ("turn", -0.79),
    "neckTurnLeftFar": ("turn", 1.4),
    "neckTurnRightFar": ("turn", -1.4),
    "neckDown": ("nod", 0.52),
    "neckUp": ("nod", -0.52),
}
# Only the neck, the head above it and the top of the body below (cm).
ABOVE = 110


def main(model_path, out_path):
    model = torch.jit.load(model_path)
    model.eval()
    character = model.character_torch
    rest = character.mesh.rest_vertices
    faces = character.mesh.faces
    keep = rest[:, 1] > ABOVE
    index = torch.full((rest.shape[0],), -1, dtype=torch.long)
    index[keep] = torch.arange(int(keep.sum()))
    kept_faces = faces[keep[faces].all(dim=1)]
    shapes = {}
    for name, (axis, angle) in POSES.items():
        params = torch.zeros(1, 204)
        params[0, NECK[axis]] = angle / 2
        params[0, HEAD[axis]] = angle / 2
        joints = character.model_parameters_to_joint_parameters(
            torch.cat([params, torch.zeros(1, 45)], dim=1)
        )
        with torch.no_grad():
            offsets = model.pose_correctives_model(joints)[0]
        shapes[name] = [round(c, 3) for c in offsets[keep].flatten().tolist()]
    data = {
        "source": "Momentum Human Rig (MHR), Meta, Apache License 2.0",
        "units": "cm, y up, facing +z",
        "vertices": [round(c, 3) for c in rest[keep].flatten().tolist()],
        "faces": index[kept_faces].flatten().tolist(),
        "shapes": shapes,
    }
    with gzip.open(out_path, "wt") as f:
        json.dump(data, f)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
