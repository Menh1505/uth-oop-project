import app from './app';

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`🚀 Workout service running on port ${PORT}`);
  console.log(`🏥 Health check at http://localhost:${PORT}/`);
  console.log(`🏋️ API endpoints at http://localhost:${PORT}/api/workout`);
});