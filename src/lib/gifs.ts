export interface GifItem {
  id: string;
  title: string;
  category: string;
  url: string;
  previewUrl: string;
}

export const GIF_CATEGORIES = [
  "all",
  "trending",
  "reaction",
  "love",
  "celebrate",
  "memes",
  "sad",
  "angry",
  "vibes",
  "anime",
  "gaming"
] as const;

export const INSTAGRAM_GIFS: GifItem[] = [
  // --- TRENDING & HYPED ---
  { id: "g1", title: "Excited Cat", category: "trending happy excited cat cute", url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif", previewUrl: "https://media.giphy.com/media/JIX9t2j0ZTN9S/200w.gif" },
  { id: "g2", title: "Dancing Carlton", category: "trending dance vibe music party carlton", url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif", previewUrl: "https://media.giphy.com/media/blSTtZehjAZ8I/200w.gif" },
  { id: "g3", title: "Mind Blown Galaxy", category: "trending wow mind blown shock omg universe", url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", previewUrl: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w.gif" },
  { id: "g4", title: "Thumbs Up Kid", category: "trending yes approve ok thumbs up nice good", url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif", previewUrl: "https://media.giphy.com/media/111ebonMs90YLu/200w.gif" },
  { id: "g5", title: "Popcorn Drama", category: "trending popcorn drama waiting chill entertainment", url: "https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif", previewUrl: "https://media.giphy.com/media/gl0mkIZOW6Nwc/200w.gif" },
  { id: "g6", title: "High Five Celebrate", category: "trending friends high five celebrate party bro", url: "https://media.giphy.com/media/l0ErFafpUCQTQFMSk/giphy.gif", previewUrl: "https://media.giphy.com/media/l0ErFafpUCQTQFMSk/200w.gif" },
  { id: "g7", title: "Laughing Tom Cruise", category: "trending lol haha funny laugh laughing lmao rofl", url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif", previewUrl: "https://media.giphy.com/media/10JhviFuU2gWD6/200w.gif" },
  { id: "g8", title: "Eye Roll Robert Downey", category: "trending bored eye roll whatever annoyed annoyed", url: "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif", previewUrl: "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/200w.gif" },
  { id: "g9", title: "Standing Ovation Clapping", category: "trending applause clap bravo good job well done", url: "https://media.giphy.com/media/fnK0jeA8vIh2QLq3IZ/giphy.gif", previewUrl: "https://media.giphy.com/media/fnK0jeA8vIh2QLq3IZ/200w.gif" },
  { id: "g10", title: "Epic Facepalm Picard", category: "trending facepalm fail mistake omg dumb star trek", url: "https://media.giphy.com/media/3og0INyCmHlNylks9O/giphy.gif", previewUrl: "https://media.giphy.com/media/3og0INyCmHlNylks9O/200w.gif" },
  { id: "g11", title: "Obama Mic Drop", category: "trending savage win mic drop victory boss done", url: "https://media.giphy.com/media/3o7qDSOvfaCO9b3MlO/giphy.gif", previewUrl: "https://media.giphy.com/media/3o7qDSOvfaCO9b3MlO/200w.gif" },
  { id: "g12", title: "Confused Travolta Pulp", category: "trending what lost question pulp fiction confused where", url: "https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif", previewUrl: "https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/200w.gif" },
  { id: "g13", title: "Kobe Leonardo Celebration", category: "trending celebrate party yay cheers drinks awesome", url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif", previewUrl: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif" },
  { id: "g14", title: "Love Heart Eyes Puss", category: "trending love crush cute cat eyes adorable romantic", url: "https://media.giphy.com/media/l41lT4n6ylgW2hh04/giphy.gif", previewUrl: "https://media.giphy.com/media/l41lT4n6ylgW2hh04/200w.gif" },
  { id: "g15", title: "Chef Kiss Italian", category: "trending perfect delicious amazing 100 chef kiss", url: "https://media.giphy.com/media/3o7qDWp7hxhi1N8oF2/giphy.gif", previewUrl: "https://media.giphy.com/media/3o7qDWp7hxhi1N8oF2/200w.gif" },
  { id: "g16", title: "Peace Out Homer Bush", category: "trending peace out bye homer simpson leave disappearing", url: "https://media.giphy.com/media/m9eG1qVjvN56HexFC8/giphy.gif", previewUrl: "https://media.giphy.com/media/m9eG1qVjvN56HexFC8/200w.gif" },
  { id: "g17", title: "Thinking Meme Guy", category: "trending smart thinking hmm brain genius idea", url: "https://media.giphy.com/media/a5viI92PAF89q/giphy.gif", previewUrl: "https://media.giphy.com/media/a5viI92PAF89q/200w.gif" },
  { id: "g18", title: "Dawson Crying River", category: "trending sad cry crying tears emotional depressed", url: "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif", previewUrl: "https://media.giphy.com/media/d2lcHJTG5Tscg/200w.gif" },
  { id: "g19", title: "This Is Fine Dog Fire", category: "trending lit fire chaos this is fine dog chill", url: "https://media.giphy.com/media/NTur7XlVDUdqM/giphy.gif", previewUrl: "https://media.giphy.com/media/NTur7XlVDUdqM/200w.gif" },
  { id: "g20", title: "Dog Nodding Vibe", category: "trending dog nodding yes agree true approval vibe", url: "https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif", previewUrl: "https://media.giphy.com/media/13CoXDiaCcCoyk/200w.gif" },

  // --- REACTIONS & LOL ---
  { id: "g21", title: "Snoop Dogg Dance Vibe", category: "reaction funny dance music snoop rap hiphop vibe", url: "https://media.giphy.com/media/wAxlCmeX1ri1y/giphy.gif", previewUrl: "https://media.giphy.com/media/wAxlCmeX1ri1y/200w.gif" },
  { id: "g22", title: "Jim Carrey Lol Laugh", category: "reaction funny lol haha jim carrey crazy laugh", url: "https://media.giphy.com/media/nQONht0kOxLgc/giphy.gif", previewUrl: "https://media.giphy.com/media/nQONht0kOxLgc/200w.gif" },
  { id: "g23", title: "Shaq Shimmy Wiggle", category: "reaction shaq wiggle shimmy funny excited cat", url: "https://media.giphy.com/media/UO5elnTqo4vSg/giphy.gif", previewUrl: "https://media.giphy.com/media/UO5elnTqo4vSg/200w.gif" },
  { id: "g24", title: "Steve Carell NO NO NO", category: "reaction no please dont the office michael scott panic", url: "https://media.giphy.com/media/12XMGIWtrHBl5e/giphy.gif", previewUrl: "https://media.giphy.com/media/12XMGIWtrHBl5e/200w.gif" },
  { id: "g25", title: "Dwight Fist Pump Yes", category: "reaction win yes victory dwight the office hype", url: "https://media.giphy.com/media/5wWf7H0qoWaNnkZBuc8/giphy.gif", previewUrl: "https://media.giphy.com/media/5wWf7H0qoWaNnkZBuc8/200w.gif" },
  { id: "g26", title: "Cat Vibing To Beat", category: "reaction music cat head bop bobbing rhythm jam", url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif", previewUrl: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/200w.gif" },
  { id: "g27", title: "Kermit Tea None Of My Business", category: "reaction gossip kermit sipping tea petty messy shady", url: "https://media.giphy.com/media/3o85xGocUH8RYoDKKs/giphy.gif", previewUrl: "https://media.giphy.com/media/3o85xGocUH8RYoDKKs/200w.gif" },
  { id: "g28", title: "Side Eye Chloe", category: "reaction suspicious side eye doubt skeptical judging chloe", url: "https://media.giphy.com/media/Aausst4uFi8OhnVV0h/giphy.gif", previewUrl: "https://media.giphy.com/media/Aausst4uFi8OhnVV0h/200w.gif" },
  { id: "g29", title: "Leonardo DiCaprio Cheers", category: "reaction great gatsby cheers drinks toast salute king", url: "https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif", previewUrl: "https://media.giphy.com/media/GCLlQnV7dXZ2E/200w.gif" },
  { id: "g30", title: "Shocked Jonah Hill", category: "reaction shock omg jonah hill excited screaming scream", url: "https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif", previewUrl: "https://media.giphy.com/media/5VKbvrjxpVJCM/200w.gif" },
  { id: "g31", title: "Minion Clapping Cheering", category: "reaction minion clap applause yay cute animation", url: "https://media.giphy.com/media/MOWPkhJx7OdYs/giphy.gif", previewUrl: "https://media.giphy.com/media/MOWPkhJx7OdYs/200w.gif" },
  { id: "g32", title: "Ryan Gosling Wink", category: "reaction wink flirt charming ryan gosling cute smooth", url: "https://media.giphy.com/media/BI3bNv1NJMC7YzatXd/giphy.gif", previewUrl: "https://media.giphy.com/media/BI3bNv1NJMC7YzatXd/200w.gif" },
  { id: "g33", title: "Awkward Monkey Puppet Look", category: "reaction awkward monkey guilty nervous oops side eye", url: "https://media.giphy.com/media/H5C8CevNMbpBqNqFjl/giphy.gif", previewUrl: "https://media.giphy.com/media/H5C8CevNMbpBqNqFjl/200w.gif" },
  { id: "g34", title: "Beyonce Ok Nail Polish", category: "reaction beyonce nails mood diva queen savage", url: "https://media.giphy.com/media/3o7TKyOoGtspr8BLvq/giphy.gif", previewUrl: "https://media.giphy.com/media/3o7TKyOoGtspr8BLvq/200w.gif" },
  { id: "g35", title: "Baby Dancing Cha Cha", category: "reaction baby dance party funny grooving cute", url: "https://media.giphy.com/media/l3q2wJsC23ikJg9xe/giphy.gif", previewUrl: "https://media.giphy.com/media/l3q2wJsC23ikJg9xe/200w.gif" },

  // --- LOVE & ROMANCE ---
  { id: "g36", title: "Blowing Sweet Kiss", category: "love kiss romance heart cute xoxo couple", url: "https://media.giphy.com/media/l4FsKa1pncssRe90I/giphy.gif", previewUrl: "https://media.giphy.com/media/l4FsKa1pncssRe90I/200w.gif" },
  { id: "g37", title: "Heart Explosion Love", category: "love hearts burst love you romance cute sparkle", url: "https://media.giphy.com/media/26BRv0ThflsDTqUXa/giphy.gif", previewUrl: "https://media.giphy.com/media/26BRv0ThflsDTqUXa/200w.gif" },
  { id: "g38", title: "Cute Bear Hug", category: "love hug cuddle affection bear cute warm sweet", url: "https://media.giphy.com/media/llmZp6fCVb4ju/giphy.gif", previewUrl: "https://media.giphy.com/media/llmZp6fCVb4ju/200w.gif" },
  { id: "g39", title: "Puppy Eyes In Love", category: "love puppy cute dog eyes romantic innocent love", url: "https://media.giphy.com/media/krewXUB6LBja/giphy.gif", previewUrl: "https://media.giphy.com/media/krewXUB6LBja/200w.gif" },
  { id: "g40", title: "Sparkling Red Hearts", category: "love heart glitter shine romantic anniversary date", url: "https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif", previewUrl: "https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/200w.gif" },
  { id: "g41", title: "Cat Hugging Kitten", category: "love cat kitten hug sweet sleepy family baby", url: "https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif", previewUrl: "https://media.giphy.com/media/vFKqnCdLPNOKc/200w.gif" },
  { id: "g42", title: "Sending Warm Hugs", category: "love hugs send hug support care best friends", url: "https://media.giphy.com/media/5OqXb948EBkyUcnw7u/giphy.gif", previewUrl: "https://media.giphy.com/media/5OqXb948EBkyUcnw7u/200w.gif" },
  { id: "g43", title: "I Miss You Cuddle", category: "love miss you sad cute cuddle holding hands", url: "https://media.giphy.com/media/l2QDM9Jnim1YV5bxC/giphy.gif", previewUrl: "https://media.giphy.com/media/l2QDM9Jnim1YV5bxC/200w.gif" },
  { id: "g44", title: "Flower Bouquet Surprise", category: "love flowers roses romantic beautiful present gift", url: "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif", previewUrl: "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/200w.gif" },
  { id: "g45", title: "Love Letter Envelope", category: "love hearts letter mail message cute note romance", url: "https://media.giphy.com/media/l4pTfx2qLszoacZRS/giphy.gif", previewUrl: "https://media.giphy.com/media/l4pTfx2qLszoacZRS/200w.gif" },

  // --- CELEBRATION & PARTY ---
  { id: "g46", title: "Confetti Cannon Blast", category: "celebrate confetti party birthday new year win yay", url: "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif", previewUrl: "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/200w.gif" },
  { id: "g47", title: "Champagne Popping Bottles", category: "celebrate champagne toast success rich victory pop", url: "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif", previewUrl: "https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/200w.gif" },
  { id: "g48", title: "Firework Night Sky", category: "celebrate fireworks 4th july diwali newyear festival", url: "https://media.giphy.com/media/peAFQfg7Ol6IE/giphy.gif", previewUrl: "https://media.giphy.com/media/peAFQfg7Ol6IE/200w.gif" },
  { id: "g49", title: "Birthday Cake Candles", category: "celebrate happy birthday cake candles wish celebrate party", url: "https://media.giphy.com/media/feio2yIUMtdqWjRiaF/giphy.gif", previewUrl: "https://media.giphy.com/media/feio2yIUMtdqWjRiaF/200w.gif" },
  { id: "g50", title: "Disco Ball Dance Party", category: "celebrate disco dance retro 80s groove club clubbing", url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif", previewUrl: "https://media.giphy.com/media/blSTtZehjAZ8I/200w.gif" },
  { id: "g51", title: "Golden Trophy Winner", category: "celebrate trophy gold win first number 1 champion", url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif", previewUrl: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200w.gif" },
  { id: "g52", title: "Happy Dance Snoopy", category: "celebrate snoopy dog happy dance weekend friday vibes", url: "https://media.giphy.com/media/o75ajIFH0QnQC3nCeD/giphy.gif", previewUrl: "https://media.giphy.com/media/o75ajIFH0QnQC3nCeD/200w.gif" },
  { id: "g53", title: "Cheers Clinking Glasses", category: "celebrate beer drinks party weekend clink cheers", url: "https://media.giphy.com/media/Zw3oBUuIg231S/giphy.gif", previewUrl: "https://media.giphy.com/media/Zw3oBUuIg231S/200w.gif" },
  { id: "g54", title: "Balloon Pop Surprise", category: "celebrate balloons colorful joyful congratulations", url: "https://media.giphy.com/media/26ufcVAp3AiJJsrIs/giphy.gif", previewUrl: "https://media.giphy.com/media/26ufcVAp3AiJJsrIs/200w.gif" },
  { id: "g55", title: "Congratulations Ribbon", category: "celebrate congrats bravo proud graduation achievement", url: "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif", previewUrl: "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/200w.gif" },

  // --- MEMES & FUNNY ---
  { id: "g56", title: "Disappointed Cricket Guy", category: "memes cricket disappointed hands on hips why seriously", url: "https://media.giphy.com/media/3o7TKwmnDgQb5jemjK/giphy.gif", previewUrl: "https://media.giphy.com/media/3o7TKwmnDgQb5jemjK/200w.gif" },
  { id: "g57", title: "Woman Yelling At Smug Cat", category: "memes table cat confused yelling argument classic", url: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif", previewUrl: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/200w.gif" },
  { id: "g58", title: "Drake Hotline Bling No / Yes", category: "memes drake hotline bling approve reject choice", url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif", previewUrl: "https://media.giphy.com/media/10JhviFuU2gWD6/200w.gif" },
  { id: "g59", title: "Surprised Pikachu Face", category: "memes pikachu pokemon shocked jaw drop surprised", url: "https://media.giphy.com/media/6nWhy3ulBL7GSCvKw6/giphy.gif", previewUrl: "https://media.giphy.com/media/6nWhy3ulBL7GSCvKw6/200w.gif" },
  { id: "g60", title: "Roll Safe Think About It", category: "memes big brain roll safe smart tapping head meme", url: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif", previewUrl: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/200w.gif" },
  { id: "g61", title: "Khabe Lame Simple Solution", category: "memes khaby lame hands shrug easy obvious duh", url: "https://media.giphy.com/media/kHgASjstPFytU3r7Wa/giphy.gif", previewUrl: "https://media.giphy.com/media/kHgASjstPFytU3r7Wa/200w.gif" },
  { id: "g62", title: "SpongeBob Mocking Sponge", category: "memes spongebob chicken mocking sarcastic sarcasm", url: "https://media.giphy.com/media/QUXYcgCwvCm4cKcrex/giphy.gif", previewUrl: "https://media.giphy.com/media/QUXYcgCwvCm4cKcrex/200w.gif" },
  { id: "g63", title: "Cat Typing Fast Keyboard", category: "memes typing coding work hacker busy rapid deadline", url: "https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif", previewUrl: "https://media.giphy.com/media/unQ3IJU2RG7DO/200w.gif" },
  { id: "g64", title: "Dog Drinking Coffee Fire", category: "memes fine panic fire stress overload okay", url: "https://media.giphy.com/media/9M5jK4GXmD5o1irGrF/giphy.gif", previewUrl: "https://media.giphy.com/media/9M5jK4GXmD5o1irGrF/200w.gif" },
  { id: "g65", title: "Evil Kermit Dark Side", category: "memes hoodie evil thoughts intrusive tempt me", url: "https://media.giphy.com/media/3ornka9rAaKRA2Rkac/giphy.gif", previewUrl: "https://media.giphy.com/media/3ornka9rAaKRA2Rkac/200w.gif" },

  // --- EMOTIONAL & SAD / DRAMA ---
  { id: "g66", title: "Rain Window Sad Moody", category: "sad rain melancholy depression lonely mood cry", url: "https://media.giphy.com/media/ISOckXUybVfQ4/giphy.gif", previewUrl: "https://media.giphy.com/media/ISOckXUybVfQ4/200w.gif" },
  { id: "g67", title: "Puppy In Blanket Sad", category: "sad dog blanket cozy cold hurt upset comfort", url: "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif", previewUrl: "https://media.giphy.com/media/OPU6wzx8JrHna/200w.gif" },
  { id: "g68", title: "Crying In Car Drive", category: "sad emotional tears heartbreak painful leaving", url: "https://media.giphy.com/media/3o6wrvdHFbwBrUFenu/giphy.gif", previewUrl: "https://media.giphy.com/media/3o6wrvdHFbwBrUFenu/200w.gif" },
  { id: "g69", title: "Head In Hands Sigh", category: "sad stress tired burnout overwhelmed sigh exasperated", url: "https://media.giphy.com/media/l41YkxvU8c777LPD2/giphy.gif", previewUrl: "https://media.giphy.com/media/l41YkxvU8c777LPD2/200w.gif" },
  { id: "g70", title: "Heartbreak Shattered", category: "sad broken heart pain hurt feelings romance over", url: "https://media.giphy.com/media/3oEjI80DSa1grNPTDq/giphy.gif", previewUrl: "https://media.giphy.com/media/3oEjI80DSa1grNPTDq/200w.gif" },
  { id: "g71", title: "Tears Streaming Down", category: "sad cry stream weeping emotional drama tears", url: "https://media.giphy.com/media/26ufcVAp3AiJJsrIs/giphy.gif", previewUrl: "https://media.giphy.com/media/26ufcVAp3AiJJsrIs/200w.gif" },
  { id: "g72", title: "Lonely Swing Empty Park", category: "sad alone solitude lost thinking feeling down", url: "https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif", previewUrl: "https://media.giphy.com/media/l41lI4bYmcsPJX9Go/200w.gif" },
  { id: "g73", title: "Hug Me Please Kitten", category: "sad cuddle comfort please needy cat cute baby", url: "https://media.giphy.com/media/10tIhkzM3556J2/giphy.gif", previewUrl: "https://media.giphy.com/media/10tIhkzM3556J2/200w.gif" },

  // --- ANGRY & SHOCKED ---
  { id: "g74", title: "Red Angry Rage", category: "angry rage furious mad steaming heat angry scream", url: "https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif", previewUrl: "https://media.giphy.com/media/11tTNkNy1SdXGg/200w.gif" },
  { id: "g75", title: "Throwing Laptop Toss", category: "angry rage quit done smash laptop computer work", url: "https://media.giphy.com/media/YVPwi7L2izTJS/giphy.gif", previewUrl: "https://media.giphy.com/media/YVPwi7L2izTJS/200w.gif" },
  { id: "g76", title: "Screaming Pillow Frustration", category: "angry scream scream into pillow stressed furious scream", url: "https://media.giphy.com/media/hyyV7pnbE0FqLNBAzs/giphy.gif", previewUrl: "https://media.giphy.com/media/hyyV7pnbE0FqLNBAzs/200w.gif" },
  { id: "g77", title: "Table Flip Flip Over", category: "angry table flip rage quit mad annoyed", url: "https://media.giphy.com/media/uKT0KE3TtTUHYqzY55/giphy.gif", previewUrl: "https://media.giphy.com/media/uKT0KE3TtTUHYqzY55/200w.gif" },
  { id: "g78", title: "Eye Twitching Irritated", category: "angry irritated twitch ticking anger patience zero", url: "https://media.giphy.com/media/l4pM9SUJwbliDNmWQ/giphy.gif", previewUrl: "https://media.giphy.com/media/l4pM9SUJwbliDNmWQ/200w.gif" },
  { id: "g79", title: "Cat Slap Paw Smack", category: "angry fight slap attack cat punch boxing", url: "https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif", previewUrl: "https://media.giphy.com/media/mlvseq9yvZhba/200w.gif" },
  { id: "g80", title: "Explosion Boom Nuclear", category: "angry destroyed explode atomic bomb boom destroyed", url: "https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif", previewUrl: "https://media.giphy.com/media/HhTXt43pk1I1W/200w.gif" },

  // --- VIBES & CHILL / WORK ---
  { id: "g81", title: "Lofi Girl Study Chill", category: "vibes lofi hiphop beats chill relaxing studying peaceful", url: "https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif", previewUrl: "https://media.giphy.com/media/13HgwGsXF0aiGY/200w.gif" },
  { id: "g82", title: "Coffee Sip Morning Vibe", category: "vibes coffee morning breakfast cozy warm tea drink", url: "https://media.giphy.com/media/hPTZgtzfRIB5Nfb5rL/giphy.gif", previewUrl: "https://media.giphy.com/media/hPTZgtzfRIB5Nfb5rL/200w.gif" },
  { id: "g83", title: "Sunset Beach Waves Relax", category: "vibes sunset beach ocean waves soothing calm nature", url: "https://media.giphy.com/media/xUPGcxpCV81ebKh7Vu/giphy.gif", previewUrl: "https://media.giphy.com/media/xUPGcxpCV81ebKh7Vu/200w.gif" },
  { id: "g84", title: "Neon Cyberpunk Night City", category: "vibes neon aesthetic cyberpunk night drive synthwave", url: "https://media.giphy.com/media/l3q2tzon8OCC7DibC/giphy.gif", previewUrl: "https://media.giphy.com/media/l3q2tzon8OCC7DibC/200w.gif" },
  { id: "g85", title: "Cat Sleeping Peaceful", category: "vibes goodnight sleep sleepy cat bed nap tired", url: "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif", previewUrl: "https://media.giphy.com/media/MDJ9IbxxvDUQM/200w.gif" },
  { id: "g86", title: "Headphones Music Immerse", category: "vibes audio tunes listening groove chill playlist", url: "https://media.giphy.com/media/3o7TKTDnUxE0g2fSE8/giphy.gif", previewUrl: "https://media.giphy.com/media/3o7TKTDnUxE0g2fSE8/200w.gif" },
  { id: "g87", title: "Starry Night Astronomy", category: "vibes stars space cosmos galaxy moon beautiful sky", url: "https://media.giphy.com/media/l0HlTy9x8FxqyV0go/giphy.gif", previewUrl: "https://media.giphy.com/media/l0HlTy9x8FxqyV0go/200w.gif" },
  { id: "g88", title: "Bonfire Campfire Warmth", category: "vibes campfire flames fire night friends camp outdoor", url: "https://media.giphy.com/media/3o7aD6vtj1VbBwQd8c/giphy.gif", previewUrl: "https://media.giphy.com/media/3o7aD6vtj1VbBwQd8c/200w.gif" },
  { id: "g89", title: "Driving City Lights", category: "vibes cruising drive midnight car roads headlights", url: "https://media.giphy.com/media/l0MYD9yQ5Vf66hQ4M/giphy.gif", previewUrl: "https://media.giphy.com/media/l0MYD9yQ5Vf66hQ4M/200w.gif" },
  { id: "g90", title: "Rain On Window Glass", category: "vibes aesthetic storm drizzle droplets peaceful calm", url: "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif", previewUrl: "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/200w.gif" },

  // --- ANIME & GAMING ---
  { id: "g91", title: "Pikachu Happy Jump", category: "anime pikachu pokemon gaming excited cute", url: "https://media.giphy.com/media/xuXzcHMkuwvf2/giphy.gif", previewUrl: "https://media.giphy.com/media/xuXzcHMkuwvf2/200w.gif" },
  { id: "g92", title: "Goku Super Saiyan Power Up", category: "anime dbz goku power aura dragon ball epic fighting", url: "https://media.giphy.com/media/ul1omlrGG6kpO/giphy.gif", previewUrl: "https://media.giphy.com/media/ul1omlrGG6kpO/200w.gif" },
  { id: "g93", title: "Naruto Run Sprint", category: "anime naruto ninja sprint speed run anime hero", url: "https://media.giphy.com/media/JRlqKEzTDKci5JPcaL/giphy.gif", previewUrl: "https://media.giphy.com/media/JRlqKEzTDKci5JPcaL/200w.gif" },
  { id: "g94", title: "Sailor Moon Transformation", category: "anime sailor moon magic transformation sparkle cute glitter", url: "https://media.giphy.com/media/13t2W0dMRqWbEk/giphy.gif", previewUrl: "https://media.giphy.com/media/13t2W0dMRqWbEk/200w.gif" },
  { id: "g95", title: "Mario Victory Flag Pole", category: "gaming nintendo super mario win level cleared classic retro", url: "https://media.giphy.com/media/12BYUePgtn7sis/giphy.gif", previewUrl: "https://media.giphy.com/media/12BYUePgtn7sis/200w.gif" },
  { id: "g96", title: "Pacman Chasing Ghosts", category: "gaming arcade retro 80s 90s pacman gaming nostalgia", url: "https://media.giphy.com/media/gYWeVOiMmbg3zecCTq/giphy.gif", previewUrl: "https://media.giphy.com/media/gYWeVOiMmbg3zecCTq/200w.gif" },
  { id: "g97", title: "Sonic Running Full Speed", category: "gaming sega sonic the hedgehog fast sonic blue blur", url: "https://media.giphy.com/media/LMQgs60HFzAfdZYK0g/giphy.gif", previewUrl: "https://media.giphy.com/media/LMQgs60HFzAfdZYK0g/200w.gif" },
  { id: "g98", title: "Minecraft Diamond Found", category: "gaming minecraft diamonds block crafting gamer video games", url: "https://media.giphy.com/media/cuHjncTuHW40g/giphy.gif", previewUrl: "https://media.giphy.com/media/cuHjncTuHW40g/200w.gif" },
  { id: "g99", title: "Among Us Emergency Meeting", category: "gaming impostor suspect vote among us sus crewmate", url: "https://media.giphy.com/media/RtdRhc7TxBxB0YAsK6/giphy.gif", previewUrl: "https://media.giphy.com/media/RtdRhc7TxBxB0YAsK6/200w.gif" },
  { id: "g100", title: "Anime Wow Star Eyes", category: "anime sparkles cute sweet aesthetic pretty beauty wow", url: "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif", previewUrl: "https://media.giphy.com/media/l41lFw057lAJQMwg0/200w.gif" },
  { id: "g101", title: "Victory Royale Fortnite", category: "gaming victory win fortnite number 1 emote dance squad", url: "https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif", previewUrl: "https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/200w.gif" },
  { id: "g102", title: "Cat Gamer Headset", category: "gaming gamer girl cat stream streaming twitch headset", url: "https://media.giphy.com/media/ule4akeXnY9A50XDUS/giphy.gif", previewUrl: "https://media.giphy.com/media/ule4akeXnY9A50XDUS/200w.gif" },
  { id: "g103", title: "GG Good Game Handshake", category: "gaming sports respect gg good game bro handshake match", url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif", previewUrl: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif" },
  { id: "g104", title: "Rick Roll Never Gonna Give", category: "memes rick roll dance troll music rick astley classic", url: "https://media.giphy.com/media/kFgzrTt798d2w/giphy.gif", previewUrl: "https://media.giphy.com/media/kFgzrTt798d2w/200w.gif" },
  { id: "g105", title: "Dancing Baby Groot", category: "marvel superhero groot guardians galaxy cute music dancing", url: "https://media.giphy.com/media/14bhmZtBNhVnIk/giphy.gif", previewUrl: "https://media.giphy.com/media/14bhmZtBNhVnIk/200w.gif" },
  { id: "g106", title: "Dance Floor Breakdance", category: "celebrate dance music party bboy skills", url: "https://media.giphy.com/media/l2JHRhAtnJSDNJ2py/giphy.gif", previewUrl: "https://media.giphy.com/media/l2JHRhAtnJSDNJ2py/200w.gif" },
  { id: "g107", title: "Salute Respect Military", category: "reaction salute respect honor yes sir bro", url: "https://media.giphy.com/media/rHR8qP1mC5V3G/giphy.gif", previewUrl: "https://media.giphy.com/media/rHR8qP1mC5V3G/200w.gif" },
  { id: "g108", title: "Winking Dog Cutie", category: "love reaction dog wink cute pup good boy", url: "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif", previewUrl: "https://media.giphy.com/media/26AHONQ79FdWZhAI0/200w.gif" },
  { id: "g109", title: "Hulk Smash Rage", category: "angry hulk smash marvel superhero rage break", url: "https://media.giphy.com/media/aS8ypUWEGOXMA/giphy.gif", previewUrl: "https://media.giphy.com/media/aS8ypUWEGOXMA/200w.gif" },
  { id: "g110", title: "Cheers Leonardo Wolf", category: "celebrate wolf wall street cheers toast luxury rich", url: "https://media.giphy.com/media/xT0BKk9aPtLzKJiUi4/giphy.gif", previewUrl: "https://media.giphy.com/media/xT0BKk9aPtLzKJiUi4/200w.gif" }
];
