import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCGKW7RspRu84i_20cQp49cuPDIUoPYuy8");

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const result = await model.generateContent("Explain AI simply");

console.log(result.response.text());