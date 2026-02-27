"""
Test Google Gemini API Connection
Run this to verify your Gemini API key is working
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

def test_gemini_connection():
    """Test if Gemini API key is valid"""
    
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found in .env file")
        return False
    
    print(f"✓ API Key found: {api_key[:20]}...{api_key[-10:]}")
    print("\nTesting Gemini connection...")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        # Try a simple generation
        response = model.generate_content("Say 'Hello, VeriResume!' if you can read this.")
        
        result = response.text
        print(f"✅ SUCCESS! Gemini responded: {result}")
        print("\n✅ Your Gemini API key is working correctly!")
        print("🎉 Gemini is FREE and works great as an alternative to OpenAI!")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        print("\nPossible issues:")
        print("1. API key is invalid")
        print("2. Gemini API service is down")
        print("3. Network/firewall blocking Google services")
        print("\nGet a new API key at: https://makersuite.google.com/app/apikey")
        return False

if __name__ == "__main__":
    test_gemini_connection()
