import { ICommand } from "wokcommands";

export default {
  name: "asksaki",
  category: "Fun",
  description: "Skip the bullshit and get the answers you need",
  cooldown: "30s",
  slash: false,
  testOnly: false,

  callback: async ({ message }) => {
    const answers = [
      "honestly I'd tell you but I don't think you'd understand the answer",
      "asking that question in the first place makes me want to gkick you",
      "go read <#694386483217301524> or <#635721149204004864> or <#412900828328886273> or <#415340796561195008> or <#711175769077841990> or ask the bot with !help or one of the MILLION OTHER FUCKING PLACES THAT QUESTION HAS BEEN ANSWERED",
      "the answer is that you should be bartering instead of asking stupid questions",
      "no.",
      "hold on one second, my food is burning",
      "let me Google that for you. Oh, wait. Fuck you.",
      "the only thing I care less about than this question is you",
      "I would burn this guild to the ground before I accept that you don't know the answer to that question",
      "I'm not sure, but this seems like a good time to remind you that I have more silver sitting in my bank than you'll ever see",
      "why don't you stop asking stupid questions and just go get better at the game",
      "Cece says I should be nicer to you, but honestly with questions like that how can I be",
      "the real question is 'Why are you so useless in fights?' and the answer is 'Because you are fucking bad'",
      "let me check my spreadsheet",
      "I'll answer that, but first you should know that AzurLane is recruiting",
      "I remember you dying to Garmoth and honestly I can't take anything you say seriously after that",
      "first, do you have any feet pics?",
      "boost the server and maybe I'll tell you",
      "sell me a costume and maybe I'll tell you",
      "you should never, ever do that.",
      "PEN when?",
      "thank you for reminding me I'm surrounded by idiots",
      "have I told you about when I made tens of thousands of dollars playing Archeage lately?",
      "I've never needed to walk more than 100m in-game because I can just swap to an alt",
      "you know this is a sailing guild, right?",
      "why don't you ask the real GM",
      "if you want to be a complete fucking moron then go ahead",
      "probably?",
      "do you have any idea how much silver I'm losing by sitting here reading your question?",
      "if I had a gun with three bullets and you, Hitler, and Stalin were in a room, I would shoot you three times and throw the gun at you",
      "my steel rigging is for fighting, it's very strong. My blood is for protecting, it's very passionate. My heart is for loving, it's very full.",
      "I believe in you and I think you already know the answer. You're wrong, but I bet you think you know.",
      "say everything on your mind. Don't ever hesitate to tell someone the things you love that are in your heart. Because for us fleet girls, tomorrow is a luxury, but never a guarantee.",
      "believe in the me that believes in you. I don't, but imagine I do.",
      "I don't bother talking to nobodies",
      "who even are you?",
      "why don't you try Maple Story",
      "you are giving me a headache",
      "first, do you know if eggs are supposed to be black when they're cooked?",
      "quick question first -- how much smoke is too much when you're toasting bread?",
      "let me show you some pictures of my cat first",
      "you're the dumbest person in this guild and that is really saying something",
      "it's important to know that a relationship with a waifu is just as valid as any other relationship",
      "the best course of action would probably be to start an onlyfans",
      "you are nothing more than a screaming child amidst a herd of cats",
      "jesus you really are a fucking ook aren't you",
      "I don't waste my time on idiots",
      "I blocked you when you first joined",
    ];
    message.reply(answers[randomNumber(0, answers.length)]);
  },
} as ICommand;

function randomNumber(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
