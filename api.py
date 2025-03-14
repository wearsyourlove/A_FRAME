from fastapi import FastAPI, HTTPException
from arango import ArangoClient
from pydantic import BaseModel
from typing import List, Dict
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import logging

# ✅ Initialize FastAPI
app = FastAPI(
    title="AI Knowledge Graph API",
    description="API to explore AI-powered knowledge graph using FAISS & ArangoDB.",
    version="1.2",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# ✅ Logging Setup
logging.basicConfig(level=logging.INFO)

# ✅ Connect to ArangoDB
client = ArangoClient()
db = client.db("KnowledgeGraph", username="root", password="Sparkofcreativity", verify=True)

# ✅ Load AI Model for Topic Embeddings
model = SentenceTransformer("all-MiniLM-L6-v2")

# ----------------------------------------
# ✅ FAISS Embeddings Setup
# ----------------------------------------
dimension = 384
faiss_index = faiss.IndexFlatL2(dimension)
topic_embeddings = {}

def load_embeddings():
    """ Loads topic embeddings from FAISS index. """
    try:
        index = faiss.read_index("faiss_index.bin")
        embeddings = {}
        for i in range(index.ntotal):
            vector = np.array(index.reconstruct(i))
            embeddings[f"topic_{i}"] = vector
        return embeddings
    except Exception as e:
        logging.error(f"Error loading FAISS embeddings: {e}")
        return {}

# ✅ Load existing topics into FAISS
cursor = db.collection("Topics").all()
for doc in cursor:
    embedding = model.encode(doc["name"]).astype(np.float32)
    topic_embeddings[doc["_key"]] = embedding
    faiss_index.add(np.array([embedding]))

# ----------------------------------------
# ✅ Pydantic Models
# ----------------------------------------
class AIRequest(BaseModel):
    query: str
    top_k: int = 3

class Relationship(BaseModel):
    topic: str
    relation: str
    distance: float | None = None

class TopicRelationships(BaseModel):
    topic: str
    relationships: List[Relationship]

# ----------------------------------------
# ✅ REST API ENDPOINTS
# ----------------------------------------

# ✅ Get All Topics
@app.get("/api/topics", response_model=List[str])
def get_topics():
    try:
        topics = [doc["name"] for doc in db.collection("Topics").all()]
        return topics
    except Exception as e:
        logging.error(f"Error fetching topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ✅ Get Direct Relationships for a Topic
@app.get("/api/relationships/{topic_name}", response_model=TopicRelationships)
def get_direct_relationships(topic_name: str):
    try:
        key = topic_name.lower().replace(" ", "_").replace("-", "_")
        topic = db.collection("Topics").get(key)
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")

        # ✅ Query for relationships
        query = """
        FOR v, e IN OUTBOUND @startVertex GRAPH "KnowledgeGraph"
            RETURN { name: v.name, relation: e.relation ? e.relation : "distance", distance: e.distance }
        """
        result = db.aql.execute(query, bind_vars={"startVertex": f"Topics/{key}"})
        relationships = [{"topic": r["name"], "relation": r["relation"], "distance": r.get("distance")} for r in result]

        return {"topic": topic["name"], "relationships": relationships}

    except Exception as e:
        logging.error(f"Error fetching relationships: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ✅ AI-Suggested Relationships (Bidirectional)
@app.post("/api/ai/suggest_relationships/")
async def suggest_relationships():
    topics = list(topic_embeddings.keys())
    topic_vectors = np.array(list(topic_embeddings.values()))

    if faiss_index.ntotal == 0:
        raise HTTPException(status_code=500, detail="FAISS index is empty.")

    relationships = []
    for i, key in enumerate(topics):
        _, indices = faiss_index.search(np.array([topic_vectors[i]]), 3)

        for idx in indices[0]:
            if idx != i:
                related_key = topics[idx]
                forward_key = f"{key}_{related_key}"
                reverse_key = f"{related_key}_{key}"

                # ✅ Check if relationship exists before inserting
                if not db.collection("Relationships").get(forward_key):
                    db.collection("Relationships").insert({
                        "_key": forward_key,
                        "_from": f"Topics/{key}",
                        "_to": f"Topics/{related_key}",
                        "relation": "AI-Suggested"
                    })
                    relationships.append({"from": key, "to": related_key})

                if not db.collection("Relationships").get(reverse_key):
                    db.collection("Relationships").insert({
                        "_key": reverse_key,
                        "_from": f"Topics/{related_key}",
                        "_to": f"Topics/{key}",
                        "relation": "AI-Suggested"
                    })
                    relationships.append({"from": related_key, "to": key})

    return {"message": "Bidirectional relationships generated", "relationships": relationships}

# ✅ Root Endpoint
@app.get("/")
def root():
    return {"message": "FastAPI Knowledge Graph API is running!"}

# ----------------------------------------
# ✅ Run API Server as System Service
# ----------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8080, reload=True)
