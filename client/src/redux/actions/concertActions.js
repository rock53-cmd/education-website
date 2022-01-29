export function LOAD_QUESTIONS(payload) {
  return { type: "LOAD_QUESTIONS", payload };
}

export function LOAD_ASSETS(payload) {
  return { type: "LOAD_ASSETS", payload };
}

export function NEXT_WORD() {
  return { type: "NEXT_WORD" };
}

export function RESET_CONCERT() {
  return { type: "RESET_CONCERT" };
}

export function START_ACTIVE_LEARNING() {
  return { type: "START_ACTIVE_LEARNING" };
}

export function START_PASSIVE_LEARNING() {
  return { type: "START_PASSIVE_LEARNING" };
}

export function START_CONCERT() {
  return { type: "START_CONCERT" };
}
