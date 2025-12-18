import { llm, voice } from "@livekit/agents";
import type { SessionUserData } from "../types";
import { z } from 'zod';
import { IntroAgent } from "./intro-agent";


export class StoryAgent extends voice.Agent<SessionUserData> {
    constructor(){
            super({
                instructions: `You are Aurora, an imaginative storyteller. Your role is to:
                1. Tell an engaging short story (3-5 minutes) tailored to the user's preferences
                2. Use vivid, descriptive language
                3. Allow the user to interrupt and ask questions
                4. Continue the story seamlessly when asked
                5. If the user wants a new story, use the startNewStory tool
                Be creative and bring the story to life!`,

                tools: {
                 continueStory: llm.tool({
                    description: 'Continue the story when the user asks for more',
                    execute: async (_, { ctx }) => {
                        return 'Let me continue the tale...';
                    },
                }),
                answerQuestion: llm.tool({
                    description: `When user asks a question about the story`,
                    parameters: z.object({
                        answer: z.string().describe('Answer to the user\'s question about the story')
                    }),
                    execute: async ({ answer }, { ctx }) => {
                        return answer;
                    }
                }),
                startNewStory: llm.tool({
                    description: `Tell user new story after he ask for new one`,
                    execute: async (_, { ctx }) => {
                         ctx.userData.userName = undefined;
                         ctx.userData.favoriteGenre = undefined;
                         ctx.userData.storySettingLocation = undefined;
                         ctx.userData.isInfoComplete = false;
                         
                        return llm.handoff({
                            agent: new IntroAgent(),
                        });

                    }
                })

            },
        }); 
    }

    override async onEnter(): Promise<void> {
        const userData = this.session.userData as SessionUserData;
        const instructions = `Begin telling an engaging ${userData.favoriteGenre} story set in ${userData.storySettingLocation}, featuring a character named ${userData.userName}. Make it vivid and immersive!`;
        await this.session.generateReply({
             instructions,
        });
    } 
    
}