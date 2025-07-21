export interface Resume {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  experience: number; // years
  skills: string[];
  education: {
    degree: string;
    school: string;
    year: number;
  }[];
  summary: string;
  status: 'new' | 'reviewed' | 'shortlisted' | 'interviewed' | 'rejected' | 'hired';
  uploadDate: string;
  fileType: 'pdf' | 'doc' | 'docx';
  fileSize: number; // in bytes
  matchScore?: number; // 0-100
  tags: string[];
  lastActivity: string;
  source: string;
}

export const mockResumes: Resume[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    title: 'Senior Software Engineer',
    experience: 5,
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
    education: [
      {
        degree: 'Bachelor of Computer Science',
        school: 'Stanford University',
        year: 2019
      }
    ],
    summary: 'Experienced software engineer with expertise in full-stack development and cloud technologies.',
    status: 'reviewed',
    uploadDate: '2024-01-15T10:30:00Z',
    fileType: 'pdf',
    fileSize: 2048576,
    matchScore: 92,
    tags: ['Frontend', 'Backend', 'Cloud'],
    lastActivity: '2024-01-16T14:20:00Z',
    source: 'LinkedIn'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 234-5678',
    location: 'New York, NY',
    title: 'UX/UI Designer',
    experience: 3,
    skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'HTML/CSS'],
    education: [
      {
        degree: 'Master of Design',
        school: 'Parsons School of Design',
        year: 2021
      }
    ],
    summary: 'Creative UX/UI designer passionate about creating intuitive and beautiful user experiences.',
    status: 'shortlisted',
    uploadDate: '2024-01-14T09:15:00Z',
    fileType: 'pdf',
    fileSize: 1536000,
    matchScore: 88,
    tags: ['Design', 'UX', 'UI'],
    lastActivity: '2024-01-17T11:45:00Z',
    source: 'Company Website'
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 345-6789',
    location: 'Seattle, WA',
    title: 'Data Scientist',
    experience: 4,
    skills: ['Python', 'R', 'Machine Learning', 'TensorFlow', 'SQL', 'Tableau'],
    education: [
      {
        degree: 'PhD in Data Science',
        school: 'University of Washington',
        year: 2020
      }
    ],
    summary: 'Data scientist with strong background in machine learning and statistical analysis.',
    status: 'interviewed',
    uploadDate: '2024-01-13T16:45:00Z',
    fileType: 'docx',
    fileSize: 1024000,
    matchScore: 95,
    tags: ['Data Science', 'ML', 'Analytics'],
    lastActivity: '2024-01-18T09:30:00Z',
    source: 'Referral'
  }
];

// Generate more mock data
export const generateMockResumes = (count: number): Resume[] => {
  const names = ['Alex Rodriguez', 'Emily Davis', 'David Wilson', 'Lisa Anderson', 'James Brown', 'Maria Garcia', 'Robert Taylor', 'Jennifer Martinez'];
  const titles = ['Software Engineer', 'Product Manager', 'Data Analyst', 'Marketing Specialist', 'Sales Representative', 'HR Manager', 'Graphic Designer', 'DevOps Engineer'];
  const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Chicago, IL', 'Los Angeles, CA', 'Denver, CO'];
  const skillSets = [
    ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    ['Python', 'Django', 'PostgreSQL', 'Redis'],
    ['Java', 'Spring', 'MySQL', 'Kubernetes'],
    ['C#', '.NET', 'Azure', 'SQL Server'],
    ['PHP', 'Laravel', 'Vue.js', 'Docker'],
    ['Ruby', 'Rails', 'Heroku', 'Git']
  ];
  const statuses: Resume['status'][] = ['new', 'reviewed', 'shortlisted', 'interviewed', 'rejected'];
  const sources = ['LinkedIn', 'Indeed', 'Company Website', 'Referral', 'Job Fair'];

  return Array.from({ length: count }, (_, i) => ({
    id: (i + 4).toString(),
    name: names[i % names.length],
    email: `${names[i % names.length].toLowerCase().replace(' ', '.')}@email.com`,
    phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    location: locations[i % locations.length],
    title: titles[i % titles.length],
    experience: Math.floor(Math.random() * 10) + 1,
    skills: skillSets[i % skillSets.length],
    education: [{
      degree: 'Bachelor of Science',
      school: 'University of Technology',
      year: 2020 - Math.floor(Math.random() * 5)
    }],
    summary: `Experienced professional with ${Math.floor(Math.random() * 10) + 1} years in the industry.`,
    status: statuses[i % statuses.length],
    uploadDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    fileType: ['pdf', 'doc', 'docx'][i % 3] as 'pdf' | 'doc' | 'docx',
    fileSize: Math.floor(Math.random() * 3000000) + 500000,
    matchScore: Math.floor(Math.random() * 40) + 60,
    tags: ['Frontend', 'Backend', 'Full Stack'][i % 3] ? ['Frontend'] : ['Backend'],
    lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    source: sources[i % sources.length]
  }));
};

export const allMockResumes = [...mockResumes, ...generateMockResumes(20)];
