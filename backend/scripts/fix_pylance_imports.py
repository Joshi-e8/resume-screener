#!/usr/bin/env python3
"""
Fix Pylance Import Issues
Helps resolve Python import resolution in VS Code
"""

import os
import subprocess
import sys
from pathlib import Path


def main():
    print("🔧 Pylance Import Resolution Fix")
    print("=" * 50)
    
    # Get current directory info
    backend_dir = Path(__file__).parent.parent
    venv_dir = backend_dir / "venv"
    
    print(f"📁 Backend directory: {backend_dir}")
    print(f"🐍 Virtual environment: {venv_dir}")
    
    # Check if virtual environment exists
    if not venv_dir.exists():
        print("❌ Virtual environment not found!")
        print("   Please create one with: python -m venv venv")
        return
    
    # Test imports
    print("\n🧪 Testing Google Drive imports...")
    
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import Flow
        from googleapiclient.discovery import build
        print("✅ All Google Drive imports successful!")
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("   Run: pip install -r requirements.txt")
        return
    
    # Check Python interpreter
    print(f"\n🐍 Current Python interpreter: {sys.executable}")
    
    # VS Code configuration suggestions
    print("\n🔧 VS Code Pylance Fix Steps:")
    print("1️⃣  PYTHON INTERPRETER:")
    print("   • Press Ctrl+Shift+P (Cmd+Shift+P on Mac)")
    print("   • Type: 'Python: Select Interpreter'")
    print(f"   • Choose: {venv_dir}/bin/python")
    print(f"   • Or: {venv_dir}/Scripts/python.exe (Windows)")
    
    print("\n2️⃣  WORKSPACE SETTINGS:")
    print("   • Create .vscode/settings.json in project root:")
    
    settings_content = f'''{{
    "python.defaultInterpreterPath": "./backend/venv/bin/python",
    "python.terminal.activateEnvironment": true,
    "pylance.include": ["backend/**"],
    "python.analysis.extraPaths": ["./backend"]
}}'''
    
    print(f"   {settings_content}")
    
    print("\n3️⃣  RELOAD VS CODE:")
    print("   • Press Ctrl+Shift+P (Cmd+Shift+P on Mac)")
    print("   • Type: 'Developer: Reload Window'")
    print("   • Or restart VS Code completely")
    
    print("\n4️⃣  ALTERNATIVE FIX:")
    print("   • Open terminal in VS Code")
    print("   • Run: source backend/venv/bin/activate")
    print("   • Then open Python files")
    
    # Create VS Code settings if requested
    vscode_dir = backend_dir.parent / ".vscode"
    settings_file = vscode_dir / "settings.json"
    
    print(f"\n💡 Want me to create VS Code settings?")
    print(f"   Settings file: {settings_file}")
    
    if not vscode_dir.exists():
        vscode_dir.mkdir()
        print("   Created .vscode directory")
    
    if not settings_file.exists():
        with open(settings_file, 'w') as f:
            f.write(settings_content)
        print("   ✅ Created VS Code settings.json")
    else:
        print("   ⚠️  VS Code settings.json already exists")
    
    print("\n✅ Pylance import issues should be resolved!")
    print("   Restart VS Code and the import errors should disappear.")

if __name__ == "__main__":
    main()
