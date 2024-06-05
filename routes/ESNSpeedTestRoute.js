import router from "express";
import ESNSpeedTestController from "../controllers/ESNSpeedTestController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const speedTestRouter = router();
const speedTestController = new ESNSpeedTestController();

speedTestRouter.put("/speedtest/running", AuthMiddleware.isAdmin, speedTestController.startSpeedTest);

speedTestRouter.put("/speedtest/stopped", AuthMiddleware.isAdmin, speedTestController.stopSpeedTest);

export default speedTestRouter;