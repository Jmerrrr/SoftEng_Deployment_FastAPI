import copy
import os
import warnings

import requests
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from langchain.chains import LLMChain, RetrievalQA
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
from langchain_community.llms import HuggingFaceHub
from langchain_community.vectorstores import Chroma

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates/")

warnings.simplefilter(action='ignore', category=FutureWarning)

load_dotenv()
os.environ["HUGGINGFACEHUB_API_TOKEN"] = os.getenv("HUGGINGFACEHUB_API_TOKEN")

embeddings = HuggingFaceInferenceAPIEmbeddings(api_key=os.getenv("HUGGINGFACEHUB_API_TOKEN"),model_name="sentence-transformers/all-mpnet-base-v2")

load_vector_store = Chroma(persist_directory = "stores/stored_cosine",embedding_function = embeddings)
retriever = load_vector_store.as_retriever(search_kwargs={"k":2})

# ChatBot LLM
repo_id = "MBZUAI/LaMini-Flan-T5-783M"
llm = HuggingFaceHub(repo_id=repo_id,model_kwargs={"temperature":0.3,"max_length":500})

prompt_template="""
Use the following pieces of information to answer the user's question.
If you don't know the answer, just say the you don't know, don't try to make up an answer.

Context: {context}
Question: {question}

Only return the helpful answer below and nothing else.
HelfUl answer:
"""
memory = ConversationBufferMemory(memory_key = "chat_history", return_messages=True)

prompt = PromptTemplate(input_variables=['context','question'], template = prompt_template)

chain_type_kwargs= {"prompt":prompt}
def qa_chain():
    qa = RetrievalQA.from_chain_type(
    llm = llm,
    chain_type = "stuff",
    retriever = retriever,
    memory = memory,
    chain_type_kwargs=chain_type_kwargs,
    verbose=True
    )
    return qa


query = qa_chain()

zs_template = r"""
Reply in cheerful tone. 
Human: {text}
If you don't know the answer, just say the you don't know, don't try to make up an answer.
Only return the helpful answer below and nothing else.
Helful answer:
"""
zs_prompt = PromptTemplate.from_template(template = zs_template, zs_input_variables=["text"])

conversation = LLMChain(prompt=zs_prompt, llm = llm)

API_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN")
API_URL = "https://api-inference.huggingface.co/models/MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli"
headers = {"Authorization": f"Bearer {API_TOKEN}"}

# Zero_shot LLM
def zero_shot_handler(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

def zero_shot(userPrompt):

    classifier = zero_shot_handler({
        "inputs":userPrompt,
        "parameters":{"candidate_labels": ["Simple Conversation", "School related question", "Follow up Question"]}
        })

    if classifier["labels"][0] == "Simple Conversation":
        final_result = conversation.run({"text":userPrompt})
        return final_result
    if classifier["labels"][0] == "School related question":
        final_result = query(userPrompt)
        return final_result["result"]
    if classifier["labels"][0] == "Follow up Question":
        final_result = query(userPrompt)
        return final_result["result"]

def process_answer(prompt):
    question = prompt
    qa= zero_shot(question)
    return qa

def clear_memory():
    memory.clear()

@app.get("/")
def form_post(request: Request):
    return templates.TemplateResponse('index.html', context={'request': request})
 
@app.get('/lamini')
def model(question : str):
    res = process_answer(question)
    result = copy.deepcopy(res)
    return result

@app.get('/clearMem')
def clearMemory():
    clear_memory()



















































