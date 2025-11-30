import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/db';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

