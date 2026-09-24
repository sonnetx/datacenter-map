# Winter solar factor and off-grid band — September 23, 2026

## What changed

Model version 3 adds a ninth factor, winter solar resource, and a fifth size band, off-grid solar and battery. Every version 2 preset, lens and size band weights the new factor at zero, so version 2 scores, ranks and delivery labels are unchanged until a reader raises the slider or chooses the new band.

The prompt was feedback from an operator of solar and battery powered micro datacenters: state electricity prices and a 40% connectivity weight do not describe their economics, which turn on winter solar yield, battery autonomy, land, permitting speed, cooling, network reliability and local maintenance. Winter yield is the one of those with a public state-level source. The rest stay in the site checklist.

## Source

NASA POWER climatology API, parameter `ALLSKY_SFC_SW_DWN` (all-sky surface shortwave downward irradiance), community RE, 2001 to 2020 monthly and annual means, kWh per square metre per day. https://power.larc.nasa.gov/ Fetched September 23, 2026 at each state's 2020 Census center of population (Census CenPop2020_Mean_ST). The dataset is the SYN1DEG product at roughly 1 degree, so one grid cell stands for the state.

Two values per state are stored: `sr`, the December mean, which is the factor input because December sizes an off-grid array and battery; and `sy`, the annual mean, shown for context. Hawaii is highest in December at 3.93, Arizona 3.04, Florida 3.28; Washington 0.92, Vermont 1.06 and Alaska 0.14 are lowest. The factor scores 0 at 1.0 and 100 at 4.0, clamped, which spans the observed range.

## Cross-check

Five states were read from NREL's solar resource service (Perez-SUNY/NREL 2012, roughly 10 km cells) at the same points. December and annual means, NASA first then NREL, in kWh/m²/day: Arizona 3.04/5.80 and 3.20/5.80; Colorado 2.37/4.74 and 2.35/4.48; Florida 3.28/5.01 and 3.21/5.00; New Mexico 2.99/5.66 and 2.96/5.31; Texas 2.74/4.81 and 2.70/4.74. December differs by at most 0.16, which moves a state's factor score by at most five points. Further NREL calls were blocked by that service's ten-per-hour demonstration limit; the other 45 states are NASA only.

## Off-grid band

Starting weights: winter solar 35, community and permitting 20, natural hazard 15, cooling climate 15, connectivity 10, incentives 5; power cost, headroom and water 0. A self-powered unit buys no grid electricity and joins no interconnection queue, so price and headroom carry nothing, and most such units are air cooled. Floors are headroom 1 and permitting 3, so only permitting can raise a delivery concern. Three workload buttons set connectivity to 10 (batch inference), 25 (real-time serving) or 40 (distributed training) and leave the other weights alone.

These weights and floors are analyst judgments, like the other bands. The operator's remaining variables, battery autonomy, land cost, local maintenance depth and physical security, have no state-level public source that would survive review and are named in the methodology as unmodeled.

## Limits

One point per state is a coarse proxy for a resource that varies by a third or more within large states, and a population center is a poor stand-in for the remote sites where such units are deployed. The value describes irradiance, not the permitting, land or interconnection of a solar array. Cooling climate remains a 1 to 5 rating rather than a measured temperature series.
