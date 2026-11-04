---
title: Can frontier LLMs fix robots by editing their weights?
date: 2026-11-04
image: pair_11_poster.jpg
description: We asked Claude to edit π0.5's weights directly, with no gradients or training. Laundry folding went from 51% to 70%, and Make kong from 23% to 36%.
---
We asked Claude to edit π0.5's weights directly, with no gradients and no training. Laundry folding went from 51% to 70%, and Make kong from 23% to 36%.

> This extends [weight-space programming](https://rikiyat.github.io/blog/weight-space-programming/) to robotics: an LLM can read a robot's neurons, find what makes it fail, and rewrite what it does.

<div class="wx-panels">
  <div class="bbox wx-panel"><span class="label">read</span>
    <div class="wx-txt"><b>Can an LLM tell what a robot is about to do from its neurons?</b><span class="wx-big">0.81</span><span class="wx-small">how well Make kong's neurons flag grabs in attempts that go on to fail (0.5 = chance)</span></div>
    <video class="wx-ex" src="explorer.mp4" poster="explorer_poster.jpg" autoplay muted loop playsinline preload="metadata" aria-label="The neuron viewer playing a recorded attempt"></video>
  </div>
  <div class="bbox wx-panel"><span class="label">fix</span>
    <div class="wx-txt"><b>Can it find the neurons behind a failure and flip them?</b><span class="wx-big">36%</span><span class="wx-small">Make kong, up from 23%, by changing 0.004% of the weights</span></div>
    <div class="wx-pair"><div class="wx-lab"><span>stock π0.5</span><span>after the edit</span></div><video src="pair_kong.mp4" poster="pair_kong_poster.jpg" autoplay muted loop playsinline preload="metadata" aria-label="Stock π0.5 knocks a tile loose and runs out of time; the edited model finishes in 15 seconds"></video></div>
  </div>
  <div class="bbox wx-panel"><span class="label">write</span>
    <div class="wx-txt"><b>Can it copy-paste what one robot brain learned into another?</b><span class="wx-big">70%</span><span class="wx-small">clothes folded, up from 51%</span></div>
    <div class="wx-pair"><div class="wx-lab"><span>stock π0.5</span><span>after the edit</span></div><video src="pair_11.mp4" poster="pair_11_poster.jpg" autoplay muted loop playsinline preload="metadata" aria-label="Stock π0.5 re-grabs the shirt and runs out of time; the edited model folds it in 12 seconds"></video></div>
  </div>
</div>

## 01 · An LLM can read a robot's brain

π0.5 turns camera images and an instruction into arm motion. The part that writes the motion has **73,728 neurons** (18 layers × 4,096). Claude recorded every one of them through 48 attempts per task. On folding it labelled what each one does: this one fires right before the gripper closes, this one at release, this one only in grabs that go on to fail, and which joints each pushes when it fires harder.

The neurons give failures away before they happen. On Make kong, they flag a failing grab with an AUROC of **0.81**.

<div class="wx-chart">
  <div class="wx-t">How clearly the neurons flag a failing grab, per task</div>
  <div class="wx-legend">bar: held-out AUROC of the best layer · dashed line: chance (0.5)</div>
  <div class="wx-bars wx-chance">
    <div class="wx-bar key"><span>Make kong</span><i><b class="e" style="--v:81"></b></i><em>0.81</em></div>
    <div class="wx-bar"><span>Store laptop</span><i><b class="s" style="--v:72"></b></i><em>0.72</em></div>
    <div class="wx-bar"><span>Pick from conveyor</span><i><b class="s" style="--v:71"></b></i><em>0.71</em></div>
    <div class="wx-bar"><span>Build tower</span><i><b class="s" style="--v:69"></b></i><em>0.69</em></div>
    <div class="wx-bar"><span>Fill pen holder</span><i><b class="s" style="--v:67"></b></i><em>0.67</em></div>
    <div class="wx-bar"><span>Stack blocks</span><i><b class="s" style="--v:67"></b></i><em>0.67</em></div>
    <div class="wx-bar"><span>Fold clothes</span><i><b class="s" style="--v:61"></b></i><em>0.61</em></div>
    <div class="wx-bar"><span>Bottles into bin</span><i><b class="s" style="--v:60"></b></i><em>0.60</em></div>
    <div class="wx-bar"><span>Classify objects</span><i><b class="s" style="--v:60"></b></i><em>0.60</em></div>
    <div class="wx-bar"><span>Cover blocks</span><i><b class="s" style="--v:49"></b></i><em>0.49</em></div>
  </div>
</div>

Each dot below is one neuron. Play a recorded attempt and watch which ones light up before a grab, at a release, or only in failed tries. In the [neuron viewer](https://pi05-weight-edit.vercel.app/neurons/), tap any neuron to see its strongest moments and the joints it moves.

<video class="wx-ex" src="explorer.mp4" poster="explorer_poster.jpg" autoplay muted loop playsinline preload="metadata" aria-label="The neuron viewer: dots light up as neurons fire"></video>

## 02 · Find the failure, flip it

Claude built a small algorithm to find where each task's failures live in the brain, then edited only those neurons. No gradients, just a direct write to **0.004% of the weights**.

<ol class="wx-steps">
  <li><b>Record</b><span>48 stock attempts per task, good and failed.</span></li>
  <li><b>Compare</b><span>In each layer, find the pattern that separates failed grabs from good ones. Check it on held-out attempts.</span></li>
  <li><b>Target</b><span>Pick the 2 layers where it is clearest and the 64 neurons in each that write it most.</span></li>
  <li><b>Flip</b><span>Reverse the pattern in those 128 neurons. Score the edited robot.</span></li>
</ol>

Make kong, where the neurons gave failure away most clearly, jumped from **23% to 36%**. On layouts the robot had never been scored on, it still led: 24% vs 17%. Over all 141 runs: 31% vs 21%.

<div class="wx-pair wx-wide"><div class="wx-lab"><span>stock π0.5</span><span>after the edit</span></div><video src="pair_kong.mp4" poster="pair_kong_poster.jpg" autoplay muted loop playsinline preload="metadata"></video></div>

*Make kong, unseen layout, same seed, 1.2× speed. Stock knocks a tile loose and runs out of time. The edited robot finishes in 15 s.*

<div class="wx-chart">
  <div class="wx-legend"><i class="s"></i>stock π0.5 <i class="e"></i>after the edit</div>
  <div class="wx-bars">
    <div class="wx-grp">make kong · held-out layouts · 87 runs</div>
    <div class="wx-bar"><span>Stock</span><i><b class="s" style="--v:23"></b></i><em>23%</em></div>
    <div class="wx-bar"><span>After the edit</span><i><b class="e" style="--v:36"></b></i><em>36%</em></div>
    <div class="wx-grp">make kong · unseen layouts · 54 runs</div>
    <div class="wx-bar"><span>Stock</span><i><b class="s" style="--v:17"></b></i><em>17%</em></div>
    <div class="wx-bar"><span>After the edit</span><i><b class="e" style="--v:24"></b></i><em>24%</em></div>
  </div>
</div>

## 03 · Where the flip helped

We ran the same recipe on all 10 tasks, from 48 new attempts on each, at two strengths: remove the failure pattern (flip) or reverse it (flip 2×). It raised success on **5 of the 10 tasks**. On Make kong and Classify objects, the gain held up on layouts the robot had never been scored on.

<div class="wx-chart">
  <div class="wx-t">Success over 90 held-out runs per task (kong 87)</div>
  <div class="wx-legend"><i class="s"></i>stock π0.5 <i class="e"></i>best neuron flip</div>
  <div class="wx-bars">
    <div class="wx-grp">make kong · flip 2× · +13 points</div>
    <div class="wx-bar"><span>Stock</span><i><b class="s" style="--v:23"></b></i><em>23%</em></div>
    <div class="wx-bar key"><span>Flip 2×</span><i><b class="e" style="--v:36"></b></i><em>36%</em></div>
    <div class="wx-grp">classify objects · flip · +5 points</div>
    <div class="wx-bar"><span>Stock</span><i><b class="s" style="--v:16"></b></i><em>16%</em></div>
    <div class="wx-bar"><span>Flip</span><i><b class="e" style="--v:21"></b></i><em>21%</em></div>
    <div class="wx-grp">store laptop · flip · +5 points</div>
    <div class="wx-bar"><span>Stock</span><i><b class="s" style="--v:7"></b></i><em>7%</em></div>
    <div class="wx-bar"><span>Flip</span><i><b class="e" style="--v:12"></b></i><em>12%</em></div>
    <div class="wx-grp">pick from conveyor · flip 2× · +4 points</div>
    <div class="wx-bar"><span>Stock</span><i><b class="s" style="--v:14"></b></i><em>14%</em></div>
    <div class="wx-bar"><span>Flip 2×</span><i><b class="e" style="--v:18"></b></i><em>18%</em></div>
    <div class="wx-grp">bottles into bin · flip and flip 2× · +3 points</div>
    <div class="wx-bar"><span>Stock</span><i><b class="s" style="--v:73"></b></i><em>73%</em></div>
    <div class="wx-bar"><span>Flip</span><i><b class="e" style="--v:76"></b></i><em>76%</em></div>
  </div>
</div>

We retested every gain of 5 points or more on unseen layouts:

| Stock → flip | Held-out runs | Unseen layouts | All runs |
|---|---|---|---|
| Make kong, flip 2× | 23% → **36%** | 17% → **24%** | 21% → **31%** |
| Classify objects, flip | 16% → **21%** | 15% → **26%** | 15% → **22%** |
| Store laptop, flip | 7% → **12%** | 19% → 11% | 9% → **12%** |

**It works where the brain is readable.** The clearer the failure signal, the more the flip helped (r = 0.69 across 10 tasks). Kong's signal was the clearest of all, and so was its gain.

<div class="wx-chart">
  <div class="wx-t">Failure signal vs gain from the flip</div>
  <svg class="wx-scatter" viewBox="0 0 520 300" role="img" aria-label="Scatter of failure-signal AUROC against gain in points for 10 tasks. Make kong is highest at 0.81 and +13; Cover blocks lowest at 0.49 and −12.">
    <line class="g" x1="108" y1="20" x2="108" y2="250"/><line class="g" x1="220" y1="20" x2="220" y2="250"/>
    <line class="g" x1="332" y1="20" x2="332" y2="250"/><line class="g" x1="444" y1="20" x2="444" y2="250"/>
    <line class="z" x1="52" y1="135" x2="500" y2="135"/>
    <text class="m" x="44" y="62" text-anchor="end">+10</text><text class="m" x="44" y="139" text-anchor="end">0</text><text class="m" x="44" y="216" text-anchor="end">−10</text>
    <text class="m" x="108" y="270" text-anchor="middle">0.5</text><text class="m" x="220" y="270" text-anchor="middle">0.6</text>
    <text class="m" x="332" y="270" text-anchor="middle">0.7</text><text class="m" x="444" y="270" text-anchor="middle">0.8</text>
    <text class="m" x="276" y="293" text-anchor="middle">failure signal (AUROC, 0.5 = chance)</text>
    <text class="m" x="500" y="152" text-anchor="end">no change</text>
    <text class="m" x="52" y="12">gain, points</text>
    <circle class="k" cx="455.2" cy="38.4" r="7"/><text x="445" y="43" text-anchor="end" font-weight="600">Make kong</text>
    <circle cx="354.4" cy="92.8" r="6"/><text x="363" y="89">Laptop</text>
    <circle cx="344.3" cy="108.9" r="6"/><text x="353" y="118">Conveyor</text>
    <circle cx="320.8" cy="143.4" r="6"/><text x="330" y="156">Tower</text>
    <circle cx="298.4" cy="177.9" r="6"/><text x="307" y="175">Stack</text>
    <circle cx="298.4" cy="186.4" r="6"/><text x="307" y="199">Pen</text>
    <circle cx="231.2" cy="143.4" r="6"/><text x="240" y="160">Fold</text>
    <circle cx="220" cy="117.4" r="6"/><text x="211" y="126" text-anchor="end">Bottles</text>
    <circle cx="214.4" cy="92.8" r="6"/><text x="205" y="90" text-anchor="end">Classify</text>
    <circle cx="95.7" cy="228.5" r="6"/><text x="105" y="233">Cover</text>
  </svg>
</div>

## 04 · Brain math: copy-paste what a robot learned

Training a robot on extra folding demos changes its weights. Training it the same way without folding changes them too. Subtract one from the other and what's left is the folding know-how. Claude added it to the stock robot. The edit itself took no training, just arithmetic in minutes on a CPU.

<div class="wx-math" role="img" aria-label="Stock π0.5 plus fold-tuned copy minus plain-tuned copy equals a robot that folds 70% of the time">
  <div class="wx-chip s"><b>stock π0.5</b><span>folds 51%</span></div><span class="wx-op">+</span>
  <div class="wx-chip"><b>fold-tuned copy</b><span>trained with folding</span></div><span class="wx-op">−</span>
  <div class="wx-chip"><b>plain-tuned copy</b><span>trained without it</span></div><span class="wx-op">=</span>
  <div class="wx-chip e"><b>folds 70%</b><span>no training</span></div>
</div>

<div class="wx-chart">
  <div class="wx-t">Fold clothes, success over 90 held-out runs</div>
  <div class="wx-bars">
    <div class="wx-bar"><span>Stock π0.5</span><i><b class="s" style="--v:51"></b></i><em>51%</em></div>
    <div class="wx-bar"><span>Fold-tuned copy</span><i><b style="--v:68"></b></i><em>68%</em></div>
    <div class="wx-bar key"><span>Stock + the pasted change</span><i><b class="e" style="--v:70"></b></i><em>70%</em></div>
  </div>
</div>

The pasted change does as well as the fine-tuned copy it came from (p ≈ 0.01 vs stock). On 75 runs in layouts neither model had seen, it still leads, 56% vs 48%.

<div class="wx-pair wx-wide"><div class="wx-lab"><span>stock π0.5</span><span>after the edit</span></div><video src="pair_14.mp4" poster="pair_14_poster.jpg" autoplay muted loop playsinline preload="metadata"></video></div>

*Unseen layout 44. The edited robot folds in 12 s.*

## 05 · Two things that didn't work

- **Merging every task into one brain.** Adding five tasks' changes at once scored 0% everywhere. One change at a time is the way.
- **Flipping neurons on folding.** Laundry failures are small slips that differ every time, so there is no single pattern to flip (42–50% vs 51%). The copy-paste above is what worked there.

## 06 · Robots might get solved by LLMs writing weights

We pictured robotics getting solved the slow way: more demos, bigger models, longer training runs. We now think a shortcut may come first.

Today an LLM can read a robot's neurons, find the ones behind a failure, and copy-paste what one robot brain learned into another, in minutes and with no training. Next, it writes the weights for a new task directly. This is the first spark.

<details markdown="1">
<summary>All numbers, every edit we tried</summary>

| Success, held-out runs | Stock | Blend of 3 | Multi-task paste | Neuron flip | Neuron flip 2× |
|---|---|---|---|---|---|
| Make kong | 23% | 20% | 24% | 22% | **36%** |
| Classify objects | 16% | 14% | 7% | 21% | 11% |
| Store laptop | 7% | 8% | 8% | 12% | 9% |
| Pick from conveyor | 14% | 17% | 17% | 12% | 18% |
| Bottles into bin | 73% | 76% | 61% | 76% | 76% |
| Build tower | 40% | 39% | 19% | 39% | 18% |
| Fold clothes | 51% | 32% | 52% | 42% | 50% |
| Stack blocks | 19% | 14% | 13% | 13% | 12% |
| Fill pen holder | 11% | 8% | 2% | 4% | 2% |
| Cover blocks | 12% | 4% | 10% | 0% | 0% |

*90 held-out runs per cell (kong 87): 3 seeds × 30 layouts, scored by the simulator's own success check.*

</details>

---

All runs are RoboDojo simulation (Isaac Sim), seeds 0–2, scored by the simulator's own success check. Live results and the full neuron viewer: [pi05-weight-edit.vercel.app](https://pi05-weight-edit.vercel.app/). Related: task arithmetic (Ilharco et al., 2023), model soups (Wortsman et al., 2022), ExPO (Zheng et al., 2024), and [Sparks of Weight-Space Programming](https://rikiyat.github.io/blog/weight-space-programming/).
