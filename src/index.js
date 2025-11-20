import connectDB from "./db/index.js";
import env from "dotenv";


env.config({ path: "./.env" }); // Load environment variables from .env file to process.env
connectDB();
