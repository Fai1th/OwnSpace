import type { Profile } from "./profile";
import { emptyProfile } from "./profile";
// Fictional, editable demonstration profiles. These are not customers.
export const examples: Profile[] = [
  {
    ...emptyProfile,
    handle: "jules",
    displayName: "Jules Rivera",
    bio: "Making things. Taking the long way home.\nDesign, photographs & whatever comes next.",
    avatar: "/art/avatar-jules.svg",
    theme: "night",
    background: "/art/mountain.svg",
    links: [
      { id: "j1", title: "Selected work", url: "https://example.com/work", enabled: true },
      { id: "j2", title: "Instagram", url: "https://instagram.com", enabled: true },
      {
        id: "j3",
        title: "A playlist for the way home",
        url: "https://open.spotify.com",
        enabled: true,
      },
    ],
    cards: [
      {
        id: "jc",
        title: "Somewhere quieter",
        image: "/art/mountain.svg",
        caption: "Scenes from outside.",
      },
    ],
  },
  {
    ...emptyProfile,
    handle: "kai",
    displayName: "Kai Morgan",
    bio: "Games after hours. Music always.\nUsually somewhere between the two.",
    avatar: "/art/avatar-kai.svg",
    theme: "aero",
    links: [
      { id: "k1", title: "Find me on Twitch", url: "https://twitch.tv", enabled: true },
      { id: "k2", title: "Steam", url: "https://store.steampowered.com", enabled: true },
      { id: "k3", title: "On repeat", url: "https://open.spotify.com", enabled: true },
    ],
    cards: [
      { id: "kc", title: "Off the clock", image: "/art/sky.svg", caption: "A little more sky." },
    ],
  },
  {
    ...emptyProfile,
    handle: "sam",
    displayName: "Sam Chen",
    bio: "Code, cameras, coffee.\nA few tabs I never close.",
    avatar: "/art/avatar-sam.svg",
    theme: "desktop",
    links: [
      { id: "s1", title: "GitHub", url: "https://github.com", enabled: true },
      { id: "s2", title: "Things I am building", url: "https://example.com", enabled: true },
    ],
    cards: [
      {
        id: "sc",
        title: "Weekend collection",
        image: "/art/orbit.svg",
        caption: "Small experiments.",
      },
    ],
  },
  {
    ...emptyProfile,
    handle: "noor",
    displayName: "Noor Ellis",
    bio: "Pictures, places, small observations.\nWelcome to my corner.",
    avatar: "/art/avatar-noor.svg",
    theme: "gallery",
    links: [
      { id: "n1", title: "My photographs", url: "https://example.com", enabled: true },
      { id: "n2", title: "Instagram", url: "https://instagram.com", enabled: true },
    ],
    cards: [
      {
        id: "nc",
        title: "Light studies",
        image: "/art/still-life.svg",
        caption: "An ongoing collection.",
      },
    ],
  },
];
