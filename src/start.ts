import { createMiddleware, createStart } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { differenceInMilliseconds } from "date-fns";

export const loggingMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next, functionId, data }) => {
    const startTime = Date.now();
    const result = await next();
    const endTime = Date.now();
    const headers = getRequestHeaders();
    try {
      console.info(
        JSON.stringify({
          functionId,
          requestData: data,
          requestIp: headers.get("x-forwarded-for") ?? "unknown",
          requestTimeMilliseconds: differenceInMilliseconds(endTime, startTime),
        }),
      );
    } catch (e) {
      console.error("Could not log request/response: ", e);
    }
    return result;
  },
);

export const startInstance = createStart(() => {
  return {
    functionMiddleware: [loggingMiddleware],
  };
});
