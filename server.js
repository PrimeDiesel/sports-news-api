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

// Fetch UK sports news using /everything endpoint (works with free tier)
async function fetchUKSportsNews() {
  try {
    if (!process.env.NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not found');
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: '(football OR "premier league" OR rugby OR cricket OR "formula 1" OR tennis) AND (UK OR England OR Scotland OR Wales OR Britain)',
        language: 'en',
        sortBy: 'publishedAt',
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

// Fetch from BBC Sport specifically (alternative approach)
async function fetchBBCSports() {
  try {
    if (!process.env.NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not found');
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        domains: 'bbc.co.uk,bbc.com',
        q: 'sport OR football OR rugby OR cricket',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 30,
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
    console.log('BBC Sports fetch failed:', error.message);
    return [];
  }
}

// Fetch news from ESPN API (backup)
async function fetchFromESPN() {
  try {
    const response = await axios.get('https://site.api.espn.com/apis/site/v2/sports/news', {
      params: {
        limit: 20
      },
      timeout: 10000
    });

    return response.data.articles.map(article => ({
      title: article.headline,
      description: article.description || article.headline,
      url: article.links?.web?.href || 'https://espn.com',
      image: article.images?.[0]?.url || 'https://via.placeholder.com/400x200?text=Sports+News',
      publishedAt: new Date(article.published).toLocaleString(),
      source: 'ESPN'
    }));
  } catch (error) {
    console.log('ESPN API failed:', error.message);
    return [];
  }
}

// Main function to fetch sports news
async function fetchSportsNews() {
  try {
    console.log('Fetching UK sports news...');
    
    let articles = [];

    // Try UK sports search
    const ukSports = await fetchUKSportsNews();
    articles = [...ukSports];

    // Also try BBC specifically
    if (process.env.NEWS_API_KEY && articles.length < 20) {
      const bbcSports = await fetchBBCSports();
      articles = [...articles, ...bbcSports];
    }

    // Remove duplicates based on title
    const uniqueArticles = articles.filter((article, index, self) =>
      index === self.findIndex((a) => a.title === article.title)
    );

    // If NewsAPI fails completely, try ESPN as backup
    if (uniqueArticles.length === 0) {
      console.log('NewsAPI returned no results, trying ESPN...');
      const espnArticles = await fetchFromESPN();
      articles = espnArticles;
    } else {
      articles = uniqueArticles;
    }

    // Fallback sample data if all APIs fail
    if (articles.length === 0) {
      console.log('All APIs failed, using sample data');
      articles = [
        {
          title: "UK Sports News API Setup Complete!",
          description: "Your API is working! Add your NewsAPI.org key for real UK sports news.",
          url: "https://newsapi.org/register",
          image: "https://via.placeholder.com/400x200?text=Setup+Required",
          publishedAt: new Date().toLocaleString(),
          source: "System"
        }
      ];
    }

    // Sort by published date (newest first)
    articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Update cache
    newsCache = articles;
    lastFetchTime = Date.now();
    
    console.log(`Fetched ${articles.length} UK sports articles`);
    return articles;
  } catch (error) {
    console.error('Error fetching sports news:', error);
    return newsCache.length > 0 ? newsCache : [];
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'UK Sports News API is running!',
    note: 'Using /everything endpoint (works with free NewsAPI tier)',
    endpoints: {
      '/news': 'Get latest UK sports news',
      '/news/football': 'Get football/Premier League news',
      '/news/rugby': 'Get rugby news',
      '/news/cricket': 'Get cricket news',
      '/health': 'Health check'
    },
    setup: 'Add NEWS_API_KEY environment variable for live UK sports news',
    coverage: 'Covers UK sports including Premier League, Rugby, Cricket, and more'
  });
});

app.get('/news', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (newsCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Returning cached UK sports news');
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

// Sport-specific endpoints
app.get('/news/football', async (req, res) => {
  try {
    if (!process.env.NEWS_API_KEY) {
      return res.status(503).json({ error: 'NEWS_API_KEY required' });
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: '("premier league" OR "champions league" OR "FA cup" OR football) AND (England OR UK OR Britain)',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 30,
        apiKey: process.env.NEWS_API_KEY
      },
      timeout: 10000
    });

    const articles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.urlToImage || 'https://via.placeholder.com/400x200?text=Football+News',
      publishedAt: new Date(article.publishedAt).toLocaleString(),
      source: article.source.name
    }));

    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch football news', details: error.message });
  }
});

app.get('/news/rugby', async (req, res) => {
  try {
    if (!process.env.NEWS_API_KEY) {
      return res.status(503).json({ error: 'NEWS_API_KEY required' });
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: 'rugby AND (UK OR England OR Scotland OR Wales OR "six nations" OR premiership)',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 30,
        apiKey: process.env.NEWS_API_KEY
      },
      timeout: 10000
    });

    const articles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.urlToImage || 'https://via.placeholder.com/400x200?text=Rugby+News',
      publishedAt: new Date(article.publishedAt).toLocaleString(),
      source: article.source.name
    }));

    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rugby news', details: error.message });
  }
});

app.get('/news/cricket', async (req, res) => {
  try {
    if (!process.env.NEWS_API_KEY) {
      return res.status(503).json({ error: 'NEWS_API_KEY required' });
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: 'cricket AND (England OR UK OR "test match" OR ashes OR "T20")',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 30,
        apiKey: process.env.NEWS_API_KEY
      },
      timeout: 10000
    });

    const articles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.urlToImage || 'https://via.placeholder.com/400x200?text=Cricket+News',
      publishedAt: new Date(article.publishedAt).toLocaleString(),
      source: article.source.name
    }));

    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cricket news', details: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    region: 'UK',
    method: '/everything endpoint (free tier compatible)',
    timestamp: new Date().toISOString(),
    cached_articles: newsCache.length,
    last_fetch: new Date(lastFetchTime).toISOString(),
    has_api_key: !!process.env.NEWS_API_KEY
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`UK Sports News API running on port ${PORT}`);
  console.log(`NewsAPI Key available: ${!!process.env.NEWS_API_KEY}`);
  console.log('Using /everything endpoint (compatible with free tier)');
  
  // Initial fetch
  fetchSportsNews();
});

// Refresh news every 30 minutes
setInterval(fetchSportsNews, 30 * 60 * 1000);
