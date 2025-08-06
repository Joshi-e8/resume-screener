"""
Sample job seeding script for Resume Screener
Creates realistic job postings across different departments and experience levels
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import init_database
from app.models.job import ExperienceLevel, Job, JobStatus, JobType, SalaryInfo
from app.models.user import User

# Sample job data
SAMPLE_JOBS = [
    {
        "title": "Senior Frontend Developer",
        "department": "Engineering",
        "location": "San Francisco, CA",
        "job_type": JobType.FULL_TIME,
        "experience_level": ExperienceLevel.SENIOR,
        "description": """We are seeking a Senior Frontend Developer to join our dynamic engineering team. You will be responsible for building and maintaining cutting-edge web applications using modern technologies like React, TypeScript, and Next.js. 

This role offers the opportunity to work on high-impact projects that serve millions of users worldwide. You'll collaborate closely with our design and product teams to create exceptional user experiences while mentoring junior developers and contributing to our technical architecture decisions.""",
        "requirements": [
            "5+ years of experience in frontend development",
            "Expert knowledge of React, TypeScript, and modern JavaScript (ES6+)",
            "Experience with state management libraries (Redux, Zustand, or similar)",
            "Strong understanding of responsive design and CSS-in-JS solutions",
            "Experience with testing frameworks (Jest, React Testing Library)",
            "Familiarity with build tools (Webpack, Vite) and CI/CD pipelines",
            "Bachelor's degree in Computer Science or equivalent experience"
        ],
        "responsibilities": [
            "Develop and maintain high-quality frontend applications",
            "Collaborate with designers to implement pixel-perfect UI components",
            "Optimize applications for maximum speed and scalability",
            "Mentor junior developers and conduct code reviews",
            "Participate in architectural decisions and technical planning",
            "Write comprehensive tests and maintain code documentation",
            "Stay up-to-date with emerging frontend technologies and best practices"
        ],
        "benefits": [
            "Competitive salary with equity package",
            "Comprehensive health, dental, and vision insurance",
            "Flexible work arrangements and remote work options",
            "Professional development budget ($3,000/year)",
            "Unlimited PTO policy",
            "Top-tier equipment and home office setup allowance",
            "Team building events and company retreats"
        ],
        "skills": ["React", "TypeScript", "JavaScript", "CSS", "HTML", "Redux", "Next.js", "Git", "Testing"],
        "salary": SalaryInfo(min=120000, max=160000, currency="USD", period="yearly"),
        "remote_allowed": True,
        "urgent": False,
        "status": JobStatus.ACTIVE,
        "closing_date": datetime.now() + timedelta(days=30)
    },
    {
        "title": "Product Manager",
        "department": "Product",
        "location": "New York, NY",
        "job_type": JobType.FULL_TIME,
        "experience_level": ExperienceLevel.MID,
        "description": """Join our product team as a Product Manager to drive the strategy and execution of our core products. You will work closely with engineering, design, and business teams to deliver features that delight our customers and drive business growth.

In this role, you'll own the product roadmap for key features, conduct user research, analyze data to make informed decisions, and collaborate with cross-functional teams to bring innovative solutions to market.""",
        "requirements": [
            "3+ years of product management experience in tech companies",
            "Strong analytical and problem-solving skills",
            "Experience with agile development methodologies",
            "Excellent communication and leadership skills",
            "Data-driven approach to decision making",
            "Experience with product analytics tools (Mixpanel, Amplitude, etc.)",
            "Bachelor's degree in Business, Engineering, or related field"
        ],
        "responsibilities": [
            "Define and execute product strategy and roadmap",
            "Conduct user research and gather customer feedback",
            "Work with engineering teams to prioritize features and manage releases",
            "Analyze product metrics and user behavior data",
            "Collaborate with design team on user experience improvements",
            "Communicate product updates to stakeholders and leadership",
            "Manage product backlog and sprint planning"
        ],
        "benefits": [
            "Competitive salary with performance bonuses",
            "Health, dental, and vision insurance",
            "401(k) with company matching",
            "Professional development opportunities",
            "Flexible work schedule",
            "Catered meals and snacks",
            "Gym membership reimbursement"
        ],
        "skills": ["Product Management", "Analytics", "Agile", "User Research", "SQL", "Roadmapping", "Stakeholder Management"],
        "salary": SalaryInfo(min=100000, max=140000, currency="USD", period="yearly"),
        "remote_allowed": False,
        "urgent": False,
        "status": JobStatus.ACTIVE,
        "closing_date": datetime.now() + timedelta(days=45)
    },
    {
        "title": "Data Scientist",
        "department": "Engineering",
        "location": "Remote",
        "job_type": JobType.FULL_TIME,
        "experience_level": ExperienceLevel.MID,
        "description": """We're looking for a talented Data Scientist to join our growing data team. You'll work on challenging problems involving machine learning, statistical analysis, and data visualization to drive business insights and product improvements.

This is a remote-first position where you'll collaborate with product managers, engineers, and business stakeholders to turn data into actionable insights that impact millions of users.""",
        "requirements": [
            "3+ years of experience in data science or related field",
            "Strong programming skills in Python and R",
            "Experience with machine learning frameworks (scikit-learn, TensorFlow, PyTorch)",
            "Proficiency in SQL and database technologies",
            "Experience with data visualization tools (Tableau, Power BI, or similar)",
            "Strong statistical analysis and modeling skills",
            "Master's degree in Data Science, Statistics, or related field preferred"
        ],
        "responsibilities": [
            "Develop and deploy machine learning models",
            "Analyze large datasets to identify trends and insights",
            "Create data visualizations and dashboards for stakeholders",
            "Collaborate with engineering teams to implement data solutions",
            "Design and conduct A/B tests and experiments",
            "Present findings to leadership and cross-functional teams",
            "Maintain and improve existing data pipelines"
        ],
        "benefits": [
            "Competitive salary with equity",
            "Remote work with flexible hours",
            "Health and wellness benefits",
            "Learning and development budget",
            "Home office setup allowance",
            "Annual company retreat",
            "Mental health support"
        ],
        "skills": ["Python", "R", "Machine Learning", "SQL", "Statistics", "TensorFlow", "Tableau", "A/B Testing"],
        "salary": SalaryInfo(min=110000, max=150000, currency="USD", period="yearly"),
        "remote_allowed": True,
        "urgent": True,
        "status": JobStatus.ACTIVE,
        "closing_date": datetime.now() + timedelta(days=21)
    },
    {
        "title": "Marketing Specialist",
        "department": "Marketing",
        "location": "Austin, TX",
        "job_type": JobType.FULL_TIME,
        "experience_level": ExperienceLevel.ENTRY,
        "description": """Join our marketing team as a Marketing Specialist to help drive brand awareness and customer acquisition. You'll work on diverse marketing campaigns across digital channels, content creation, and event marketing.

This is an excellent opportunity for someone early in their marketing career to gain experience across multiple marketing disciplines while working with a supportive and creative team.""",
        "requirements": [
            "1-3 years of marketing experience",
            "Bachelor's degree in Marketing, Communications, or related field",
            "Experience with digital marketing platforms (Google Ads, Facebook Ads)",
            "Strong written and verbal communication skills",
            "Familiarity with marketing automation tools",
            "Basic knowledge of SEO and content marketing",
            "Creative thinking and attention to detail"
        ],
        "responsibilities": [
            "Execute digital marketing campaigns across multiple channels",
            "Create and manage content for social media platforms",
            "Assist with event planning and execution",
            "Analyze campaign performance and provide insights",
            "Support email marketing campaigns and automation",
            "Collaborate with design team on marketing materials",
            "Conduct market research and competitive analysis"
        ],
        "benefits": [
            "Competitive entry-level salary",
            "Health and dental insurance",
            "Professional development opportunities",
            "Flexible PTO policy",
            "Team lunch stipend",
            "Conference attendance budget",
            "Career mentorship program"
        ],
        "skills": ["Digital Marketing", "Social Media", "Content Creation", "Google Ads", "Analytics", "SEO", "Email Marketing"],
        "salary": SalaryInfo(min=50000, max=70000, currency="USD", period="yearly"),
        "remote_allowed": False,
        "urgent": False,
        "status": JobStatus.ACTIVE,
        "closing_date": datetime.now() + timedelta(days=60)
    },
    {
        "title": "UX/UI Designer",
        "department": "Design",
        "location": "Seattle, WA",
        "job_type": JobType.FULL_TIME,
        "experience_level": ExperienceLevel.MID,
        "description": """We're seeking a talented UX/UI Designer to join our design team and help create intuitive, beautiful user experiences. You'll work on both web and mobile applications, collaborating closely with product managers and engineers to bring designs from concept to reality.

This role is perfect for a designer who is passionate about user-centered design and wants to make a significant impact on products used by millions of people worldwide.""",
        "requirements": [
            "3+ years of UX/UI design experience",
            "Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)",
            "Strong portfolio demonstrating user-centered design process",
            "Experience with user research and usability testing",
            "Understanding of responsive design and mobile-first principles",
            "Knowledge of design systems and component libraries",
            "Bachelor's degree in Design, HCI, or related field"
        ],
        "responsibilities": [
            "Design user interfaces for web and mobile applications",
            "Conduct user research and usability testing",
            "Create wireframes, prototypes, and high-fidelity mockups",
            "Collaborate with product and engineering teams",
            "Maintain and evolve design system components",
            "Present design concepts to stakeholders",
            "Iterate on designs based on user feedback and data"
        ],
        "benefits": [
            "Competitive salary with design tool stipend",
            "Health, dental, and vision insurance",
            "Creative workspace with latest design equipment",
            "Conference and workshop attendance budget",
            "Flexible work arrangements",
            "Design book and resource library",
            "Team design retreats"
        ],
        "skills": ["Figma", "Sketch", "Adobe XD", "User Research", "Prototyping", "Design Systems", "HTML/CSS"],
        "salary": SalaryInfo(min=85000, max=120000, currency="USD", period="yearly"),
        "remote_allowed": True,
        "urgent": False,
        "status": JobStatus.ACTIVE,
        "closing_date": datetime.now() + timedelta(days=35)
    },
    {
        "title": "Sales Development Representative",
        "department": "Sales",
        "location": "Boston, MA",
        "job_type": JobType.FULL_TIME,
        "experience_level": ExperienceLevel.ENTRY,
        "description": """Join our high-performing sales team as a Sales Development Representative (SDR). You'll be responsible for generating qualified leads, conducting outreach to potential customers, and setting up meetings for our Account Executives.

This is an excellent entry point into a sales career with clear advancement opportunities and comprehensive training. You'll learn our sales methodology while contributing to our rapid growth.""",
        "requirements": [
            "0-2 years of sales or customer-facing experience",
            "Bachelor's degree preferred",
            "Excellent communication and interpersonal skills",
            "Strong work ethic and competitive drive",
            "Familiarity with CRM systems (Salesforce preferred)",
            "Ability to handle rejection and maintain positive attitude",
            "Interest in technology and SaaS products"
        ],
        "responsibilities": [
            "Generate qualified leads through outbound prospecting",
            "Conduct cold calls and email outreach to potential customers",
            "Qualify prospects and schedule meetings for Account Executives",
            "Maintain accurate records in CRM system",
            "Collaborate with marketing team on lead generation campaigns",
            "Attend industry events and networking opportunities",
            "Meet monthly quotas for qualified meetings and pipeline generation"
        ],
        "benefits": [
            "Base salary plus uncapped commission",
            "Comprehensive sales training program",
            "Health and dental insurance",
            "Career advancement opportunities",
            "Monthly team incentives and contests",
            "Professional development budget",
            "Flexible PTO policy"
        ],
        "skills": ["Sales", "CRM", "Cold Calling", "Email Marketing", "Lead Generation", "Salesforce", "Communication"],
        "salary": SalaryInfo(min=45000, max=65000, currency="USD", period="yearly"),
        "remote_allowed": False,
        "urgent": True,
        "status": JobStatus.ACTIVE,
        "closing_date": datetime.now() + timedelta(days=14)
    },
    {
        "title": "DevOps Engineer",
        "department": "Engineering",
        "location": "Denver, CO",
        "job_type": JobType.FULL_TIME,
        "experience_level": ExperienceLevel.SENIOR,
        "description": """We're looking for an experienced DevOps Engineer to join our infrastructure team. You'll be responsible for building and maintaining our cloud infrastructure, implementing CI/CD pipelines, and ensuring the reliability and scalability of our systems.

This role offers the opportunity to work with cutting-edge technologies and make architectural decisions that impact our entire engineering organization.""",
        "requirements": [
            "5+ years of DevOps or infrastructure engineering experience",
            "Strong experience with cloud platforms (AWS, GCP, or Azure)",
            "Proficiency in Infrastructure as Code (Terraform, CloudFormation)",
            "Experience with containerization (Docker, Kubernetes)",
            "Knowledge of CI/CD tools (Jenkins, GitLab CI, GitHub Actions)",
            "Scripting skills in Python, Bash, or similar languages",
            "Experience with monitoring and logging tools"
        ],
        "responsibilities": [
            "Design and maintain cloud infrastructure architecture",
            "Implement and optimize CI/CD pipelines",
            "Monitor system performance and reliability",
            "Automate deployment and scaling processes",
            "Collaborate with development teams on infrastructure needs",
            "Implement security best practices and compliance measures",
            "Troubleshoot and resolve production issues"
        ],
        "benefits": [
            "Competitive salary with equity package",
            "Comprehensive health benefits",
            "Remote work flexibility",
            "Professional certification reimbursement",
            "Conference attendance budget",
            "Home office equipment allowance",
            "On-call compensation"
        ],
        "skills": ["AWS", "Kubernetes", "Docker", "Terraform", "Python", "CI/CD", "Monitoring", "Linux"],
        "salary": SalaryInfo(min=130000, max=170000, currency="USD", period="yearly"),
        "remote_allowed": True,
        "urgent": False,
        "status": JobStatus.ACTIVE,
        "closing_date": datetime.now() + timedelta(days=40)
    },
    {
        "title": "HR Business Partner",
        "department": "Human Resources",
        "location": "Chicago, IL",
        "job_type": JobType.FULL_TIME,
        "experience_level": ExperienceLevel.MID,
        "description": """Join our HR team as an HR Business Partner to support our growing organization. You'll work closely with leadership teams to develop HR strategies, manage employee relations, and drive organizational development initiatives.

This role is ideal for an experienced HR professional who wants to make a strategic impact on company culture and employee experience.""",
        "requirements": [
            "5+ years of HR generalist or business partner experience",
            "Bachelor's degree in HR, Business, or related field",
            "Strong knowledge of employment law and HR best practices",
            "Experience with HRIS systems and HR analytics",
            "Excellent interpersonal and communication skills",
            "PHR or SHRM certification preferred",
            "Experience in fast-growing technology companies"
        ],
        "responsibilities": [
            "Partner with leadership on HR strategy and initiatives",
            "Manage employee relations and conflict resolution",
            "Support talent acquisition and onboarding processes",
            "Develop and implement HR policies and procedures",
            "Conduct performance management and coaching sessions",
            "Lead organizational development and culture initiatives",
            "Analyze HR metrics and provide insights to leadership"
        ],
        "benefits": [
            "Competitive salary with annual bonus",
            "Comprehensive health and wellness benefits",
            "Professional development and certification support",
            "Flexible work arrangements",
            "Generous PTO and sabbatical options",
            "Employee assistance program",
            "Retirement plan with company matching"
        ],
        "skills": ["HR Strategy", "Employee Relations", "HRIS", "Employment Law", "Performance Management", "Recruiting", "Analytics"],
        "salary": SalaryInfo(min=80000, max=110000, currency="USD", period="yearly"),
        "remote_allowed": False,
        "urgent": False,
        "status": JobStatus.ACTIVE,
        "closing_date": datetime.now() + timedelta(days=50)
    },
    {
        "title": "Backend Developer",
        "department": "Engineering",
        "location": "Remote",
        "job_type": JobType.FULL_TIME,
        "experience_level": ExperienceLevel.MID,
        "description": """We're seeking a skilled Backend Developer to join our engineering team and help build scalable, high-performance APIs and services. You'll work with modern technologies like Python, FastAPI, and cloud services to create robust backend systems.

This is a fully remote position where you'll collaborate with a distributed team of engineers, product managers, and designers to deliver features that serve millions of users.""",
        "requirements": [
            "3+ years of backend development experience",
            "Strong proficiency in Python and web frameworks (FastAPI, Django, Flask)",
            "Experience with relational and NoSQL databases",
            "Knowledge of RESTful API design and microservices architecture",
            "Familiarity with cloud services (AWS, GCP, or Azure)",
            "Experience with version control (Git) and agile methodologies",
            "Understanding of testing frameworks and best practices"
        ],
        "responsibilities": [
            "Design and develop scalable backend APIs and services",
            "Optimize database queries and system performance",
            "Implement security best practices and data protection measures",
            "Collaborate with frontend developers on API integration",
            "Write comprehensive tests and maintain code documentation",
            "Participate in code reviews and technical discussions",
            "Monitor and troubleshoot production systems"
        ],
        "benefits": [
            "Competitive salary with equity",
            "Fully remote work environment",
            "Flexible working hours across time zones",
            "Health and wellness benefits",
            "Professional development budget",
            "Home office setup allowance",
            "Annual team meetups and retreats"
        ],
        "skills": ["Python", "FastAPI", "PostgreSQL", "MongoDB", "REST APIs", "Docker", "AWS", "Git"],
        "salary": SalaryInfo(min=95000, max=130000, currency="USD", period="yearly"),
        "remote_allowed": True,
        "urgent": False,
        "status": JobStatus.ACTIVE,
        "closing_date": datetime.now() + timedelta(days=45)
    },
    {
        "title": "Marketing Intern",
        "department": "Marketing",
        "location": "San Francisco, CA",
        "job_type": JobType.INTERNSHIP,
        "experience_level": ExperienceLevel.ENTRY,
        "description": """Join our marketing team as a Marketing Intern for a hands-on learning experience in digital marketing, content creation, and campaign management. This internship offers real-world experience with mentorship from senior marketing professionals.

Perfect for students or recent graduates looking to gain practical marketing experience while contributing to meaningful projects that impact our business growth.""",
        "requirements": [
            "Currently pursuing or recently completed degree in Marketing, Communications, or related field",
            "Strong written and verbal communication skills",
            "Familiarity with social media platforms and digital marketing concepts",
            "Basic knowledge of Microsoft Office or Google Workspace",
            "Creative thinking and attention to detail",
            "Ability to work 20-40 hours per week",
            "Enthusiasm for learning and taking on new challenges"
        ],
        "responsibilities": [
            "Assist with social media content creation and scheduling",
            "Support email marketing campaigns and automation",
            "Help with market research and competitive analysis",
            "Assist in planning and executing marketing events",
            "Create marketing materials and presentations",
            "Track and report on marketing campaign performance",
            "Support various marketing projects and initiatives"
        ],
        "benefits": [
            "Competitive internship stipend",
            "Mentorship from senior marketing professionals",
            "Real-world marketing experience",
            "Networking opportunities",
            "Potential for full-time offer",
            "Flexible schedule for students",
            "Professional development workshops"
        ],
        "skills": ["Social Media", "Content Creation", "Microsoft Office", "Communication", "Research", "Analytics"],
        "salary": SalaryInfo(min=20, max=25, currency="USD", period="hourly"),
        "remote_allowed": False,
        "urgent": False,
        "status": JobStatus.DRAFT,
        "closing_date": datetime.now() + timedelta(days=30)
    }
]


async def get_admin_user():
    """Get the admin user for job creation"""
    admin_user = await User.find_one(User.email == "admin@resumescreener.com")
    if not admin_user:
        print("❌ Admin user not found. Please run init_database.py first.")
        return None
    return admin_user


async def create_sample_jobs():
    """Create sample jobs in the database"""
    print("🚀 Starting sample job creation...")
    
    # Get admin user
    admin_user = await get_admin_user()
    if not admin_user:
        return False
    
    created_count = 0
    
    for job_data in SAMPLE_JOBS:
        try:
            # Check if job already exists
            existing_job = await Job.find_one(
                Job.title == job_data["title"], 
                Job.department == job_data["department"]
            )
            
            if existing_job:
                print(f"⏭️  Job '{job_data['title']}' already exists, skipping...")
                continue
            
            # Create new job
            job = Job(
                title=job_data["title"],
                description=job_data["description"],
                department=job_data["department"],
                location=job_data["location"],
                job_type=job_data["job_type"],
                experience_level=job_data["experience_level"],
                requirements=job_data["requirements"],
                responsibilities=job_data["responsibilities"],
                benefits=job_data["benefits"],
                skills=job_data["skills"],
                salary=job_data["salary"],
                remote_allowed=job_data["remote_allowed"],
                urgent=job_data["urgent"],
                status=job_data["status"],
                closing_date=job_data["closing_date"],
                user_id=str(admin_user.id),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            await job.insert()
            created_count += 1
            print(f"✅ Created job: {job_data['title']} ({job_data['department']})")
            
        except Exception as e:
            print(f"❌ Error creating job '{job_data['title']}': {str(e)}")
    
    print(f"\n🎉 Successfully created {created_count} sample jobs!")
    return True


async def main():
    """Main function"""
    print("📋 Sample Job Seeding Script")
    print("=" * 50)
    
    try:
        # Initialize database
        await init_database()
        print("✅ Database connection established")
        
        # Create sample jobs
        success = await create_sample_jobs()
        
        if success:
            print("\n✨ Sample job creation completed successfully!")
            print("\n📊 Summary:")
            print(f"   • Total jobs in dataset: {len(SAMPLE_JOBS)}")
            print("   • Departments: Engineering, Product, Marketing, Design, Sales, HR")
            print("   • Experience levels: Entry, Mid, Senior")
            print("   • Job types: Full-time, Internship")
            print("   • Locations: San Francisco, New York, Austin, Seattle, Boston, Denver, Chicago, Remote")
        else:
            print("\n❌ Sample job creation failed!")
            
    except Exception as e:
        print(f"❌ Script execution failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
