const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require("./config/redis");

const JWT_SECRET = process.env.JWT_SECRET || "hdkf439749756413%$^&*";

async function registerUser(username, password) {
  // Check if user exist
  const existingUser = await redisClient.hget("users", username);
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    username,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  await redisClient.hset("users", username, JSON.stringify(user));
  return { username, createdAt: user.createdAt };
}

async function loginUser(username, password) {
  // Get user
  const userJson = await redisClient.hget("users", username);
  if (!userJson) {
    throw new Error("Invalid credentials");
  }

  const user = JSON.parse(userJson);

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  // Generate JWT token
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
  return { token };
}

async function authenticate(request, reply) {
  try {
    const token = request.headers.authorization?.split(" ")[1];
    if (!token) {
      reply.code(401).send({ error: "Authentication required" });
      return false;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;
    return true;
  } catch (error) {
    reply.code(401).send({ error: "Invalid or expired token" });
    return false;
  }
}

module.exports = { registerUser, loginUser, authenticate };
