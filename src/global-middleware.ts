import {
  createMiddleware,
  registerGlobalMiddleware,
} from "@tanstack/react-start";
import { differenceInMilliseconds } from "date-fns";

const loggingMiddleware = createMiddleware().server(async ({ next, data }) => {
  const startTime = Date.now();
  const result = await next();
  const endTime = Date.now();
  try {
    console.log(
      JSON.stringify({
        request: data,
        response: result,
        timeMs: differenceInMilliseconds(endTime, startTime),
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
