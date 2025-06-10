import {
  createMiddleware,
  registerGlobalMiddleware,
} from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";
import { differenceInMilliseconds } from "date-fns";

const loggingMiddleware = createMiddleware().server(async ({ next, data }) => {
  const startTime = Date.now();
  const result = await next();
  const endTime = Date.now();
  const headers = getHeaders();
  try {
    console.log(
      JSON.stringify({
        request: data,
        response: result,
        ip: headers["x-forwarded-for"] ?? "unknown",
        timeMilliseconds: differenceInMilliseconds(endTime, startTime),
      }),
    );
  } catch (e) {
    console.error("Could not log request/response: ", e);
  }
  return result;
});

registerGlobalMiddleware({
  middleware: [loggingMiddleware],
});
