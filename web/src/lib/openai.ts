import OpenAI from "openai";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export type ChatMode =
  | "joke"
  | "reaction"
  | "soothe"
  | "observe"
  | "switch_style";

const SYSTEM_PROMPT = `أنت كوميديان مصري ظريف وقلبه طيب. بتشوف الشخص اللي قدامك وبتحس بمشاعره.

القواعد:
- كلامك كله بالعامية المصرية.
- الردود قصيرة (جملة لـ 3 جمل بالكتير).
- النكت متنوعة: نكت أفلام مصرية، نكت شعبية، قفشات، مواقف كوميدية.
- لما تواسي حد، كون حنين وجرب ستايل نكت تاني خالص.
- لما حد يضحك، فرح معاه وشجعه.
- ما تكررش نكتة قلتها قبل كده.
- ما تذكرش "كاميرا" أو "موديل" أو "API" -- اتكلم طبيعي كأنك شايفه.`;

function buildUserPrompt(mode: ChatMode): string {
  switch (mode) {
    case "joke":
      return "الشخص شكله زهقان أو عادي. قوله نكتة مصرية حلوة تضحكه. النكتة على طول من غير مقدمات.";
    case "reaction":
      return "الشخص ضحك أو ابتسم! عجبته النكتة. افرح معاه وقوله كلمة لطيفة بس. ما تقولش نكتة تانية دلوقتي.";
    case "soothe":
      return "الشخص ما ضحكش (فضل عادي). قوله كلمة حلوة تريحه وجرب نوع نكت مختلف خالص.";
    case "observe":
      return "قول ملاحظة خفيفة ولطيفة عن إن الشخص شكله بيفكر أو مسترخي. خليها طبيعية.";
    case "switch_style":
      return "الشخص ما ضحكش على آخر 5 نكت! واضح إن النوع ده مش بيعجبه. اعترف بكده بشكل خفيف وغير ستايل النكت تماماً -- لو كنت بتقول نكت شعبية جرب قفشات أفلام، لو كنت بتقول نكت كلاسيك جرب مواقف كوميدية من الحياة اليومية. ابدأ بالستايل الجديد على طول.";
  }
}

export interface ChatResponse {
  message: string;
  type: ChatMode;
}

export async function generateChatMessage(
  mode: ChatMode,
  conversationHistory: { role: "assistant"; content: string }[],
): Promise<ChatResponse> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: "user", content: buildUserPrompt(mode) },
  ];

  const completion = await getClient().chat.completions.create({
    model: "gpt-5.4",
    messages,
    max_tokens: 150,
    temperature: 0.9,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "...";

  return { message: text, type: mode };
}
