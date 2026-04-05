"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
async function bootstrap() {
    await (0, db_1.connectDB)();
    app_1.default.listen(env_1.env.port, () => {
        logger_1.logger.info(`API running at http://localhost:${env_1.env.port}`);
    });
}
bootstrap().catch((error) => {
    logger_1.logger.error("Failed to start server", error);
    process.exit(1);
});
