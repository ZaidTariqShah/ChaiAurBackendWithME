import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const startServer = async () => {
   try {
      await connectDB();
      app.listen(process.env.PORT, () => {
         console.log(`Server is running on port ${process.env.PORT}`);
      });
   } catch (error) {
      console.error("Failed to connect to the database:", error);
   }
};
startServer();
