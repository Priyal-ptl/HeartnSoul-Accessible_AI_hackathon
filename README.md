# ❤️ Heart n Soul — Appointment Planner

An accessible, mobile-first web app that helps people with learning disabilities, autism, and physical disabilities plan and get to their appointments with confidence.

I participated as a **design volunteer** in a Heart n Soul accessibility workshop, co-designing this planner with the community.

This was a workshop organized to explore the use of AI, specifically Claude, and how it can be used to quickly prototype concepts. We used these tools to ideate and co-create quickly with disabled people and other workshop attendees, to talk about the importance of making accessibility-friendly solutions, and how AI helped in creating quick prototypes that helped understand the point way quicker.

**Live app:** https://priyal-ptl.github.io/HeartnSoul/appointment-planner/

Scan to open on a phone:

![QR code](appointment-planner/qr.png)

## What it does

- 📅 **Clear appointment list** — big text, simple words, one thing at a time
- 💙 **Friendly alerts** — changes explained calmly, with what to do about them
- 🚌 **Journey planning** — public transport vs drive/Uber, step-by-step routes with costs
- 🗺️ **One-tap navigation** — Google Maps and Uber deep links
- 🏢 **Venue support** — photos of the building, which floor, who to speak to
- 🌦️ **Weather advice** — practical tips like "bring an umbrella"
- 🔊 **Read aloud** — every section has a speech button (tap again to stop)
- ✅ **Three simple phases** — Before you go / When you get there / After the event
- ☑️ **Tick lists** — documents to bring and follow-up actions
- 📆 **Calendar** — add to Google Calendar or download a .ics file
- 🎥 **Online meetings** — direct join button for Zoom and phone appointments

## Accessibility & design

- Designed with and for the Heart n Soul community during an accessibility workshop
- Apple Human Interface Guidelines: large tap targets, high contrast, native-feel navigation
- Works on any phone browser — no install, no login
- Web Speech API for read-aloud (built into the browser, no server needed)

## Project structure

```
HeartnSoul/
├── appointment-planner/     The app
│   ├── index.html           Page structure
│   ├── style.css            All styling (design tokens at the top)
│   ├── app.js               App logic (rendering, speech, navigation)
│   ├── procedures.js        Appointment data — edit this to change events
│   └── qr.png               QR code linking to the live app
├── index.html               Redirects to the app
└── README.md
```

## Editing the appointments

All appointment data lives in [`appointment-planner/procedures.js`](appointment-planner/procedures.js) as a plain JavaScript array. Each event has:

| Field | What it is |
|---|---|
| `title`, `date`, `time`, `duration` | Basics shown on the card |
| `typeColor` | Accent colour for the card and detail view |
| `online`, `isPhone` | Online meeting / phone call flags |
| `location` | Address, floor directions, photos, map/Uber links, routes with costs |
| `alert` | Optional friendly notice (e.g. room change) |
| `before` / `arrival` / `after` | Content for the three phases |
| `weather`, `contact` | Forecast advice and who to contact |

Edit the file, commit, push — GitHub Pages redeploys automatically.

## Deployment

Hosted on **GitHub Pages** from the `main` branch. Pushing to `main` triggers the *pages build and deployment* workflow. The `.nojekyll` file must stay in the repo root.

---

Created as a design volunteer during a Heart n Soul accessibility workshop, July 2026.
