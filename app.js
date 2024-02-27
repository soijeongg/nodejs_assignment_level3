import express from "express";
import dotenv from "dotenv";
import CategoryRouter from "./src/routes/category.router.js";
//import MenuRouter from "./routes/reviews.router.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: false })); 
app.use("/api/categories", CategoryRouter)
app.get("/", (req, res) => {
  res.send("<h1>3차과제</h1>");
});

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
