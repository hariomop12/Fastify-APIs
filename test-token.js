const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "hdkf439749756413%$^&*";

// Generate a token
const token = jwt.sign({ username: "testuser12" }, JWT_SECRET, {
  expiresIn: "24h",
});
console.log("Generated token:", token);
console.log("Token length:", token.length);

// Verify the token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log("Token verified successfully:", decoded);
} catch (error) {
  console.error("Token verification failed:", error.message);
}
