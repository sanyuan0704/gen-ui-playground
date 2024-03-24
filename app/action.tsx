import "server-only";
import React from "react";
import { createAI, createStreamableUI, getMutableAIState } from "ai/rsc";
import OpenAI from "openai";
import { BotCard, BotMessage } from "@/components/message";
import { spinner } from "@/components/ui/spinner";

function checkValid(html: string) {
  // Invalid case:
  // 1. ...< 结尾
  // 2. ...</ 结尾
  // 3. ...<! 结尾
  // 4. ...<!-- 结尾
  const regex = /<[^>]*$/;
  return !regex.test(html);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function submitUserMessage(content: string) {
  "use server";

  const aiState = getMutableAIState<typeof AI>();
  aiState.update([
    ...aiState.get(),
    {
      role: "user",
      content,
    },
  ]);

  const reply = createStreamableUI(
    <BotMessage className="items-center">{spinner}</BotMessage>
  );

  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages: [
      {
        role: "system",
        content: `
  You are a frontend expert and you are great at React and Tailwind CSS.
  Faced with every message, you will recieve the data from user and then use the data and choose a appropriate layout to render the ui, finally you just give the html code. Use card design as the container of the ui as much as possible.
  
  The style of ui should be iOS style.

  Don't import any package for the component. And Only use Tailwind CSS for styling.
  Don't add any extra text or comments in the code.

  The image should be adaptive to the width of the container and comfortable with the words, and the image url should be online.

  The ui design principle is to be simple and clear, and near to Material Design. And the preference must be consistent among all the element, such as the theme color and align style.

  The vertical and horizental padding and margin should be reasonable and consistent among all the element, must not be empty because it will make the element looks close to each other and hard to distinguish.

  DON'T INCLUDE ANYTHING ELSE EXCEPT THE HTML CODE!
  DON'T INCLUDE ANYTHING ELSE EXCEPT THE HTML CODE!
  DON'T INCLUDE ANYTHING ELSE EXCEPT THE HTML CODE!
  For example:
  \`\`\`
  <div class="bg-red-500 text-white p-4 rounded-lg">
    Hello, world!
  </div>
  \`\`\`
            `,
      },
      {
        role: "user",
        content,
      },
    ],
  });

  (async () => {
    let finalRes = "";
    for await (const chunk of stream) {
      const result = chunk.choices[0]?.delta.content;
      if (result) {
        finalRes += result;
      }
      if (checkValid(finalRes)) {
        reply.update(
          <BotCard>
            <div
              dangerouslySetInnerHTML={{
                __html: finalRes.replace(/\`\`\`(html|jsx)?/g, ""),
              }}
            ></div>
          </BotCard>
        );
      }
    }
    reply.done();
  })();

  return {
    id: Date.now(),
    display: reply.value,
  };
}

// Define necessary types and create the AI.

const initialAIState: {
  role: "user" | "assistant" | "system" | "function";
  content: string;
  id?: string;
  name?: string;
}[] = [];

const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];

export const AI = createAI({
  actions: {
    submitUserMessage,
  },
  initialUIState,
  initialAIState,
});
