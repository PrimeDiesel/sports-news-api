const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the News API!');
});

// News route (existing)
app.get('/news', async (req, res) => {
  try {
    // Fetch world news articles
    const response = await axios.get('https://newsapi.org/v2/top-headlines?sources=bbc-news&apiKey=59278959b90f45bbbfee3a42287dbf7b');
    
    // Expanded excluded words array to include more drug-related terms
    const excludedWords = [
      'murder', 'sexual assault', 'rape', 'drugs', 'drug trafficking', 'sex trafficking', 
      'cannabis', 'marijuana', 'illegal drugs', 'narcotics'
    ];
    
    const articles = response.data.articles
      .filter(article => 
        article.title &&
        !excludedWords.some(word => 
          article.title.toLowerCase().includes(word) || 
          (article.description && article.description.toLowerCase().includes(word))
        ) &&
        !article.source.name.includes('NFL') && 
        !article.source.name.includes('MLB')
      )
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }))
      .slice(0, 6);
    
    // Ensure there are exactly 6 articles
    while (articles.length < 6) {
      articles.push({
        title: 'No title available',
        description: 'No description available',
        url: '',
        image: '',
        publishedAt: ''
      });
    }
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).send('Error fetching news');
  }
});

// Tech news route (NEW!)
app.get('/tech', async (req, res) => {
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines?category=technology&country=us&pageSize=8&apiKey=59278959b90f45bbbfee3a42287dbf7b');
    
    const excludedWords = [
      'murder', 'sexual assault', 'rape', 'drugs', 'drug trafficking', 'sex trafficking', 
      'cannabis', 'marijuana', 'illegal drugs', 'narcotics'
    ];
    
    const articles = response.data.articles
      .filter(article => 
        article.title &&
        !excludedWords.some(word => 
          article.title.toLowerCase().includes(word) || 
          (article.description && article.description.toLowerCase().includes(word))
        )
      )
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }))
      .slice(0, 8);
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching tech news:', error);
    res.status(500).send('Error fetching tech news');
  }
});

// Sports news route (NEW!)
app.get('/sports', async (req, res) => {
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines?category=sports&country=gb&pageSize=8&apiKey=59278959b90f45bbbfee3a42287dbf7b');
    
    // Less strict filtering for sports - only exclude extreme content
    const excludedWords = [
      'murder', 'sexual assault', 'rape', 'sex trafficking'
    ];
    
    const articles = response.data.articles
      .filter(article => 
        article.title &&
        !excludedWords.some(word => 
          article.title.toLowerCase().includes(word) || 
          (article.description && article.description.toLowerCase().includes(word))
        )
      )
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }))
      .slice(0, 8);
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching sports news:', error);
    res.status(500).send('Error fetching sports news');
  }
});

// Education news route - Scotland/SQA focused (NEW!)
app.get('/education', async (req, res) => {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: '(Scotland OR Scottish OR SQA OR "Scottish Qualifications Authority") AND (education OR school OR university OR college OR students OR teachers OR exam OR curriculum OR Highers OR "National 5")',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 8,
        apiKey: '59278959b90f45bbbfee3a42287dbf7b'
      }
    });
    
    const articles = response.data.articles
      .filter(article => article.title && article.description)
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }))
      .slice(0, 8);
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching education news:', error);
    res.status(500).send('Error fetching education news');
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
