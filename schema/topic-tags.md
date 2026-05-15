# topic_tag controlled vocabulary

Assign exactly one tag per row. Tags group equivalent requirements across jurisdictions so the Compare matrix can align them in the same row.

**Rules:**
- Never rename an existing tag (RegIntel diffs on tag values)
- Add new tags as needed — append to the relevant section below
- Use `null` only for rows with no standard cross-state equivalent

---

## CNA — Initial

| tag | covers |
|---|---|
| `cna_initial_training_hrs` | Total minimum training hours (initial program) |
| `cna_initial_clinical_hrs` | Supervised clinical hours within initial training |
| `cna_competency_eval` | Skills / competency evaluation (initial) |
| `cna_registry_listing` | State nurse aide registry registration |

## CNA — Ongoing

| tag | covers |
|---|---|
| `cna_inservice_annual` | Annual in-service training hours |
| `cna_dementia_annual` | Annual dementia care in-service |
| `cna_competency_eval_annual` | Annual skills re-evaluation |

## LPN / LVN

| tag | covers |
|---|---|
| `lvn_ce_continuing` | Total CE hours per renewal cycle |
| `lvn_ce_dementia` | Dementia-specific CE hours |
| `lvn_iv_therapy` | IV therapy authorization training |
| `lvn_scope_relevance` | CE scope-of-practice relevance filter |

## RN / APRN

| tag | covers |
|---|---|
| `rn_ce_continuing` | Total CE hours per renewal cycle |
| `rn_ce_dementia` | Dementia-specific CE |
| `rn_delegation_training` | Delegation / supervision training |

## Administrator

| tag | covers |
|---|---|
| `admin_licensure_initial` | Initial NHA / administrator licensure |
| `admin_licensure_renewal` | License renewal requirements |
| `admin_ce_continuing` | CE hours per renewal cycle |
| `admin_ce_dementia` | Dementia-specific CE for administrators |
| `admin_initial_training_hrs` | Initial certification program hours |

## All staff — mandatory

| tag | covers |
|---|---|
| `staff_abuse_prevention` | Abuse, neglect, exploitation identification and reporting |
| `staff_residents_rights` | Residents' rights, dignity, autonomy |
| `staff_infection_control` | Infection control and standard precautions |
| `staff_fire_emergency` | Fire safety and emergency response |
| `staff_hipaa_privacy` | HIPAA and patient privacy |
| `staff_mandated_reporter` | Mandated reporter obligations (elder/dependent adult abuse) |
| `staff_cultural_competency` | Cultural competency and sensitivity |

## State-specific mandatory topics

| tag | covers |
|---|---|
| `implicit_bias` | Implicit bias awareness training |
| `human_trafficking` | Human trafficking identification and reporting |
| `domestic_violence` | Domestic violence identification and intervention |
| `hiv_aids` | HIV/AIDS awareness and confidentiality |
| `lgbtq_sensitivity` | LGBTQ+ and underserved population sensitivity |

## Facility systems

| tag | covers |
|---|---|
| `qapi_participation` | Quality Assurance and Performance Improvement |
| `emergency_preparedness` | Emergency preparedness planning and coordination |
| `infection_control_program` | Infection control officer / program requirements |
| `grievance_officer` | Grievance officer designation and procedures |
