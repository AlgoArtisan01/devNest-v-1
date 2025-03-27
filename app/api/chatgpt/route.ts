// import { NextResponse } from "next/server";

// export const POST = async (request: Request) => {
//   const { question } = await request.json();

//   try {
//     const API_KEY = process.env.GEMINI_API_KEY;
//     const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

//     const response = await fetch(API_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             role: "user",
//             parts: [
//               {
//                 text: `Tell me ${question}`,
//               },
//             ],
//           },
//         ],
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(`API request failed with status ${response.status}`);
//     }

//     const data = await response.json();
//     const reply = data.candidates[0]?.content?.parts[0]?.text || "No response available.";

//     return NextResponse.json({ reply });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// };


// //////////////

import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  let question;
  try {
    const body = await request.json();
    question = body.question;

    // Validate the input
    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Invalid input: 'question' is required and must be a string." },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

    // Add a timeout mechanism (e.g., 180 seconds to avoid Vercel's 10-second timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000); // Abort after 180 seconds

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Tell me ${question}`,
              },
            ],
          },
        ],
      }),
      signal: controller.signal, // Attach the abort signal
    });

    clearTimeout(timeout); // Clear the timeout if the request completes

    if (!response.ok) {
      const errorData = await response.json(); // Parse the error response
      throw new Error(
        `API request failed with status ${response.status}: ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    const reply = data.candidates[0]?.content?.parts[0]?.text || "No response available.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timed out. Please try again with a simpler question." },
        { status: 504 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};