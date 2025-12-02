const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Cache for news articles
let newsCache = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Fetch news from NewsAPI.org
async function fetchFromNewsAPI() {
  try {
    if (!process.env.NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not found');
    }

    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        category: 'sports',
        country: 'us',
        pageSize: 50,
        apiKey: process.env.NEWS_API_KEY
      },
      timeout: 10000
    });

    return response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.urlToImage || 'https://via.placeholder.com/400x200?text=Sports+News',
      publishedAt: new Date(article.publishedAt).toLocaleString(),
      source: article.source.name
    }));
  } catch (error) {
    console.log('NewsAPI failed:', error.message);
    return [];
  }
}

// Fetch news from NewsAPI.org (UK focused)
async function fetchFromNewsAPI() {
  try {
    if (!process.env.NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not found');
    }

    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        category: 'sports',
        country: 'gb',  // Changed from 'us' to 'gb' for UK news
        pageSize: 50,
        apiKey: process.env.NEWS_API_KEY
      },
      timeout: 10000
    });

    return response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.urlToImage || 'https://via.placeholder.com/400x200?text=Sports+News',
      publishedAt: new Date(article.publishedAt).toLocaleString(),
      source: article.source.name
    }));
  } catch (error) {
    console.log('NewsAPI failed:', error.message);
    return [];
  }
}

// Main function to fetch sports news
async function fetchSportsNews() {
  try {
    console.log('Fetching sports news...');
    
    // Try NewsAPI first
    let articles = await fetchFromNewsAPI();
    
    // If NewsAPI fails, try ESPN
    if (articles.length === 0) {
      articles = await fetchFromESPN();
    }
    
    // Fallback sample data if all APIs fail
    if (articles.length === 0) {
      console.log('All APIs failed, using sample data');
      articles = [
        {
          title: "Sports News API Setup Complete!",
          description: "Your API is working! Add your NewsAPI.org key for real sports news.",
          url: "https://newsapi.org/register",
          image: "https://via.placeholder.com/400x200?text=Setup+Required",
          publishedAt: new Date().toLocaleString(),
          source: "System"
        }
      ];
    }
    
    // Update cache
    newsCache = articles;
    lastFetchTime = Date.now();
    
    console.log(`Fetched ${articles.length} sports articles`);
    return articles;
    
  } catch (error) {
    console.error('Error fetching sports news:', error);
    return newsCache.length > 0 ? newsCache : [];
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Sports News API is running!',
    endpoints: {
      '/news': 'Get latest sports news',
      '/health': 'Health check'
    },
    setup: 'Add NEWS_API_KEY environment variable for live sports news'
  });
});

app.get('/news', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (newsCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Returning cached sports news');
      return res.json(newsCache);
    }
    
    // Fetch fresh news
    const articles = await fetchSportsNews();
    res.json(articles);
    
  } catch (error) {
    console.error('Error in /news endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch sports news',
      message: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    cached_articles: newsCache.length,
    last_fetch: new Date(lastFetchTime).toISOString(),
    has_api_key: !!process.env.NEWS_API_KEY
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Sports News API running on port ${PORT}`);
  console.log(`NewsAPI Key available: ${!!process.env.NEWS_API_KEY}`);
  
  // Initial fetch
  fetchSportsNews();
});

// Refresh news every 30 minutes
setInterval(fetchSportsNews, 30 * 60 * 1000);
