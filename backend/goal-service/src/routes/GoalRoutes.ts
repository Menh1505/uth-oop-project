import { Router } from 'express';
import { GoalController } from '../controllers/GoalController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const goalController = new GoalController();

// =================== Goal Management Routes ===================

/**
 * @route POST /goals
 * @description Create a new goal
 * @access Private (Admin/Staff)
 * @body {CreateGoalRequest}
 */
router.post('/', authenticate, goalController.createGoal);

/**
 * @route GET /goals/:goalId
 * @description Get goal by ID
 * @access Public
 */
router.get('/:goalId', goalController.getGoalById);

/**
 * @route PUT /goals/:goalId
 * @description Update goal
 * @access Private (Admin/Staff)
 * @body {UpdateGoalRequest}
 */
router.put('/:goalId', authenticate, goalController.updateGoal);

/**
 * @route DELETE /goals/:goalId
 * @description Delete goal
 * @access Private (Admin/Staff)
 */
router.delete('/:goalId', authenticate, goalController.deleteGoal);

/**
 * @route GET /goals
 * @description Get all goals with filters and pagination
 * @access Public
 * @query goal_type, is_active, created_after, created_before, page, limit, sort_by, sort_order
 */
router.get('/', goalController.getAllGoals);

/**
 * @route GET /goals/popular/list
 * @description Get popular goals
 * @access Public
 * @query limit
 */
router.get('/popular/list', goalController.getPopularGoals);

// =================== User Goal Management Routes ===================

/**
 * @route POST /user-goals
 * @description Assign goal to authenticated user
 * @access Private
 * @body {AssignGoalRequest}
 */
router.post('/user-goals', authenticate, goalController.assignGoalToUser);

/**
 * @route GET /user-goals
 * @description Get user's goals with filters and pagination
 * @access Private
 * @query status, goal_type, completion_status, progress_min, progress_max, page, limit, sort_by, sort_order
 */
router.get('/user-goals', authenticate, goalController.getUserGoals);

/**
 * @route GET /user-goals/:userGoalId
 * @description Get specific user goal by ID
 * @access Private
 */
router.get('/user-goals/:userGoalId', authenticate, goalController.getUserGoalById);

/**
 * @route PUT /user-goals/:userGoalId
 * @description Update user goal
 * @access Private
 * @body {UpdateUserGoalRequest}
 */
router.put('/user-goals/:userGoalId', authenticate, goalController.updateUserGoal);

/**
 * @route DELETE /user-goals/:userGoalId
 * @description Delete user goal
 * @access Private
 */
router.delete('/user-goals/:userGoalId', authenticate, goalController.deleteUserGoal);

// =================== Progress Tracking Routes ===================

/**
 * @route GET /user-goals/:userGoalId/progress
 * @description Get detailed goal progress
 * @access Private
 */
router.get('/user-goals/:userGoalId/progress', authenticate, goalController.getGoalProgress);

/**
 * @route PUT /user-goals/:userGoalId/progress
 * @description Update goal progress percentage
 * @access Private
 * @body {progress_percentage: number}
 */
router.put('/user-goals/:userGoalId/progress', authenticate, goalController.updateGoalProgress);

/**
 * @route GET /statistics/user
 * @description Get user's goal statistics
 * @access Private
 */
router.get('/statistics/user', authenticate, goalController.getUserGoalStatistics);

/**
 * @route GET /goals/deadline/near
 * @description Get active goals near deadline
 * @access Private
 * @query days (default: 7)
 */
router.get('/deadline/near', authenticate, goalController.getActiveGoalsNearDeadline);

/**
 * @route GET /activity/recent
 * @description Get recent goal activity
 * @access Private
 * @query days (default: 30)
 */
router.get('/activity/recent', authenticate, goalController.getRecentGoalActivity);

// =================== Goal Recommendations Routes ===================

/**
 * @route GET /recommendations/goals
 * @description Get personalized goal recommendations
 * @access Private
 */
router.get('/recommendations/goals', authenticate, goalController.getGoalRecommendations);

/**
 * @route GET /user-goals/:userGoalId/suggestions
 * @description Get goal adjustment suggestions
 * @access Private
 */
router.get('/user-goals/:userGoalId/suggestions', authenticate, goalController.getGoalAdjustmentSuggestions);

/**
 * @route GET /templates
 * @description Get goal templates
 * @access Public
 */
router.get('/templates/list', goalController.getGoalTemplates);

/**
 * @route POST /templates/:templateId/create
 * @description Create goal from template
 * @access Private
 * @body {customizations?: Partial<GoalTargetMetrics>}
 */
router.post('/templates/:templateId/create', authenticate, goalController.createGoalFromTemplate);

/**
 * @route GET /suggestions/smart
 * @description Get smart goal suggestions based on user history
 * @access Private
 */
router.get('/suggestions/smart', authenticate, goalController.getSmartGoalSuggestions);

export default router;