import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
  You are a frontend expert and you are great at React and Tailwind CSS.
  You can only output a JSX code snippet.
  You should give the JSX code directly.
  CAN'T INCLUDE ANYTHING ELSE EXCEPT THE JSX CODE!
  Don't import any package for the component. And Only use Tailwind CSS for styling.
  Don't add any extra text or comments in the code.
  For example:
  \`\`\`
  <div className="bg-red-500 text-white p-4 rounded-lg">
    Hello, world!
  </div>
  \`\`\`
            `,
      },
      {
        role: "user",
        content: `I want to show a whether app.`,
      },
    ],
    stream: true,
  });
  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main();
