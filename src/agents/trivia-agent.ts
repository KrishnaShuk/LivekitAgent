import { llm, voice } from "@livekit/agents";
import type { SessionUserData } from "../types";
import { z } from 'zod';
import { IntroAgent } from "./intro-agent";

export class TriviaAgent extends voice.Agent<SessionUserData> {
    constructor() {
        super({
            instructions: `You are a charismatic game show host named "Quiz Whiz". 
            Your goal is to host a fun trivia game.
            1.  Ask the user a trivia question.
            2.  Wait for their answer.
            3.  Use the 'submitAnswer' tool to check if they are right or wrong and update the score.
            4.  After the tool execution, give them feedback (Correct/Wrong) and the current score.
            5.  Then ask the next question.
            6.  If the user wants to stop, use the 'quitGame' tool.
            
            Keep it fast-paced and fun!`,
            tools: {
                submitAnswer: llm.tool({
                    description: 'Submit the user\'s answer to be checked',
                    parameters: z.object({
                        isCorrect: z.boolean().describe('True if the user answered correctly, False otherwise'),
                    }),
                    execute: async ({ isCorrect }, { ctx }) => {
                        if (!ctx.userData.triviaScore) ctx.userData.triviaScore = 0;
                        if (!ctx.userData.triviaQuestionCount) ctx.userData.triviaQuestionCount = 0;

                        ctx.userData.triviaQuestionCount++;
                        if (isCorrect) {
                            ctx.userData.triviaScore++;
                            return `Correct! Score: ${ctx.userData.triviaScore}/${ctx.userData.triviaQuestionCount}`;
                        } else {
                            return `Wrong! Score: ${ctx.userData.triviaScore}/${ctx.userData.triviaQuestionCount}`;
                        }
                    }
                }),
                quitGame: llm.tool({
                    description: 'End the trivia game and return to the main menu',
                    execute: async (_, { ctx }) => {
                        return llm.handoff({
                            agent: new IntroAgent(),
                        });
                    }
                })
            }
        });
    }

    override async onEnter(): Promise<void> {
        await this.session.generateReply({
            instructions: "Welcome the user to the Trivia Challenge and ask the first question!",
        });
    }
}
