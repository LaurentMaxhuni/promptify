const express = require('express');
const cors = require('cors');
const app = express();

app.get('/', (req, res) => {
  res.send('<h2>hi :)</h2>')
})

const port = process.env.PORT || 6767;

const groqsRoute = require('./routes/api/groq')

app.use(cors());

app.use('/api/groq', groqsRoute);

app.listen(port, () => {
  console.log(`Server started on port: ${port}`)
})
