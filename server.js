const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Root route
app.get('/', (req, res) => {
  res.send('UK Sports News API - Access /news for sports articles');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'UK Sports News API' });
});

// UK Sports News route
app.get('/news', async (req, res) => {
  try {
    // Fetch from multiple sports sources
    const sources = [
      'bbc-sport',
      'the-guardian-uk',
      'espn',
      'four-four-two'
    ];
    
    const sourceQuery = sources.join(',');
    const response = await axios.get(`https://newsapi.org/v2/top-headlines?sources=${sourceQuery}&apiKey=59278959b90f45bbbfee3a42287dbf7b`);
    
    // Filter out non-sports content
    const excludedWords = [
      'movie', 'film', 'celebrity', 'entertainment', 'music', 'album',
      'concert', 'festival', 'actor', 'actress', 'director'
    ];
    
    const articles = response.data.articles
      .filter(article => {
        if (!article.title || !article.description) return false;
        
        // Exclude entertainment content
        const lowerTitle = article.title.toLowerCase();
        const lowerDesc = article.description.toLowerCase();
        
        return !excludedWords.some(word => 
          lowerTitle.includes(word) || lowerDesc.includes(word)
        );
      })
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }));
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching sports news:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch sports news',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`UK Sports News API listening on port ${PORT}`);
});
