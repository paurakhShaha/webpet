import { line } from './types';

/** What a pet says about the weather, the hour and the season. */
export const WORLD_LINES = [
  line('weather', 'It\u2019s raining! Can we go out and splash?', { weather: 'rain' }),
  line('weather', 'Rain on the roof. I could listen to this all day.', { weather: 'rain', personality: 'lazy' }),
  line('weather', 'The herbs will be so happy about this rain.', { weather: 'rain', personality: 'curious' }),
  line('weather', 'Was that thunder? I wasn\u2019t scared. I was just\u2026 alert.', { weather: 'storm', personality: ['shy', 'mischievous'] }),
  line('weather', 'A storm! Now THAT is an adventure.', { weather: 'storm', personality: ['brave', 'adventurous'] }),
  line('weather', 'The wind is really something today.', { weather: 'storm' }),
  line('weather', 'Snow! Look, it\u2019s on my nose!', { weather: 'snow' }),
  line('weather', 'It\u2019s so quiet when it snows.', { weather: 'snow', personality: ['shy', 'kind'] }),
  line('weather', 'I can\u2019t see very far in this fog. Isn\u2019t that exciting?', { weather: 'fog' }),
  line('weather', 'Strange things hide in fog. Let\u2019s look!', { weather: 'fog', personality: ['curious', 'adventurous'] }),
  line('weather', 'What a lovely clear sky.', { weather: 'clear', worldTime: 'night' }),
  line('weather', 'The stars are out. Do you think anyone is looking back?', { weather: 'clear', worldTime: 'night' }),
  line('weather', 'Nice weather for a walk.', { weather: 'clear', worldTime: ['morning', 'day'] }),
  line('weather', 'Spring! Everything smells like flowers.', { season: 'spring' }),
  line('weather', 'Summer evenings are the best evenings.', { season: 'summer', worldTime: 'evening' }),
  line('weather', 'The leaves are all gold. Can I roll in them?', { season: 'autumn' }),
  line('weather', 'Winter again. Warm blankets, please.', { season: 'winter' }),
];
