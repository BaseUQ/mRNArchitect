import {
  createMiddleware,
  registerGlobalMiddleware,
} from "@tanstack/react-start";
import { differenceInMilliseconds } from "date-fns";

const loggingMiddleware = createMiddleware().server(async ({ next, data }) => {
  const startTime = Date.now();
  const result = await next();
  const endTime = Date.now();
  console.log({
    ...result,
    time: differenceInMilliseconds(endTime, startTime),
  });
  return result;
});

registerGlobalMiddleware({
  middleware: [loggingMiddleware],
});
