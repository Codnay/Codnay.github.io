---
title: Your physics engine breaks at scale
date: 2026-11-07
description: Large-scale distributed training runs thousands of worlds per GPU for billions of steps. That is exactly where open-source physics engines quietly break.
---
Over the past month we found 20 bugs in open-source physics engines. Most never raise an error. They quietly corrupt what your robot learns in simulation, and show up later as the sim-to-real gap: a robot that works in sim and fails on the real thing.

The worst of them only appear at scale. Large-scale distributed training packs thousands of copies of a world onto every GPU, spreads them across many GPUs, and runs them for billions of steps. That is the whole point of simulation, and it is exactly where the physics breaks: when many worlds run at once, in poses too rare for any unit test, and in the cables and cloth that need the most data. We found these bugs in Newton, MuJoCo Warp and MuJoCo, and reported every one upstream.

## 1. More worlds, different physics

A ten-cube tower stands on its own. Run it in thousands of worlds at once, and most of the copies fall.

![The same tower copied more and more times: the more copies, the more fall](towers.svg)

*MuJoCo Warp, CG solver: 0 of 16 copies fall, then 92 of 256, 882 of 1,024 and 4,031 of 4,096.*

Worlds also leak into each other. In MuJoCo Warp, every world wrote its bounding box to one shared slot, and a ball fell through its own table ([#1795](https://github.com/google-deepmind/mujoco_warp/issues/1795); fix [#1800](https://github.com/google-deepmind/mujoco_warp/pull/1800) by another contributor).

![Two worlds write their bounding boxes into one slot; world 0 is checked against world 1's narrower box and its ball falls through](aabb.svg)

In Newton's MPM solver, changing the other worlds moved world 0 by up to 0.1 mm ([#5207](https://github.com/newton-physics/newton/issues/5207)). And at 4,096 worlds, Newton's mesh contact buffer filled up without a warning, and pegs sank 28.9 mm into a 20 mm hole.

**What it does to training:** the more worlds you run, the further your physics drifts from the one world you debugged.

## 2. Rare poses stop being rare

In a two-arm task, a 15 mm block resting on a 12.7 mm board was fired straight down through it at several metres per second.

![The same pose through two routines: 0.009 mm and up, or 27.7 mm and down](boxflip.svg)

MuJoCo Warp's general collision routine returned the contact upside down and 27.7 mm deep: both thicknesses added. Its own box-box routine and MuJoCo both say 0.009 mm, pointing up. Only a sliver of heights triggers it:

![A height scan of the block: only a 0.35 µm band flips](band.svg)

*130 of 2,001 heights, 2 nm apart, all inside 0.35 µm.*

**What it does to training:** a unit test never lands in that band. Billions of steps across thousands of worlds land in it all the time, and the policy learns that blocks sometimes explode. Reported as [#1883](https://github.com/google-deepmind/mujoco_warp/issues/1883). Two open PRs from other contributors, [#1845](https://github.com/google-deepmind/mujoco_warp/pull/1845) and [#1866](https://github.com/google-deepmind/mujoco_warp/pull/1866), together remove every flip on our scan and on 8,000 random poses.

## 3. The tasks that need scale most get the worst physics

Cables and cloth are why you need millions of rollouts: they have more ways to move than any rigid object. They are also where the engines are furthest from reality.

**Stiff cables sag 40 % too far** (Newton, VBD solver[^vbd]). VBD corrects one body at a time, so a correction crawls one segment per sweep. Our [#4795](https://github.com/newton-physics/newton/pull/4795) solves each rod at once and lands within 1–2 % of the exact shape.

![One body at a time, a fix travels about a segment per sweep; solving the whole rod at once lands the beam on its exact shape](rods.svg)

**A cloth pile sinks through the floor** (Newton, VBD with self-contact). 271 of 1,681 particles end up below the ground, the lowest 74 mm down ([#5143](https://github.com/newton-physics/newton/issues/5143)).

**What it does to training:** a policy that learns to route a cable or fold a towel, at scale, learns a material that doesn't exist.

## If you train at scale, check this

1. **Run one scene at 1 and at 4,096 worlds.** The physics must match.
2. **Scan awkward poses:** thin things resting on each other, shallow overlaps, edges across edges.
3. **Check momentum:** push a free object with a known impulse. Its momentum must change by exactly that.
4. **Size contact buffers yourself** and check them for overflow every step.
5. **Test soft things at your real mesh size.**
6. **In MuJoCo Warp, route box pairs to the box-box routine** (turn `NATIVECCD` off) until [#1845](https://github.com/google-deepmind/mujoco_warp/pull/1845) and [#1866](https://github.com/google-deepmind/mujoco_warp/pull/1866) land.

## What's next

These bugs share one cause. The engines are tuned for scenes where a millimetre doesn't matter, nobody reruns a world, and speed is measured on falling boxes. That is the right tuning for most of their users, and the wrong one for training robot hands at scale. So we are building Alloy, a physics engine for robot hands at scale, around the checks above. It launches soon. Why we are building it, in plain words: [Robots need their own wind tunnel](../robots-need-their-own-wind-tunnel/).

## Footnotes

{{ others }}

1. **Round shapes touch 0.1 mm early** (Newton). A 0.1 mm collision margin was counted twice for spheres and capsules. [#4790](https://github.com/newton-physics/newton/issues/4790), fix [#4791](https://github.com/newton-physics/newton/pull/4791), merged.
2. **One contact on a line** (MuJoCo). A box lying across another box's edge gets one contact at one end instead of a row along the edge. [#3755](https://github.com/google-deepmind/mujoco/issues/3755).
3. **16.5 µm overlap read as 190 mm** (MuJoCo Warp). A face built on two near-identical corners points anywhere, so a tiny overlap becomes a huge sideways push. Fix [#1796](https://github.com/google-deepmind/mujoco_warp/pull/1796).
4. **Fine cloth won't bend** (Newton VBD). Folds with edges under about 1 mm fail a fixed-size check, so bending switches off. [#5130](https://github.com/newton-physics/newton/issues/5130), fix [#5131](https://github.com/newton-physics/newton/pull/5131).
5. **Bending weakens with mesh size** (Newton XPBD and semi-implicit). Bending is scaled by triangle area, so 1 cm cells bend 10⁴ times weaker than 1 m cells. [#5140](https://github.com/newton-physics/newton/issues/5140).
6. **Held cloth drops** (Newton VBD). In deterministic mode, the forces pinning cloth to a body were overwritten. [#5145](https://github.com/newton-physics/newton/issues/5145), fix [#5146](https://github.com/newton-physics/newton/pull/5146), merged.
7. **Fluid flows 15 % slow** (Newton MPM). On the default sparse grid, the floor cuts a grid cell in half and drags on the film. [#5206](https://github.com/newton-physics/newton/issues/5206).
8. **Pushed cloth gains 3.2× the momentum** (Newton VBD). Solving one vertex at a time doesn't conserve momentum. [#5129](https://github.com/newton-physics/newton/issues/5129).

Every report links a script that reproduces it.

## References

///Footnotes Go Here///

## Citation

Please cite this work as:

```bibtex
@article{gupta2026scale,
  author  = {Pranay Gupta},
  title   = {{Your physics engine breaks at scale}},
  journal = {codnay.github.io},
  year    = {2026},
  month   = {November},
  url     = {https://codnay.github.io/blog/sim-to-real-gap/},
}
```

[^vbd]: Anka He Chen, Ziheng Liu, Yin Yang, Cem Yuksel. "Vertex Block Descent." *ACM Transactions on Graphics* (SIGGRAPH), 2024. [arXiv:2403.06321](https://arxiv.org/abs/2403.06321).
