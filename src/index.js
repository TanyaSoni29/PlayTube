import connectDB from "./db/index.js"
import dotenv from "dotenv"
import { app } from "./app";

dotenv.config({
    path: './.env'
})

connectDB().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`)
    })
}).catch((error) => {
    console.log("DB connection Faces some issuse", error)
})




