// MongoDB initialization script
db = db.getSiblingDB('resume_screener');

// Create collections
db.createCollection('uploaded_resumes');
db.createCollection('job_descriptions');
db.createCollection('resume_analyses');

// Create indexes for better performance
db.uploaded_resumes.createIndex({ "filename": 1 });
db.uploaded_resumes.createIndex({ "uploaded_at": -1 });
db.uploaded_resumes.createIndex({ "status": 1 });

db.job_descriptions.createIndex({ "title": 1 });
db.job_descriptions.createIndex({ "company": 1 });
db.job_descriptions.createIndex({ "created_at": -1 });

db.resume_analyses.createIndex({ "resume_id": 1 });
db.resume_analyses.createIndex({ "job_description_id": 1 });
db.resume_analyses.createIndex({ "status": 1 });
db.resume_analyses.createIndex({ "match_score.overall_score": -1 });
db.resume_analyses.createIndex({ "ai_analysis.recommendation": 1 });
db.resume_analyses.createIndex({ "created_at": -1 });

// Compound indexes
db.resume_analyses.createIndex({ 
    "job_description_id": 1, 
    "status": 1, 
    "match_score.overall_score": -1 
});

print("MongoDB initialization completed successfully!");
