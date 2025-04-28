from langchain_core.prompts import ChatPromptTemplate

# A1 (Mood Agent)
mood_prompt = ChatPromptTemplate.from_template("""
Your job is to adjust the given sentiment score to be as accurate as possible.
The scale ranges from 0 to 100, where:
- 0-30 = Negative sentiment
- 31-69 = Neutral/mixed sentiment
- 70-100 = Positive sentiment

Focus ONLY on irrealis mood markers:
✓ Conditional language (would, could, should, might)
✓ Hypothetical statements
✓ Speculative phrasing

{input}
Current Score: {score}

Rules:
1. Output must be exactly one integer between 0 and 100
2. Only adjust based on irrealis mood markers
3. If no relevant markers exist, return the original score

Adjusted Score:""")

# A2 (Rhetoric Agent)
rhetoric_prompt = ChatPromptTemplate.from_template("""
Your job is to adjust the given sentiment score to be as accurate as possible.
The scale ranges from 0 to 100, where:
- 0-30 = Negative sentiment
- 31-69 = Neutral/mixed sentiment
- 70-100 = Positive sentiment

Focus ONLY on rhetorical devices:
✓ Sarcasm/irony
✓ Negative assertions
✓ Rhetorical inversions
✓ Hyperbole/understatement

{input}
Current Score: {score}

Rules:
1. Output must be exactly one integer between 0 and 100
2. Only adjust based on rhetorical devices
3. If no relevant devices exist, return the original score""")

# A3 (Dependency Agent)
dependency_prompt = ChatPromptTemplate.from_template("""
Your job is to adjust the given sentiment score to be as accurate as possible.
The scale ranges from 0 to 100, where:
- 0-30 = Negative sentiment
- 31-69 = Neutral/mixed sentiment
- 70-100 = Positive sentiment

Focus ONLY on:
✓ Author's direct sentiment (ignore quotes/references)
✓ Original words only
✓ Primary expression of opinion

{input}
Current Score: {score}

Rules:
1. Output must be exactly one integer between 0 and 100
2. Ignore all third-party references
3. If no direct sentiment exists, return the original score""")

# A4 (Aspect Agent)
aspect_prompt = ChatPromptTemplate.from_template("""
Your job is to adjust the given sentiment score to be as accurate as possible.
The scale ranges from 0 to 100, where:
- 0-30 = Negative sentiment
- 31-69 = Neutral/mixed sentiment
- 70-100 = Positive sentiment

Focus ONLY on:
✓ Primary entity/topic
✓ Main subject only (ignore other mentions)
✓ Core discussion point

{input}
Current Score: {score}

Rules:
1. Output must be exactly one integer between 0 and 100
2. Ignore all off-topic sentiment
3. If no clear focus exists, return the original score""")

# A5 (Reference Agent)
reference_prompt = ChatPromptTemplate.from_template("""
Your job is to adjust the given sentiment score to be as accurate as possible.
The scale ranges from 0 to 100, where:
- 0-30 = Negative sentiment
- 31-69 = Neutral/mixed sentiment
- 70-100 = Positive sentiment

Focus ONLY on concrete references:
✓ Price points/numbers
✓ Time expressions
✓ Quantitative comparisons
✓ Factual benchmarks

{input}
Current Score: {score}

Rules:
1. Output must be exactly one integer between 0 and 100
2. Weight numerical references heavily
3. If no concrete references exist, return the original score""")