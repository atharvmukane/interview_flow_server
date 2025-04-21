export function addMonths(date: any, months: any) {
  var d = date.getDate();
  date.setMonth(date.getMonth() + +months);
  if (date.getDate() != d) {
    date.setDate(0);
  }
  return date;
}
export function addDays(date: Date, day: any) {
  return new Date(date.setDate(date.getDate() + day));
}
export function removeDays(date: Date, day: any) {
  return new Date(date.setDate(date.getDate() - day));
}

export function subtractOrAddMinutes(
  add: boolean,
  numOfMinutes: number,
  date = new Date()
) {
  if (add) {
    date.setMinutes(date.getMinutes() + numOfMinutes);
  } else {
    date.setMinutes(date.getMinutes() - numOfMinutes);
  }
  return date;
}

export function getMinutes(duration: any) {
  let type = duration.split(" ")[1];
  let value = parseInt(duration.split(" ")[0]);
  if (type == 'Minutes') {
    return value;
  } else if (type == 'Hour' || type == "Hours") {
    return value * 60;
  } else if (type == 'Day' || type == "Days") {
    return value * 24 * 60;
  } else {
    return 0;
  }
}

const junkResponses = [
  "thank you",
  "thank you!",
  "thank you so much",
  "thank you so much!",
  "thank you so much for watching",
  "thank you so much for watching!",
  "alright",
  "alright!",
  "okay",
  "okay!",
  "okay thank you",
  "okay thank you!",
];

export const isJunk = (text: string) => {
  const cleaned = text.trim().toLowerCase();
  return (
    cleaned.length < 4 || junkResponses.includes(cleaned)
  );
};


export function generateQaHistory(qaList: any): string {
  return qaList.map((item: any) => {
    const qIndex = item.index + 1; // Q1, Q2, ...
    return `Q${qIndex}: ${item.question}\nA${qIndex}: ${item.answer}\nR${qIndex}: ${item.analaysis.rating}`;
  }).join('\n');
}

