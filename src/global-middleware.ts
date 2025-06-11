import {
  createMiddleware,
  registerGlobalMiddleware,
} from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";
import { differenceInMilliseconds } from "date-fns";

const loggingMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next, data }) => {
    const startTime = Date.now();
    const result = await next();
    const endTime = Date.now();
    const headers = getHeaders();
    try {
      console.log(
        JSON.stringify({
          requestData: data,
          requestIp: headers["x-forwarded-for"] ?? "unknown",
          requestTimeMilliseconds: differenceInMilliseconds(endTime, startTime),
          result,
        }),
      );
    } catch (e) {
      console.error("Could not log request/response: ", e);
    }
    return result;
  },
);

registerGlobalMiddleware({
  middleware: [loggingMiddleware],
});
