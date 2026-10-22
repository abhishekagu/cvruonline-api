import Program from '../models/Program.js';

export const initialProgramsSeedData = [
    {
        slug: 'bba',
        name: 'Bachelor of Business Administration (BBA)',
        title: 'Online BBA',
        fullTitle: 'Bachelor of Business Administration (BBA)',
        type: 'BBA',
        level: 'UG',
        duration: '3 Years',
        minDegreeLevel: '12th',
        minEligibility: '10+2 in any discipline from a recognised/equivalent Board; General 45%, SC/ST/OBC 40%.',
        eligibility_criteria: '10+2 in any discipline from a recognised/equivalent Board; General 45%, SC/ST/OBC 40%.',
        baseFee: 22000,
        total_fee: 22000,
        registrationFee: 5000,
        categories: ['all', 'ug', 'management'],
        isActive: true,
        hasLinkedInBadge: false,
        heroImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
        description: 'The CVRU Bachelor of Business Administration (BBA) equips you with essential skills. It features interactive learning, expert faculty, and placement support.',
        infoBar: {
            fee: '₹22,000/- Per Year',
            hasEMI: false,
            deadline: 'Upcoming',
            durationNote: 'Total duration',
            commitment: '8-10 hours/week',
            commitmentNote: 'Recommended',
            model: 'LIVE + Recorded',
            modelNote: 'Lectures by Expert Faculty',
            batchesNote: 'Batches starting soon',
        },
        specializations: [
            { id: 'mkt', title: 'Marketing Management', icon: 'TrendingUp', desc: 'Strategic marketing, digital branding, consumer psychology, and market analytics.' },
            { id: 'fin', title: 'Financial Management', icon: 'DollarSign', desc: 'Corporate finance, investment analysis, working capital management, and banking.' },
            { id: 'hr', title: 'Human Resource Management', icon: 'Users', desc: 'Talent development, employee engagement, organizational behavior, and leadership.' },
            { id: 'ib', title: 'International Business', icon: 'Globe', desc: 'Global trade dynamics, export-import operations, and cross-border management.' },
        ],
        programUSPs: [
            { title: 'Entrepreneurship', desc: 'Focus on Entrepreneurship and Employability' },
            { title: 'Online BBA Curriculum', desc: 'Industry-oriented curriculum designed by experts' },
            { title: 'Projects & Training', desc: 'Capstone Projects and Summer Training for experiential learning' },
            { title: 'Flexible Learning', desc: 'Flexible Online Learning with LMS, e-Content and Live Sessions' },
        ],
        linkedinUSPs: [
            { title: 'Leadership & Management Learning Paths', icon: 'Award' },
            { title: 'Practical AI Skills for Managers', icon: 'Cpu' },
            { title: 'Real-World Business Case Studies & Projects', icon: 'Briefcase' },
            { title: 'Certification Prep: PMI, SHRM, Salesforce & More', icon: 'CheckCircle' },
        ],
        fee: {
            indian: { semester: 22000, lumpsum: 66000 },
            international: { semester: 1200, lumpsum: 4400 },
        },
        eligibility: ['10+2 in any discipline from a recognised/equivalent Board; General 45%, SC/ST/OBC 40%.'],
        notes: [
            'The fee indicated above is applicable to applicants from India, Sri Lanka, Bhutan, Nepal, Bangladesh, and Afghanistan.',
            'All payments are accepted online.',
            'Note: All CVRU programs are offered in English medium.',
        ],
        curriculum: {
            stats: [
                { label: 'Total Credits of Program', value: 120, icon: 'GraduationCap' },
                { label: 'Contemporary Courses', value: 35, icon: 'BookOpen' },
                { label: 'Semesters', value: '6', icon: 'Calendar' },
            ],
            semesters: [
                {
                    title: 'Semester 1',
                    courses: [
                        '1BBA1 - Hindi Bhasha aur Sanrachna',
                        '1BBA2 - Fundamentals of Entrepreneurship',
                        '1BBA3 - Principles of Management',
                        '1BBA4 - Business Environment',
                        '1BBA5 - Managerial Economics',
                        '1BBA6 - Business Mathematics',
                    ],
                },
                {
                    title: 'Semester 2',
                    courses: [
                        '2BBA1 - English Language and Indian Culture',
                        '2BBA2 - Development of Entrepreneur',
                        '2BBA3 - Business Communication',
                        '2BBA4 - Financial Accounting',
                        '2BBA5 - Business Law',
                        '2BBA6 - Business Organization & Management',
                    ],
                },
                {
                    title: 'Semester 3',
                    courses: [
                        '3BBA1 - Basic Computer Application',
                        '3BBA2 - Environmental Studies-I',
                        '3BBA3 - Banking & Insurance Practices',
                        '3BBA4 - Cost & Management Accounting',
                        '3BBA5 - Business Statistics',
                        '3BBA6 - Management information System',
                    ],
                },
                {
                    title: 'Semester 4',
                    courses: [
                        '4BBA1 - English Language and Scientific Temper',
                        '4BBA2 - Environmental Study-II',
                        '4BBA3 - Financial Management',
                        '4BBA4 - Marketing Management',
                        '4BBA5 - Production & Operation Management',
                        '4BBA6 - Human Resource Management',
                    ],
                },
                {
                    title: 'Semester 5',
                    courses: [
                        '5BBA1 - Hindi Language (Bhasha Kaushal aur Sanchar Sadhan)',
                        '5BBA2 - Computer & Information Technology Basics-I',
                        '5BBA3 - Corporate Strategy',
                        '5BBA4 - Research Methodology',
                        '5BBA5 - Consumer Behaviour',
                        '5BBA6 - Advertising and Sales Management',
                    ],
                },
                {
                    title: 'Semester 6',
                    courses: [
                        '6BBA1 - English Language and Aspects of Development',
                        '6BBA2 - Computer & Information Technology Basics-II',
                        '6BBA3 - Project Work & Viva Voce',
                        '6BBA4 - Service Marketing',
                        '6BBA5 - Marketing Research',
                    ],
                },
            ],
        },
        placements: {
            supportText: "The CVRU Placement Support Services are designed to enhance students' capabilities and prepare them for the professional world.",
            supportImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800',
            enhancement: [
                { title: 'Placement Enhancement', desc: 'Gain essential knowledge through comprehensive sessions focused on placement enhancement.', image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&q=80&w=800' },
                { title: 'Master Classes', desc: 'Explore our Master Classes and Workshops, designed to enhance your CV.', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800' },
            ],
        },
        admissionProcess: [
            { step: 1, title: 'Registration', desc: 'Sign up and pay the initial registration fee.' },
            { step: 2, title: 'Online Application', desc: 'Complete the application form with the required details, upload all necessary documents, and pay the applicable program fee.' },
            { step: 3, title: 'Provisional Registration & LMS Access', desc: 'Receive provisional student registration & access to the Learning Management System (LMS). Login credentials are shared via email.' },
            { step: 4, title: 'Document Verification & Admission Confirmation', desc: 'Submitted documents are reviewed by the admissions team. Upon successful verification, admission is formally confirmed.' },
        ],
        benefits: [
            { title: 'Expert Faculty Support', desc: 'Learn from qualified and experienced faculty through live interactive sessions, mentoring and academic guidance.' },
            { title: 'Industry Exposure', desc: 'Gain practical understanding through case studies, projects, industry-oriented assignments and application-based learning.' },
            { title: 'Advanced LMS Support', desc: 'Access e-content, recorded lectures, live classes, assignments, discussion forums and learning resources anytime, anywhere.' },
            { title: 'Contemporary Curriculum', desc: 'Study an updated, career-focused curriculum designed to develop relevant professional, digital and practical skills.' },
        ],
    },
    {
        slug: 'bca',
        name: 'Bachelor of Computer Applications (BCA)',
        title: 'Online BCA',
        fullTitle: 'Bachelor of Computer Applications (BCA)',
        type: 'BCA',
        level: 'UG',
        duration: '3 Years',
        minDegreeLevel: '12th',
        minEligibility: '10+2 with Mathematics from a recognised Board; General 45%, SC/ST/OBC 40%.',
        eligibility_criteria: '10+2 with Mathematics from a recognised Board; General 45%, SC/ST/OBC 40%.',
        baseFee: 28000,
        total_fee: 28000,
        registrationFee: 5000,
        categories: ['all', 'ug', 'computer_applications'],
        isActive: true,
        hasLinkedInBadge: false,
        heroImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200',
        description: 'The CVRU Bachelor of Computer Applications (BCA) equips you with essential skills. It features interactive learning, expert faculty, and placement support.',
        infoBar: {
            fee: '₹28,000/- Per Year',
            hasEMI: false,
            deadline: 'Upcoming',
            durationNote: 'Total duration',
            commitment: '8-10 hours/week',
            commitmentNote: 'Recommended',
            model: 'LIVE + Recorded',
            modelNote: 'Lectures by Expert Faculty',
            batchesNote: 'Batches starting soon',
        },
        specializations: [
            { id: 'cloud', title: 'Cloud Computing & DevOps', icon: 'Cpu', desc: 'Modern cloud architectures, containerization, CI/CD pipelines, and AWS/Azure deployment.' },
            { id: 'ds', title: 'Data Science & Big Data', icon: 'BarChart2', desc: 'Applied Python analysis, predictive data modeling, ETL pipelines, and business visualization.' },
            { id: 'cyber', title: 'Cyber Security & Network Defense', icon: 'Shield', desc: 'Defensive cyber infrastructure, ethical hacking, digital forensics, and security auditing.' },
            { id: 'web', title: 'Full Stack Web Development', icon: 'Monitor', desc: 'Scalable frontend engineering, REST API architecture, databases, and modern JS frameworks.' },
        ],
        programUSPs: [
            { title: 'Foundation', desc: 'Strong foundation in Programming and Computer Applications' },
            { title: 'Online BCA Curriculum', desc: 'Industry-oriented curriculum designed by experts' },
            { title: 'Projects & Training', desc: 'Capstone Projects and Summer Training for experiential learning' },
            { title: 'Programming', desc: 'Covers Python, C++, Java, Database and Software Engineering' },
        ],
        linkedinUSPs: [
            { title: 'Leadership & Management Learning Paths', icon: 'Award' },
            { title: 'Practical AI Skills for Managers', icon: 'Cpu' },
            { title: 'Real-World Business Case Studies & Projects', icon: 'Briefcase' },
            { title: 'Certification Prep: PMI, SHRM, Salesforce & More', icon: 'CheckCircle' },
        ],
        fee: {
            indian: { semester: 28000, lumpsum: 84000 },
            international: { semester: 1200, lumpsum: 4400 },
        },
        eligibility: [
            '10+2 with Mathematics from a recognised Board; General 45%, SC/ST/OBC 40%.',
            'Candidates without Mathematics at 10+2 shall pass a Remedial Course in Mathematics.',
        ],
        notes: [
            'The fee indicated above is applicable to applicants from India, Sri Lanka, Bhutan, Nepal, Bangladesh, and Afghanistan.',
            'All payments are accepted online.',
            'Note: All CVRU programs are offered in English medium.',
        ],
        curriculum: {
            stats: [
                { label: 'Total Credits of Program', value: 120, icon: 'GraduationCap' },
                { label: 'Contemporary Courses', value: 29, icon: 'BookOpen' },
                { label: 'Semesters', value: '6', icon: 'Calendar' },
            ],
            semesters: [
                {
                    title: 'Semester 1',
                    courses: [
                        '1BCA1 - Fundamentals of Computer Programming',
                        '1BCA2 - Fundamentals of Python',
                        '1BCA3 - Discrete Mathematics',
                        '1BCA4 - Entrepreneurship Development',
                        '1BCA5 - Hindi Bhasha avam Sanrachana',
                    ],
                },
                {
                    title: 'Semester 2',
                    courses: [
                        '2BCA1 - Advance Python',
                        '2BCA2 - Object Oriented programming in C++',
                        '2BCA3 - Digital Electronics',
                        '2BCA4 - English language and Indian culture',
                        '2BCA5 - Environmental Studies',
                    ],
                },
                {
                    title: 'Semester 3',
                    courses: [
                        '3BCA1 - Data Structure using C++',
                        '3BCA2 - Advance Excel',
                        '3BCA3 - Data Communication',
                        '3BCA4 - Office Automation & Internet',
                        '3BCA5 - Communication Skill',
                    ],
                },
                {
                    title: 'Semester 4',
                    courses: [
                        '4BCA1 - Programming with Java',
                        '4BCA2 - Introduction to Database',
                        '4BCA3 - Business Research Methods',
                        '4BCA4 - Software Quality Assurance and Testing',
                        '4BCA5 - Software Engineering',
                    ],
                },
                {
                    title: 'Semester 5',
                    courses: [
                        '5BCA1 - Operating System (Linux, windows, Shell Programming)',
                        '5BCA2 - Data Science Using Python',
                        '5BCA3 - Artificial Intelligence',
                        '5BCA4 - Personality Development',
                        '5BCA5 - Big Data Analytics',
                    ],
                },
                {
                    title: 'Semester 6',
                    courses: [
                        '6BCA1 - Cloud Computing',
                        '6BCA2 - Quantitative Techniques',
                        '6BCA3 - Internet of Thing',
                        '6BCA4 - Project & Viva Voce',
                    ],
                },
            ],
        },
        placements: {
            supportText: "The CVRU Placement Support Services are designed to enhance students' capabilities and prepare them for the professional world.",
            supportImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800',
            enhancement: [
                { title: 'Placement Enhancement', desc: 'Gain essential knowledge through comprehensive sessions focused on placement enhancement.', image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&q=80&w=800' },
                { title: 'Master Classes', desc: 'Explore our Master Classes and Workshops, designed to enhance your CV.', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800' },
            ],
        },
        admissionProcess: [
            { step: 1, title: 'Registration', desc: 'Sign up and pay the initial registration fee.' },
            { step: 2, title: 'Online Application', desc: 'Complete the application form with the required details, upload all necessary documents, and pay the applicable program fee.' },
            { step: 3, title: 'Provisional Registration & LMS Access', desc: 'Receive provisional student registration & access to the Learning Management System (LMS).' },
            { step: 4, title: 'Document Verification & Admission Confirmation', desc: 'Submitted documents are reviewed by the admissions team.' },
        ],
        benefits: [
            { title: 'Expert Faculty Support', desc: 'Learn from qualified and experienced faculty through live interactive sessions, mentoring and academic guidance.' },
            { title: 'Industry Exposure', desc: 'Gain practical understanding through case studies, projects, industry-oriented assignments and application-based learning.' },
            { title: 'Advanced LMS Support', desc: 'Access e-content, recorded lectures, live classes, assignments, discussion forums and learning resources anytime, anywhere.' },
            { title: 'Contemporary Curriculum', desc: 'Study an updated, career-focused curriculum designed to develop relevant professional, digital and practical skills.' },
        ],
    },
    {
        slug: 'blibisc',
        name: 'Bachelor of Library and Information Science (B.Lib.I.Sc.)',
        title: 'Online B.Lib.I.Sc.',
        fullTitle: 'Bachelor of Library and Information Science (B.Lib.I.Sc.)',
        type: 'B.Lib.I.Sc',
        level: 'PG',
        duration: '1 Year',
        minDegreeLevel: 'graduation',
        minEligibility: "Graduation / Bachelor's Degree in any discipline from a recognized university",
        eligibility_criteria: "Graduation / Bachelor's Degree in any discipline from a recognized university",
        baseFee: 22500,
        total_fee: 22500,
        registrationFee: 5000,
        categories: ['all', 'ug', 'library_science'],
        isActive: true,
        hasLinkedInBadge: false,
        heroImage: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1200',
        description: 'The CVRU Bachelor of Library and Information Science (B.Lib.I.Sc.) equips you with essential skills for modern digital libraries and information systems.',
        infoBar: {
            fee: '₹22,500/- Per Year',
            hasEMI: false,
            deadline: 'Upcoming',
            durationNote: 'Total duration',
            commitment: '8-10 hours/week',
            commitmentNote: 'Recommended',
            model: 'LIVE + Recorded',
            modelNote: 'Lectures by Expert Faculty',
            batchesNote: 'Batches starting soon',
        },
        programUSPs: [
            { title: 'Digital Library Skills', desc: 'Comprehensive knowledge of classification, cataloguing, and digital archiving.' },
            { title: 'Modern Information Systems', desc: 'Hands-on exposure to library automation software and databases.' },
            { title: 'Accredited Curriculum', desc: 'UGC-DEB recognized degree program.' },
        ],
        linkedinUSPs: [],
        fee: {
            indian: { semester: 22500, lumpsum: 22500 },
            international: { semester: 1200, lumpsum: 1200 },
        },
        eligibility: ["Graduation / Bachelor's Degree in any discipline from a recognized university."],
        notes: [
            'The fee indicated above is applicable to applicants from India, Sri Lanka, Bhutan, Nepal, Bangladesh, and Afghanistan.',
            'All payments are accepted online.',
        ],
        curriculum: {
            stats: [
                { label: 'Total Credits of Program', value: 40, icon: 'GraduationCap' },
                { label: 'Contemporary Courses', value: 10, icon: 'BookOpen' },
                { label: 'Semesters', value: '2', icon: 'Calendar' },
            ],
            semesters: [
                {
                    title: 'Semester 1',
                    courses: [
                        '1BLIB1 - Library and Society',
                        '1BLIB2 - Library Management',
                        '1BLIB3 - Library Classification Theory',
                        '1BLIB4 - Library Classification Practice',
                        '1BLIB5 - Foundation of library and information science',
                    ],
                },
                {
                    title: 'Semester 2',
                    courses: [
                        '2BLIB1 - Library Cataloguing Theory',
                        '2BLIB2 - Library Cataloguing Practice',
                        '2BLIB3 - Reference and Information Sources',
                        '2BLIB4 - Information Technology Basics',
                        '2BLIB5 - Project/Dissertation/Internships & Viva-Voce',
                    ],
                },
            ],
        },
        placements: {
            supportText: "CVRU Placement Support Services help library science graduates secure opportunities in university libraries, corporate documentation centers, and archives.",
            supportImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800',
            enhancement: [
                { title: 'Placement Enhancement', desc: 'Gain essential knowledge through comprehensive sessions focused on placement enhancement.', image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&q=80&w=800' },
                { title: 'Master Classes', desc: 'Explore our Master Classes and Workshops, designed to enhance your CV.', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800' },
            ],
        },
        admissionProcess: [
            { step: 1, title: 'Registration', desc: 'Sign up and pay the initial registration fee.' },
            { step: 2, title: 'Online Application', desc: 'Upload graduation marksheet and identity documents.' },
            { step: 3, title: 'Provisional Registration', desc: 'Receive student credentials.' },
            { step: 4, title: 'Confirmation', desc: 'Formal confirmation upon document review.' },
        ],
        benefits: [
            { title: 'Expert Faculty Support', desc: 'Learn from qualified and experienced faculty through live interactive sessions, mentoring and academic guidance.' },
            { title: 'Industry Exposure', desc: 'Gain practical understanding through case studies, projects, industry-oriented assignments and application-based learning.' },
            { title: 'Advanced LMS Support', desc: 'Access e-content, recorded lectures, live classes, assignments, discussion forums and learning resources anytime, anywhere.' },
            { title: 'Contemporary Curriculum', desc: 'Study an updated, career-focused curriculum designed to develop relevant professional, digital and practical skills.' },
        ],
    },
    {
        slug: 'mba',
        name: 'Master of Business Administration (MBA)',
        title: 'Online MBA',
        fullTitle: 'Master of Business Administration (MBA)',
        type: 'MBA',
        level: 'PG',
        duration: '2 Years',
        minDegreeLevel: 'graduation',
        minEligibility: "Graduation / Bachelor's Degree in any discipline from a recognized university",
        eligibility_criteria: "Graduation / Bachelor's Degree in any discipline from a recognized university",
        baseFee: 42000,
        total_fee: 42000,
        registrationFee: 5000,
        categories: ['all', 'pg', 'management'],
        isActive: true,
        hasLinkedInBadge: true,
        heroImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200',
        description: 'The CVRU Master of Business Administration (MBA) equips you with executive leadership, strategic management, and financial decision-making skills.',
        infoBar: {
            fee: '₹42,000/- Per Year',
            hasEMI: true,
            deadline: 'Upcoming',
            durationNote: 'Total duration',
            commitment: '10-12 hours/week',
            commitmentNote: 'Recommended',
            model: 'LIVE + Recorded',
            modelNote: 'Executive Lectures by Industry Leaders',
            batchesNote: 'Batches starting soon',
        },
        specializations: [
            { id: 'it', title: 'Information Technology', icon: 'Monitor', desc: 'Enterprise systems, IT governance, digital transformation management, and analytics.' },
            { id: 'ib', title: 'International Business', icon: 'Globe', desc: 'Cross-border commerce, global supply chains, international trade policy, and strategy.' },
            { id: 'bfs', title: 'Banking & Financial Services', icon: 'Building', desc: 'Investment analysis, retail banking, risk assessment, and fintech innovations.' },
            { id: 'hhm', title: 'Hospital & Healthcare Management', icon: 'Activity', desc: 'Hospital operations, health informatics, clinical governance, and healthcare finance.' },
            { id: 'hr', title: 'Human Resource Management', icon: 'Users', desc: 'Strategic talent management, corporate culture, HR analytics, and organizational development.' },
            { id: 'fin', title: 'Finance Management', icon: 'DollarSign', desc: 'Corporate valuation, portfolio management, treasury operations, and equity analysis.' },
            { id: 'mkt', title: 'Marketing Management', icon: 'TrendingUp', desc: 'Digital marketing ecosystems, brand architecture, omni-channel retail, and customer growth.' },
        ],
        programUSPs: [
            { title: 'Strategic Leadership', desc: 'Develop executive problem-solving and corporate decision-making capabilities.' },
            { title: 'Multi-Discipline Specializations', desc: 'Marketing, Finance, HR, IT, and International Business options.' },
            { title: 'Industry Mentorship', desc: 'Regular masterclasses with senior corporate executives.' },
            { title: 'Global Case Studies', desc: 'Real-world business case analyses and capstone strategy simulations.' },
        ],
        linkedinUSPs: [
            { title: 'Executive Management Learning Paths', icon: 'Award' },
            { title: 'Applied Generative AI for Executives', icon: 'Cpu' },
            { title: 'Global Corporate Strategy Projects', icon: 'Briefcase' },
            { title: 'Certifications: PMP, Agile, SHRM & Financial Modeling', icon: 'CheckCircle' },
        ],
        fee: {
            indian: { semester: 42000, lumpsum: 84000 },
            international: { semester: 2200, lumpsum: 4400 },
        },
        eligibility: ["Graduation / Bachelor's Degree in any discipline from a recognized university with minimum 50% (45% for reserved categories)."],
        notes: [
            'The fee indicated above is applicable to applicants from India, Sri Lanka, Bhutan, Nepal, Bangladesh, and Afghanistan.',
            'No-Cost EMI options available through university banking partners.',
            'All payments are accepted online.',
        ],
        curriculum: {
            stats: [
                { label: 'Total Credits of Program', value: 80, icon: 'GraduationCap' },
                { label: 'Core & Elective Courses', value: 38, icon: 'BookOpen' },
                { label: 'Semesters', value: '4', icon: 'Calendar' },
            ],
            semesters: [
                {
                    title: 'Semester 1',
                    courses: [
                        '1MBA1 - Management Process and Organizational Behavior',
                        '1MBA2 - Quantitative Method',
                        '1MBA3 - Managerial Economics',
                        '1MBA4 - Environment Analysis and Management',
                        '1MBA5 - Managerial Skill Development',
                        '1MBA6 - Accounting for Managers',
                        '1MBA7 - Computer Application for Managers',
                        '1MBA8 - Business ethics & CSR',
                    ],
                },
                {
                    title: 'Semester 2',
                    courses: [
                        '2MBA1 - Business policy and Strategic analysis',
                        '2MBA2 - Management science',
                        '2MBA3 - Human Resource Management',
                        '2MBA4 - Financial Management',
                        '2MBA5 - Marketing Management',
                        '2MBA6 - Production & operation Management',
                        '2MBA7 - Research Methodology',
                        '2MBA8 - International Business',
                    ],
                },
                {
                    title: 'Semester 3',
                    courses: [
                        '3MBA1 - Business legislation',
                        '3MBA2 - Group 1 - Paper I',
                        '3MBA3 - Group 1 - Paper II',
                        '3MBA4 - Group 1 - Paper III',
                        '3MBA5 - Group 2 - Paper I',
                        '3MBA6 - Group 2 - Paper II',
                        '3MBA7 - Group 2 - Paper III',
                        '3MBA8 - Summer Training Project & Viva',
                    ],
                },
                {
                    title: 'Semester 4',
                    courses: [
                        '4MBA1 - MIS & Decision Support System',
                        '4MBA2 - Group 1 - Paper IV',
                        '4MBA3 - Group 1 - Paper V',
                        '4MBA4 - Group 1 - Paper VI',
                        '4MBA5 - Group 2 - Paper IV',
                        '4MBA6 - Group 2 - Paper V',
                        '4MBA7 - Group 2 - Paper IV',
                        '4MBA8 - Final Project & Viva',
                    ],
                },
            ],
        },
        placements: {
            supportText: "The CVRU Corporate Relations & Placement Cell assists MBA graduates in securing leadership roles across leading multinational corporations and startups.",
            supportImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800',
            enhancement: [
                { title: 'Placement Enhancement', desc: 'Gain essential knowledge through comprehensive sessions focused on placement enhancement.', image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&q=80&w=800' },
                { title: 'Master Classes', desc: 'Explore our Master Classes and Workshops, designed to enhance your CV.', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800' },
            ],
        },
        admissionProcess: [
            { step: 1, title: 'Registration', desc: 'Sign up and pay the initial registration fee.' },
            { step: 2, title: 'Online Application', desc: 'Complete the academic profile and upload graduation credentials.' },
            { step: 3, title: 'Provisional Admission', desc: 'Receive LMS access and student dashboard.' },
            { step: 4, title: 'Confirmation', desc: 'Verification of university documents and enrollment letter.' },
        ],
        benefits: [
            { title: 'Expert Faculty Support', desc: 'Learn from qualified and experienced faculty through live interactive sessions, mentoring and academic guidance.' },
            { title: 'Industry Exposure', desc: 'Gain practical understanding through case studies, projects, industry-oriented assignments and application-based learning.' },
            { title: 'Advanced LMS Support', desc: 'Access e-content, recorded lectures, live classes, assignments, discussion forums and learning resources anytime, anywhere.' },
            { title: 'Contemporary Curriculum', desc: 'Study an updated, career-focused curriculum designed to develop relevant professional, digital and practical skills.' },
        ],
    },
    {
        slug: 'ma_english',
        name: 'Master of Arts in English (MA English)',
        title: 'Online MA English',
        fullTitle: 'Master of Arts in English (MA English)',
        type: 'MA English',
        level: 'PG',
        duration: '2 Years',
        minDegreeLevel: 'graduation',
        minEligibility: "Graduation / Bachelor's Degree in any discipline from a recognized university",
        eligibility_criteria: "Graduation / Bachelor's Degree in any discipline from a recognized university",
        baseFee: 21700,
        total_fee: 21700,
        registrationFee: 5000,
        categories: ['all', 'pg', 'linguistic'],
        isActive: true,
        hasLinkedInBadge: false,
        heroImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=1200',
        description: 'The CVRU Master of Arts in English program explores world literature, literary criticism, linguistics, and advanced communication competencies.',
        infoBar: {
            fee: '₹21,700/- Per Year',
            hasEMI: false,
            deadline: 'Upcoming',
            durationNote: 'Total duration',
            commitment: '8-10 hours/week',
            commitmentNote: 'Recommended',
            model: 'LIVE + Recorded',
            modelNote: 'Seminars by Eminent Scholars',
            batchesNote: 'Batches starting soon',
        },
        programUSPs: [
            { title: 'Literary & Linguistic Depth', desc: 'Classical to contemporary British, American, and Indian writing in English.' },
            { title: 'Critical Theory & Research', desc: 'Rigorous foundation in critical thought, discourse analysis, and academic writing.' },
            { title: 'Academic Career Readiness', desc: 'Prepares for UGC-NET, SET, teaching, publishing, and creative communications.' },
        ],
        linkedinUSPs: [],
        fee: {
            indian: { semester: 21700, lumpsum: 43400 },
            international: { semester: 1200, lumpsum: 2400 },
        },
        eligibility: ["Graduation / Bachelor's Degree in any discipline from a recognized university."],
        notes: [
            'The fee indicated above is applicable to applicants from India, Sri Lanka, Bhutan, Nepal, Bangladesh, and Afghanistan.',
            'All payments are accepted online.',
        ],
        curriculum: {
            stats: [
                { label: 'Total Credits of Program', value: 80, icon: 'GraduationCap' },
                { label: 'Core Literature Courses', value: 19, icon: 'BookOpen' },
                { label: 'Semesters', value: '4', icon: 'Calendar' },
            ],
            semesters: [
                {
                    title: 'Semester 1',
                    courses: [
                        '1MAENG1 - Poetry-I',
                        '1MAENG2 - Drama-I',
                        '1MAENG3 - Prose-I',
                        '1MAENG4 - Fiction-I',
                        '1MAENG5 - Linguistics & Phonetics',
                    ],
                },
                {
                    title: 'Semester 2',
                    courses: [
                        '2MAENG1 - Poetry-II',
                        '2MAENG2 - Drama-II',
                        '2MAENG3 - Prose-II',
                        '2MAENG4 - Fiction-II',
                        '2MAENG5 - Indian Writing in English',
                    ],
                },
                {
                    title: 'Semester 3',
                    courses: [
                        '3MAENG1 - Literary Theory & Criticism-I',
                        '3MAENG2 - American Literature-I',
                        '3MAENG3 - Women’s Writing in English',
                        '3MAENG4 - Commonwealth Literature in English',
                        '3MAENG5 - World Literature in Translation',
                    ],
                },
                {
                    title: 'Semester 4',
                    courses: [
                        '4MAENG1 - Research Methodology',
                        '4MAENG2 - Literary Theory & Criticism-II',
                        '4MAENG3 - American Literature-II',
                        '4MAENG4 - Project/Dissertation/Internship & Viva-Voce',
                    ],
                },
            ],
        },
        placements: {
            supportText: "CVRU Placement Support Services guide humanities postgraduates into careers in higher education, content creation, journalism, publishing, and corporate communications.",
            supportImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800',
            enhancement: [
                { title: 'Placement Enhancement', desc: 'Gain essential knowledge through comprehensive sessions focused on placement enhancement.', image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&q=80&w=800' },
                { title: 'Master Classes', desc: 'Explore our Master Classes and Workshops, designed to enhance your CV.', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800' },
            ],
        },
        admissionProcess: [
            { step: 1, title: 'Registration', desc: 'Sign up and pay the initial registration fee.' },
            { step: 2, title: 'Application Form', desc: 'Fill basic details and upload graduation degree certificates.' },
            { step: 3, title: 'Enrollment', desc: 'Receive university enrollment number and LMS credentials.' },
            { step: 4, title: 'Orientation', desc: 'Participate in virtual program orientation.' },
        ],
        benefits: [
            { title: 'Expert Faculty Support', desc: 'Learn from qualified and experienced faculty through live interactive sessions, mentoring and academic guidance.' },
            { title: 'Industry Exposure', desc: 'Gain practical understanding through case studies, projects, industry-oriented assignments and application-based learning.' },
            { title: 'Advanced LMS Support', desc: 'Access e-content, recorded lectures, live classes, assignments, discussion forums and learning resources anytime, anywhere.' },
            { title: 'Contemporary Curriculum', desc: 'Study an updated, career-focused curriculum designed to develop relevant professional, digital and practical skills.' },
        ],
    },
];

/**
 * Seeds initial programs if the Program collection is empty.
 * Safe, idempotent, and non-destructive.
 */
export const seedInitialPrograms = async () => {
    try {
        const count = await Program.countDocuments();
        if (count === 0) {
            console.log('[CMS Seeder] Program collection empty. Seeding 5 initial academic programs...');
            await Program.insertMany(initialProgramsSeedData);
            console.log(`[CMS Seeder] Successfully seeded ${initialProgramsSeedData.length} programs into MongoDB.`);
        } else {
            // Non-destructive backfill of specializations for programs that have empty specializations
            for (const item of initialProgramsSeedData) {
                if (item.specializations && item.specializations.length > 0) {
                    await Program.updateOne(
                        { 
                            slug: item.slug, 
                            $or: [
                                { specializations: { $exists: false } }, 
                                { specializations: { $size: 0 } },
                                { specializations: null }
                            ] 
                        },
                        { $set: { specializations: item.specializations } }
                    );
                }

                // Non-destructive backfill of curriculum.semesters for programs that have empty curriculum.semesters
                if (item.curriculum?.semesters && item.curriculum.semesters.length > 0) {
                    await Program.updateOne(
                        { 
                            slug: item.slug, 
                            $or: [
                                { 'curriculum.semesters': { $exists: false } }, 
                                { 'curriculum.semesters': { $size: 0 } },
                                { 'curriculum.semesters': null }
                            ] 
                        },
                        { $set: { 'curriculum.semesters': item.curriculum.semesters } }
                    );
                }
            }

            // Backfill lastPublishedSnapshot for any programs missing snapshot
            const programsWithoutSnapshot = await Program.find({
                $or: [
                    { lastPublishedSnapshot: null },
                    { lastPublishedSnapshot: { $exists: false } }
                ]
            });
            for (const p of programsWithoutSnapshot) {
                let snap = null;
                if (p.publishStatus === 'PUBLISHED') {
                    snap = p.toObject();
                    delete snap.lastPublishedSnapshot;
                    delete snap.approvalHistory;
                } else {
                    const seedMatch = initialProgramsSeedData.find(s => s.slug === p.slug);
                    if (seedMatch) {
                        snap = { ...seedMatch };
                    }
                }
                if (snap) {
                    p.lastPublishedSnapshot = snap;
                    p.isActive = true;
                    await p.save();
                }
            }
        }
    } catch (error) {
        console.error('[CMS Seeder] Error during program seeding:', error.message);
    }
};
