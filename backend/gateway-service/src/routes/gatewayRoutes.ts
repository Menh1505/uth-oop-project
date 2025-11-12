import { Router } from "express";
import { GatewayController } from "../controllers/GatewayController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// ✅ Các endpoint public (không cần token)
const PUBLIC_PATHS = new Set<string>([
  "/auth/register",
  "/auth/login",
  "/auth/refresh",
  "/health",
  "/metrics",
  "/info",
]);

// (Tuỳ chọn) log ngắn gọn để debug đường đi
router.use((req, _res, next) => {
  console.log(`➡️  [Gateway] ${req.method} ${req.path}`);
  next();
});

// ✅ Trả preflight để tránh 401/404 do OPTIONS
router.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ✅ Health & observability (public)
router.get("/health", GatewayController.healthCheck);
router.get("/metrics", GatewayController.getMetrics);
router.get("/info",   GatewayController.getInfo);

// ✅ Áp auth có điều kiện (chỉ các route KHÔNG thuộc PUBLIC_PATHS)
router.use((req, res, next) => {
  if (PUBLIC_PATHS.has(req.path)) return next();
  return authMiddleware(req, res, next);
});

// ✅ Bắt mọi API còn lại để forward đến service phù hợp
// FE gọi:      /api/auth/register
// Tại đây:     req.path === /auth/register
router.all("/*", GatewayController.routeRequest);

export default router;
