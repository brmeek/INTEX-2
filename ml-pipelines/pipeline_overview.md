# IS 455 — ML Pipeline Overview (Submission-Aligned)
### Philippine NGO: At-Risk Girls Program
**Team Project | 5 Machine Learning Pipelines**

---

## Notebook Locations and Names

Final submission-ready notebooks are in:

`ml-pipelines/`

1. `donor-churn-prediction.ipynb`
2. `resident-reintegration-readiness.ipynb`
3. `social-media-donation-conversion.ipynb`
4. `safehouse-education-outcome-forecasting.ipynb`
5. `in-kind-donation-value-prediction.ipynb`

---

## Quick Reference

| # | Pipeline | Domain | Target Variable | Goal Type |
|---|---|---|---|---|
| 1 | Donor Churn Prediction | Donor Management | `churned` (binary) + OLS on giving | Predictive + Explanatory |
| 2 | Resident Reintegration Readiness | Case Management | `reintegration_completed` + `risk_improved` | Predictive + Explanatory |
| 3 | Social Media Donation Conversion | Outreach / Fundraising | `log1p(donation_referrals)` + `log1p(value)` | Predictive + Explanatory |
| 4 | Safehouse Education Outcome Forecasting | Operations | `avg_education_progress` (+ threshold class) | Predictive + Explanatory |
| 5 | In-Kind Donation Value Prediction | Donor / Resource | `log1p(total_value_php)` | Predictive + Explanatory |

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
- Each notebook includes an in-notebook deployment-ready `predict(...)` function and example input.
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

### Pipeline 3 — Social Media Conversion
- Uses pre-publication-only features for predictive model.
- Explicitly excludes post-publication leakage metrics.
- Includes time-aware and random validation comparisons.

### Pipeline 4 — Safehouse Forecasting
- Uses lagged operational predictors to avoid same-month leakage.
- Uses time-based split strategy.
- Includes explanatory OLS with multicollinearity checks and robust preprocessing.

### Pipeline 5 — In-Kind Value
- Uses donation-at-receipt framing and log-target modeling.
- Uses CV for small sample context.
- Includes descriptive explanatory OLS and intake prediction function.

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
- API endpoint or service call for each `predict(...)`
- Dashboard/interactive form integration
- Demonstrable end-user workflow in video

Notebook-level IS 455 pipeline requirements are satisfied; app-level deployment integration remains the final implementation step.
