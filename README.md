# WarLords ⚔️

![Status](https://img.shields.io/badge/Status-In_Development-yellow) ![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Twitch_Extension-purple) ![Tech](https://img.shields.io/badge/Backend-Node.js-green) ![DB](https://img.shields.io/badge/DB-SQL-blue)

> **Summary:** A web platform and Twitch extension that gamifies audience loyalty, turning followers into armies and watch-time into RPG experience.

---

## 📖 Project Vision
**WarLords** aims to solve the lack of deep interactivity in streaming communities. Instead of being passive viewers, followers become **active characters** that evolve alongside the channel.

The platform functions as an **RPG Management Dashboard** where users can manage the characters they acquire by following different streamers associated with the extension.

### Key Features
* **Passive Progression:** Characters level up through watch-time, raids, and bit donations.
* **Inventory Management:** Users can equip items, assign statistics, and manage their "heroes" directly from the web dashboard.
* **War System (WIP):** Streamers can declare "War" on other channels. The web application simulates the clash between the armies (followers) of both channels.
* **Economy:** A reward system based on *Reputation* and *Channel Points*.

---

## ⚙️ Architecture & Data Flow

The system consists of two vital components: the **Twitch Extension** (data collection) and the **Web Platform** (persistence and management). This repository hosts the source code for the Web Platform.

### Conceptual Flow
1.  **Trigger:** User interacts on Twitch (Follow, Watch time, Raid).
2.  **Auth:** Account linking via **Twitch OAuth**.
3.  **Processing:** The backend verifies the subscription/follow status.
4.  **Generation:** If the user follows Streamer X, a character linked to that User ID is instantiated in the SQL database.
5.  **User Interface:** The web app queries the DB and renders the "cards" of the characters available to that user.

---

## 🛠️ Tech Stack

This repository focuses on the web implementation and database logic.

* **Frontend:** HTML5, CSS3, JavaScript - *Visual facade and user dashboard.*
* **Backend:** Node.js - *Business logic handling.*
* **Database:** SQL - *Relational storage for Users, Characters (stats, items), and Streamers.*
* **Integration:** **Twitch API (Helix)** & **EventSub** - *Authentication and channel event listening.*

---

## 🚧 Current Development Status

The project is currently in an active Alpha phase, focusing on core logic construction.

### ✅ Implemented
* [x] **Web Facade:** Initial UI/UX design of the dashboard using HTML/CSS/JS.
* [x] **Authentication System:** User Login and Registration.
* [x] **Twitch Linking:** Functional OAuth flow to validate Twitch accounts.
* [x] **Database Design:** Relational SQL schema created to link `Accounts` -> `Characters`.

### 🔄 Roadmap (Work In Progress)
* [ ] **Auto-Sync:** Script to automatically instantiate characters upon detecting a "Follow" via the API.
* [ ] **Battle Logic:** Algorithm to resolve clashes between streamer armies.
* [ ] **Leaderboards:** Global and per-channel ranking visualization.
* [ ] **Refactoring:** Optimization of SQL queries for scalability.

---

## 💡 Technical Notes / Challenges
*The current implementation utilizes a strict relational model to ensure data integrity (levels, items) is not compromised, as an internal economy (Reputation currency) is planned for future releases.*

---

### Contact / Author
Developed by Nazareno Negrete.

📧 Email: [nazareno.negrete22@gmail.com](mailto:nazareno.negrete22@gmail.com)
