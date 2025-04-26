from langchain_core.prompts import ChatPromptTemplate

# A1 (mood agent)
mood_prompt = ChatPromptTemplate.from_template("""
Analyze this post's sentiment (-100 to 100 scale, 0=neutral) focusing exclusively on irrealis mood markers:
- Conditional language (would, could, should, might)
- Hypothetical statements
- Speculative phrasing

{input}
CURRENT SCORE: {score}

RULES:
1. Adjust the given score from -100 to 100 where >0 = bullish, <0 = bearish to be more accurate
2. Focus ONLY on irrealis mood markers
3. Output MUST be exactly one integer between -100 and 100

OUTPUT:""")


# A2 (rhetoric agent)
rhetoric_prompt = ChatPromptTemplate.from_template("""
Analyze this post's sentiment (-100 to 100 scale, 0=neutral) for hidden meaning:
- Sarcasm/irony
- Negative assertions
- Rhetorical inversions
- Hyperbole/understatement

{input}
CURRENT SCORE: {score}

RULES:
1. Adjust the given score from -100 to 100 where >0 = bullish, <0 = bearish to be more accurate
2. Detect and adjust for rhetorical devices
3. Output MUST be exactly one integer between -100 and 100

OUTPUT:""")

# A3 (dependency agent)
dependency_prompt = ChatPromptTemplate.from_template("""
Analyze ONLY the author's direct sentiment (-100 to 100 scale, 0=neutral):
- Ignore all third-party references
- Exclude quoted material
- Focus exclusively on original sentiment

{input}
CURRENT SCORE: {score}

RULES:
1. Adjust the given score from -100 to 100 where >0 = bullish, <0 = bearish to be more accurate
2. Consider ONLY the author's own words
3. Output MUST be exactly one integer between -100 and 100

OUTPUT:""")

# A4 (aspect agent)
aspect_prompt = ChatPromptTemplate.from_template("""
Analyze sentiment (-100 to 100 scale, 0=neutral) for ONLY the primary entity:
- Ignore all other mentioned tickers/topics
- Focus exclusively on the main subject
- Exclude off-topic sentiment

{input}
CURRENT SCORE: {score}

RULES:
1. Adjust the given score from -100 to 100 where >0 = bullish, <0 = bearish to be more accurate
2. Evaluate ONLY the primary entity
3. Output MUST be exactly one integer between -100 and 100

OUTPUT:""")

# A5 (reference agent)
reference_prompt = ChatPromptTemplate.from_template("""
Analyze sentiment (-100 to 100 scale, 0=neutral) based on concrete references:
- Price points
- Time expressions
- Quantitative comparisons
- Factual benchmarks

{input}
CURRENT SCORE: {score}

RULES:
1. Adjust the given score from -100 to 100 where >0 = bullish, <0 = bearish to be more accurate
2. Weight numerical references heavily
3. Output MUST be exactly one integer between -100 and 100

OUTPUT:""")