import express from "express";

const port = 3001;

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send({
    message: "hello world!"
  })
})

app.listen(port, () => console.log(`server listening on ${port}`))
