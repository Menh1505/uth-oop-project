import express from 'express';
import UserController from '../controllers/UserController';
import RecommendationController from '../controllers/RecommendationController';

const router = express.Router();

// User management routes
router.post('/users', UserController.createUser.bind(UserController));
router.get('/users', UserController.listUsers.bind(UserController));
router.get('/users/:userId', UserController.getUser.bind(UserController));
router.put('/users/:userId', UserController.updateUser.bind(UserController));
router.delete('/users/:userId', UserController.deleteUser.bind(UserController));

// User behavior tracking
router.get('/users/:userId/behaviors', UserController.getUserBehaviors.bind(UserController));
router.post('/users/:userId/behaviors', UserController.trackBehavior.bind(UserController));

// Recommendation routes
router.post('/users/:userId/recommendations', RecommendationController.generateRecommendations.bind(RecommendationController));
router.get('/users/:userId/recommendations', RecommendationController.getUserRecommendations.bind(RecommendationController));
router.put('/users/:userId/recommendations/:recommendationId', RecommendationController.updateRecommendationStatus.bind(RecommendationController));

// Specific recommendation types
router.get('/users/:userId/recommendations/exercises', RecommendationController.getExerciseRecommendations.bind(RecommendationController));
router.get('/users/:userId/recommendations/foods', RecommendationController.getFoodRecommendations.bind(RecommendationController));
router.get('/users/:userId/recommendations/quick', RecommendationController.getQuickRecommendations.bind(RecommendationController));

export default router;