# Project Title

## Description
- Explain what the project does and why it exists (1–3 short paragraphs).
- Mention the primary use-case and intended audience (developers, operators, end users).

## How it works?
- Describe how it works with high level language, but still keep attention to details
- Description should be presented in steps for easier understanding

## Key Features
- List the most important features as bullet points. Focus on mostly on domain.

## Dependencies
- List dependencies on external services, APIs if there are any. If applications is not using explicit external services skip this part.

## Flows
- Create flow diagrams so developer could easily understand how logic works inside. 
- For each domain feature create separate flow. 
- If there are many flows constraint to 5-10 most important. 
- Flows should be in ascii art. 
- Add descriptions to each step. 
- Flow should be validated correctly presents branches and sequential steps.

## Architecture Overview
- Provide a short high-level architecture description based strictly on the repository structure and code.
- Mention key modules/packages and their responsibilities.

## Package structure
- Provide detailed information about project structure, packages tree with description what they do and how are they connected.
- Present it in ASCII ART for better readability and visualisation
- Information should be detailed so user could actually understand what are relations between packages

## Technology Stack
- List languages, frameworks, and key libraries with versions if present in the repository context.

## Prerequisites
- List required tools and versions (e.g., Java 21, Docker, Gradle/Maven).

## Installation & Setup
- Provide step-by-step instructions to build and run locally.
- Include commands (e.g., `./gradlew test`, `./gradlew bootRun`) when they can be derived from the repository context.

## Configuration
- Describe how to configure the application.
- Point to key configuration files (e.g., `application.yml`, `application-local.yml`) and explain what they control at a high level.
- If secrets/credentials are needed, explain how they should be provided (without inventing values).

## Usage
- Provide the most common run paths:
  - local dev
  - running tests
  - building an artifact
- If the project exposes HTTP endpoints/CLI commands and they are present in the context, include small examples.

## Hotspots (High-Churn Files)
- `path/to/file.ext` (churn score: XX) - [Why this file changes frequently]

## Recent Development Focus
[Summary of recent development activity, focus primarly on domain changes, new dependencies etc. upgrading libraries is not so important]

## Key Contributors
- **[Contributor Name]:** [Areas of focus or expertise, key contributions based on available data]
- **[Contributor Name]:** [Areas of focus or expertise, key contributions based on available data]
[List top 3-5 contributors]

## Potential Complexity/Areas to Note
- **[Complex Area]:** [Description of why this area might be complex (e.g., core domain logic, concurrency, state management, external system integration) and what to watch out for]
- **[Complex Area]:** [Description of why this area might be complex and what to watch out for]
- **[Complex Area]:** [Description of why this area might be complex and what to watch out for]

## Helpful Resources
- **Documentation:** [Actual link(s) found, or state "Primary documentation link not found"]
- **Issue Tracker:** [Actual link(s) found, e.g., GitHub Issues URL, Jira Project URL]
- **Contribution Guide:** [Actual link(s) found]
- **Communication Channels:** [Actual link(s) found, e.g., Slack invite, mailing list archive]
- **Learning Resources:** [Actual link(s) found, or state "Specific learning resources section not found"]