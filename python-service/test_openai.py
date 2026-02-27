"""
Test OpenAI API Connection
Run this to verify your OpenAI API key is working
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

def test_openai_connection():
    """Test if OpenAI API key is valid"""
    
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        print("❌ ERROR: OPENAI_API_KEY not found in .env file")
        return False
    
    print(f"✓ API Key found: {api_key[:20]}...{api_key[-10:]}")
    print("\nTesting OpenAI connection...")
    
    try:
        client = OpenAI(api_key=api_key)
        
        # Try a simple completion
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": "Say 'Hello, VeriResume!' if you can read this."}
            ],
            max_tokens=20
        )
        
        result = response.choices[0].message.content
        print(f"✅ SUCCESS! OpenAI responded: {result}")
        print("\n✅ Your OpenAI API key is working correctly!")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        print("\nPossible issues:")
        print("1. API key is invalid or expired")
        print("2. No credits remaining on your OpenAI account")
        print("3. Network/firewall blocking OpenAI")
        print("4. OpenAI service is down")
        print("\nGet a new API key at: https://platform.openai.com/api-keys")
        return False

if __name__ == "__main__":
    test_openai_connection()
