You will be analyzing a code repository to identify opportunities for improvement, refactoring, and optimization. Your goal is to create a comprehensive, prioritized refactoring plan that highlights areas needing attention, ordered from most to least important.

Here is the repository content you need to analyze:

$REPOSITORY_CONTEXT_PAYLOAD_PLACEHOLDER$

Your task is to thoroughly review this repository and identify potential improvements across multiple dimensions. Consider the following categories:

**Code Quality & Maintainability:**
- Code duplication and opportunities for DRY (Don't Repeat Yourself) principles
- Complex functions or methods that should be broken down
- Poor naming conventions or unclear variable/function names
- Missing or inadequate documentation and comments
- Inconsistent code style or formatting

**Architecture & Design:**
- Violation of SOLID principles
- Tight coupling between components
- Missing abstraction layers
- Inappropriate design patterns or missing patterns where they would help
- Circular dependencies

**Performance:**
- Inefficient algorithms or data structures
- N+1 query problems or database inefficiencies
- Memory leaks or excessive memory usage
- Unnecessary computations or redundant operations

**Security:**
- Hardcoded credentials or sensitive data
- SQL injection or XSS vulnerabilities
- Missing input validation
- Insecure dependencies or outdated packages

**Testing & Reliability:**
- Missing test coverage
- Lack of error handling
- Missing logging or monitoring
- Brittle or flaky tests

**Technical Debt:**
- Deprecated API usage
- Outdated dependencies
- TODO comments or temporary fixes that became permanent
- Dead code or unused imports

For each improvement you identify, assess two key dimensions:

1. **Priority** (Critical/High/Medium/Low) based on:
    - Impact on functionality, security, or performance
    - Risk if left unaddressed
    - Frequency of use of the affected code

2. **Complexity** (Simple/Moderate/Complex/Very Complex) based on:
    - Time and effort required
    - Number of files/components affected
    - Risk of introducing bugs
    - Need for testing or validation

## Analysis Process

Before creating your final refactoring plan, work through your thinking inside `<analysis>` tags. In this section, follow these steps systematically:

1. **Repository Structure Overview**: List out all files and directories in the repository to ensure you have a complete picture of what you're analyzing.

2. **Category-by-Category Review**: Go through each category systematically and identify specific issues:
    - Code Quality & Maintainability: List each issue you find with file names and line numbers
    - Architecture & Design: List each issue you find with file names and affected components
    - Performance: List each issue you find with file names and specific problems
    - Security: List each issue you find with file names and vulnerability details
    - Testing & Reliability: List each issue you find with file names and gaps
    - Technical Debt: List each issue you find with file names and specifics

3. **Preliminary Issue List**: Create a complete, unordered list of all issues you've identified across all categories, with their locations and brief descriptions.

4. **Priority Assessment**: For each issue in your preliminary list, explicitly evaluate its priority (Critical/High/Medium/Low) and explain your reasoning.

5. **Complexity Assessment**: For each issue in your preliminary list, explicitly evaluate its complexity (Simple/Moderate/Complex/Very Complex) and explain your reasoning.

6. **Dependency Mapping**: Note any dependencies between refactoring tasks (e.g., "Issue X should be addressed before Issue Y").

7. **Final Ordering**: Sort your issues into priority groups (Critical, High, Medium, Low) and within each group consider complexity and dependencies.

It's OK for this section to be quite long - thoroughness is more important than brevity here.

## Output Requirements

IMPORTANT: DO NOT include the analysis work from the thinking block in the final output.
After completing your analysis, create a refactoring plan in **pure markdown format**. Your markdown output should follow this structure:

```markdown
$DOCUMENTATION_TEMPLATE$
```
## Important Notes

- Be specific with file names, function names, and line numbers where possible
- Consider the practical constraints of implementation when ordering your recommendations
- Ensure your entire refactoring plan after the analysis is in pure markdown format without any XML tags
- Include estimated effort for each item to help with sprint planning
- Group related improvements together when they should be tackled as a unit
- Highlight any dependencies between refactoring tasks
  $LANGUAGE_INSTRUCTION$
Begin your analysis now.