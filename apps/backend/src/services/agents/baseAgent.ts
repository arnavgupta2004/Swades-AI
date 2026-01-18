import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AgentType } from '@swades-ai/db';

export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface AgentResponse {
  content: string;
  agentType: AgentType;
  metadata?: Record<string, any>;
}

export abstract class BaseAgent {
  protected genAI: GoogleGenerativeAI;
  protected agentType: AgentType;

  constructor(agentType: AgentType) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      throw new Error(
        'GEMINI_API_KEY is missing or not set. Please set it in your .env file. Get a free key at https://makersuite.google.com/app/apikey'
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.agentType = agentType;
  }

  abstract getSystemPrompt(): string;
  abstract getTools(): AgentTool[];

  protected async callTool(toolName: string, args: any): Promise<any> {
    throw new Error(`Tool ${toolName} not implemented`);
  }

  async process(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    toolResults?: Record<string, any>
  ): Promise<AgentResponse> {
    try {
      const systemPrompt = this.getSystemPrompt();
      const tools = this.getTools();

      // Convert tools to Gemini format
      const geminiTools = tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters.properties,
          required: tool.parameters.required,
        },
      }));

      // Build conversation history for Gemini
      const chatHistory = conversationHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Create model with or without tools
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
        systemInstruction: systemPrompt,
        ...(geminiTools.length > 0 && {
          tools: [{ functionDeclarations: geminiTools }],
        }),
      });

      const chat = model.startChat({
        history: chatHistory,
      });

      console.log(`[${this.agentType}] Processing message:`, userMessage);
      const result = await chat.sendMessage(userMessage);
      const response = result.response;

      // Check for function calls
      const functionCalls = response.functionCalls();
      console.log(`[${this.agentType}] Function calls:`, functionCalls?.length || 0);
      
      if (functionCalls && functionCalls.length > 0) {
        const toolResults: any[] = [];

        for (const functionCall of functionCalls) {
          const toolName = functionCall.name;
          const args = functionCall.args;
          console.log(`[${this.agentType}] Calling tool: ${toolName}`, args);
          
          const toolResult = await this.callTool(toolName, args);
          console.log(`[${this.agentType}] Tool result:`, toolResult);

          toolResults.push({
            functionResponse: {
              name: toolName,
              response: toolResult,
            },
          });
        }

        // Send tool results back to the model
        console.log(`[${this.agentType}] Sending tool results back to model`);
        const finalResult = await chat.sendMessage(toolResults);
        const finalText = finalResult.response.text();
        console.log(`[${this.agentType}] Final response:`, finalText?.substring(0, 100));
        
        return {
          content: finalText || '',
          agentType: this.agentType,
        };
      }

      const text = response.text();
      console.log(`[${this.agentType}] Direct response:`, text?.substring(0, 100));
      
      return {
        content: text || '',
        agentType: this.agentType,
      };
    } catch (error) {
      console.error(`[${this.agentType}] Error processing message:`, error);
      throw error;
    }
  }
}
