const dotenv = require('dotenv');   
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();
const app = express();
app.use(express.json());

let users = [];

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};


const path = require("path");

// serve static files (index.html, css, js)
app.use(express.static(path.join(__dirname, "public")));

const authMiddleware = (req, res, next)=>{


    const publicRoutes =[
        "/api/auth/signup",
        "/api/auth/login",
        "/api/auth/forgot-password",
    ];

    const regexRoutes = [
        /^\/api\/auth\/reset-password\/.*/,
        /^\/api\/auth\/verify-email\/.*/,
    ];
    const path = req.path.replace(/\/$/, "");
    const isPublic = 
        publicRoutes.includes(path) ||
        regexRoutes.some((route) => route.test(path));
       
    if (isPublic){
        return next();
    }

    const token = req.headers['authorization']?.split(' ')[1];

      if (!token){
        return res.status(401).json({message: "No token provided"});

      }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error){
        return res.status(401).json({message: "No token provided"});
    }
        
};


app.post('/api/auth/signup', async (req, res) =>{
   const {name, email, password} = req.body;
   const existing = users.find((user) => user.email === email);
   if(existing){
    return res.status(400).json({message: "User already exists"});
   }
   
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser ={
        id:Date.now().toString(),
        name,
        email,
        password: hashedPassword,
        isVerified: true,
    };
    users.push(newUser);
    res.json({message:"Sign up successfully" , id: newUser.id, email: newUser.email, name: newUser.name})
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  res.json({ token: generateToken(user.id) });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  const resetToken = generateToken(user.id);
  res.json({ message: "Use this token to reset password", resetToken });
});

app.post("/api/auth/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = users.find((u) => u.id === decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    res.json({ message: "Password reset successful!" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

app.post("/api/auth/change-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = users.find((u) => u.id === req.user.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) return res.status(400).json({ message: "Old password incorrect" });

  user.password = await bcrypt.hash(newPassword, 10);
  res.json({ message: "Password changed successfully!" });
});


app.get("/", (req, res) => {
  res.send("✅ Auth API is running. Try /signup-test or /login-test in the browser.");
});

app.get("/signup-test", (req, res) => {
  users.push({
    id: Date.now().toString(),
    name: "TestUser",
    email: "test@mail.com",
    password: hashedPassword, 
    isVerified: true,
  });
  res.send("User test@mail.com signed up!");
});

app.get("/login-test", (req, res) => {
  const user = users.find((u) => u.email === "test@mail.com");
  if (!user) return res.send("User not found. Try /signup-test first.");

  const token = generateToken(user.id);
  res.send("Login successful. Token: " + token);
});
app.use(authMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


