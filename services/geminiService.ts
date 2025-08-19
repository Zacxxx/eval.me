import { GoogleGenAI, Type } from "@google/genai";
import { MCQTrial, TextResponseTrial, CodingExerciseTrial, DeliverableTrial } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const suggestMCQTrial = async (jobTitle: string, existingQuestions: string[]): Promise<Partial<MCQTrial> | null> => {
  if (!process.env.API_KEY) {
    // Simulate a delay and return a mock question if API key is not present
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        questionText: `What is a key skill for a ${jobTitle}?`,
        options: ["Communication", "Problem Solving", "Teamwork", "All of the above"],
        correctAnswerIndex: 3,
    };
  }
    
  try {
    const prompt = `Based on the job title "${jobTitle}", generate a single, relevant multiple-choice question to assess a candidate's basic knowledge.
    Avoid questions that are too generic or too specific to a single company's technology stack unless the title is very specific.
    Do not repeat questions on these topics: ${existingQuestions.join(', ')}.
    Provide 4 distinct options. Designate the correct answer.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questionText: {
              type: Type.STRING,
              description: "The text of the multiple-choice question."
            },
            options: {
              type: Type.ARRAY,
              description: "An array of 4 string options for the question.",
              items: { type: Type.STRING }
            },
            correctAnswerIndex: {
              type: Type.INTEGER,
              description: "The 0-based index of the correct answer in the 'options' array."
            }
          },
          required: ["questionText", "options", "correctAnswerIndex"]
        }
      }
    });

    const jsonString = response.text;
    const suggestedQuestion = JSON.parse(jsonString) as Partial<MCQTrial>;
    
    if (suggestedQuestion.options?.length !== 4) {
        console.error("AI did not return 4 options.");
        return null;
    }
    
    return suggestedQuestion;

  } catch (error) {
    console.error("Error suggesting MCQ:", error);
    return null;
  }
};

export const suggestTextTrial = async (jobTitle: string, existingPrompts: string[]): Promise<Partial<TextResponseTrial> | null> => {
    if (!process.env.API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
          prompt: `Describe a challenging situation you faced as a ${jobTitle} and how you resolved it.`,
      };
    }
      
    try {
      const prompt = `Based on the job title "${jobTitle}", generate a single, insightful, open-ended question or prompt for a text response. This should assess a candidate's experience, problem-solving skills, or understanding of the role.
      Do not repeat prompts on these topics: ${existingPrompts.join(', ')}.`;
  
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompt: {
                type: Type.STRING,
                description: "The text of the open-ended question or prompt."
              },
            },
            required: ["prompt"]
          }
        }
      });
  
      const jsonString = response.text;
      return JSON.parse(jsonString) as Partial<TextResponseTrial>;
  
    } catch (error) {
      console.error("Error suggesting Text Trial:", error);
      return null;
    }
  };

  export const suggestCodingTrial = async (jobTitle: string, existingPrompts: string[]): Promise<Partial<CodingExerciseTrial> | null> => {
    if (!process.env.API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
          prompt: `Write a function in any language to reverse a string.`,
      };
    }
      
    try {
      const prompt = `Based on the job title "${jobTitle}", generate a prompt for a short, practical coding exercise. It should be solvable in a text editor and assess a fundamental skill for the role.
      Do not repeat prompts on these topics: ${existingPrompts.join(', ')}.`;
  
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompt: {
                type: Type.STRING,
                description: "The prompt for the coding exercise."
              },
            },
            required: ["prompt"]
          }
        }
      });
  
      const jsonString = response.text;
      return JSON.parse(jsonString) as Partial<CodingExerciseTrial>;
  
    } catch (error) {
      console.error("Error suggesting Coding Trial:", error);
      return null;
    }
  };

  export const suggestDeliverableTrial = async (jobTitle: string, existingPrompts: string[]): Promise<Partial<DeliverableTrial> | null> => {
    if (!process.env.API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
          prompt: `Create a one-page PDF document outlining a 30-60-90 day plan for a new ${jobTitle}.`,
      };
    }
      
    try {
      const prompt = `Based on the job title "${jobTitle}", generate a prompt for a task where a candidate needs to create and upload a deliverable (e.g., a document, a design, a plan). The task should be something a candidate can reasonably complete and demonstrate their skills.
      Do not repeat prompts on these topics: ${existingPrompts.join(', ')}.`;
  
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompt: {
                type: Type.STRING,
                description: "The prompt for the deliverable task."
              },
            },
            required: ["prompt"]
          }
        }
      });
  
      const jsonString = response.text;
      return JSON.parse(jsonString) as Partial<DeliverableTrial>;
  
    } catch (error) {
      console.error("Error suggesting Deliverable Trial:", error);
      return null;
    }
  };