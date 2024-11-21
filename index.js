import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
var score=0;
var qNO=1;

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

import session from "express-session";

app.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Use true if HTTPS is enabled
    })
);

app.get("/", (req, res) => {
  // Reset score, question number, and session data
  score = 0;
  qNO = 1;
  req.session.results = [];
  req.session.answeredQuestions = [];
  
  // Redirect to the first question or home page
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

    // Filter out already answered questions
    const unansweredQuestions = questions.filter(
        (q) => !req.session.answeredQuestions.includes(q.id)
    );

    // If the user has answered 5 questions, redirect to the results page
    if (req.session.answeredQuestions.length >= 5) {
      qNO=1;
      req.session.answeredQuestions = [];
      return res.redirect('/results');
    }

    // Select a random unanswered question
    const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
    const randomQuestion = unansweredQuestions[randomIndex];

    // Send the question to the EJS template
    res.render("index.ejs", { question: randomQuestion, questionNumber: qNO++, });
});
  

app.post("/submit-answer", (req, res) => {
  const userAnswer = req.body.answer;
  const questionId = parseInt(req.body.currentQuestionId);

  const currentQuestion = questions.find((q) => q.id === questionId);

  if (!currentQuestion) {
    return res.status(404).send('Question not found');
  }

  // Initialize session properties if not already set
  if (!req.session.results) {
    req.session.results = []; // Only initialize the results array if it doesn't already exist
  }

  if (!req.session.answeredQuestions) {
    req.session.answeredQuestions = [];
  }

  // Add the current question to answered questions and store the result
  req.session.answeredQuestions.push(currentQuestion.id);
  req.session.results.push({
    questionId: currentQuestion.id,
    userAnswer,
    isCorrect: userAnswer === currentQuestion.answer,
  });

  // Redirect to the next random question
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

  res.render("results.ejs", { correctAnswers, totalQuestions, remark });

  // Clear the session data after displaying results
  req.session.results = [];
  req.session.answeredQuestions = [];

  req.session.destroy();
});




app.listen(port);

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
  }
]
