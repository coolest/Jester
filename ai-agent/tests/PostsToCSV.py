import json
import csv
import re


def parse_json_to_csv(input_file, output_file):
    # Read JSON data from input file
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Prepare CSV data
    csv_data = []
    current_submission = None
    comment_count = 0  # Track number of comments for current submission

    for item in data:
        if item.startswith("[SUBMISSION]"):
            # New submission found, reset comment count
            current_submission = item.replace("[SUBMISSION] Title: ", "").strip()
            comment_count = 0

            print(f"\nSubmission: {current_submission}")
            sentiment = input("Enter sentiment score (vpos/pos/neu/neg/vneg): ").strip().lower()
            while sentiment not in ['vpos', 'pos', 'neu', 'neg', 'vneg']:
                print("Invalid input. Please enter 'vpos', 'pos', 'neu', 'neg', or 'vneg'")
                sentiment = input("Enter sentiment score (vpos/pos/neu/neg/vneg): ").strip().lower()

            # Add submission row with empty comment and sentiment
            csv_data.append([current_submission, "", sentiment])

        elif item.startswith("[COMMENT]") and current_submission is not None and comment_count < 5:
            # Only process if we haven't reached 5 comments yet
            comment_count += 1

            # Clean the comment text
            comment = item.replace("[COMMENT] ", "").strip()
            clean_comment = re.sub(r'\[.*?\]\(.*?\)', '', comment)  # Remove markdown links
            clean_comment = re.sub(r'https?://\S+', '', clean_comment)  # Remove URLs
            clean_comment = clean_comment.strip()

            # Skip empty comments after cleaning
            if not clean_comment:
                comment_count -= 1  # Don't count empty comments
                continue

            # Get user input for sentiment
            print(f"Comment {comment_count}/5: {clean_comment}")
            sentiment = input("Enter sentiment score (vpos/pos/neu/neg/vneg): ").strip().lower()

            while sentiment not in ['vpos', 'pos', 'neu', 'neg', 'vneg']:
                print("Invalid input. Please enter 'vpos', 'pos', 'neu', 'neg', or 'vneg'")
                sentiment = input("Enter sentiment score (vpos/pos/neu/neg/vneg): ").strip().lower()

            csv_data.append([current_submission, clean_comment, sentiment])

    # Write to CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Submission', 'Comment', 'Sentiment Score'])
        writer.writerows(csv_data)

    print(f"\nData successfully written to {output_file}")


if __name__ == "__main__":
    input_file = "ethtrader_posts.json"  # Change to your JSON input file name
    output_file = "output_sentiment.csv"
    parse_json_to_csv(input_file, output_file)