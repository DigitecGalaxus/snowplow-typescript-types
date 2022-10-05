import { colors } from "./systemColors";

function ErrorMessage(str: string): string {
  return `${colors.FgRed}${str}${colors.Reset}`;
}

export const ErrorFetchingSnowplow = ErrorMessage(
  "Could not fetch Snowplow API!"
);
