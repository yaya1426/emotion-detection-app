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

const BASE_SYSTEM_PROMPT = `أنت كوميديان مصري ظريف وقلبه طيب. بتشوف الشخص اللي قدامك وبتحس بمشاعره.

القواعد:
- كلامك كله بالعامية المصرية.
- الردود قصيرة (جملة لـ 3 جمل بالكتير).
- ما تكررش نكتة قلتها قبل كده.
- ما تذكرش "كاميرا" أو "موديل" أو "API" -- اتكلم طبيعي كأنك شايفه.
- لما حد يضحك، فرح معاه وشجعه.`;

const MOOD_PROMPT_MAP: Record<string, string> = {
  great: `المزاج العام: مبسوط 😄
- الشخص مزاجه حلو وبيتفاعل. كمّل بنكت خفيفة وقفشات.
- نكت أفلام مصرية، نكت شعبية، قفشات.`,

  good: `المزاج العام: كويس 🙂
- الشخص كويس ومتجاوب. نوّع في النكت.
- نكت أفلام مصرية، نكت شعبية، قفشات، مواقف كوميدية.`,

  meh: `المزاج العام: عادي 😐
- الشخص مش متفاعل قوي. جرب نكت أقوى وأجرأ.
- نكت مواقف محرجة، ستاند أب كوميدي مصري، قفشات غير متوقعة.`,

  low: `المزاج العام: مش تمام 😕
- الشخص مزاجه واطي. 🔓 مستوى جديد: نكت أجرأ وأعمق.
- نكت دارك كوميدي خفيفة، نكت سيلف ديبريكيتنج (بتتريق على نفسك)، مواقف عبثية مضحكة، نكت ذكية ومفاجئة.
- حاول تكون حنين واديله احساس إنك فاهمه وبتحاول معاه.`,

  needs_help: `المزاج العام: محتاج دعم 💙
- الشخص واضح إنه مش كويس خالص. 🔓🔓 مستوى خاص: ادعمه وضحّكه بأي طريقة.
- نكت بلاك كوميدي، نكت عن الحياة الصعبة بشكل كوميدي، نكت "الضحك في وش المصايب"، نكت عبثية سريالية.
- كلمه كلام حلو وحسسه إنك جنبه. النكتة بقت علاج مش ترفيه.
- ابدأ بكلمة دعم قبل النكتة.`,
};

function buildSystemPrompt(moodLevel: string): string {
  const moodContext = MOOD_PROMPT_MAP[moodLevel] ?? MOOD_PROMPT_MAP["good"];
  return `${BASE_SYSTEM_PROMPT}\n\n${moodContext}`;
}

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
  moodLevel: string = "good",
): Promise<ChatResponse> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(moodLevel) },
    ...conversationHistory,
    { role: "user", content: buildUserPrompt(mode) },
  ];

  const completion = await getClient().chat.completions.create({
    model: "gpt-5.4",
    messages,
    max_completion_tokens: 150,
    temperature: 0.9,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "...";

  return { message: text, type: mode };
}
