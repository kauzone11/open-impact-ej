# Security Policy

Please report vulnerabilities privately by opening a GitHub security advisory when available, or by contacting the maintainers through the repository owner.

Do not open public issues containing:

- credentials or tokens;
- private event datasets;
- personally identifiable information;
- exploit details that could harm deployed instances.

The project is an MVP and should not be deployed with sensitive production data without an independent security review.

## Deployment practices

- Use environment variables for database URLs and deployment configuration.
- Do not commit production databases, exports, respondent lists, or logs.
- Review hosting, backup, and retention policies before collecting real responses.
- Prefer anonymous questionnaires unless a documented use case requires identification.
