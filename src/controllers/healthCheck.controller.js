import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async (req, res) => {
  //TODO: build a healthcheck response that simply returns the OK status as json with a message
  res
    .status(200)
    .json(new ApiResponse(200, null, "Service is healthy"))
    .catch((err) => {
      throw new ApiError(500, "Internal Server Error", err.message);
    });
});

export { healthcheck };
