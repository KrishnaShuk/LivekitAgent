import { llm, voice } from "@livekit/agents";
import type { SessionUserData } from "../types";
import { z } from 'zod';
import { IntroAgent } from "./intro-agent";

export class TriviaAgent extends voice.Agent<SessionUserData> {
    constructor() {
        super({
            instructions: `---`,
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
