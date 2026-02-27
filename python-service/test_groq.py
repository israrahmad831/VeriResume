"""
Test Groq API Connection
Run this to verify your Groq API key is working
"""

import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

def test_groq_connection():
    """Test if Groq API key is valid"""
    
    api_key = os.getenv('GROQ_API_KEY')
    
    if not api_key:
        print("❌ ERROR: GROQ_API_KEY not found in .env file")
        return False
    
    print(f"✓ API Key found: {api_key[:20]}...{api_key[-10:]}")
    print("\nTesting Groq connection...")
    
    try:
        client = Groq(api_key=api_key)
        
        # Try a simple completion
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": "Say 'Hello, VeriResume!' if you can read this."}
            ],
            max_tokens=20
        )
        
        result = response.choices[0].message.content
        print(f"✅ SUCCESS! Groq responded: {result}")
        print("\n✅ Your Groq API key is working correctly!")
        print("🎉 Groq is FREE, FAST, and UNLIMITED - perfect for your project!")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        print("\nPossible issues:")
        print("1. API key is invalid")
        print("2. Network/firewall blocking Groq")
        print("3. Groq service is down")
        print("\nGet a new API key at: https://console.groq.com/keys")
        return False

if __name__ == "__main__":
    test_groq_connection()
