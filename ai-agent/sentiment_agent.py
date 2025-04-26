from transformers import AutoTokenizer
from transformers import AutoModelForSequenceClassification
from scipy.special import softmax
from langchain_ollama.llms import OllamaLLM
from prompts import mood_prompt, aspect_prompt, rhetoric_prompt, reference_prompt, dependency_prompt
import torch
import logging



class SentimentAgent:
    
    MODEL = f"cardiffnlp/twitter-roberta-base-sentiment"
    LOCAL_LLM = "deepseek-r1:1.5b"
    CYCLES = 5
    
    def __init__(self, nlp_model=MODEL, llm_model=LOCAL_LLM ):
        logging.basicConfig(level=logging.ERROR)
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                nlp_model,
                truncation = True,
                max_length = 514
            )
            
            self.model = AutoModelForSequenceClassification.from_pretrained(
                nlp_model,
                device_map="auto",
                torch_dtype=torch.float16
            )
            
            self.llm = OllamaLLM(
                model=llm_model,
                temperature=0,
                timeout=30.0,  # Fail if response takes >30s
                request_timeout=60.0  # HTTP-level timeout
            )
            
            self.mood_chain = mood_prompt | self.llm
            self.aspect_chain = aspect_prompt | self.llm
            self.rhetoric_chain = rhetoric_prompt | self.llm
            self.reference_chain = reference_prompt | self.llm
            self.dependency_chain = dependency_prompt | self.llm

        except Exception as e:
            logging.error(f"An Initialization Error has occurred: {e}")
    
    def run(self, post, comment=None):
        post = "Post: " + post

        if comment is not None:
            post += f"\nComment: {comment}"

        # Move the model to GPU
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self.model.to(device)

        encoded_text = self.tokenizer(post, return_tensors='pt').to(device)
        output = self.model(**encoded_text)

        # Move output back to CPU for processing
        scores = output[0][0].detach().cpu().numpy()
        scores = softmax(scores)

        # gives value from -1 to 1 where 0 is neutral , 1 is positive, and -1 is negative
        sentiment_score = scores[2] * 100

        # for _ in range(0,SentimentAgent.CYCLES):
        #     scores = [
        #         float(re.findall(r"[-+]?\d*\.\d+|\d+", self.aspect_chain.invoke({"input": post, "score": f"{sentiment_score:.2f}"}))[-1]),
        #         float(re.findall(r"[-+]?\d*\.\d+|\d+", self.mood_chain.invoke({"input": post, "score": f"{sentiment_score:.2f}"}))[-1]),
        #         # float(re.findall(r"[-+]?\d*\.\d+|\d+", self.rhetoric_chain.invoke({"post": post, "score": f"{sentiment_score:.2f}"}))[-1]),
        #         float(re.findall(r"[-+]?\d*\.\d+|\d+", self.reference_chain.invoke({"input": post, "score": f"{sentiment_score:.2f}"}))[-1]),
        #         float(re.findall(r"[-+]?\d*\.\d+|\d+", self.dependency_chain.invoke({"input": post, "score": f"{sentiment_score:.2f}"}))[-1])
        #     ]
        #
        #     sentiment_score = sum(scores) / len(scores)

        return sentiment_score
            



            
