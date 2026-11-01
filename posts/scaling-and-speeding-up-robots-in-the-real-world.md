---
title: Scaling and speeding up robots in the real world
date: 2026-09-18
authors: Pranay Gupta and Deepanshu Rohilla
description: Three levers that make robot policies run nearly four times faster than the remote-teleoperation data they learned from, without losing accuracy.
---
Speed is the final frontier that needs to be unlocked before we can see robots assisting humans in the real world.

Speeding up robots is a chicken-and-egg problem: you need deployments in the real world to collect data and iterate on models, but you need fast models in the first place to provide enough economic value to earn those deployments.

Several companies like Physical Intelligence[^pi0]<sup>,</sup>[^pi05], Skild AI, Generalist AI, Reward AI have shown impressive demos of their models working at impressive speeds, but the fundamental lever behind that is very fast demonstration data, which does not hold once you start scaling a fleet into the real world. We have spent the past few months deploying across various industries, and here is what we, along with several other companies actually deploying robots on the ground, have seen.

## Why is deployment data slow?

Operators in live deployments run two to four times slower than operators in demo setups, for a few key reasons:

1. **Assistance has to be remote to scale.** Sending an operator to every site breaks before you reach even a hundred deployments. Remote operation lets one office of trained operators serve many sites without downtime, which makes it the only viable path to human-assisted deployment at scale. Remote teleoperation is slower because it is hard to perceive depth intuitively from camera views; building a 3D environment inside a Meta Quest is a good technical solution, but nobody can use one for more than an hour without feeling nauseated.
2. **The control interface differs.** Many demo datasets use leader follower arms[^act]<sup>,</sup>[^gello], which tie operator speed to physical arm speed. Deployments need dynamic speed adjustment like going slower near humans and fragile objects, for safety, etc. Most deployments we have seen use Meta Quest controllers, which track the operator's hand and move the arm accordingly.
3. **There is no predictability.** Demo scenes are structured and learnable, so operators can act before they think. In a real deployment, an operator has to react to live cues, which is inherently slower.

## Why is slow data a problem?

Slow teleoperation hurts deployment and scaling in two ways:

1. **Weak learning signal.** Current robotics policies work by predicting the next chunk of actions. Data in which most of the motion is idle, or does not contain significant movement, carries poor information for a policy to learn from. We have seen this directly in our training runs: policies trained on such data are not only slower but usually less accurate, because each next-chunk prediction offers little progress toward completing the task.
2. **Economics.** When a policy or a teleoperator runs significantly slower than a human, it becomes impossible to create economic value for the end customer especially in environments such as kitchens and warehouses, which have been optimised around humans doing tasks quickly and efficiently.

Over the past six months we have run policies in live deployments and focused our engineering and research effort on making policies run faster than the teleoperation data they were trained on, so that we can deploy our robots at scale. We have found three levers that make policies faster while maintaining accuracy:

### 1. Adaptive speed-up of the training data

The simplest approach you could think of is to speed up the training data and then train a model on it. Unfortunately, that works poorly in practice: you lose a lot of key information when you discard frames from the data you collect. Uniformly dropping every other frame (2x) took success from **94%** to **53%**, and at 4x uniform it collapsed to **9%** for plate picking, handover between arms and release. The failures concentrated at the grasp and the release, exactly where the discarded frames carried the most information.

A better and more effective approach, also observed by many others in the field, is to treat the motion of the arms as two separate parts: free-space motion, where the arms are travelling toward their target region, and contact-rich motion, where the arms are interacting with the real world. Free-space motion contains far less information about manipulation than contact-rich motion, so it makes sense to speed up free-space motion while keeping contact-rich motion intact.

Prior works such as AutoSpeed[^autospeed], SAIL[^sail] and SRIL[^sril] have consistently used an RL head to predict contact-rich motion and perform speed-ups around it. We were able to achieve similar or better results without training an RL head at all, by simply treating any motion within x seconds of a gripper event (gripper opening or closing) as contact-rich motion; trying everything from 0.1 to 2 seconds.

We ran hundreds of ablations at 2x, 3x, 4x, 5x and 10x, and across different contact-identification techniques, and saw the best results at 4x with actions within 0.5s of gripper events being classified as contact. Beyond 4x the arm still reaches the object, but it arrives with too much residual velocity to close the gripper cleanly, and success falls off sharply.

| Free-space speed-up | End-to-end task time vs. teleop data | Success rate |
|:---|---:|---:|
| 1x (raw teleop data) | 1.00x | 94.2% |
| 2x | 1.82x | 96% |
| 3x | 2.63x | 97.4% |
| **4x** | **3.41x** | **95.6%** |
| 5x | 4.02x | 82% |
| 10x | 6.2x | 11% |

*Contact window fixed at x = 0.5 s; each row is 500 real-robot runs on the same task and scene.*

### 2. Selective chunk skipping at inference

A VLA policy predicts several chunks of future actions at once. Skipping chunks makes the policy run faster by letting the arm jump to future states, with no retraining. Doing this naively causes two problems, and both of them push the policy out of distribution quickly:

1. **Far-out predictions are less accurate.** The further out a chunk is, the less likely it is to be accurate, because the world will have changed by the time the first few actions have been executed. The general practice is to query the model often and execute only near-term chunks.
2. **Skipping causes jitter.** When you skip chunks, the arm moves through a different distribution than the training data, and the video feed from the real world no longer corresponds to the training data, which takes the model out of distribution very quickly.

To solve these issues, our approach after running thousands of tests in the real world is to estimate the risk before skipping a step. We look at the motion predicted by the policy and skip only if both of the following conditions hold:

1. **The predicted chunks sit close together in the real world.** We measure the end-effector displacement between the last pose of the current chunk and the last pose of the chunk we would skip to, and require it to stay under **x cm** at 20 chunk executions per second. That threshold is not fixed: a VLM scores the current camera view for scene complexity i.e. clutter, number of movable objects, proximity of a human into 5 buckets, and we scale the allowed displacement from **2 cm** in a clean, static scene down to **0.3 cm** in a cluttered or human-occupied one. The intuition is that displacement is only safe if the world will still look the way the policy expects when the arm arrives.
2. **There must be no gripper event inside the skipping window.**

The second condition is essential. Every time we skipped chunks through a gripper event, the task fell apart. Restricting skips to slow, contact-free motion keeps the policy in distribution. With these techniques we achieve another 22 percent speed-up over our fastest policy.

### 3. DAgger-style intervention data

Intervention data is the most useful and most unexpected lever for speeding up a model. We expected it to increase accuracy which it does, at roughly 30x the per-frame value of ordinary teleoperation data. But with no other changes, the policy also gained a 10–15 percent speed-up simply from adding intervention data, sped up using the same techniques described above.

The setup follows DAgger (Ross et al., 2011)[^dagger]. The policy runs on the robot, and an operator takes control the moment it starts to fail. We then speed up that intervention data with the same gripper-event rule from Lever 1 and retrain.

For models trained at lower speeds, intervention data barely helps with speed, so there is effectively zero speed-up. For policies trained at a faster speed, sped-up intervention data helps them grow faster and faster.

| Base policy (training-data speed) | + intervention data | Success rate | Speed vs. base policy |
|:---|:---|---:|---:|
| 1x | — | 94.2% | 1.00x |
| 1x | 200 interventions | 96.6% | 1.01x |
| 2x | — | 96% | 1.82x |
| 2x | 200 interventions | 96.2% | 1.93x |
| 4x | — | 95.6% | 3.41x |
| 4x | 200 interventions | 97.2% | **3.92x** |

### Final results

Combined, the three levers let us run our policies nearly four times (3.97x) faster than the data we collected from remote teleoperation. In the table below we report speed alongside accuracy as we add each lever:

| Configuration | Median task time | Speed vs. teleop data | Success rate |
|:---|---:|---:|---:|
| Teleoperation data (reference) | 37.3 s | 1.00x | 100% |
| Policy trained on raw data | 41.2 s | 0.9x | 94.2% |
| + Lever 1 (adaptive 4x speed-up) | 12.1 s | 3.08x | **95.6%** |
| + Lever 2 (risk-gated chunk skipping) | 9.9 s | 3.76x | 93.8% |
| + Lever 3 (sped-up intervention data) | **9.4 s** | **3.97x** | 95.2% |

**Setup.** All results are on a bimanual cell of two AgileX PiPER six-DoF arms with parallel-jaw grippers, with three RealSense cameras (one overhead, one per wrist) recorded at 20 fps, driven over CAN from a Jetson Orin NX 16 GB. The policy is π<sub>0.5</sub>[^pi05], with an action chunk of 30. Training data is 10 hours of remote teleoperation collected in the same deployment across seven days plus around one hour of usable teleoperation intervention data. Each number in the tables is 500 real-robot runs, with object positions re-randomised between runs.

### Limitations

These results come from a narrow set of tasks: picking up plates and dishes, and picking and placing objects. We have yet to test whether the gripper-event rule and the 4x optimum hold across a more diverse task set. We also have no explanation yet for why 4x outperforms both lower and higher factors.

## What comes next?

We expect our policies to soon run significantly faster than any human can control them, on specific tasks. To build superhuman policies, human data alone cannot get us there.

Human intervention data plays a role in robotics similar to the one RLHF[^instructgpt] played in the early days of LLM post-training. The field had to move past human feedback as models improved, because the models began to outperform expert annotators by too wide a margin. Robotics will hit the same wall in six to eight months.

Our next line of research is RL post-training with no humans in the loop. We plan to apply techniques in the GRPO[^grpo] and DAPO[^dapo] family to robot policies, with the goal of pushing speed beyond human capability while holding accuracy at similar levels.

## References

///Footnotes Go Here///

## Citation

Please cite this post as:

Pranay Gupta and Deepanshu Rohilla. "Scaling and speeding up robots in the real world." September 2026. <https://codnay.github.io/blog/scaling-and-speeding-up-robots-in-the-real-world/>

```bibtex
@misc{gupta2026speeding,
  title  = {Scaling and Speeding Up Robots in the Real World},
  author = {Gupta, Pranay and Rohilla, Deepanshu},
  year   = {2026},
  month  = sep,
  note   = {Blog post},
  url    = {https://codnay.github.io/blog/scaling-and-speeding-up-robots-in-the-real-world/}
}
```

[^pi0]: Kevin Black, Noah Brown, Danny Driess, et al. "π<sub>0</sub>: A Vision-Language-Action Flow Model for General Robot Control." [arXiv:2410.24164](https://arxiv.org/abs/2410.24164), 2024.
[^pi05]: Physical Intelligence, Kevin Black, Noah Brown, et al. "π<sub>0.5</sub>: a Vision-Language-Action Model with Open-World Generalization." [arXiv:2504.16054](https://arxiv.org/abs/2504.16054), 2025.
[^act]: Tony Z. Zhao, Vikash Kumar, Sergey Levine, Chelsea Finn. "Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware." RSS 2023. [arXiv:2304.13705](https://arxiv.org/abs/2304.13705).
[^gello]: Philipp Wu, Yide Shentu, Zhongke Yi, Xingyu Lin, Pieter Abbeel. "GELLO: A General, Low-Cost, and Intuitive Teleoperation Framework for Robot Manipulators." [arXiv:2309.13037](https://arxiv.org/abs/2309.13037), 2023.
[^autospeed]: Qingda Hu, Ziheng Qiu, Jieru Zhao, Zhongxue Gan, Wenchao Ding. "AutoSpeed: Annotation-Free Stage-Adaptive Motion Speed Learning for Robot Manipulation." [arXiv:2607.01051](https://arxiv.org/abs/2607.01051), 2026.
[^sail]: Nadun Ranawaka Arachchige, Zhenyang Chen, Wonsuhk Jung, et al. "SAIL: Faster-than-Demonstration Execution of Imitation Learning Policies." CoRL 2025. [arXiv:2506.11948](https://arxiv.org/abs/2506.11948).
[^sril]: Jun Xie, Zhicheng Wang, Jianwei Tan, Huanxu Lin, Xiaoguang Ma. "Subconscious Robotic Imitation Learning." [arXiv:2412.20368](https://arxiv.org/abs/2412.20368), 2024.
[^dagger]: Stéphane Ross, Geoffrey J. Gordon, J. Andrew Bagnell. "A Reduction of Imitation Learning and Structured Prediction to No-Regret Online Learning." AISTATS 2011, pp. 627–635. [arXiv:1011.0686](https://arxiv.org/abs/1011.0686).
[^instructgpt]: Long Ouyang, Jeff Wu, Xu Jiang, et al. "Training Language Models to Follow Instructions with Human Feedback." NeurIPS 2022. [arXiv:2203.02155](https://arxiv.org/abs/2203.02155).
[^grpo]: Zhihong Shao, Peiyi Wang, Qihao Zhu, et al. "DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models." [arXiv:2402.03300](https://arxiv.org/abs/2402.03300), 2024.
[^dapo]: Qiying Yu, Zheng Zhang, Ruofei Zhu, et al. "DAPO: An Open-Source LLM Reinforcement Learning System at Scale." [arXiv:2503.14476](https://arxiv.org/abs/2503.14476), 2025.
