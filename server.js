// const express = require('express')
// const cors = require('cors')
// const axios = require('axios')

// const app = express()
// const port = 3000

// require('dotenv').config()

// console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY)

// // Use CORS to allow frontend requests
// app.use(cors())

// // Body parser
// app.use(express.json())

// // 1) Simple ping route
// app.get('/ping', (req, res) => {
//   res.json({ message: 'pong' })
// })

// // 2) Optional: Check if we can reach OpenAI (no tokens consumed)
// app.get('/ping_openai', async (req, res) => {
//   try {
//     const openaiHealthCheckUrl = 'https://api.openai.com/v1/models'
//     const response = await axios.get(openaiHealthCheckUrl, {
//       headers: {
//         Authorization: `Bearer ${process.env.OPENAI_API_KEY}` // or your OPENAI_API_KEY variable
//       }
//     })

//     // If the request succeeds, it means your API key is valid and OpenAI is reachable
//     return res.json({
//       status: 'success',
//       availableModels: response.data?.data?.length || 0
//     })
//   } catch (error) {
//     // If there's an error, return it in the response
//     return res.status(500).json({
//       status: 'error',
//       message: error?.response?.data || error.message
//     })
//   }
// })

// // Example existing routes (no changes needed if you already have them)
// // app.post('/add_reflection', ...);
// // app.post('/summarize_reflection', ...);

// // Start the server
// console.log('im running')
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`)
// })

/******************************************************
 * server.js
 * A simple Express server that calls OpenAI's Chat API
 ******************************************************/
require('dotenv').config() // Loads .env with OPENAI_API_KEY
const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
const port = 3000

// Enable CORS and JSON parsing
app.use(cors())
app.use(express.json())

// Check that we loaded the key (optional logging)
console.log(
  'OPENAI_API_KEY:',
  process.env.OPENAI_API_KEY ? 'Loaded' : 'Not Found'
)

//
// 1) Test route to confirm backend is running
//
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' })
})

//
// 2) Route to send a question to OpenAI
//
app.post('/askAI', async (req, res) => {
  try {
    const userQuestion = req.body.question // text from the frontend

    if (!userQuestion) {
      return res.status(400).json({ error: 'No question provided.' })
    }

    // Call OpenAI Chat Completions endpoint with userQuestion
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userQuestion }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // Extract the assistant's reply
    const aiAnswer = openaiResponse.data.choices[0].message.content
    res.json({ answer: aiAnswer })
  } catch (error) {
    console.error(
      'Error in askAI route:',
      error?.response?.data || error.message || error
    )
    res.status(500).json({
      error: 'Failed to get answer from OpenAI',
      details: error?.response?.data || error.message
    })
  }
})

//
// Start the Server
//
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
