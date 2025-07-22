export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: 'entry' | 'mid' | 'senior' | 'executive';
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  status: 'draft' | 'active' | 'paused' | 'closed';
  applicants: number;
  views: number;
  postedDate: string;
  closingDate: string;
  createdBy: string;
  updatedAt: string;
}

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    type: 'full-time',
    experience: 'senior',
    salary: {
      min: 120000,
      max: 160000,
      currency: 'USD'
    },
    description: 'We are looking for a Senior Frontend Developer to join our growing engineering team. You will be responsible for building and maintaining our web applications using modern technologies.',
    requirements: [
      '5+ years of experience in frontend development',
      'Expert knowledge of React, TypeScript, and modern JavaScript',
      'Experience with state management libraries (Redux, Zustand)',
      'Strong understanding of responsive design and CSS',
      'Experience with testing frameworks (Jest, React Testing Library)'
    ],
    responsibilities: [
      'Develop and maintain high-quality web applications',
      'Collaborate with designers and backend developers',
      'Write clean, maintainable, and well-tested code',
      'Participate in code reviews and technical discussions',
      'Mentor junior developers and contribute to team growth'
    ],
    benefits: [
      'Competitive salary and equity package',
      'Health, dental, and vision insurance',
      'Flexible work arrangements',
      'Professional development budget',
      'Unlimited PTO'
    ],
    skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Redux', 'Next.js'],
    status: 'active',
    applicants: 24,
    views: 156,
    postedDate: '2024-01-15',
    closingDate: '2024-02-15',
    createdBy: 'John Smith',
    updatedAt: '2024-01-20'
  },
  {
    id: '2',
    title: 'Product Manager',
    department: 'Product',
    location: 'New York, NY',
    type: 'full-time',
    experience: 'mid',
    salary: {
      min: 100000,
      max: 140000,
      currency: 'USD'
    },
    description: 'Join our product team to drive the strategy and execution of our core products. You will work closely with engineering, design, and business teams.',
    requirements: [
      '3+ years of product management experience',
      'Strong analytical and problem-solving skills',
      'Experience with agile development methodologies',
      'Excellent communication and leadership skills',
      'Bachelor\'s degree in relevant field'
    ],
    responsibilities: [
      'Define product strategy and roadmap',
      'Work with engineering teams to deliver features',
      'Analyze user feedback and market trends',
      'Coordinate with stakeholders across the organization',
      'Track and report on product metrics'
    ],
    benefits: [
      'Competitive salary and bonus structure',
      'Comprehensive health benefits',
      'Stock options',
      'Learning and development opportunities',
      'Flexible working hours'
    ],
    skills: ['Product Strategy', 'Agile', 'Analytics', 'User Research', 'Roadmapping'],
    status: 'active',
    applicants: 18,
    views: 89,
    postedDate: '2024-01-10',
    closingDate: '2024-02-10',
    createdBy: 'Sarah Johnson',
    updatedAt: '2024-01-18'
  },
  {
    id: '3',
    title: 'UX Designer',
    department: 'Design',
    location: 'Remote',
    type: 'full-time',
    experience: 'mid',
    salary: {
      min: 80000,
      max: 110000,
      currency: 'USD'
    },
    description: 'We\'re seeking a talented UX Designer to create intuitive and engaging user experiences for our digital products.',
    requirements: [
      '3+ years of UX design experience',
      'Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)',
      'Strong portfolio demonstrating UX design skills',
      'Experience with user research and usability testing',
      'Understanding of design systems and accessibility'
    ],
    responsibilities: [
      'Design user-centered experiences for web and mobile',
      'Conduct user research and usability testing',
      'Create wireframes, prototypes, and high-fidelity designs',
      'Collaborate with product and engineering teams',
      'Maintain and evolve design systems'
    ],
    benefits: [
      'Remote-first culture',
      'Health and wellness benefits',
      'Professional development budget',
      'Latest design tools and equipment',
      'Flexible schedule'
    ],
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Accessibility'],
    status: 'active',
    applicants: 31,
    views: 203,
    postedDate: '2024-01-12',
    closingDate: '2024-02-12',
    createdBy: 'Mike Chen',
    updatedAt: '2024-01-19'
  },
  {
    id: '4',
    title: 'Data Scientist',
    department: 'Data',
    location: 'Austin, TX',
    type: 'full-time',
    experience: 'senior',
    salary: {
      min: 130000,
      max: 170000,
      currency: 'USD'
    },
    description: 'Join our data team to build machine learning models and derive insights from large datasets to drive business decisions.',
    requirements: [
      'PhD or Master\'s in Data Science, Statistics, or related field',
      '4+ years of experience in data science and machine learning',
      'Proficiency in Python, R, and SQL',
      'Experience with ML frameworks (TensorFlow, PyTorch, scikit-learn)',
      'Strong statistical analysis and modeling skills'
    ],
    responsibilities: [
      'Develop and deploy machine learning models',
      'Analyze large datasets to extract business insights',
      'Collaborate with product and engineering teams',
      'Present findings to stakeholders',
      'Mentor junior data scientists'
    ],
    benefits: [
      'Competitive salary and equity',
      'Comprehensive benefits package',
      'Conference and training budget',
      'State-of-the-art computing resources',
      'Flexible work arrangements'
    ],
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Statistics', 'R'],
    status: 'paused',
    applicants: 12,
    views: 67,
    postedDate: '2024-01-08',
    closingDate: '2024-02-08',
    createdBy: 'Lisa Wang',
    updatedAt: '2024-01-16'
  },
  {
    id: '5',
    title: 'Marketing Coordinator',
    department: 'Marketing',
    location: 'Los Angeles, CA',
    type: 'full-time',
    experience: 'entry',
    salary: {
      min: 50000,
      max: 65000,
      currency: 'USD'
    },
    description: 'Support our marketing team in executing campaigns and managing marketing operations for our growing company.',
    requirements: [
      '1-2 years of marketing experience',
      'Bachelor\'s degree in Marketing, Communications, or related field',
      'Experience with digital marketing tools',
      'Strong written and verbal communication skills',
      'Detail-oriented with strong organizational skills'
    ],
    responsibilities: [
      'Assist in planning and executing marketing campaigns',
      'Manage social media accounts and content',
      'Coordinate marketing events and webinars',
      'Track and report on marketing metrics',
      'Support the marketing team with various projects'
    ],
    benefits: [
      'Growth opportunities',
      'Health and dental insurance',
      'Paid time off',
      'Professional development support',
      'Team building activities'
    ],
    skills: ['Digital Marketing', 'Social Media', 'Content Creation', 'Analytics', 'Communication'],
    status: 'draft',
    applicants: 0,
    views: 0,
    postedDate: '2024-01-20',
    closingDate: '2024-02-20',
    createdBy: 'Emma Davis',
    updatedAt: '2024-01-20'
  }
];

export const jobDepartments = [
  'Engineering',
  'Product',
  'Design',
  'Data',
  'Marketing',
  'Sales',
  'Operations',
  'HR',
  'Finance'
];

export const jobTypes = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' }
];

export const experienceLevels = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'executive', label: 'Executive' }
];

export const jobStatuses = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'paused', label: 'Paused', color: 'yellow' },
  { value: 'closed', label: 'Closed', color: 'red' }
];
