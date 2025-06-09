import {
  createMiddleware,
  registerGlobalMiddleware,
} from "@tanstack/react-start";
import { differenceInMilliseconds } from "date-fns";

const loggingMiddleware = createMiddleware().server(async ({ next }) => {
  const startTime = Date.now();
  const result = await next();
  const endTime = Date.now();
  try {
    console.log(
      JSON.stringify({
        ...result,
        time: differenceInMilliseconds(endTime, startTime),
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
