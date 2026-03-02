---
applyTo: "**/*.cs"
---

# C# Coding Conventions

Apply these conventions consistently across all C# code.

## Principles
- Prefer clarity and readability over cleverness.
- Use modern C# language features when they improve clarity.
- Avoid outdated constructs unless required for compatibility.
- Keep examples and code resilient to copy/paste and later edits.

## Tooling
- Prefer enforcing rules via `.editorconfig` and analyzers when available.
- If there is a conflict between local project conventions and these rules, follow the project's `.editorconfig` and documented standards.


# Language Guidelines

## Modern C#
- Use modern C# features where they make code clearer.
- Avoid outdated language constructs.

## Exceptions
- Only catch exceptions you can properly handle.
- Avoid catching `System.Exception` unless using an exception filter and you are explicitly demonstrating why.
- Prefer specific exception types and meaningful error messages.

## Async
- Use `async` / `await` for I/O-bound work.
- Be mindful of deadlocks.
- Use `Task.ConfigureAwait(...)` when appropriate for library code.

## Type names
- Use language keywords for built-in types:
  - `string` not `System.String`
  - `int` not `System.Int32`
  - Include `nint` / `nuint` where appropriate.

## Integers
- Prefer `int` over unsigned integer types.
- Use unsigned types only when the domain requires them and it improves correctness.

## `var` usage
- Use `var` only when the type is obvious from the right-hand side.
- Use explicit types when the reader cannot easily infer the type.

## `foreach` typing
- Do not use `var` for the loop variable in `foreach` when the element type is not obvious from the collection.
- Use explicit element typing in `foreach` for readability.

## LINQ results
- Use `var` for LINQ query results when they are anonymous types or deeply nested generics and `var` improves readability.
- Be careful not to change the iterable type accidentally (for example, switching from `IQueryable` to `IEnumerable`), as it may change query execution behavior.


# Comment Style

- Use single-line comments (`//`) for brief explanations.
- Avoid multi-line comments (`/* */`) for longer explanations.
- For methods, classes, fields, and all public members, use XML documentation comments.

## Formatting
- Put comments on their own line, not at the end of a code line.
- Start comment text with an uppercase letter.
- End comment text with a period.
- Use exactly one space after `//`.


# Style Guidelines and Layout

## Indentation and whitespace
- Use 4 spaces for indentation.
- Do not use tab characters.

## Line length and wrapping
- Keep lines reasonably short (docs guidance targets around 65 chars).
- Break long statements into multiple lines for readability.
- When breaking lines around binary operators, put the line break before the operator.

## Braces
- Use Allman style braces:
  - Opening brace on a new line.
  - Closing brace on its own line aligned with the current indentation level.

## Layout conventions
- One statement per line.
- One declaration per line.
- For continuation lines not auto-indented, indent one tab stop (4 spaces).
- Leave at least one blank line between method definitions and property definitions.
- Use parentheses to make expression clauses apparent when it improves clarity.


# Security

- Follow secure coding guidelines.
- Do not introduce insecure patterns (hard-coded secrets, insecure randomness, unsafe crypto, etc.).
- Prefer least privilege and secure defaults.

# String Data Conventions

- Use string interpolation for short concatenations.
- In loops or when building large strings, use `StringBuilder`.
- Prefer raw string literals over escape sequences or verbatim strings when it improves readability.
- Prefer expression-based string interpolation over positional interpolation.

# Constructors and Initialization

## Primary constructor parameters
- For `record` types: use PascalCase for primary constructor parameters.
- For `class` and `struct` types: use camelCase for primary constructor parameters.

## Required initialization
- Prefer `required` properties over constructors to force initialization of property values when appropriate.

# Arrays and Collections

- Use collection expressions to initialize collection types where supported.
  - Example: `string[] vowels = ["a", "e", "i", "o", "u"];`


# Delegates

- Prefer `Func<>` and `Action<>` over declaring custom delegate types when it improves readability.
- When creating delegate instances, prefer concise syntax.
- When a custom delegate type is truly warranted, define a method with a matching signature and keep the usage straightforward.

# Disposables and `using`

- If a `try/finally` exists only to call `Dispose`, replace it with a `using`.
- Prefer the modern `using` declaration form (no braces) when it improves clarity and reduces nesting.


# Static Members

- Access static members via the type name: `TypeName.StaticMember`.
- Do not qualify a base-class static member using a derived type name, even if it compiles.
  - This can mislead readers and can break if the derived type later introduces a same-named static member.


# LINQ Queries

- Use meaningful names for query variables (for example, `seattleCustomers`).
- Use aliases to ensure anonymous-type property names are PascalCase.
- Rename properties in results when names would be ambiguous (for example, `CustomerName` and `DistributorName` instead of two `Name` values).


# Namespaces and `using` Directives

## Namespace declarations
- Prefer file-scoped namespaces when the file contains a single namespace:
  - `namespace MySampleCode;`

## `using` placement
- Place `using` directives outside the namespace declaration.
- Reason: `using` directives inside a namespace can become context-sensitive and complicate name resolution.
- If you must place a `using` inside a namespace, use `global::` to avoid ambiguity, but the default is to keep `using` directives outside the namespace.
