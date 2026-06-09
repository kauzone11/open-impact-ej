# Methodology: Small Events

The MVP estimates direct economic impact for small events such as local fairs, university events, small congresses, cultural events, food events, and community initiatives.

## Scope

This methodology is suitable for small local events where a simple anonymous survey can produce a conservative estimate. Examples include local fairs, university events, small congresses, cultural events, food events, and community initiatives.

It is not suitable for large regional festivals, complex tourism studies, events with major public investment decisions, or cases that require formal input-output modeling without review by qualified analysts.

## Inputs

The questionnaire collects anonymous information:

- local resident or visitor;
- city of origin;
- whether the person came specifically for the event;
- group size;
- spending on food, transportation, shopping, and lodging;
- spending on other items;
- whether the respondent stayed overnight because of the event;
- average stay;
- whether spending is individual or group spending;
- simple event rating.

## Calculation

1. Validate each response.
2. Exclude invalid responses from the valid sample.
3. Convert group spending into per-person spending by dividing each category by group size.
4. Do not count lodging for local residents unless they report an overnight stay because of the event.
5. Sum spending categories per valid response as the observed sample total.
6. Report average spend per person.
7. Identify event-driven visitors: non-local respondents who came mainly because of the event.
8. Estimate adjusted audience as `expected audience * event-driven visitor share`.
9. Estimate direct impact as `average event-driven visitor spending * adjusted audience`.
10. Report local, visitor, and event-driven visitor counts separately.

## Formulas

```txt
normalized category spend = category spend / group size, when spending is reported for the group
observed sample total = sum(normalized category spend for all valid responses)
event-driven visitor share = event-driven visitor responses / valid responses
adjusted audience = expected audience * event-driven visitor share
direct impact estimate = average event-driven visitor spend * adjusted audience
```

## Example

If 40% of valid responses are event-driven visitors, expected audience is 500, and average event-driven visitor spending is R$ 120, the adjusted audience is 200 and the estimated direct impact is R$ 24,000.

## Double-counting cautions

- Local resident spending is reported in the observed sample but is not used as external event-driven impact.
- Visitor spending is only attributed to direct impact when the visitor came mainly because of the event.
- Group spending is divided by group size before aggregation.
- Lodging from local residents is excluded unless the response explicitly indicates overnight stay due to the event.

## What is not included

The MVP does not calculate:

- indirect impact;
- induced impact;
- employment effects;
- tax revenue;
- input-output multipliers;
- substitution effects;
- official tourism statistics.

## Responsible use

Results are estimates. They should be reviewed before being used in public reports, funding requests, policy decisions, or commercial proposals.
