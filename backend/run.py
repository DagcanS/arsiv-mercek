import uvicorn
import sys
import os

# app modülünün import edilebilmesi için backend dizinini sys.path'e ekle
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8008, reload=True)
