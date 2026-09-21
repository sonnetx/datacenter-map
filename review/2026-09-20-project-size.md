# Project size and scenario sharing — September 20, 2026

## What changed

The interface gains a project size selector with four bands: edge or micro (under 5 MW), enterprise or colocation (5 to 50 MW), hyperscale (50 to 300 MW) and gigawatt campus (300 MW and up). A band loads a starting weight profile and sets the headroom and permitting ratings a project of that scale needs before its delivery concerns read as lower. The delivery rule is now expressed against those floors. At or above the floor is lower concern, one level below is elevated, two or more below is major, and the worse of the two factors sets the level.

Hyperscale uses floors of 3 and 3, which reproduces the version 2 rule exactly (1 major, 2 elevated, 3 to 5 lower). The page opens on hyperscale with Balanced weights, so every default score, rank and delivery label is unchanged. The model version stays at 2.

The page address now records the scenario (size, weights, view, ranking rule, price anchors, figure, shortlist), a button copies it, and another draws a 1200 by 675 pixel share image. A top and bottom five card sits under the figure legend.

## Basis for the profiles and floors

The weight profiles and floors are analyst judgments about how project scale changes what matters. They are not derived from a dataset.

- Edge sites of a few megawatts connect at distribution voltage and rarely wait in a transmission queue, so headroom carries little weight and a headroom rating of 2 still reads as lower concern. They are placed for latency and fiber, so connectivity dominates. Many are air cooled, so water carries no weight.
- Enterprise and colocation projects match the existing Connectivity first preset and need ordinary utility service. Permitting at 2 is tolerable because they are usually built in existing industrial zoning.
- Hyperscale keeps the version 2 thresholds.
- Gigawatt campuses need a transmission-level interconnection and a receptive utility, so headroom at 3 reads as elevated and 2 as major. They draw local opposition at a scale that permitting at 2 does not survive, so permitting stays at 3.

No state rating changed. The floors do not read momentum, reception or regulation, and the model tests confirm those fields stay independent of fit and rank.

## Limits

Size is a band, not a load figure, and the floors are the same across every state in a band. A utility territory with a fast large-load process in a state rated 3 is invisible to this rule. The profiles say how a project of that scale might weigh the factors, not how any named operator does.
