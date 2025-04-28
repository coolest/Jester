import pandas as pd
from sentiment_agent import SentimentAgent

def run_sentiment_analysis(input_csv, output_csv):
    df = pd.read_csv(input_csv)

    if 'Submission' not in df.columns or 'Sentiment Score' not in df.columns:
        raise ValueError("CSV must contain 'post' and 'manual_sentiment_score' columns")

    agent = SentimentAgent()

    predicted_scores = []

    for _, row in df.iterrows():
        post = row['Submission']
        comment = row['Comment'] if 'Comment' in df.columns and pd.notna(row['Comment']) else None

        try:
            if comment:
                score = agent.run(post, comment)
            else:
                score = agent.run(post)
        except Exception as e:
            print(f"Error processing post: {post[:30]}... => {e}")
            score = None

        predicted_scores.append(score)

    df['predicted_sentiment_score'] = predicted_scores
    df.to_csv(output_csv, index=False)
    print(f"Finished writing to {output_csv}")

if __name__ == "__main__":
    run_sentiment_analysis("tests/output_sentiment.csv", "tests/agent_results.csv")
