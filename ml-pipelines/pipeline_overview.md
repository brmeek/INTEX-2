# IS 455 — ML Pipeline Overview (Submission-Aligned)
### Philippine NGO: At-Risk Girls Program
**Team Project | 6 Machine Learning Pipelines**

---

## Notebook Locations and Names

Final submission-ready notebooks are in:

`ml-pipelines/`

1. `donor-churn-prediction.ipynb`
2. `resident-reintegration-readiness.ipynb`
3. `social-media-donation-conversion.ipynb`
4. `safehouse-multi-metric-success-forecasting.ipynb`
5. `in-kind-donation-value-prediction.ipynb`
6. `donor-impact-allocation-forecasting.ipynb`

---

## Quick Reference

| # | Pipeline | Domain | Target Variable | Goal Type |
|---|---|---|---|---|
| 1 | Donor Churn Prediction | Donor Management | `churned` (binary) + OLS on giving | Predictive + Explanatory |
| 2 | Resident Reintegration Readiness | Case Management | `reintegration_completed` + `risk_improved` | Predictive + Explanatory |
| 3 | Social Media Donation Conversion | Outreach / Fundraising | `log1p(donation_referrals)` + `log1p(value)` | Predictive + Explanatory |
| 4 | Safehouse Multi-Metric Success Forecasting | Operations | `avg_education_progress`, `avg_health_score`, `incident_count`, `process_recording_count`, `home_visitation_count` (+ education threshold class) | Predictive + Explanatory |
| 5 | In-Kind Donation Value Prediction | Donor / Resource | `log1p(total_value_php)` | Predictive + Explanatory |
| 6 | Donor Impact Allocation Forecasting | Donor Transparency / Impact | Program-area allocation shares + estimated residents supported | Predictive + Explanatory |

---

## IS 455 Requirement Coverage

### 1) Problem Framing
- Present in all five notebooks with explicit business question and decision context.
- Prediction vs explanation distinction is explicitly stated per pipeline.

### 2) Data Acquisition, Preparation, and Exploration
- All pipelines include table loading, joins, feature engineering, and EDA.
- Added reproducible dynamic loading utilities:
  - `_resolve_data_path()` for environment/folder discovery
  - `_safe_read_csv(...)` with required-column backfill and date parsing safeguards
- Added schema reporting messages for missing columns/date fields.

### 3) Modeling and Feature Selection
- Each notebook includes at least one predictive model and one explanatory model.
- Multiple model comparisons are present where appropriate.
- Feature selection and inclusion/exclusion rationale is documented.

### 4) Evaluation and Interpretation
- Validation strategies are used (CV, stratified CV, time split where needed).
- Metrics are aligned to task type (AUC/Recall/F1 for classification; RMSE/R2 for regression).
- Business interpretation notes added, including FP/FN tradeoff implications.

### 5) Causal and Relationship Analysis
- Dedicated relationship-analysis content included.
- Causal caution is explicitly documented (association vs causation).

### 6) Deployment Notes
- Each notebook includes an in-notebook deployment-ready prediction function and example input.
- Pipeline 4 now exposes:
  - `predict_safehouse_success_metrics(...)` for multi-target forecasts
  - `predict_safehouse_success_with_score(...)` for multi-target forecasts + composite `1-10` performance score
- Deployment notes section added in all notebooks.
- **Current status:** web/API integration is still pending and should be wired to app endpoints/components.

---

## Pipeline-Specific Compliance Notes

### Pipeline 1 — Donor Churn
- Uses churn-specific recall focus and CV for small N.
- Includes OLS explanatory analysis of giving.
- Includes leakage exclusions and segment caveats.

### Pipeline 2 — Reintegration Readiness
- Uses stratified evaluation for class imbalance.
- Excludes post-outcome visitation types and post-outcome fields.
- Includes explanatory logistic/odds-ratio interpretation.
- Includes trajectory-aware deployment output (last 3-4 months + beginning-vs-now deltas) to label resident momentum as Improving/Stable/Declining.

### Pipeline 3 — Social Media Conversion
- Uses pre-publication-only features for predictive model.
- Explicitly excludes post-publication leakage metrics.
- Includes time-aware and random validation comparisons.

### Pipeline 4 — Safehouse Multi-Metric Forecasting
- Uses lagged operational predictors to avoid same-month leakage.
- Uses time-based split strategy.
- Supports a multi-target forecasting layer across education, health, safety, and engagement metrics.
- Retains education threshold classification for continuity with dashboard framing.
- Includes a weighted composite safehouse performance score (`1-10`) derived from the predicted metrics.

### Pipeline 5 — In-Kind Value
- Uses donation-at-receipt framing and log-target modeling.
- Uses CV for small sample context.
- Includes descriptive explanatory OLS and intake prediction function.

### Pipeline 6 — Donor Impact Allocation Forecasting
- Predicts likely allocation shares across major program areas for a new monetary donation.
- Converts donation amount into estimated residents-supported proxy using historical monthly cost-per-active-resident calibration.
- Includes explanatory OLS on education allocation share with donor/channel/campaign controls.

---

## Textbook Alignment Summary

The notebooks align with the textbook lifecycle:
- Problem framing
- Data preparation + feature engineering
- Exploration
- Modeling
- Evaluation
- Feature selection
- Deployment-ready prediction interface

They also align with the textbook’s core distinction between:
- **Predictive performance** (out-of-sample metrics)
- **Explanatory interpretation** (relationship-focused, causally cautious)

---

## Remaining Work (Non-Notebook)

To be fully complete in final judging context, connect notebook model outputs to the deployed web app:
- API endpoint or service call for each pipeline prediction function (including Pipeline 4 multi-target + composite-score functions and Pipeline 6 donor-impact allocation function)
- Dashboard/interactive form integration
- Demonstrable end-user workflow in video

Notebook-level IS 455 pipeline requirements are satisfied; app-level deployment integration remains the final implementation step.

---

## Website Integration Readiness (Prepared, Not Yet Implemented)

All six pipelines are prepared for implementation in the website. They are notebook-ready with defined prediction functions and can now be wired to backend endpoints/UI components.

| Pipeline | Prediction Function(s) | Website Location | Display/Behavior |
|---|---|---|---|
| Pipeline 1 — Donor Churn | `predict_donor_churn(...)` | Admin Dashboard; Donors & Contributions page | Show churn risk flag/tier next to donor name and optionally sort by risk probability for outreach queues. |
| Pipeline 2 — Reintegration Readiness | `predict_reintegration_readiness(...)` | Caseload Inventory page | Show readiness score/tier per resident; include trajectory fields (`trend_label`, month-over-month, beginning-vs-now deltas) for case prioritization. |
| Pipeline 3 — Social Media Conversion | `predict_social_referrals(...)` | Reports & Analytics (or dedicated social planning page) | Staff enters draft post attributes and sees predicted donation referrals before publishing. |
| Pipeline 4 — Safehouse Multi-Metric Success Forecasting | `predict_safehouse_success_metrics(...)`, `predict_safehouse_success_with_score(...)` | Admin Dashboard safehouse summary cards | Monthly run. Show next-month predicted education score + alert flag, with optional expanded metrics and composite `1-10` performance score. |
| Pipeline 5 — In-Kind Donation Value | `predict_inkind_value(...)` | Donors & Contributions donation intake form | On form entry, instantly show estimated peso value for new in-kind donations. |
| Pipeline 6 — Donor Impact Allocation Forecasting | `predict_donor_impact(...)` | Donor Dashboard | For a proposed donation amount, show estimated program-area use and estimated residents supported with transparency messaging. |

### Implementation Notes
- **Prepared status:** model logic is ready; integration endpoints and UI wiring are the remaining tasks.
- **Recommended rollout:** start with Pipeline 5 (form-level real-time estimate) and Pipeline 1 (dashboard risk flag), then add Pipeline 2/4 scoring views, then Pipeline 3 planning tool.
- **Production guardrails:** log inputs/outputs, monitor drift/performance monthly, and expose "decision support only" language in admin views.
