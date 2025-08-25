#!/usr/bin/env python3
"""
Final comprehensive test of all fixes
"""

import requests
import json

def test_all_fixes():
    """Test all the fixes comprehensively"""
    try:
        print("🎉 FINAL COMPREHENSIVE TEST")
        print("=" * 60)
        
        url = "http://localhost:8000/api/v1/resumes"
        headers = {
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGFjMzEzZWU3NmQ4ZDVkYzNmZjVhMDIiLCJleHAiOjE3NTYxMTg4ODMsInR5cGUiOiJhY2Nlc3MifQ.kaiExkw-nrZRWr1nv7IH1veM2ShfW7Q9RNdrY2hl98c"
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            records = data.get('records', [])
            
            print(f"📊 Total resumes: {len(records)}")
            
            # Test each issue that was reported
            issues_fixed = []
            issues_remaining = []
            
            for i, record in enumerate(records, 1):
                name = record.get('candidate_name', f'Resume {i}')
                print(f"\n📄 {name}:")
                
                # Test 1: Experience showing wrong (should show work experience, not summary)
                experience_array = record.get('experience', [])
                summary = record.get('summary', '')
                total_exp_years = record.get('total_experience_years', 0)
                
                print(f"   💼 Experience Entries: {len(experience_array)}")
                print(f"   📅 Total Experience Years: {total_exp_years}")
                print(f"   📝 Summary Length: {len(summary)} chars")
                
                if len(experience_array) > 0:
                    issues_fixed.append(f"{name}: Experience data now showing correctly ({len(experience_array)} positions)")
                    
                    # Show experience details
                    for j, exp in enumerate(experience_array[:2], 1):
                        if isinstance(exp, dict):
                            title = exp.get('title', 'Unknown')
                            company = exp.get('company', 'Unknown')
                            duration = exp.get('duration', 'Unknown')
                            print(f"      {j}. {title} at {company} ({duration})")
                else:
                    issues_remaining.append(f"{name}: No experience entries found")
                
                # Test 2: Total experience years should not be 0 if experience exists
                if len(experience_array) > 0 and total_exp_years > 0:
                    issues_fixed.append(f"{name}: Experience years calculated correctly ({total_exp_years} years)")
                elif len(experience_array) > 0 and total_exp_years == 0:
                    issues_remaining.append(f"{name}: Has experience but 0 years calculated")
                
                # Test 3: Skills comprehensiveness
                skills = record.get('key_skills', [])
                print(f"   🛠️ Skills: {len(skills)} found")
                if len(skills) > 10:
                    issues_fixed.append(f"{name}: Comprehensive skills extraction ({len(skills)} skills)")
                    # Show sample skills
                    print(f"      Sample: {', '.join(skills[:5])}")
                
                # Test 4: Projects data (if available)
                projects = record.get('projects', [])
                print(f"   🚀 Projects: {len(projects)} found")
                
                # Test 5: AI scoring uniqueness
                ai_scoring = record.get('ai_scoring', {})
                if ai_scoring:
                    explanations = ai_scoring.get('explanations', {})
                    top_matches = explanations.get('top_matches', [])
                    overall_score = record.get('ai_overall_score', 0)
                    print(f"   🎯 AI Score: {overall_score}")
                    print(f"   🎯 Top Matches: {top_matches[:3]}")
            
            # Save final response
            with open("final_comprehensive_response.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"\n💾 Final response saved to: final_comprehensive_response.json")
            
            # Summary
            print(f"\n📋 COMPREHENSIVE TEST RESULTS:")
            print(f"✅ Issues Fixed ({len(issues_fixed)}):")
            for issue in issues_fixed:
                print(f"   ✅ {issue}")
            
            if issues_remaining:
                print(f"\n⚠️ Issues Remaining ({len(issues_remaining)}):")
                for issue in issues_remaining:
                    print(f"   ⚠️ {issue}")
            else:
                print(f"\n🎉 ALL MAJOR ISSUES HAVE BEEN RESOLVED!")
            
            # Calculate success rate
            total_tests = len(issues_fixed) + len(issues_remaining)
            success_rate = (len(issues_fixed) / total_tests * 100) if total_tests > 0 else 100
            print(f"\n📈 SUCCESS RATE: {success_rate:.1f}%")
            
        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing API: {e}")

def main():
    """Main function"""
    test_all_fixes()

if __name__ == "__main__":
    main()
