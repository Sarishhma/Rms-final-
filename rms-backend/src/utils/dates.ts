export const startOfDay = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const DEFAULT_BUSINESS_TIME_ZONE = "Asia/Kathmandu";
const DEFAULT_STOCK_RESET_HOUR = 4;

const zonedDateParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit"
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour") % 24
  };
};

export const businessDateFor = (
  date = new Date(),
  resetHour = DEFAULT_STOCK_RESET_HOUR,
  timeZone = DEFAULT_BUSINESS_TIME_ZONE
) => {
  const parts = zonedDateParts(date, timeZone);
  const businessDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

  if (parts.hour < resetHour) {
    businessDate.setUTCDate(businessDate.getUTCDate() - 1);
  }

  return businessDate;
};

export const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};
