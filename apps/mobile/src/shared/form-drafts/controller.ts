import { createFormDraftSession } from "./session";
import { createDraftStorage } from "./storage";

export const createFormDrafts = createFormDraftSession(createDraftStorage);
export const clearCreateFormDrafts = () => createFormDrafts.clear();
