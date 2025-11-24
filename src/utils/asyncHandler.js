const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
      //(req, res, next) So ANY function that Express executes with these three arguments automatically becomes a middleware.
      Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
   };
};

export { asyncHandler };

// const asyncHandler = (fn) => async (req, res, next) => {
//    try {
//       await fn(req, res, next);
//    } catch (error) {
//       res.status(error.code || 500).json({
//          success: false,
//          message: error.message || "Internal Server Error",
//       });
//       console.error("Error caught by asyncHandler:", error);
//    }
// };
