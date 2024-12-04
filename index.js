import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
var score=0;
var qNO=1;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "quiz_project",
  password: "strangert3",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

import session from "express-session";

app.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, 
    })
);

app.get("/", (req, res) => {
  qNO = 1;
  req.session.results = [];
  req.session.answeredQuestions = [];
});

app.post('/', async (req, res) => {
  const { fname, lname, email } = req.body;

  // Checking if user already exists
  const userResult = await db.query('SELECT * FROM scores WHERE email = $1', [email]);
  
  if (userResult.rows.length > 0) {
    // User exists so updating the session with existing user information
    req.session.user = userResult.rows[0];
  } else {
    // Inserting new user
    const newUserResult = await db.query(
      'INSERT INTO scores (fname, lname, email, max_score) VALUES ($1, $2, $3, $4) RETURNING *',
      [fname, lname, email, 0]
    );
    req.session.user = newUserResult.rows[0];
  }
  res.redirect("/question");
});


  app.post("/question", (req,res) => {
    const randomIndex=Math.floor(Math.random() * questions.length);
    const randomQuestion=questions[randomIndex];
    res.render("index.ejs", {
      question: randomQuestion,
      questionNumber: qNO++,
    });
  })

  app.get('/question', (req, res) => {

    if (!req.session.answeredQuestions) {
        req.session.answeredQuestions = [];
    }

    // Filtering out already answered questions
    const unansweredQuestions = questions.filter(
        (q) => !req.session.answeredQuestions.includes(q.id)
    );

    // If the user has answered 5 questions, redirecting to the results page
    if (req.session.answeredQuestions.length >= 5) {
      qNO=1;
      req.session.answeredQuestions = [];
      return res.redirect('/results');
    }

    // Selecting a random unanswered question
    const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
    const randomQuestion = unansweredQuestions[randomIndex];

    // Sending the question to the EJS template
    res.render("index.ejs", { question: randomQuestion, questionNumber: qNO++, });
});
  

app.post("/submit-answer", async (req, res) => {
  const userAnswer = req.body.answer;
  const questionId = parseInt(req.body.currentQuestionId);
  const currentQuestion = questions.find((q) => q.id === questionId);

  if (!currentQuestion) {
    return res.status(404).send('Question not found');
  }

  // Initialising session properties if not already set
  if (!req.session.results) {
    req.session.results = [];
  }

  if (!req.session.answeredQuestions) {
    req.session.answeredQuestions = [];
  }

  // Adding the current question to answered questions and storing the result
  req.session.answeredQuestions.push(currentQuestion.id);
  const isCorrect = userAnswer === currentQuestion.answer;
  req.session.results.push({
    questionId: currentQuestion.id,
    userAnswer,
    isCorrect,
  });

  // Updating user's max score in the database if needed
  if (isCorrect) {
    const email = req.session.user.email;
    const currentMaxScore = req.session.user.max_score;
    const newMaxScore = Math.max(currentMaxScore, req.session.results.filter((r) => r.isCorrect).length);

    if (newMaxScore > currentMaxScore) {
      await db.query('UPDATE scores SET max_score = $1 WHERE email = $2', [newMaxScore, email]);
      req.session.user.max_score = newMaxScore; 
    }
  }

  // Redirecting to the next random question
  res.redirect("/question");
});


function getRemark(score) {
  switch (score) {
      case 0:
        return "Oops!";
      case 1:
          return "Better luck next time!";
      case 2:
          return "Not bad, but there's room for improvement.";
      case 3:
          return "Good job! A little more effort, and you'll ace it!";
      case 4:
          return "Great work! You're almost perfect.";
      case 5:
          return "Outstanding! You're a genius! Perfect score!";
      default:
          return "Invalid score.";
  }
}

app.get("/results", (req, res) => {
  const results = req.session.results || [];
  const totalQuestions = 5;
  const correctAnswers = results.filter((r) => r.isCorrect).length;

  const remark = getRemark(correctAnswers);

  const max_score=req.session.user.max_score;

  res.render("results.ejs", { correctAnswers, totalQuestions, remark, max_score });


  // Clear the session data after displaying results
  req.session.results = [];
  req.session.answeredQuestions = [];

  req.session.destroy();
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

var questions= [
  {
    "id": 1,
    "question": "What does 'HTTP' stand for?",
    "options": ["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperTerminal Transfer Process", "Hyperlink Transmission Protocol"],
    "answer": "HyperText Transfer Protocol"
  },
  {
    "id": 2,
    "question": "Which company developed the Android operating system?",
    "options": ["Microsoft", "Google", "Apple", "IBM"],
    "answer": "Google"
  },
  {
    "id": 3,
    "question": "What is the name of the first mechanical computer designed by Charles Babbage?",
    "options": ["Analytical Engine", "Difference Machine", "Calculation Engine", "Computing Machine"],
    "answer": "Analytical Engine"
  },
  {
    "id": 4,
    "question": "Which programming language is known as the 'language of the web'?",
    "options": ["C++", "Java", "Python", "JavaScript"],
    "answer": "JavaScript"
  },
  {
    "id": 5,
    "question": "Who is known as the 'Father of Artificial Intelligence'?",
    "options": ["Alan Turing", "John McCarthy", "Marvin Minsky", "Elon Musk"],
    "answer": "John McCarthy"
  },
  {
    "id": 6,
    "question": "Which of the following is a type of non-volatile storage?",
    "options": ["RAM", "Cache", "SSD", "Registers"],
    "answer": "SSD"
  },
  {
    "id": 7,
    "question": "What does 'GPU' stand for in computing?",
    "options": ["General Processing Unit", "Graphics Processing Unit", "Global Processor Utility", "Graphical Power Unit"],
    "answer": "Graphics Processing Unit"
  },
  {
    "id": 8,
    "question": "Which company manufactures the iPhone?",
    "options": ["Samsung", "Nokia", "Apple", "Huawei"],
    "answer": "Apple"
  },
  {
    "id": 9,
    "question": "What is the primary function of an operating system?",
    "options": ["To manage computer hardware and software resources", "To run antivirus programs", "To browse the internet", "To create documents"],
    "answer": "To manage computer hardware and software resources"
  },
  {
    "id": 10,
    "question": "In what year was the World Wide Web invented?",
    "options": ["1985", "1989", "1992", "1995"],
    "answer": "1989"
  },
  {
    "id": 11,
    "question": "What is the primary language used for iOS app development?",
    "options": ["Java", "Swift", "Kotlin", "Python"],
    "answer": "Swift"
  },
  {
    "id": 12,
    "question": "Which company is known for developing the microprocessor?",
    "options": ["Intel", "AMD", "IBM", "NVIDIA"],
    "answer": "Intel"
  },
  {
    "id": 13,
    "question": "What does 'CSS' stand for in web development?",
    "options": ["Computer Style Sheet", "Cascading Style Sheets", "Complex Style Sheet", "Creative Styling Source"],
    "answer": "Cascading Style Sheets"
  },
  {
    "id": 14,
    "question": "What type of malware is designed to trick victims into paying money for fake threats?",
    "options": ["Spyware", "Ransomware", "Adware", "Scareware"],
    "answer": "Scareware"
  },
  {
    "id": 15,
    "question": "Which of these is a popular version control system?",
    "options": ["Docker", "Git", "Kubernetes", "Jenkins"],
    "answer": "Git"
  },
  {
    "id": 16,
    "question": "What does 'IoT' stand for?",
    "options": ["Internet of Technology", "Integrated Operational Tasks", "Internet of Things", "Intelligent Operations Tool"],
    "answer": "Internet of Things"
  },
  {
    "id": 17,
    "question": "Which programming language is known for its simple syntax and is commonly used for teaching beginners?",
    "options": ["C++", "Python", "Assembly", "JavaScript"],
    "answer": "Python"
  },
  {
    "id": 18,
    "question": "What type of network is commonly used to connect devices in a single building?",
    "options": ["MAN (Metropolitan Area Network)", "WAN (Wide Area Network)", "LAN (Local Area Network)", "PAN (Personal Area Network)"],
    "answer": "LAN (Local Area Network)"
  },
  {
    "id": 19,
    "question": "Which company was formerly known as Blue Ribbon Sports?",
    "options": ["Sony", "Microsoft", "Nike", "Adidas"],
    "answer": "Nike"
  },
  {
    "id": 20,
    "question": "What is the main purpose of a firewall in computer networks?",
    "options": ["To boost internet speed", "To filter and monitor incoming and outgoing traffic", "To provide cloud storage", "To enhance computer graphics"],
    "answer": "To filter and monitor incoming and outgoing traffic"
  },
  {
    "id": 21,
    "question": "What is the main advantage of a quantum computer over a classical computer?",
    "options": ["Higher RAM capacity", "Ability to perform parallel computations using qubits", "Larger hard drive space", "Enhanced graphics processing"],
    "answer": "Ability to perform parallel computations using qubits"
  },
  {
    "id": 22,
    "question": "Which of the following algorithms is used in blockchain to achieve consensus?",
    "options": ["Proof of Work (PoW)", "Dijkstra's Algorithm", "PageRank", "Bellman-Ford Algorithm"],
    "answer": "Proof of Work (PoW)"
  },
  {
    "id": 23,
    "question": "What is Docker primarily used for?",
    "options": ["Network monitoring", "Virtualization", "Containerization of applications", "Web hosting"],
    "answer": "Containerization of applications"
  },
  {
    "id": 24,
    "question": "Which type of machine learning algorithm is K-Means?",
    "options": ["Supervised learning", "Unsupervised learning", "Reinforcement learning", "Transfer learning"],
    "answer": "Unsupervised learning"
  },
  {
    "id": 25,
    "question": "In cybersecurity, what does 'phishing' refer to?",
    "options": ["A type of firewall configuration", "An attack that deceives people into providing confidential information", "A malware designed to steal passwords", "A secure method of encryption"],
    "answer": "An attack that deceives people into providing confidential information"
  },
  {
    "id": 26,
    "question": "What does 'PCI' stand for in the context of hardware?",
    "options": ["Peripheral Component Interconnect", "Processor Component Integration", "Primary Computing Interface", "Peripheral Circuit Integration"],
    "answer": "Peripheral Component Interconnect"
  },
  {
    "id": 27,
    "question": "Which protocol is used to send email?",
    "options": ["POP3", "IMAP", "SMTP", "FTP"],
    "answer": "SMTP"
  },
  {
    "id": 28,
    "question": "What is the purpose of a hash function in cryptography?",
    "options": ["To encrypt data", "To create a unique fixed-size representation of data", "To compress files", "To improve data retrieval speed"],
    "answer": "To create a unique fixed-size representation of data"
  },
  {
    "id": 29,
    "question": "Which programming paradigm emphasizes the use of objects and classes?",
    "options": ["Functional programming", "Object-oriented programming", "Procedural programming", "Logical programming"],
    "answer": "Object-oriented programming"
  },
  {
    "id": 30,
    "question": "What does 'BIOS' stand for in a computer system?",
    "options": ["Basic Input/Output System", "Binary Integrated Operating System", "Basic Internet Operating Setup", "Basic Infrastructure of Systems"],
    "answer": "Basic Input/Output System"
  },
  {
    "id": 31,
    "question": "What does 'SQL' stand for?",
    "options": ["Structured Query Language", "Simple Query Language", "Secure Query Language", "System Query Language"],
    "answer": "Structured Query Language"
},
{
    "id": 32,
    "question": "Which HTML tag is used to create a hyperlink?",
    "options": ["<link>", "<a>", "<href>", "<hyperlink>"],
    "answer": "<a>"
},
{
    "id": 33,
    "question": "What is the main purpose of RAID (Redundant Array of Independent Disks) in computing?",
    "options": ["To increase storage capacity", "To improve data redundancy and performance", "To enhance graphics performance", "To increase network speed"],
    "answer": "To improve data redundancy and performance"
},
{
    "id": 34,
    "question": "Which company developed the Linux operating system?",
    "options": ["IBM", "Microsoft", "Linus Torvalds", "Google"],
    "answer": "Linus Torvalds"
},
{
    "id": 35,
    "question": "In programming, what is a 'loop' used for?",
    "options": ["To perform a repetitive task", "To store data", "To define a function", "To display output"],
    "answer": "To perform a repetitive task"
},
{
    "id": 36,
    "question": "What is the full form of 'RAM'?",
    "options": ["Random Access Memory", "Readily Accessible Memory", "Read and Modify", "Real-time Access Memory"],
    "answer": "Random Access Memory"
},
{
    "id": 37,
    "question": "Which technology is used to create interactive effects within web browsers?",
    "options": ["HTML", "CSS", "JavaScript", "PHP"],
    "answer": "JavaScript"
},
{
    "id": 38,
    "question": "What is the primary purpose of a DNS (Domain Name System)?",
    "options": ["To translate domain names into IP addresses", "To secure internet connections", "To manage email accounts", "To host websites"],
    "answer": "To translate domain names into IP addresses"
},
{
    "id": 39,
    "question": "Which of the following is a server-side scripting language?",
    "options": ["HTML", "CSS", "JavaScript", "PHP"],
    "answer": "PHP"
},
{
    "id": 40,
    "question": "What is the default port number for HTTP?",
    "options": ["21", "25", "80", "443"],
    "answer": "80"
},
{
    "id": 41,
    "question": "Who is known as the inventor of the World Wide Web?",
    "options": ["Bill Gates", "Steve Jobs", "Tim Berners-Lee", "Mark Zuckerberg"],
    "answer": "Tim Berners-Lee"
},
{
    "id": 42,
    "question": "What is a 'byte' in computer terminology?",
    "options": ["8 bits", "16 bits", "32 bits", "64 bits"],
    "answer": "8 bits"
},
{
    "id": 43,
    "question": "Which of the following is a distributed version control system?",
    "options": ["Git", "SVN", "Mercurial", "All of the above"],
    "answer": "All of the above"
},
{
    "id": 44,
    "question": "What does 'URL' stand for?",
    "options": ["Uniform Resource Locator", "Uniform Retrieval Locator", "Universal Resource Locator", "Universal Retrieval Locator"],
    "answer": "Uniform Resource Locator"
},
{
    "id": 45,
    "question": "In web development, what does 'API' stand for?",
    "options": ["Application Programming Interface", "Application Process Integration", "Advanced Programming Interface", "Application Programming Interchange"],
    "answer": "Application Programming Interface"
},
{
    "id": 46,
    "question": "What is the name of the first electronic general-purpose computer?",
    "options": ["ENIAC", "UNIVAC", "IBM 701", "Altair 8800"],
    "answer": "ENIAC"
},
{
    "id": 47,
    "question": "Which language is primarily used for scientific computing and data analysis?",
    "options": ["Python", "Java", "C++", "Ruby"],
    "answer": "Python"
},
{
    "id": 48,
    "question": "What does 'HTTPS' stand for?",
    "options": ["HyperText Transfer Protocol Secure", "High Transfer Text Protocol Secure", "HyperTerminal Transfer Process Secure", "Hyperlink Transmission Protocol Secure"],
    "answer": "HyperText Transfer Protocol Secure"
},
{
    "id": 49,
    "question": "What is the name of the Google-developed programming language that aims to simplify web development?",
    "options": ["Dart", "Go", "Kotlin", "Rust"],
    "answer": "Dart"
},
{
    "id": 50,
    "question": "Which file extension is used for Python files?",
    "options": [".py", ".java", ".cpp", ".rb"],
    "answer": ".py"
},
{
    "id": 51,
    "question": "In networking, what does 'VPN' stand for?",
    "options": ["Virtual Private Network", "Virtual Public Network", "Virtual Personal Network", "Virtual Protected Network"],
    "answer": "Virtual Private Network"
},
{
    "id": 52,
    "question": "What does 'GUI' stand for?",
    "options": ["Graphical User Interface", "Global User Interface", "Graphical Unified Interface", "General User Interface"],
    "answer": "Graphical User Interface"
},
{
    "id": 53,
    "question": "What is the main purpose of an IP address?",
    "options": ["To identify a device on a network", "To secure a network connection", "To increase internet speed", "To manage user accounts"],
    "answer": "To identify a device on a network"
},
{
    "id": 54,
    "question": "Which programming language is used for developing Android applications?",
    "options": ["Swift", "Java", "Kotlin", "JavaScript"],
    "answer": "Kotlin"
},
{
    "id": 55,
    "question": "What does 'SEO' stand for in digital marketing?",
    "options": ["Search Engine Optimization", "Social Engagement Optimization", "Search Efficiency Optimization", "Social Engine Optimization"],
    "answer": "Search Engine Optimization"
},
{
    "id": 56,
    "question": "Which protocol is used for secure web browsing?",
    "options": ["HTTP", "FTP", "SMTP", "HTTPS"],
    "answer": "HTTPS"
},
{
    "id": 57,
    "question": "Which company developed the Java programming language?",
    "options": ["Microsoft", "Sun Microsystems", "Apple", "Google"],
    "answer": "Sun Microsystems"
},
{
    "id": 58,
    "question": "What type of attack involves overwhelming a system with traffic?",
    "options": ["Phishing", "Man-in-the-Middle", "DDoS", "Ransomware"],
    "answer": "DDoS"
},
{
    "id": 59,
    "question": "Which language is used for querying databases?",
    "options": ["HTML", "CSS", "SQL", "Java"],
    "answer": "SQL"
},
{
    "id": 60,
    "question": "What is the primary function of a compiler?",
    "options": ["To execute code", "To translate code into machine language", "To debug code", "To optimize code"],
    "answer": "To translate code into machine language"
},

]
