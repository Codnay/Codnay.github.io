---
title: Can frontier LLMs fix robots by editing their weights?
date: 2026-11-04
image: pair_11_poster.jpg
authors: Pranay Gupta, Deepanshu Rohilla, Parjanya Prashant and Jiongli Zhu
byline: <a href="https://x.com/PranayGupt97167">Pranay Gupta</a><sup>1</sup>, <a href="https://x.com/Deepans36819800">Deepanshu Rohilla</a><sup>1</sup>, <a href="https://x.com/parjanyapp">Parjanya Prashant</a><sup>2</sup>, Jiongli Zhu<sup>2</sup><span class="aff"><sup>1</sup>Argon Robotics · <sup>2</sup>UC San Diego</span>
description: We asked Claude to edit π0.5's weights directly, with no gradients or training. Laundry folding went from 51% to 75%, and a mahjong task from 23% to 36%.
---
<div class="wx-tldr" markdown="1">

**TL;DR** We asked Claude to edit π0.5, an open robot model, directly in its weights: no gradients, no training. This extends [weight-space programming](https://rikiyat.github.io/blog/weight-space-programming/) to robotics.

**Read.** From neuron activity alone, Claude can see what the robot will do next: grab neurons fire up to a second before the gripper closes.

**Fix.** Flipping 128 "failure" neurons, 0.004% of the weights, lifted a mahjong task from 23% to 36% and raised success on 5 of 10 tasks.

**Write.** Copy-pasting what one fine-tuned robot learned into the stock model lifted laundry folding from 51% to 75%.

</div>

{{ panels }}

## 01 · An LLM can read a robot's brain

π0.5 turns camera images and an instruction into arm motion. The part that writes the motion has **73,728 neurons** (18 layers × 4,096). Claude recorded every one of them through 48 attempts per task. On folding it labelled what each one does: this one fires right before the gripper closes, this one at release, this one only in grabs that go on to fail, and which joints each pushes when it fires harder.

In the animation at the top, a recorded fold plays next to 16 of those neurons. The **grab neurons** light up up to a second before the gripper closes, and the **release neurons** fire the moment it lets go. The robot's next move is written in its neurons before it happens.

Failures leave a trace too. On the mahjong task, the neurons flag a grab that is about to fail with an AUROC of **0.81**.

{{ neuron-signal-chart }}


## 02 · Find the failure, flip it

Claude built a small algorithm to find where each task's failures live in the brain, then edited only those neurons. No gradients, just a direct write to **0.004% of the weights**.

{{ flip-steps }}

{{ flip-animation }}

The biggest win came on a mahjong task: the robot waits for its opponent to discard a tile, then sets out its three matching tiles to claim four of a kind. Here the neurons gave failure away most clearly, and success jumped from **23% to 36%**.

{{ mahjong-clip }}

*Mahjong task, same layout and seed, 1.2× speed. Stock knocks a tile loose and runs out of time. The edited robot finishes in 15 s.*

{{ mahjong-chart }}

## 03 · Where the flip helped

We ran the same recipe on all 10 tasks, from 48 new attempts on each, at two strengths: remove the failure pattern (flip) or reverse it (flip 2×). It raised success on **5 of the 10 tasks**.

{{ helped-chart }}

{{ classify-clip }}

*Classify objects, same layout and seed, 2.2× speed. Stock drops the blocks into the wrong bins. The edited robot sorts them.*

**It works where the brain is readable.** The clearer the failure signal, the more the flip helped (r = 0.69 across 10 tasks). The mahjong task's signal was the clearest of all, and so was its gain.

{{ signal-vs-gain-chart }}

## 04 · Brain math: copy-paste what a robot learned

Training a robot on extra folding demos changes its weights. Training it the same way without folding changes them too. Subtract one from the other and what's left is the folding know-how. Claude added it to the stock robot. The edit itself took no training, just arithmetic in minutes on a CPU.

{{ brain-math }}

{{ folding-chart }}

The pasted change does better than the fine-tuned copy it came from, with no training of its own.

{{ folding-clip }}

*Layout 44. The edited robot folds in 12 s.*

## 05 · Robots might get solved by LLMs writing weights

We pictured robotics getting solved the slow way: more demos, bigger models, longer training runs. We now think a shortcut may come first.

Today an LLM can read a robot's neurons, find the ones behind a failure, and copy-paste what one robot brain learned into another, in minutes and with no training. Next, it writes the weights for a new task directly. This is the first spark.

## 06 · Explore every neuron

The full viewer: all 73,728 neurons in 3D, two recorded folds, and every neuron's strongest moments. Drag to turn, tap a dot to see what it does.

{{ neuron-viewer }}

[Open the viewer full screen ↗](https://pi05-weight-edit.vercel.app/neurons/)

## Citation

Please cite this work as:

```bibtex
@article{gupta2026robotweights,
  author  = {Pranay Gupta and Deepanshu Rohilla and Parjanya Prashant and Jiongli Zhu},
  title   = {{Can frontier LLMs fix robots by editing their weights?}},
  journal = {codnay.github.io},
  year    = {2026},
  month   = {November},
  url     = {https://codnay.github.io/blog/llms-fix-robots-by-editing-weights/},
}
```

---

{{ script }}

All runs are RoboDojo simulation (Isaac Sim), seeds 0–2, scored by the simulator's own success check. Live results and the full neuron viewer: [pi05-weight-edit.vercel.app](https://pi05-weight-edit.vercel.app/). Related: task arithmetic (Ilharco et al., 2023), model soups (Wortsman et al., 2022), ExPO (Zheng et al., 2024), and [Sparks of Weight-Space Programming](https://rikiyat.github.io/blog/weight-space-programming/).
