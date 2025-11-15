import createApp from './app';

const app = createApp();
const port = process.env.PORT || 3011;

app.listen(port, () => {
  console.log(`🚀 Recommendation Service running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 AI Recommendations: ${process.env.ENABLE_AI_RECOMMENDATIONS === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' ? 'Configured' : 'Not configured (using fallback)'}`);
  console.log(`📚 API Documentation: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

export default app;