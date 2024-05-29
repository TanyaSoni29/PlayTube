const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export {asyncHandler}


// another way using try catch

// const asyncHandler = (fn) => async(req,res,next) => {
//     try{
//        await fn(req, res, next)
//     } catch (err) {
//       res.status(500).json({
//         success: false,
//         message: "Server Errorr" || err.message,
//       })
//     }
// }