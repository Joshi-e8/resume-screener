#!/usr/bin/env python3
"""
Test the experience years calculation fix
"""

import requests
import json

def test_experience_calculation():
    """Test the API response for experience calculation"""
    try:
        print("🧪 Testing Experience Years Calculation Fix")
        print("=" * 50)
        
        url = "http://localhost:8000/api/v1/resumes"
        headers = {
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGFjMzEzZWU3NmQ4ZDVkYzNmZjVhMDIiLCJleHAiOjE3NTYxMTg4ODMsInR5cGUiOiJhY2Nlc3MifQ.kaiExkw-nrZRWr1nv7IH1veM2ShfW7Q9RNdrY2hl98c"
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            records = data.get('records', [])
            
            print(f"📊 Total resumes: {len(records)}")
            
            for i, record in enumerate(records, 1):
                name = record.get('candidate_name', f'Resume {i}')
                total_exp_years = record.get('total_experience_years', 0)
                experience_array = record.get('experience', [])
                
                print(f"\n📄 {name}:")
                print(f"   📅 Total Experience Years: {total_exp_years}")
                print(f"   💼 Experience Entries: {len(experience_array)}")
                
                # Show experience details
                for j, exp in enumerate(experience_array[:3], 1):
                    if isinstance(exp, dict):
                        title = exp.get('title', 'Unknown')
                        company = exp.get('company', 'Unknown')
                        duration = exp.get('duration', 'Unknown')
                        print(f"      {j}. {title} at {company} ({duration})")
                
                # Analyze duration patterns
                if experience_array:
                    print(f"   🔍 Duration Analysis:")
                    for exp in experience_array:
                        if isinstance(exp, dict):
                            duration = exp.get('duration', '')
                            print(f"      - '{duration}'")
            
            # Save response for analysis
            with open("experience_test_response.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Response saved to: experience_test_response.json")
            
            # Check if fix worked
            issues_found = []
            for record in records:
                total_exp = record.get('total_experience_years', 0)
                experience_array = record.get('experience', [])
                
                if len(experience_array) > 0 and total_exp == 0:
                    name = record.get('candidate_name', 'Unknown')
                    issues_found.append(f"{name}: Has {len(experience_array)} experience entries but 0 years calculated")
            
            print(f"\n📋 ANALYSIS:")
            if issues_found:
                print("❌ Issues still present:")
                for issue in issues_found:
                    print(f"   - {issue}")
            else:
                print("✅ Experience years calculation appears to be working!")
            
        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing API: {e}")

def main():
    """Main function"""
    test_experience_calculation()

if __name__ == "__main__":
    main()
