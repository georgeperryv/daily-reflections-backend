const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
const port = 3000

require('dotenv').config()

console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY)

// Use CORS to allow frontend requests
app.use(cors())

// Body parser
app.use(express.json())

// 1) Simple ping route
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' })
})

// 2) Optional: Check if we can reach OpenAI (no tokens consumed)
app.get('/ping_openai', async (req, res) => {
  try {
    const openaiHealthCheckUrl = 'https://api.openai.com/v1/models'
    const response = await axios.get(openaiHealthCheckUrl, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}` // or your OPENAI_API_KEY variable
      }
    })

    // If the request succeeds, it means your API key is valid and OpenAI is reachable
    return res.json({
      status: 'success',
      availableModels: response.data?.data?.length || 0
    })
  } catch (error) {
    // If there's an error, return it in the response
    return res.status(500).json({
      status: 'error',
      message: error?.response?.data || error.message
    })
  }
})

// Example existing routes (no changes needed if you already have them)
// app.post('/add_reflection', ...);
// app.post('/summarize_reflection', ...);

// Start the server
console.log('im running')
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
