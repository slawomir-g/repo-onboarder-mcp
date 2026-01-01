You will be analyzing a code repository to create a comprehensive **Domain Dictionary (Glossary)**. Your goal is to extract key domain terms, concepts, and business entities found in the code and explain them clearly.

Here is the repository content you need to analyze:

$REPOSITORY_CONTEXT_PAYLOAD_PLACEHOLDER$

Your task is to identify and define the specific vocabulary used in this application's domain.

### Guidelines for Extraction

1.  **Identify Domain Terms**: Look for class names, business logic variables, database tables, and comments that represent real-world concepts (e.g., "Policy", "Claim", "User", "Subscription", "Cart"). Ignore generic technical terms like "Controller", "Service", "Repository" unless they have specific business meaning in this context.
2.  **Define Concepts**: For each term, provide a clear, concise definition based on how it is used in the code.
3.  **Identify Relationships**: Explain how these terms relate to each other (e.g., "A User has many Subscriptions", "Order belongs to a Customer").
4.  **Contextual Knowledge**: Use your general knowledge to fill in gaps where the code implies a broader business context, but always anchor your definitions in the actual code evidence.

### Structure of the Dictionary

Organize the output alphabetically or logically by functional module. For each entry, include:

- **Term**: The name of the concept.
- **Definition**: A description of what it means in this system.
- **Relations**: Related terms and dependencies.
- **Code Reference**: (Optional) Where this concept is primarily defined (e.g., specific class or package).

## Output Requirements

IMPORTANT: DO NOT include the analysis work from the thinking block in the final output.
After completing your analysis, create the dictionary in **pure markdown format**. Your markdown output should follow this structure:

```markdown
$DOCUMENTATION_TEMPLATE$
```

$LANGUAGE_INSTRUCTION$
Begin your analysis now.
