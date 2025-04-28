import pandas as pd
import matplotlib.pyplot as plt

def load_and_combine_csvs(agent_file, raw_file):
    # Load both CSV files
    df_agent = pd.read_csv(agent_file)
    df_raw = pd.read_csv(raw_file)
    
    # Add a source column to distinguish them
    df_agent['source'] = 'agent'
    df_raw['source'] = 'raw'
    
    # Combine the dataframes
    combined_df = pd.concat([df_agent, df_raw], ignore_index=True)
    return combined_df

def categorize_sentiment(score):
    if score <= 9:
        return 'vneg'
    elif 10 <= score <= 29:
        return 'neg'
    elif 30 <= score <= 69:
        return 'neu'
    elif 70 <= score <= 89:
        return 'pos'
    else:  # 90+
        return 'vpos'

def create_sentiment_bar_chart(df, title="Sentiment Distribution by Score Ranges"):
    # Apply categorization
    df['sentiment_category'] = df['predicted_sentiment_score'].apply(categorize_sentiment)
    
    # Count each category
    counts = df['sentiment_category'].value_counts().reindex(['vneg', 'neg', 'neu', 'pos', 'vpos'])
    
    # Create color mapping
    colors = {
        'vneg': 'darkred',
        'neg': 'tomato',
        'neu': 'gold',
        'pos': 'limegreen',
        'vpos': 'darkgreen'
    }
    
    # Create bar chart
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = counts.plot(kind='bar', color=[colors[cat] for cat in counts.index], ax=ax)
    
    # Customize the plot
    ax.set_title(title, fontsize=14, pad=20)
    ax.set_xlabel('Sentiment Category', fontsize=12)
    ax.set_ylabel('Count', fontsize=12)
    
    # Add value labels on top of each bar
    for p in ax.patches:
        ax.annotate(str(p.get_height()), 
                   (p.get_x() + p.get_width() / 2., p.get_height()),
                   ha='center', va='center', 
                   xytext=(0, 10), 
                   textcoords='offset points')
    
    # Add score range annotations below x-axis
    ax.set_xticklabels([
        'Very Negative (0-9)\nMean: {:.1f}'.format(
            df[df['sentiment_category'] == 'vneg']['predicted_sentiment_score'].mean()),
        'Negative (10-29)\nMean: {:.1f}'.format(
            df[df['sentiment_category'] == 'neg']['predicted_sentiment_score'].mean()),
        'Neutral (30-69)\nMean: {:.1f}'.format(
            df[df['sentiment_category'] == 'neu']['predicted_sentiment_score'].mean()),
        'Positive (70-89)\nMean: {:.1f}'.format(
            df[df['sentiment_category'] == 'pos']['predicted_sentiment_score'].mean()),
        'Very Positive (90+)\nMean: {:.1f}'.format(
            df[df['sentiment_category'] == 'vpos']['predicted_sentiment_score'].mean())
    ], rotation=0, ha='center')
    
    plt.tight_layout()
    return fig, ax

def main():
    # Load and combine the CSV files
    combined_df = load_and_combine_csvs('agent_results.csv', 'raw_nlp_results.csv')
    
    # Create combined plot
    fig1, _ = create_sentiment_bar_chart(combined_df, "Combined Sentiment Distribution by Score Ranges")
    fig1.savefig('combined_sentiment_barchart.png', dpi=300, bbox_inches='tight')
    
    # Create separate plots for each source
    agent_df = combined_df[combined_df['source'] == 'agent']
    raw_df = combined_df[combined_df['source'] == 'raw']
    
    fig2, _ = create_sentiment_bar_chart(agent_df, "Agent Results Sentiment Distribution")
    fig3, _ = create_sentiment_bar_chart(raw_df, "Raw NLP Results Sentiment Distribution")
    
    fig2.savefig('agent_sentiment_barchart.png', dpi=300, bbox_inches='tight')
    fig3.savefig('raw_sentiment_barchart.png', dpi=300, bbox_inches='tight')
    
    plt.show()

if __name__ == "__main__":
    main()