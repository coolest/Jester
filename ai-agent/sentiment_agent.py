from transformers import AutoTokenizer
from transformers import AutoModelForSequenceClassification
from scipy.special import softmax
from langchain_openai import ChatOpenAI
from prompts import mood_prompt, aspect_prompt, rhetoric_prompt, reference_prompt, dependency_prompt
import torch
import logging
import os
import re
import asyncio

class SentimentAgent:
    
    MODEL = "cardiffnlp/twitter-roberta-base-sentiment"
    CYCLES = 3
    
    def __init__(self, openai_api_key=None, model_name="o4-mini-2025-04-16", nlp_model=MODEL):
        logging.basicConfig(level=logging.ERROR)
        
        # Set OpenAI API key
        if openai_api_key:
            os.environ["OPENAI_API_KEY"] = openai_api_key
        elif "OPENAI_API_KEY" not in os.environ:
            raise ValueError("OpenAI API key must be provided either as argument or through environment variable")
        
        try:
            # Initialize tokenizer and model
            self.tokenizer = AutoTokenizer.from_pretrained(
                nlp_model,
                truncation=True,
                max_length=514
            )
            
            self.model = AutoModelForSequenceClassification.from_pretrained(
                nlp_model,
                device_map="auto",
                torch_dtype=torch.float16
            )
            
            # Initialize LLM
            self.llm = ChatOpenAI(
                model_name=model_name,
                temperature=1,
                request_timeout=60.0
            )
            
            # Initialize chains
            self.aspect_chain = aspect_prompt | self.llm
            self.mood_chain = mood_prompt | self.llm
            self.rhetoric_chain = rhetoric_prompt | self.llm
            self.reference_chain = reference_prompt | self.llm
            self.dependency_chain = dependency_prompt | self.llm

        except Exception as e:
            logging.error(f"Initialization Error: {e}")
            raise
    
    async def run_chain(self, chain, input_text, score):
        """Helper method to run a single chain asynchronously"""
        try:
            response = await chain.ainvoke({"input": input_text, "score": f"{score:.2f}"})
            response_text = str(response)
            numbers = re.findall(r"\b\d{1,3}\b", response_text)
            if numbers:
                return float(numbers[0])
        except Exception as e:
            logging.warning(f"Error processing chain response: {e}")
        return score  # Fallback to current score
    
    async def run_concurrent(self, post, comment=None):
        """Async version of run method with concurrent chain execution"""
        # Prepare input text
        input_text = "Post: " + post
        if comment:
            input_text = f"Analyze this Comment: {comment}\nWithin the context of this {input_text}"

        # Get base sentiment score
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self.model.to(device)
        
        encoded_text = self.tokenizer(input_text, return_tensors='pt').to(device)
        output = self.model(**encoded_text)
        
        scores = output[0][0].detach().cpu().numpy()
        scores = softmax(scores)
        sentiment_score = scores[2] * 100  # Convert to 0-100 scale

        # Refine score through multiple cycles
        for _ in range(self.CYCLES):
            try:
                # Run all chains concurrently
                results = await asyncio.gather(
                    self.run_chain(self.aspect_chain, input_text, sentiment_score),
                    self.run_chain(self.mood_chain, input_text, sentiment_score),
                    self.run_chain(self.rhetoric_chain, input_text, sentiment_score),
                    self.run_chain(self.reference_chain, input_text, sentiment_score),
                    self.run_chain(self.dependency_chain, input_text, sentiment_score)
                )
                
                # Calculate new average
                sentiment_score = sum(results) / len(results)
                print(f"Refined score: {sentiment_score:.2f}")
                
            except Exception as e:
                logging.error(f"Error during score refinement cycle: {e}")
                break
        
        return min(max(0, sentiment_score), 100)  # Clamp to 0-100 range
    
    def run(self, post, comment=None):
        """Synchronous wrapper for the async method"""
        return asyncio.run(self.run_concurrent(post, comment))