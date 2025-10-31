from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    email: str
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Temple(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    location: str
    state: str
    deity: str
    description: str
    history: str
    timings: str
    dress_code: str
    festivals: List[str]
    image_url: str
    created_at: str

class SavedTemple(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    temple_id: str
    saved_at: str

class SaveTempleRequest(BaseModel):
    temple_id: str

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    timestamp: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token({"sub": user_id})
    user = User(
        id=user_id,
        username=user_data.username,
        email=user_data.email,
        created_at=user_doc["created_at"]
    )
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": user["id"]})
    user_obj = User(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        created_at=user["created_at"]
    )
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# Temple Routes
@api_router.get("/temples", response_model=List[Temple])
async def get_temples(state: Optional[str] = None, deity: Optional[str] = None):
    query = {}
    if state:
        query["state"] = state
    if deity:
        query["deity"] = {"$regex": deity, "$options": "i"}
    
    temples = await db.temples.find(query, {"_id": 0}).to_list(1000)
    return temples

@api_router.get("/temples/{temple_id}", response_model=Temple)
async def get_temple(temple_id: str):
    temple = await db.temples.find_one({"id": temple_id}, {"_id": 0})
    if not temple:
        raise HTTPException(status_code=404, detail="Temple not found")
    return temple

@api_router.post("/temples/saved")
async def save_temple(request: SaveTempleRequest, current_user: dict = Depends(get_current_user)):
    # Check if temple exists
    temple = await db.temples.find_one({"id": request.temple_id})
    if not temple:
        raise HTTPException(status_code=404, detail="Temple not found")
    
    # Check if already saved
    existing = await db.saved_temples.find_one({
        "user_id": current_user["id"],
        "temple_id": request.temple_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Temple already saved")
    
    # Save temple
    saved_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "temple_id": request.temple_id,
        "saved_at": datetime.now(timezone.utc).isoformat()
    }
    await db.saved_temples.insert_one(saved_doc)
    return {"message": "Temple saved successfully"}

@api_router.get("/temples/saved/list", response_model=List[Temple])
async def get_saved_temples(current_user: dict = Depends(get_current_user)):
    saved = await db.saved_temples.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    temple_ids = [s["temple_id"] for s in saved]
    temples = await db.temples.find({"id": {"$in": temple_ids}}, {"_id": 0}).to_list(1000)
    return temples

@api_router.delete("/temples/saved/{temple_id}")
async def unsave_temple(temple_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.saved_temples.delete_one({
        "user_id": current_user["id"],
        "temple_id": temple_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Saved temple not found")
    return {"message": "Temple removed from saved list"}

# Chatbot Route
@api_router.post("/chat/mitra", response_model=ChatResponse)
async def chat_with_mitra(chat_msg: ChatMessage, current_user: dict = Depends(get_current_user)):
    try:
        # Initialize Mitra chatbot
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"mitra_{current_user['id']}",
            system_message="You are Mitra, a knowledgeable and friendly AI assistant for TempleQuest, an Indian temple discovery platform. You help users learn about Hindu temples, their history, significance, deities, festivals, visiting guidelines, and spiritual practices. Provide accurate, respectful, and culturally sensitive information. Keep responses concise and helpful."
        ).with_model("openai", "gpt-5")
        
        user_message = UserMessage(text=chat_msg.message)
        response = await chat.send_message(user_message)
        
        # Store chat history
        chat_doc = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "message": chat_msg.message,
            "response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_history.insert_one(chat_doc)
        
        return ChatResponse(response=response, timestamp=chat_doc["timestamp"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# Initialize sample temples on startup
@app.on_event("startup")
async def init_temples():
    count = await db.temples.count_documents({})
    if count == 0:
        sample_temples = [
            {
                "id": str(uuid.uuid4()),
                "name": "Brihadeeswarar Temple",
                "location": "Thanjavur",
                "state": "Tamil Nadu",
                "deity": "Lord Shiva",
                "description": "A UNESCO World Heritage Site and one of the largest temples in India, built by Raja Raja Chola I.",
                "history": "Built in 1010 CE by Raja Raja Chola I, this magnificent temple is a masterpiece of Dravidian architecture.",
                "timings": "6:00 AM - 12:30 PM, 4:00 PM - 8:30 PM",
                "dress_code": "Traditional attire recommended. Men: Dhoti or pants with shirt. Women: Saree or salwar kameez.",
                "festivals": ["Maha Shivaratri", "Panguni Uthiram", "Arudra Darshanam"],
                "image_url": "https://images.unsplash.com/photo-1566915682737-3e97a7eed93b",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Golden Temple",
                "location": "Amritsar",
                "state": "Punjab",
                "deity": "Guru Granth Sahib",
                "description": "The holiest Gurdwara of Sikhism, known for its stunning golden architecture.",
                "history": "Founded by Guru Ram Das in 1577, the temple is surrounded by a sacred pool and represents equality and brotherhood.",
                "timings": "Open 24 hours",
                "dress_code": "Head covering mandatory. Modest clothing required.",
                "festivals": ["Guru Nanak Jayanti", "Baisakhi", "Diwali"],
                "image_url": "https://images.unsplash.com/photo-1668605105277-87816e3e2aab",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Meenakshi Temple",
                "location": "Madurai",
                "state": "Tamil Nadu",
                "deity": "Goddess Meenakshi and Lord Sundareswarar",
                "description": "A historic Hindu temple with stunning gopurams and intricate carvings.",
                "history": "Dating back to the 6th century BCE, this temple is dedicated to Goddess Parvati and Lord Shiva.",
                "timings": "5:00 AM - 12:30 PM, 4:00 PM - 9:30 PM",
                "dress_code": "Traditional attire preferred. Shoes must be removed.",
                "festivals": ["Meenakshi Thirukalyanam", "Float Festival", "Avani Moola Festival"],
                "image_url": "https://images.unsplash.com/photo-1741358706805-a5935a200a5c",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Konark Sun Temple",
                "location": "Konark",
                "state": "Odisha",
                "deity": "Surya (Sun God)",
                "description": "A 13th-century temple shaped like a giant chariot with intricately carved stone wheels.",
                "history": "Built in 1250 CE by King Narasimhadeva I, this UNESCO World Heritage Site is an architectural marvel.",
                "timings": "6:00 AM - 8:00 PM",
                "dress_code": "Casual attire acceptable. Respectful clothing recommended.",
                "festivals": ["Konark Dance Festival", "Magha Saptami"],
                "image_url": "https://images.unsplash.com/photo-1663660408539-c9cbfcedd241",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Kedarnath Temple",
                "location": "Kedarnath",
                "state": "Uttarakhand",
                "deity": "Lord Shiva",
                "description": "One of the twelve Jyotirlingas located in the Himalayas at an altitude of 3,583 meters.",
                "history": "Dating back to over 1,000 years, this temple is part of the Char Dham pilgrimage.",
                "timings": "6:00 AM - 7:00 PM (Open only from April/May to November)",
                "dress_code": "Warm clothing essential. Traditional attire for prayers.",
                "festivals": ["Maha Shivaratri", "Shravan Month Celebrations"],
                "image_url": "https://images.unsplash.com/photo-1600476407259-0402ce168978",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Tirupati Balaji Temple",
                "location": "Tirumala",
                "state": "Andhra Pradesh",
                "deity": "Lord Venkateswara",
                "description": "One of the richest and most visited temples in the world.",
                "history": "The temple has been mentioned in ancient scriptures and is believed to be over 2,000 years old.",
                "timings": "2:30 AM - 1:00 AM (Open almost 24 hours)",
                "dress_code": "Traditional attire mandatory. Men: Dhoti or pants with shirt. Women: Saree or churidar.",
                "festivals": ["Brahmotsavam", "Vaikunta Ekadasi", "Rathasaptami"],
                "image_url": "https://images.pexels.com/photos/1007425/pexels-photo-1007425.jpeg",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.temples.insert_many(sample_temples)
        logging.info("Sample temples initialized")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()