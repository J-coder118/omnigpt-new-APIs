import { ChatWithMessageCountAndSettings, MessageT } from "@/types/collections";
import {
  ChatGPTMessage,
  OpenAIKeyOptional,
  OpenAIKeyRequired,
  OpenAISettings,
  OpenAIStreamPayload,
} from "@/types/openai";
import { encode } from "@nem035/gpt-3-encoder";
import { atom } from "jotai";
import { Database } from "./supabase";

export type ChatT = Database["public"]["Tables"]["chats"]["Row"];

// Chat Input
export const inputAtom = atom<string>("");
// Current Prices of GPT Models per 1000 tokens
const modelPrices = {
  "gpt-3.5-turbo": 0.002 / 1000,
  "gpt-4": 0.03 / 1000,
};
export const currentChatAtom = atom<null | ChatWithMessageCountAndSettings>(
  null
);
// Where we keep all the messages
export const messagesAtom = atom<MessageT[]>([]);
// Token Calculations
export const tokenCountAtom = atom((get) => {
  const currentModel = get(currentChatAtom)?.model ?? "gpt-3.5-turbo";
  const currentMessage = get(inputAtom);

  const currentMessageToken = encode(currentMessage).length;
  const currentMessagePrice =
    currentMessageToken * modelPrices[currentModel] + "$";
  const currentChatToken =
    get(messagesAtom).reduce((curr, arr) => {
      return curr + encode(arr.content as string).length;
    }, 0) + currentMessageToken;
  const currentChatPrice = currentChatToken * modelPrices[currentModel] + "$";

  return {
    currentMessageToken,
    currentMessagePrice,
    currentChatToken,
    currentChatPrice,
  };
});
const previousContextAtom = ""

export const tokenSizeLimitAtom = atom((get) => {
  const limit = 4000; // TODO: Change this based on the model.
  const responseLimit =
    get(currentChatAtom)?.advanced_settings?.max_tokens ?? 1000;
  const systemPropmtTokenSize =
    encode(get(currentChatAtom)?.system_prompt ?? "").length + 90; // 90 is for static text we provided for the sake of this app.
  const buffer = 250; // Buffer TODO: Find a proper solution
  // Calculate the context token size
  const contextTokenSize = encode(
    JSON.stringify(get(previousContextAtom))
  ).length;
  const total =
    limit - systemPropmtTokenSize - buffer - responseLimit - contextTokenSize;

  return {
    remainingToken: total - get(tokenCountAtom).currentChatToken,
    remainingTokenForCurerntChat: total,
    isBeyondLimit: total <= get(tokenCountAtom).currentChatToken,
  };
});

// Check If Token Size is Exceeded
const tokenSizeLimitExceeded = atom((get) => get(tokenSizeLimitAtom).isBeyondLimit)

if (tokenSizeLimitExceeded) {
    // We can invoke our API.
    // response from searchHistoryAPI
    // response from updateChatEmbedings
    
}
