import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import AIChatbotFAB from '../components/AIChatbotFAB'

const roles = [
    {
        id: "swe",
        title: "Software Engineer",
        icon: "terminal",
        color: "#6366f1",
        light: "#eef2ff",
        duration: "12 Weeks",
        level: "Intermediate → Advanced",
        weeks: [
            { week: 1, topic: "Data Structures & Algorithms Fundamentals", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Programming, Data Structures and Algorithms using Python", institute: "IIT Madras", link: "https://nptel.ac.in/courses/106106145", tags: ["Arrays", "Linked Lists", "Stacks", "Queues"] },
            { week: 2, topic: "Advanced DSA — Trees, Graphs & Sorting", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Design and Analysis of Algorithms", institute: "IIT Bombay", link: "https://nptel.ac.in/courses/106101060", tags: ["BST", "Graph Traversal", "Sorting Algorithms"] },
            { week: 3, topic: "Object-Oriented Programming & Design Patterns", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Object Oriented Analysis and Design", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105153", tags: ["SOLID", "Factory", "Observer", "MVC"] },
            { week: 4, topic: "Database Management & SQL", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Database Management System", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105175", tags: ["SQL", "Normalization", "Indexing", "Transactions"] },
            { week: 5, topic: "Operating Systems & System Design Basics", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Introduction to Operating Systems", institute: "IIT Madras", link: "https://nptel.ac.in/courses/106106144", tags: ["Processes", "Threads", "Memory Management"] },
            { week: 6, topic: "Computer Networks & REST APIs", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Computer Networks and Internet Protocol", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105081", tags: ["TCP/IP", "HTTP", "REST", "WebSockets"] },
            { week: 7, topic: "Version Control, Git & Agile Practices", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "Swayam", course: "Software Engineering", institute: "IIT Bombay", link: "https://swayam.gov.in/nd1_noc20_cs56/preview", tags: ["Git", "CI/CD", "Scrum", "Code Review"] },
            { week: 8, topic: "Cloud Computing Fundamentals (AWS/GCP)", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Cloud Computing", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105167", tags: ["EC2", "S3", "Lambda", "Microservices"] },
            { week: 9, topic: "Software Testing & Quality Assurance", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "NPTEL", course: "Software Testing", institute: "IIT Kanpur", link: "https://nptel.ac.in/courses/106104100", tags: ["Unit Testing", "TDD", "Selenium", "JUnit"] },
            { week: 10, topic: "Security in Software Development (DevSecOps)", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "Swayam", course: "Ethical Hacking", institute: "IIT Kharagpur", link: "https://swayam.gov.in/nd1_noc19_cs47/preview", tags: ["OWASP Top 10", "OAuth", "JWT", "Pen Testing"] },
            { week: 11, topic: "Microservices Architecture & Containers", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Cloud Computing and Distributed Systems", institute: "IIT Madras", link: "https://nptel.ac.in/courses/106106172", tags: ["Docker", "Kubernetes", "gRPC", "Service Mesh"] },
            { week: 12, topic: "Capstone: Build a Full-Stack Project + Portfolio", hours: "15 hrs", schedule: "Daily, 2–3 hrs/day", platform: "IIT Online / Swayam+", course: "Software Project Management", institute: "IIT Bombay", link: "https://swayam.gov.in", tags: ["Portfolio", "GitHub", "Deployment", "Interview Prep"] },
        ]
    },
    {
        id: "da",
        title: "Data Analyst",
        icon: "bar_chart",
        color: "#0ea5e9",
        light: "#f0f9ff",
        duration: "10 Weeks",
        level: "Beginner → Intermediate",
        weeks: [
            { week: 1, topic: "Introduction to Data Analytics & Statistics", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "NPTEL", course: "Introduction to Research and Data Analytics", institute: "IIT Roorkee", link: "https://nptel.ac.in/courses/109107092", tags: ["Mean/Median", "Std Dev", "Probability", "Distributions"] },
            { week: 2, topic: "Python for Data Analysis", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "The Joy of Computing using Python", institute: "IIT Ropar", link: "https://nptel.ac.in/courses/106106184", tags: ["Pandas", "NumPy", "Matplotlib", "Jupyter"] },
            { week: 3, topic: "SQL & Database Querying", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Database Management System", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105175", tags: ["JOINs", "Aggregations", "Window Functions", "CTEs"] },
            { week: 4, topic: "Data Wrangling & Cleaning Techniques", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "Swayam", course: "Data Science for Engineers", institute: "IIT Madras", link: "https://swayam.gov.in/nd1_noc20_cs60/preview", tags: ["Null Handling", "Outliers", "Encoding", "Feature Scaling"] },
            { week: 5, topic: "Data Visualization (Tableau / Power BI)", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "Swayam", course: "Business Intelligence & Analytics", institute: "IIT Kharagpur", link: "https://swayam.gov.in", tags: ["Charts", "Dashboards", "Seaborn", "Plotly"] },
            { week: 6, topic: "Exploratory Data Analysis (EDA)", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "NPTEL", course: "Data Analysis and Decision Making", institute: "IIT Roorkee", link: "https://nptel.ac.in/courses/109107092", tags: ["Correlation", "Heatmaps", "Box Plots", "EDA Patterns"] },
            { week: 7, topic: "Statistical Inference & Hypothesis Testing", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Statistics for Data Science", institute: "IIT Kanpur", link: "https://nptel.ac.in/courses/110104067", tags: ["t-test", "ANOVA", "Chi-Square", "p-value"] },
            { week: 8, topic: "Intro to Machine Learning for Analysts", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "NPTEL", course: "Introduction to Machine Learning", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105152", tags: ["Regression", "Classification", "Scikit-Learn", "Cross-Validation"] },
            { week: 9, topic: "Business Analytics & Storytelling with Data", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "Swayam", course: "Business Analytics", institute: "IIM Bangalore via Swayam", link: "https://swayam.gov.in", tags: ["KPIs", "Reports", "Stakeholder Communication", "Insights"] },
            { week: 10, topic: "Capstone: End-to-End Data Analysis Project", hours: "12 hrs", schedule: "Daily, 2 hrs/day", platform: "Swayam+", course: "Data Science and Analytics Project", institute: "IIT Madras", link: "https://swayam.gov.in", tags: ["Real Dataset", "Dashboard", "Presentation", "LinkedIn Portfolio"] },
        ]
    },
    {
        id: "ml",
        title: "AI / ML Engineer",
        icon: "smart_toy",
        color: "#8b5cf6",
        light: "#f5f3ff",
        duration: "12 Weeks",
        level: "Intermediate → Expert",
        weeks: [
            { week: 1, topic: "Mathematics for ML — Linear Algebra & Calculus", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Mathematics for Machine Learning", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/111105134", tags: ["Vectors", "Matrices", "Eigenvalues", "Derivatives"] },
            { week: 2, topic: "Probability & Statistics for ML", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Probability and Statistics", institute: "IIT Kanpur", link: "https://nptel.ac.in/courses/110104064", tags: ["Bayes Theorem", "Distributions", "MLE", "MAP"] },
            { week: 3, topic: "Python & ML Libraries", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Programming and Data Structures", institute: "IIT Madras", link: "https://nptel.ac.in/courses/106106145", tags: ["NumPy", "Pandas", "Scikit-Learn", "Matplotlib"] },
            { week: 4, topic: "Supervised Learning — Regression & Classification", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Introduction to Machine Learning", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105152", tags: ["Linear/Logistic Regression", "SVM", "Decision Trees", "KNN"] },
            { week: 5, topic: "Unsupervised Learning & Dimensionality Reduction", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Machine Learning for Engineering and Science Applications", institute: "IIT Madras", link: "https://nptel.ac.in/courses/106106198", tags: ["K-Means", "PCA", "t-SNE", "DBSCAN"] },
            { week: 6, topic: "Neural Networks & Deep Learning Basics", hours: "12 hrs", schedule: "Mon–Fri, 2–3 hrs/day", platform: "NPTEL", course: "Deep Learning", institute: "IIT Ropar", link: "https://nptel.ac.in/courses/106105215", tags: ["Perceptron", "Backprop", "Activation Functions", "Keras"] },
            { week: 7, topic: "CNNs for Computer Vision", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Computer Vision and Image Processing", institute: "IIT Roorkee", link: "https://nptel.ac.in/courses/108107190", tags: ["Conv Layers", "Pooling", "ResNet", "Transfer Learning"] },
            { week: 8, topic: "NLP & Transformers", hours: "12 hrs", schedule: "Mon–Fri, 2–3 hrs/day", platform: "NPTEL", course: "Natural Language Processing", institute: "IIT Bombay", link: "https://nptel.ac.in/courses/106101007", tags: ["Tokenization", "Embeddings", "BERT", "HuggingFace"] },
            { week: 9, topic: "MLOps — Deployment & Model Management", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "Swayam", course: "Cloud Computing & DevOps", institute: "IIT Kharagpur", link: "https://swayam.gov.in", tags: ["Flask APIs", "Docker", "MLflow", "Feature Stores"] },
            { week: 10, topic: "Reinforcement Learning Fundamentals", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Reinforcement Learning", institute: "IIT Madras", link: "https://nptel.ac.in/courses/106106143", tags: ["MDP", "Q-Learning", "Policy Gradient", "OpenAI Gym"] },
            { week: 11, topic: "Generative AI & LLMs", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "Swayam+", course: "Foundations of Large Language Models", institute: "IIT Bombay", link: "https://swayam.gov.in", tags: ["GPT Architecture", "Prompt Engineering", "Fine-tuning", "RAG"] },
            { week: 12, topic: "Capstone: Build & Deploy an ML Pipeline", hours: "15 hrs", schedule: "Daily, 2–3 hrs/day", platform: "IIT Online", course: "AI Project Workshop", institute: "IIT Madras", link: "https://onlinedegree.iitm.ac.in", tags: ["End-to-End Project", "GitHub", "Model Card", "Portfolio"] },
        ]
    },
    {
        id: "ba",
        title: "Business Analyst",
        icon: "trending_up",
        color: "#f59e0b",
        light: "#fffbeb",
        duration: "10 Weeks",
        level: "Beginner → Intermediate",
        weeks: [
            { week: 1, topic: "Business Analysis Fundamentals & BABOK", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "Swayam", course: "Managerial Economics", institute: "IIT Kharagpur", link: "https://swayam.gov.in/nd1_noc20_mg13/preview", tags: ["BABOK", "Stakeholders", "Requirements Elicitation", "SWOT"] },
            { week: 2, topic: "Data Analysis & Excel / Google Sheets", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "NPTEL", course: "Decision Making using Financial Accounting", institute: "IIT Bombay", link: "https://nptel.ac.in/courses/110105082", tags: ["Pivot Tables", "VLOOKUP", "Charts", "Dashboards"] },
            { week: 3, topic: "SQL for Business Intelligence", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Database Management System", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105175", tags: ["SQL Queries", "KPIs", "Reports", "Ad-hoc Analysis"] },
            { week: 4, topic: "Business Process Modelling (UML / BPMN)", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "NPTEL", course: "Object Oriented Analysis and Design", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105153", tags: ["Use Case Diagrams", "Flow Charts", "BPMN", "Wireframes"] },
            { week: 5, topic: "Financial Modelling & Budgeting Basics", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "NPTEL", course: "Financial Management", institute: "IIT Roorkee", link: "https://nptel.ac.in/courses/110107077", tags: ["P&L", "Balance Sheet", "NPV/IRR", "Scenario Analysis"] },
            { week: 6, topic: "Statistics & Quantitative Methods", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Quantitative Methods", institute: "IIT Kanpur", link: "https://nptel.ac.in/courses/110104041", tags: ["Regression", "Forecasting", "Hypothesis Testing", "Correlation"] },
            { week: 7, topic: "Power BI / Tableau for BA Dashboards", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "Swayam", course: "Business Analytics", institute: "IIM Bangalore", link: "https://swayam.gov.in", tags: ["KPI Dashboards", "Trends", "Drill-down", "Storytelling"] },
            { week: 8, topic: "Agile & Scrum for Business Analysts", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "NPTEL", course: "Software Project Management", institute: "IIT Bombay", link: "https://nptel.ac.in/courses/106105218", tags: ["User Stories", "Sprint Planning", "Backlog", "BRD / FRD"] },
            { week: 9, topic: "Strategic Thinking & Market Analysis", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "Swayam", course: "Strategic Management", institute: "IIT Bombay", link: "https://swayam.gov.in/nd1_noc20_mg21/preview", tags: ["Porter's 5 Forces", "PESTLE", "BCG Matrix", "Competitive Analysis"] },
            { week: 10, topic: "Capstone: BA Case Study & Presentation", hours: "12 hrs", schedule: "Daily, 2 hrs/day", platform: "Swayam+", course: "MBA Elective: Business Analytics", institute: "IIMB via Swayam", link: "https://swayam.gov.in", tags: ["Case Study", "Presentation Deck", "Recommendations", "Interview Prep"] },
        ]
    },
    {
        id: "wd",
        title: "Web Developer",
        icon: "language",
        color: "#10b981",
        light: "#ecfdf5",
        duration: "10 Weeks",
        level: "Beginner → Intermediate",
        weeks: [
            { week: 1, topic: "HTML5 & CSS3 Fundamentals", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "Swayam", course: "The Joy of Computing using Python + Web Basics", institute: "IIT Ropar", link: "https://swayam.gov.in/nd2_aic20_sp30/preview", tags: ["Semantic HTML", "CSS Box Model", "Flexbox", "Grid"] },
            { week: 2, topic: "JavaScript Fundamentals & DOM", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Programming in Java (JS parallels)", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105191", tags: ["ES6+", "DOM Manipulation", "Events", "Fetch API"] },
            { week: 3, topic: "Responsive Design & CSS Frameworks", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "Swayam", course: "Web Development Fundamentals", institute: "IIT Bombay", link: "https://swayam.gov.in", tags: ["Bootstrap", "Media Queries", "Tailwind CSS", "Mobile-First"] },
            { week: 4, topic: "React.js Fundamentals", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Programming in JavaScript / React", institute: "IIT Madras", link: "https://onlinedegree.iitm.ac.in", tags: ["Components", "Props", "State", "Hooks", "Router"] },
            { week: 5, topic: "Node.js & Express Backend Development", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "Swayam", course: "Cloud Computing & Internet of Things", institute: "IIT Kharagpur", link: "https://swayam.gov.in", tags: ["REST APIs", "Middleware", "Authentication", "JWT"] },
            { week: 6, topic: "Databases — SQL & MongoDB", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Database Management System", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105175", tags: ["MySQL", "MongoDB", "CRUD", "Mongoose", "Sequelize"] },
            { week: 7, topic: "Version Control, Git & Deployment Basics", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "NPTEL", course: "Software Engineering", institute: "IIT Bombay", link: "https://nptel.ac.in/courses/106105218", tags: ["Git", "GitHub", "Netlify", "Vercel", "Heroku"] },
            { week: 8, topic: "Web Performance, SEO & Accessibility", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "Swayam", course: "Digital Marketing & Web Analytics", institute: "IIT Delhi", link: "https://swayam.gov.in", tags: ["Lighthouse", "Core Web Vitals", "ARIA", "Lazy Loading"] },
            { week: 9, topic: "TypeScript & Advanced React Patterns", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "IIT Online", course: "Modern Web Development Practices", institute: "IIT Bombay", link: "https://swayam.gov.in", tags: ["TypeScript", "Redux", "Context API", "React Query"] },
            { week: 10, topic: "Capstone: Full-Stack Web App + Portfolio", hours: "15 hrs", schedule: "Daily, 2–3 hrs/day", platform: "Swayam+", course: "Full Stack Development Project", institute: "IIT Madras", link: "https://onlinedegree.iitm.ac.in", tags: ["MERN Stack", "Deployment", "Portfolio", "GitHub Profile"] },
        ]
    },
    {
        id: "devops",
        title: "DevOps Engineer",
        icon: "settings",
        color: "#ef4444",
        light: "#fef2f2",
        duration: "10 Weeks",
        level: "Intermediate → Advanced",
        weeks: [
            { week: 1, topic: "Linux & Shell Scripting", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Computer Architecture", institute: "IIT Madras", link: "https://nptel.ac.in/courses/106106166", tags: ["Bash", "File Systems", "Cron Jobs", "Process Management"] },
            { week: 2, topic: "Version Control with Git & GitOps", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "NPTEL", course: "Software Engineering", institute: "IIT Bombay", link: "https://nptel.ac.in/courses/106105218", tags: ["Git Branching", "Merge Strategies", "GitFlow", "PR Reviews"] },
            { week: 3, topic: "CI/CD Pipelines (Jenkins / GitHub Actions)", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "Swayam", course: "Software Quality Engineering", institute: "IIT Roorkee", link: "https://swayam.gov.in", tags: ["CI/CD", "Pipeline as Code", "Automated Testing", "Artifacts"] },
            { week: 4, topic: "Docker & Containerization", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Cloud Computing", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105167", tags: ["Dockerfile", "Images", "Volumes", "Docker Compose"] },
            { week: 5, topic: "Kubernetes & Container Orchestration", hours: "12 hrs", schedule: "Mon–Fri, 2–3 hrs/day", platform: "NPTEL", course: "Cloud Computing and Distributed Systems", institute: "IIT Madras", link: "https://nptel.ac.in/courses/106106172", tags: ["Pods", "Deployments", "Services", "Helm Charts"] },
            { week: 6, topic: "Cloud Platforms — AWS / GCP / Azure", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Cloud Computing", institute: "IIT Kharagpur", link: "https://nptel.ac.in/courses/106105167", tags: ["IAM", "VPC", "EC2", "S3", "RDS", "Lambda"] },
            { week: 7, topic: "Infrastructure as Code (Terraform / Ansible)", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "Swayam", course: "Cloud Infrastructure Management", institute: "IIT Kharagpur", link: "https://swayam.gov.in", tags: ["Terraform", "Ansible", "CloudFormation", "IaC Best Practices"] },
            { week: 8, topic: "Monitoring, Logging & Observability", hours: "10 hrs", schedule: "Mon–Fri, 2 hrs/day", platform: "NPTEL", course: "Distributed Systems", institute: "IIT Madras", link: "https://nptel.ac.in/courses/106106172", tags: ["Prometheus", "Grafana", "ELK Stack", "Alerting"] },
            { week: 9, topic: "Security & Compliance (DevSecOps)", hours: "8 hrs", schedule: "Mon–Thu, 2 hrs/day", platform: "Swayam", course: "Ethical Hacking", institute: "IIT Kharagpur", link: "https://swayam.gov.in/nd1_noc19_cs47/preview", tags: ["Secrets Mgmt", "RBAC", "Vulnerability Scanning", "Compliance"] },
            { week: 10, topic: "Capstone: Build a Full CI/CD Pipeline", hours: "15 hrs", schedule: "Daily, 2–3 hrs/day", platform: "IIT Online / Swayam+", course: "DevOps Capstone Project", institute: "IIT Bombay", link: "https://swayam.gov.in", tags: ["End-to-End Pipeline", "Blue/Green Deploy", "Portfolio", "Interview Prep"] },
        ]
    }
]

export default function CoursesExplorerPage() {
    const [selectedRoleId, setSelectedRoleId] = useState(roles[0].id)
    const [expandedWeek, setExpandedWeek] = useState(null)
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const selectedRole = roles.find(r => r.id === selectedRoleId)
    const totalHours = selectedRole.weeks.reduce((s, w) => s + parseInt(w.hours), 0)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-slate-50 text-slate-900"
            style={{ fontFamily: "'Lexend', sans-serif" }}
        >
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 py-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                        Learning Roadmap
                    </h1>
                    <p className="text-slate-500 max-w-xl">
                        Structured week-by-week learning paths sourced from NPTEL & Swayam — India's top government-backed platforms.
                    </p>
                </motion.div>

                {/* Role Dropdown Selector */}
                <div className="relative mb-8 max-w-md">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: selectedRole.light, color: selectedRole.color }}
                            >
                                <span className="material-symbols-outlined text-xl">{selectedRole.icon}</span>
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-bold text-slate-900">{selectedRole.title}</div>
                                <div className="text-[11px] text-slate-400 font-semibold">{selectedRole.duration} &middot; {selectedRole.level}</div>
                            </div>
                        </div>
                        <span className={`material-symbols-outlined text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>

                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                            >
                                {roles.map(role => (
                                    <button
                                        key={role.id}
                                        onClick={() => { setSelectedRoleId(role.id); setDropdownOpen(false); setExpandedWeek(null) }}
                                        className={`w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none ${role.id === selectedRoleId ? 'bg-slate-50' : ''
                                            }`}
                                    >
                                        <div
                                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: role.light, color: role.color }}
                                        >
                                            <span className="material-symbols-outlined text-lg">{role.icon}</span>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-slate-800">{role.title}</div>
                                            <div className="text-[10px] text-slate-400 font-semibold">{role.duration} &middot; {role.level}</div>
                                        </div>
                                        {role.id === selectedRoleId && (
                                            <span className="material-symbols-outlined text-green-500 ml-auto text-lg">check_circle</span>
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Stats Strip */}
                <motion.div
                    key={selectedRoleId + '-stats'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-3 gap-4 mb-10"
                >
                    <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                        <span className="material-symbols-outlined text-2xl mb-2 block" style={{ color: selectedRole.color }}>calendar_month</span>
                        <div className="text-2xl font-black text-slate-900">{selectedRole.weeks.length}</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Weeks</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                        <span className="material-symbols-outlined text-2xl mb-2 block" style={{ color: selectedRole.color }}>schedule</span>
                        <div className="text-2xl font-black text-slate-900">{totalHours}</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Hours</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                        <span className="material-symbols-outlined text-2xl mb-2 block" style={{ color: selectedRole.color }}>school</span>
                        <div className="text-2xl font-black text-slate-900">{new Set(selectedRole.weeks.map(w => w.platform)).size}</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platforms</div>
                    </div>
                </motion.div>

                {/* Timeline */}
                <motion.div
                    key={selectedRoleId + '-timeline'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="relative"
                >
                    {/* Vertical line */}
                    <div className="absolute left-[22px] top-0 bottom-0 w-px bg-slate-200" />

                    <div className="space-y-4">
                        {selectedRole.weeks.map((week, i) => {
                            const isOpen = expandedWeek === week.week
                            return (
                                <motion.div
                                    key={week.week}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <button
                                        onClick={() => setExpandedWeek(isOpen ? null : week.week)}
                                        className={`w-full flex items-start gap-4 text-left group transition-all duration-200 ${isOpen ? '' : 'hover:translate-x-1'}`}
                                    >
                                        {/* Week dot */}
                                        <div
                                            className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-sm font-black text-white shrink-0 shadow-md z-10 transition-transform group-hover:scale-110"
                                            style={{ backgroundColor: selectedRole.color }}
                                        >
                                            {week.week}
                                        </div>

                                        {/* Card */}
                                        <div className={`flex-1 bg-white border rounded-xl p-5 shadow-sm transition-all ${isOpen ? 'border-slate-300 shadow-md' : 'border-slate-200 group-hover:shadow-md'}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-sm font-bold text-slate-900 leading-snug">{week.topic}</h3>
                                                <span className={`material-symbols-outlined text-slate-400 text-lg transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span>{week.hours}</span>
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">event</span>{week.schedule}</span>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ backgroundColor: selectedRole.light, color: selectedRole.color }}>
                                                    {week.platform}
                                                </span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="ml-[60px] mt-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Course</div>
                                                            <div className="text-sm font-bold text-slate-800 mb-1">{week.course}</div>
                                                            <div className="text-xs text-slate-500 font-semibold">{week.institute}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Topics Covered</div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {week.tags.map(tag => (
                                                                    <span
                                                                        key={tag}
                                                                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                                                                        style={{ backgroundColor: selectedRole.light, color: selectedRole.color, borderColor: selectedRole.color + '30' }}
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <a
                                                        href={week.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all hover:translate-y-[-1px]"
                                                        style={{ backgroundColor: selectedRole.color }}
                                                    >
                                                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                                                        Start on {week.platform}
                                                    </a>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>
            </main>

            <AIChatbotFAB />
        </motion.div>
    )
}
