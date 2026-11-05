---
title: Can frontier LLMs fix robots by editing their weights?
date: 2026-11-04
image: pair_11_poster.jpg
authors: Pranay Gupta, Deepanshu Rohilla, Parjanya Prashant and Jiongli Zhu
byline: <a href="https://x.com/PranayGupt97167">Pranay Gupta</a><sup>1</sup>, <a href="https://x.com/Deepans36819800">Deepanshu Rohilla</a><sup>1</sup>, <a href="https://x.com/parjanyapp">Parjanya Prashant</a><sup>2</sup>, Jiongli Zhu<sup>2</sup><span class="aff"><sup>1</sup>Argon Robotics · <sup>2</sup>UC San Diego</span>
description: We asked Opus to improve π0.5 by editing its weights directly, with no gradient training. Laundry folding went from 51% to 75%, and a mahjong task from 23% to 36%.
---
<div class="wx-tldr" markdown="1">

**TL;DR** Robot models like π0.5 show what they are about to do **up to a second before they do it**, and **frontier LLMs can understand these signals**. They can also **edit, graft and combine the model's weights directly** to make it better, with **no gradient training**.

We gave Opus 10 manipulation tasks in RoboDojo. It built an algorithm that compares successes with failures to find where each failure lives, then edited **just 0.004% of the weights**. **Success rose on half the tasks**, including mahjong (23% to 36%), classifying objects (16% to 21%) and storing a laptop (7% to 12%). When we also let it train small models on simulated trajectories, it found the weight direction that helps folding and **lifted folding from 51% to 75%**.

Robotics has been built on expensive data collection, complex algorithms and finicky RL. We believe **LLMs offer a new way to understand robot brains, optimize them, and eventually solve robotics**.

</div>

{{ panels }}

## 01 · An LLM can read a robot's brain

Opus labelled all **73,728 neurons** that write π0.5's motion. In the animation at the top, **grab neurons** light up to a second before the gripper closes, and **release neurons** fire as it lets go. Failures show too: on mahjong, the neurons flag a failing grab with an AUROC of **0.81**.

{{ neuron-signal-chart }}

## 02 · Find the failure, flip it

Opus compares successes with failures, finds the 128 neurons behind the failure, and flips them: **0.004% of the weights**, no gradients.

{{ flip-steps }}

{{ flip-animation }}

The biggest win: a mahjong task where the robot lays out three matching tiles to claim four of a kind. Success went from **23% to 36%**.

{{ mahjong-clip }}

*Same layout and seed, 1.2× speed. Stock knocks a tile loose; the edited robot finishes in 15 s.*

{{ mahjong-chart }}

## 03 · Where the flip helped

Same recipe on all 10 tasks. Success rose on **half of them**.

{{ helped-chart }}

{{ classify-clip }}

*Classify objects, 2.2× speed. Stock picks the wrong bins; the edited robot sorts them.*

**The clearer the failure signal, the bigger the gain** (r = 0.69).

{{ signal-vs-gain-chart }}

## 04 · Brain math: copy-paste what a robot learned

Opus trained two small models on simulated trajectories, one with folding and one without. Their difference is the folding direction. Adding it to the original model lifted folding **from 51% to 75%**, beating the fine-tuned model it came from.

{{ brain-math }}

{{ folding-chart }}

{{ folding-clip }}

*Layout 44. The edited robot folds in 12 s.*

## 05 · Robots might get solved by LLMs writing weights

Today an LLM can read a robot's neurons, fix its failures and copy skills between brains, with no gradient training. Next, it writes the weights for a new task directly.

## 06 · Explore every neuron

All 73,728 neurons in 3D across two recorded folds. Drag to turn, tap a dot to see what it does.

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

All runs are RoboDojo simulation (Isaac Sim), seeds 0–2, scored by the simulator's own success check. Related: task arithmetic (Ilharco et al., 2023), model soups (Wortsman et al., 2022), ExPO (Zheng et al., 2024), and [Sparks of Weight-Space Programming](https://rikiyat.github.io/blog/weight-space-programming/).
