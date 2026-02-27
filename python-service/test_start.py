"""
Simple test to check if app.py can be imported and run
"""
import sys
import os

print("Python version:", sys.version)
print("Current directory:", os.getcwd())
print("\n" + "="*60)

try:
    print("Testing imports...")
    from dotenv import load_dotenv
    print("✓ dotenv imported")
    
    load_dotenv()
    print("✓ .env loaded")
    print(f"  GROQ_API_KEY: {'Set' if os.getenv('GROQ_API_KEY') else 'Not set'}")
    print(f"  GEMINI_API_KEY: {'Set' if os.getenv('GEMINI_API_KEY') else 'Not set'}")
    
    from flask import Flask
    print("✓ Flask imported")
    
    print("\nTesting app.py import...")
    import app
    print("✓ app.py imported successfully")
    
    print("\nChecking Flask app...")
    print(f"✓ Flask app created: {app.app is not None}")
    print(f"✓ AI Analyzer: {app.ai_analyzer is not None}")
    print(f"✓ Resume Parser: {app.resume_parser is not None}")
    
    print("\n" + "="*60)
    print("✅ All checks passed! Starting server...")
    print("="*60 + "\n")
    
    # Start the server
    app.app.run(host='0.0.0.0', port=5001, debug=False)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
