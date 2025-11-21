import connectDB from "./db/index.js";
import env from "dotenv";
import { app } from "./app.js";

env.config({ path: "./.env" }); // Load environment variables from .env file to process.env

const startServer = async () => {
   try {
      await connectDB();
      app.listen(process.env.PORT, () => {
         console.log(`Server is running on port ${process.env.PORT}`);
      });
   } catch (error) {
      console.error("Failed to connect to the database:", errpr);
   }
};
startServer();
