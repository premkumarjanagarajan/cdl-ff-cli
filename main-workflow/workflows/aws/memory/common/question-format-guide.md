# Question Format Guide

## MANDATORY: All Questions Must Use This Format

### Rule: Never Ask Questions in Chat
**CRITICAL**: You must NEVER ask questions directly in the chat. ALL questions must be placed in dedicated question files.

### Question File Format

#### File Naming Convention
- Use descriptive names: `{phase-name}-questions.md`
- Examples:
  - `classification-questions.md`
  - `requirements-questions.md`
  - `story-planning-questions.md`
  - `design-questions.md`

#### Question Structure
Every question must include meaningful options plus "Other" as the last option:

```markdown
## Question [Number]
[Clear, specific question text]

A) [First meaningful option]
B) [Second meaningful option]
[...additional options as needed...]
X) Other (please describe after [Answer]: tag below)

[Answer]: 
```

**CRITICAL**: 
- "Other" is MANDATORY as the LAST option for every question
- Only include meaningful options - don't make up options to fill slots
- Use as many or as few options as make sense (minimum 2 + Other)

### Complete Example

```markdown
# Requirements Clarification Questions

Please answer the following questions to help clarify the requirements.

## Question 1
What is the primary user authentication method?

A) Username and password
B) Social media login (Google, Facebook)
C) Single Sign-On (SSO)
D) Multi-factor authentication
E) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 2
Will this be a web or mobile application?

A) Web application
B) Mobile application
C) Both web and mobile
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 3
Is this a new project or existing codebase?

A) New project (greenfield)
B) Existing codebase (brownfield)
C) Other (please describe after [Answer]: tag below)

[Answer]: 
```

### User Response Format
Users will answer by filling in the letter choice after [Answer]: tag:

```markdown
## Question 1
What is the primary user authentication method?

A) Username and password
B) Social media login (Google, Facebook)
C) Single Sign-On (SSO)
D) Multi-factor authentication

[Answer]: C
```

### Reading User Responses
After user confirms completion:
1. Read the question file
2. Extract answers after [Answer]: tags
3. Validate all questions are answered
4. Proceed with analysis based on responses

### Multiple Choice Guidelines

#### Option Count
- Minimum: 2 meaningful options + "Other" (A, B, C)
- Typical: 3-4 meaningful options + "Other" (A, B, C, D, E)
- Maximum: 5 meaningful options + "Other" (A, B, C, D, E, F)
- **CRITICAL**: Don't make up options just to fill slots - only include meaningful choices

#### Option Quality
- Make options mutually exclusive
- Cover the most common scenarios
- Only include meaningful, realistic options
- **ALWAYS include "Other" as the LAST option** (MANDATORY)
- Be specific and clear
- **Don't make up options to fill A, B, C, D slots**

#### Good Example:
```markdown
## Question 5
What database technology will be used?

A) Relational (PostgreSQL, MySQL)
B) NoSQL Document (MongoDB, DynamoDB)
C) NoSQL Key-Value (Redis, Memcached)
D) Graph Database (Neo4j, Neptune)
E) Other (please describe after [Answer]: tag below)

[Answer]: 
```

#### Bad Example (Avoid):
```markdown
## Question 5
What database will you use?

A) Yes
B) No
C) Maybe

[Answer]: 
```

### Workflow Integration

#### Step 1: Create Question File
```markdown
Create specs/{BRANCH_NAME}/{phase-name}-questions.md with all questions
```

#### Step 2: Inform User and Offer Response Mode
```
"I've created {phase-name}-questions.md with [X] questions. 

**How would you like to proceed?**

1️⃣ **Answer Manually** — Fill in the [Answer]: tags yourself in the document. Let me know when you're done.
2️⃣ **AI Best Judgement** — I will answer ALL questions using my best judgement based on available context. You then review and override any answers you disagree with.

Please choose option 1 or 2."
```

#### Step 3: Handle Response Mode

**If user chooses "Answer Manually" (Option 1)**:
- Wait for user to say "done", "completed", "finished", or similar.

**If user chooses "AI Best Judgement" (Option 2)**:
- Execute the **AI Best Judgement Mode** (see section below).

#### Step 4: Read and Analyze
```
Read specs/{BRANCH_NAME}/{phase-name}-questions.md
Extract all answers
Validate completeness
Proceed with analysis
```

---

### AI Best Judgement Mode

**Purpose**: Allow the AI to answer question iterations using its best judgement based on the available context (codebase, requirements, prior decisions, domain knowledge), reducing human effort on questions where the AI has sufficient context to reason well.

**CRITICAL**: AI Best Judgement does NOT remove human oversight. All AI-generated answers MUST be reviewed and approved by the user before proceeding.

#### How It Works

1. **AI Fills Answers**: For each question, the AI selects the best option and fills in the `[Answer]:` tag
2. **AI Provides Reasoning**: For each answer, the AI adds a `[Reasoning]:` tag explaining WHY that option was chosen
3. **AI Marks Answers**: Each AI-generated answer is prefixed with `[AI-Generated]` so it is clearly distinguishable from human answers
4. **User Reviews**: The user reviews all AI-generated answers and can override any they disagree with
5. **Proceed After Review**: Only after the user confirms the answers (with any overrides) does the workflow proceed

#### AI Best Judgement Answer Format

When using AI Best Judgement, each question's answer section is formatted as:

```markdown
## Question [Number]
[Clear, specific question text]

A) [First meaningful option]
B) [Second meaningful option]
C) [Third meaningful option]
X) Other (please describe after [Answer]: tag below)

[Answer]: [AI-Generated] B
[Reasoning]: Based on [specific context, artifact, or prior decision], option B is the best fit because [explanation]. [Reference to supporting evidence if available.]
```

#### AI Reasoning Guidelines

When generating best judgement answers, the AI MUST:
- **Reference concrete context**: Cite specific files, prior decisions, requirements, or codebase evidence
- **Explain trade-offs**: If multiple options are viable, explain why the chosen one is preferred
- **Flag low-confidence answers**: If the AI is uncertain, prefix the reasoning with `⚠️ LOW CONFIDENCE:` and explain what information is missing
- **Never fabricate context**: Only reference information that actually exists in the workspace or conversation
- **Be conservative**: When genuinely uncertain, prefer the safer/simpler option and explain why

#### Low Confidence Handling

If the AI has low confidence on a question, it should:

```markdown
[Answer]: [AI-Generated] C
[Reasoning]: ⚠️ LOW CONFIDENCE: I selected C based on [limited evidence], but this could also be A if [condition]. This question would benefit from human input.
```

#### User Review Process

After the AI fills all answers:
1. **Inform User**: 
```
"I've filled all [X] questions using my best judgement. Each answer includes my reasoning.

⚠️ [Y] answers are marked as LOW CONFIDENCE and would benefit from your review.

Please review the answers in {phase-name}-questions.md:
- ✅ If you agree with an answer, no action needed
- ✏️ To override, replace the answer letter after [Answer]: (remove the [AI-Generated] prefix)
- Let me know when your review is complete."
```

2. **Wait for User Confirmation**: Do not proceed until user confirms review is complete
3. **Re-read and Analyze**: After user confirms, re-read the file and proceed with analysis as normal
4. **Treat Overridden Answers as Authoritative**: Any answers where the user removed `[AI-Generated]` and provided their own answer take precedence

#### Audit Trail for AI Best Judgement

When AI Best Judgement mode is used, log in `audit.md`:
```markdown
## [Stage Name] - Question Iteration
**Timestamp**: [ISO timestamp]
**Mode**: AI Best Judgement
**Total Questions**: [X]
**Low Confidence Answers**: [Y]
**User Overrides**: [Z] (logged after user review)
**Context**: AI answered all questions using best judgement; user reviewed and confirmed.
```

#### When AI Best Judgement Is Especially Useful
- Brownfield projects where codebase context provides strong evidence
- Follow-up iterations where prior decisions inform current answers
- Technical questions where the codebase structure makes the answer evident
- Questions where workspace detection or reverse engineering artifacts provide clear guidance

#### When AI Best Judgement Should Flag Low Confidence
- Business decisions with no clear technical evidence
- Regulatory or compliance questions
- Questions about user preferences, team conventions, or organizational policies
- Questions where multiple options are equally valid with no distinguishing context

### Error Handling

#### Missing Answers
If any [Answer]: tag is empty:
```
"I noticed Question [X] is not answered. Please provide an answer using one of the letter choices 
for all questions before proceeding."
```

#### Invalid Answers
If answer is not a valid letter choice:
```
"Question [X] has an invalid answer '[answer]'. 
Please use only the letter choices provided in the question."
```

#### Ambiguous Answers
If user provides explanation instead of letter:
```
"For Question [X], please provide the letter choice that best matches your answer. 
If none match, choose 'Other' and add your description after the [Answer]: tag."
```

### Contradiction and Ambiguity Detection

**MANDATORY**: After reading user responses, you MUST check for contradictions and ambiguities.

#### Detecting Contradictions
Look for logically inconsistent answers:
- Scope mismatch: "Bug fix" but "Entire codebase affected"
- Risk mismatch: "Low risk" but "Breaking changes"
- Timeline mismatch: "Quick fix" but "Multiple subsystems"
- Impact mismatch: "Single component" but "Significant architecture changes"

#### Detecting Ambiguities
Look for unclear or borderline responses:
- Answers that could fit multiple classifications
- Responses that lack specificity
- Conflicting indicators across multiple questions

#### Creating Clarification Questions
If contradictions or ambiguities detected:

1. **Create clarification file**: `{phase-name}-clarification-questions.md`
2. **Explain the issue**: Clearly state what contradiction/ambiguity was detected
3. **Ask targeted questions**: Use multiple choice format to resolve the issue
4. **Reference original questions**: Show which questions had conflicting answers

**Example**:
```markdown
# [Phase Name] Clarification Questions

I detected contradictions in your responses that need clarification:

## Contradiction 1: [Brief Description]
You indicated "[Answer A]" (Q[X]:[Letter]) but also "[Answer B]" (Q[Y]:[Letter]).
These responses are contradictory because [explanation].

### Clarification Question 1
[Specific question to resolve contradiction]

A) [Option that resolves toward first answer]
B) [Option that resolves toward second answer]
C) [Option that provides middle ground]
D) [Option that reframes the question]

[Answer]: 

## Ambiguity 1: [Brief Description]
Your response to Q[X] ("[Answer]") is ambiguous because [explanation].

### Clarification Question 2
[Specific question to clarify ambiguity]

A) [Clear option 1]
B) [Clear option 2]
C) [Clear option 3]
D) [Clear option 4]

[Answer]: 
```

#### Workflow for Clarifications

1. **Detect**: Analyze all responses for contradictions/ambiguities
2. **Create**: Generate clarification question file if issues found
3. **Inform**: Tell user about the issues and clarification file
4. **Wait**: Do not proceed until user provides clarifications
5. **Re-validate**: After clarifications, check again for consistency
6. **Proceed**: Only move forward when all contradictions are resolved

#### Example User Message
```
"I detected 2 contradictions in your responses:

1. Bug fix scope vs. codebase impact (Q1 vs Q2)
2. Low risk vs. breaking changes (Q7 vs Q4)

I've created classification-clarification-questions.md with 2 questions to resolve these.
Please answer these clarifying questions before I can proceed with classification."
```

### Best Practices

1. **Be Specific**: Questions should be clear and unambiguous
2. **Be Comprehensive**: Cover all necessary information
3. **Be Concise**: Keep questions focused on one topic
4. **Be Practical**: Options should be realistic and actionable
5. **Be Consistent**: Use same format throughout all question files

### Phase-Specific Examples

#### Example with 2 meaningful options:
```markdown
## Question 1
Is this a new project or existing codebase?

A) New project (greenfield)
B) Existing codebase (brownfield)
C) Other (please describe after [Answer]: tag below)

[Answer]: 
```

#### Example with 3 meaningful options:
```markdown
## Question 2
What is the deployment target?

A) Cloud (AWS, Azure, GCP)
B) On-premises servers
C) Hybrid (both cloud and on-premises)
D) Other (please describe after [Answer]: tag below)

[Answer]: 
```

#### Example with 4 meaningful options:
```markdown
## Question 3
What architectural pattern should be used?

A) Monolithic architecture
B) Microservices architecture
C) Serverless architecture
D) Event-driven architecture
E) Other (please describe after [Answer]: tag below)

[Answer]: 
```

## Summary

**Remember**: 
- ✅ Always create question files
- ✅ Always use multiple choice format
- ✅ **Always include "Other" as the LAST option (MANDATORY)**
- ✅ Only include meaningful options - don't make up options to fill slots
- ✅ Always use [Answer]: tags
- ✅ Always offer the choice between **Answer Manually** and **AI Best Judgement** for each question iteration
- ✅ Always wait for user completion (manual) or user review confirmation (AI best judgement)
- ✅ Always validate responses for contradictions
- ✅ Always create clarification files if needed
- ✅ Always resolve contradictions before proceeding
- ✅ When using AI Best Judgement, always include [Reasoning]: tags and flag low-confidence answers
- ❌ Never ask questions in chat
- ❌ Never make up options just to have A, B, C, D
- ❌ Never proceed without answers
- ❌ Never proceed with unresolved contradictions
- ❌ Never make assumptions about ambiguous responses
- ❌ Never skip user review when using AI Best Judgement mode
