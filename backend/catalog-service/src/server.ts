import app from './app';

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`🚀 Catalog service running on port ${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`🏥 Health check at http://localhost:${PORT}/`);
  console.log(`📁 API endpoints at http://localhost:${PORT}/api/catalog`);
});