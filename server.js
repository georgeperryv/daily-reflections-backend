require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const sqlite3 = require('sqlite3').verbose()

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

// 1) Create/open the SQLite database file
const db = new sqlite3.Database('./ai_data.db')

// 2) Create the "conversations" (or "reflections") table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS reflections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reflection TEXT,        -- user’s recorded text
      transcription TEXT,     -- the processed text
      title TEXT,             -- short summary
      created_at TEXT         -- date/time in MM-DD-YYYY HH:MM
    )
  `)
})

// Helper to format date/time as MM-DD-YYYY HH:MM
function getFormattedDateTime () {
  const now = new Date()

  const month = String(now.getMonth() + 1).padStart(2, '0') // 01-12
  const day = String(now.getDate()).padStart(2, '0') // 01-31
  const year = now.getFullYear() // 2024
  const hours = String(now.getHours()).padStart(2, '0') // 00-23
  const minutes = String(now.getMinutes()).padStart(2, '0') // 00-59

  return `${month}-${day}-${year} ${hours}:${minutes}`
}

// 3) Route to submit a reflection
//    (Previously "askAI", now renamed to "submitReflection")
app.post('/submitReflection', async (req, res) => {
  try {
    const userReflection = req.body.reflection || ''
    if (!userReflection.trim()) {
      return res.status(400).json({ error: 'No reflection provided.' })
    }

    // -- Call OpenAI’s Chat Completion just as before if you need processing --
    //    For demonstration, we’ll assume we want an AI-based “transcription” or processing
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userReflection }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // AI's “transcription” or processed text
    const processedText = openaiResponse.data.choices[0].message.content

    // A short title from the reflection text
    let shortTitle = userReflection.slice(0, 40).replace(/\n/g, ' ').trim()
    if (userReflection.length > 40) {
      shortTitle += '...'
    }

    // Combine date+time
    const createdAt = getFormattedDateTime()

    // Insert into DB
    db.run(
      `
      INSERT INTO reflections (reflection, transcription, title, created_at)
      VALUES (?, ?, ?, ?)
      `,
      [userReflection, processedText, shortTitle, createdAt],
      function (err) {
        if (err) {
          console.error('Error inserting into DB:', err)
          return res.status(500).json({ error: 'Failed to save reflection' })
        }
        // Return everything to the client
        res.json({
          transcription: processedText,
          reflectionId: this.lastID,
          title: shortTitle,
          createdAt
        })
      }
    )
  } catch (error) {
    console.error(
      'Error in submitReflection:',
      error?.response?.data || error.message
    )
    res.status(500).json({
      error: 'Failed to process reflection',
      details: error?.response?.data || error.message
    })
  }
})

// 4) Optional: get all reflections, newest first (by id DESC)
app.get('/reflections', (req, res) => {
  db.all(`SELECT * FROM reflections ORDER BY id DESC`, (err, rows) => {
    if (err) {
      console.error('Error fetching reflections:', err)
      return res.status(500).json({ error: 'Failed to fetch reflections' })
    }
    res.json(rows)
  })
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

/************************************************
 * server.js
 * Node + Express + SQLite
 * Summarize reflection, then 3 bullet points of pride,
 * and 2 bullet points to focus on.
 ************************************************/
// require('dotenv').config()
// const express = require('express')
// const cors = require('cors')
// const axios = require('axios')
// const sqlite3 = require('sqlite3').verbose()

// const app = express()
// const port = 3000

// app.use(cors())
// app.use(express.json())

// // 1) Create/open the SQLite database file
// const db = new sqlite3.Database('./ai_data.db')

// // 2) Create the "reflections" table if it doesn't exist
// db.serialize(() => {
//   db.run(`
//     CREATE TABLE IF NOT EXISTS reflections (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       reflection TEXT,
//       ai_output TEXT,    -- The summarized output from AI
//       title TEXT,
//       created_at TEXT
//     )
//   `)
// })

// // Helper to format date/time as MM-DD-YYYY HH:MM
// function getFormattedDateTime () {
//   const now = new Date()
//   const month = String(now.getMonth() + 1).padStart(2, '0') // 01-12
//   const day = String(now.getDate()).padStart(2, '0') // 01-31
//   const year = now.getFullYear() // e.g. 2024
//   const hours = String(now.getHours()).padStart(2, '0') // 00-23
//   const minutes = String(now.getMinutes()).padStart(2, '0') // 00-59

//   return `${month}-${day}-${year} ${hours}:${minutes}`
// }

// // 3) Route to submit reflection
// app.post('/submitReflection', async (req, res) => {
//   try {
//     const userReflection = req.body.reflection || ''
//     if (!userReflection.trim()) {
//       return res.status(400).json({ error: 'No reflection provided.' })
//     }

//     // Build a prompt that instructs the AI to produce
//     // a short paragraph summary, 3 bullet points to be proud of,
//     // and 2 bullet points to focus on tomorrow.
//     const prompt = `
//       Please analyze this reflection:
//       "${userReflection}"

//       1) Write a short paragraph summary of what was said.
//       2) Provide 3 bullet points detailing what I should be proud of.
//       3) Provide 2 bullet points for what I should focus on for tomorrow.
//     `

//     // Call OpenAI's Chat Completions
//     const openaiResponse = await axios.post(
//       'https://api.openai.com/v1/chat/completions',
//       {
//         model: 'gpt-3.5-turbo',
//         messages: [{ role: 'user', content: prompt }]
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     )

//     const aiOutput = openaiResponse.data.choices[0].message.content

//     // A short title from the reflection text (first 40 chars)
//     let shortTitle = userReflection.slice(0, 40).replace(/\n/g, ' ').trim()
//     if (userReflection.length > 40) {
//       shortTitle += '...'
//     }

//     // Combine date+time as "MM-DD-YYYY HH:MM"
//     const createdAt = getFormattedDateTime()

//     // Insert into DB
//     db.run(
//       `
//       INSERT INTO reflections (reflection, ai_output, title, created_at)
//       VALUES (?, ?, ?, ?)
//       `,
//       [userReflection, aiOutput, shortTitle, createdAt],
//       function (err) {
//         if (err) {
//           console.error('Error inserting into DB:', err)
//           return res.status(500).json({ error: 'Failed to save reflection' })
//         }
//         // Return the AI output + the saved row ID
//         res.json({
//           aiOutput,
//           reflectionId: this.lastID,
//           title: shortTitle,
//           createdAt
//         })
//       }
//     )
//   } catch (error) {
//     console.error(
//       'Error in submitReflection:',
//       error?.response?.data || error.message
//     )
//     res.status(500).json({
//       error: 'Failed to process reflection',
//       details: error?.response?.data || error.message
//     })
//   }
// })

// // 4) Get all reflections, newest first (by id DESC)
// app.get('/reflections', (req, res) => {
//   db.all(`SELECT * FROM reflections ORDER BY id DESC`, (err, rows) => {
//     if (err) {
//       console.error('Error fetching reflections:', err)
//       return res.status(500).json({ error: 'Failed to fetch reflections' })
//     }
//     res.json(rows)
//   })
// })

// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`)
// })
