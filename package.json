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

// Fetch UK sports news - TIGHTER FILTERING
async function fetchUKSportsNews() {
  try {
    if (!process.env.NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not found');
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: '("premier league" OR "champions league" OR "FA cup" OR rugby OR cricket OR "six nations" OR tennis OR "formula 1") AND (England OR Scotland OR Wales OR UK OR Britain)',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 100,
        apiKey: process.env.NEWS_API_KEY
      },
      timeout: 10000
    });

    return response.data.articles
      .filter(article => {
        // STRICT FILTERING - Remove movie/entertainment content
        const content = `${article.title || ''} ${article.description || ''}`.toLowerCase();
        
        // Exclude entertainment/movie terms
        const excludeTerms = [
          'movie', 'film', 'cinema', 'box office', 'trailer', 'premiere',
          'actor', 'actress', 'hollywood', 'netflix', 'streaming',
          'tv show', 'series', 'episode', 'season finale', 'director',
          'oscar', 'grammy', 'emmy', 'celebrity', 'red carpet'
        ];
        
        if (excludeTerms.some(term => content.includes(term))) {
          return false;
        }
        
        // Must have sport indicators
        const sportTerms = [
          'football', 'soccer', 'rugby', 'cricket', 'tennis', 'f1', 'formula',
          'match', 'game', 'tournament', 'league', 'championship', 'cup',
          'goal', 'score', 'win', 'defeat', 'draw', 'team', 'player',
          'manager', 'coach', 'transfer', 'fixture', 'stadium'
        ];
        
        return sportTerms.some(term => content.includes(term));
      })
      .map(article => ({
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

// Fetch from BBC Sport specifically
async function fetchBBCSports() {
  try {
    if (!process.env.NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not found');
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        domains: 'bbc.co.uk',
        q: '(football OR rugby OR cricket OR tennis OR athletics OR golf) AND sport',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 50,
        apiKey: process.env.NEWS_API_KEY
      },
      timeout: 10000
    });

    return response.data.articles
      .filter(article => {
        const content = `${article.title || ''} ${article.description || ''}`.toLowerCase();
        
        // BBC Sport specific - exclude entertainment
        const excludeTerms = ['movie', 'film', 'tv show', 'actor', 'actress'];
        if (excludeTerms.some(term => content.includes(term))) {
          return false;
        }
        
        // Must mention sport or be from sport section
        return content.includes('sport') || 
               content.includes('match') || 
               content.includes('game') ||
               content.includes('league') ||
               content.includes('team');
      })
      .map(article => ({
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

// Fetch Guardian Sports
async function fetchGuardianSports() {
  try {
    if (!process.env.NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not found');
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        domains: 'theguardian.com',
        q: 'football OR rugby OR cricket OR tennis OR sport',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 30,
        apiKey: process.env.NEWS_API_KEY
      },
      timeout: 10000
    });

    return response.data.articles
      .filter(article => {
        const content = `${article.title || ''} ${article.description || ''}`.toLowerCase();
        const excludeTerms = ['movie', 'film', 'tv show', 'actor'];
        return !excludeTerms.some(term => content.includes(term));
      })
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage || 'https://via.placeholder.com/400x200?text=Sports+News',
        publishedAt: new Date(article.publishedAt).toLocaleString(),
        source: article.source.name
      }));
  } catch (error) {
    console.log('Guardian Sports fetch failed:', error.message);
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

    // Fetch from multiple sources
    const [ukSports, bbcSports, guardianSports] = await Promise.all([
      fetchUKSportsNews(),
      fetchBBCSports(),
      fetchGuardianSports()
    ]);

    // Combine all sources
    articles = [...ukSports, ...bbcSports, ...guardianSports];

    console.log(`Total articles before deduplication: ${articles.length}`);

    // Remove duplicates based on title
    const uniqueArticles = articles.filter((article, index, self) =>
      index === self.findIndex((a) => a.title === article.title)
    );

    console.log(`Unique articles after deduplication: ${uniqueArticles.length}`);

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
    articles.sort((a, b) => {
      const dateA = new Date(a.publishedAt);
      const dateB = new Date(b.publishedAt);
      return dateB - dateA;
    });

    // Update cache
    newsCache = articles;
    lastFetchTime = Date.now();
    
    console.log(`✅ Final cached articles: ${articles.length}`);
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
    note: 'Using /everything endpoint with strict UK sports filtering',
    endpoints: {
      '/news': 'Get latest UK sports news (filtered)',
      '/news/football': 'Get football/Premier League news',
      '/news/rugby': 'Get rugby news',
      '/news/cricket': 'Get cricket news',
      '/health': 'Health check'
    },
    sources: 'BBC Sport, The Guardian, Sky Sports, and more UK sources',
    filtering: 'Movies and entertainment content automatically excluded'
  });
});

app.get('/news', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (newsCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      console.log(`Returning ${newsCache.length} cached UK sports articles`);
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
        q: '("premier league" OR "champions league" OR "FA cup" OR "EFL" OR football OR soccer) AND (England OR UK OR Britain) -movie -film',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 50,
        apiKey: process.env.NEWS_API_KEY
      },
      timeout: 10000
    });

    const articles = response.data.articles
      .filter(article => {
        const content = `${article.title || ''} ${article.description || ''}`.toLowerCase();
        return !content.includes('movie') && !content.includes('film');
      })
      .map(article => ({
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
        q: '(rugby OR "six nations" OR "premiership rugby" OR "rugby union" OR "rugby league") AND (UK OR England OR Scotland OR Wales)',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 50,
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
        q: '(cricket OR "test match" OR "ashes" OR "T20" OR "england cricket") AND (England OR UK)',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 50,
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
    method: '/everything endpoint with strict UK sports filtering',
    timestamp: new Date().toISOString(),
    cached_articles: newsCache.length,
    last_fetch: new Date(lastFetchTime).toISOString(),
    has_api_key: !!process.env.NEWS_API_KEY,
    filtering: 'Movies and entertainment automatically excluded'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`UK Sports News API running on port ${PORT}`);
  console.log(`NewsAPI Key available: ${!!process.env.NEWS_API_KEY}`);
  console.log('Using strict UK sports filtering - movies/entertainment excluded');
  
  // Initial fetch
  fetchSportsNews();
});

// Refresh news every 30 minutes
setInterval(fetchSportsNews, 30 * 60 * 1000);
